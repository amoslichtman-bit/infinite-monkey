'use client';

import { useState, useMemo, useEffect, memo } from 'react';
import Link from 'next/link';

type PlayableItem = {
  id?: string;
  text: string;
};

const TOTAL_SHAKESPEARE_WORDS = 31534;
const normalize = (word: string) => word.toLowerCase().replace(/[^a-z]/g, '');

// 1. ISOLATED INPUT COMPONENT
function GameInput({ 
  uniqueWordsInText, 
  guessedWords, 
  onCorrectGuess 
}: { 
  uniqueWordsInText: Set<string>;
  guessedWords: Set<string>;
  onCorrectGuess: (word: string) => void;
}) {
  const [currentGuess, setCurrentGuess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCurrentGuess(val);
    
    const cleanGuess = normalize(val);
    
    if (cleanGuess && uniqueWordsInText.has(cleanGuess) && !guessedWords.has(cleanGuess)) {
      onCorrectGuess(cleanGuess);
      setCurrentGuess('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const missingWords = document.querySelectorAll('.missing-word');
      const target = Array.from(missingWords).find(el => el.getBoundingClientRect().top > 120) || missingWords[0];
      
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('ring-2', 'ring-slate-400', 'bg-slate-200');
        setTimeout(() => target.classList.remove('ring-2', 'ring-slate-400', 'bg-slate-200'), 500);
      }
    }
  };

  return (
    <input
      type="text"
      value={currentGuess}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Type a word..."
      // text-base on mobile prevents iOS from automatically zooming the screen
      className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono text-base sm:text-sm shadow-inner"
      autoFocus
    />
  );
}

// 2. HYPER-OPTIMIZED PARAGRAPH COMPONENT
const MemoizedParagraph = memo(({ 
  item, 
  guessedWords, 
  lastGuessedWord 
}: { 
  item: PlayableItem; 
  guessedWords: Set<string>; 
  lastGuessedWord: string | null; 
}) => {
  const renderText = (content: string) => {
    const tokens = content.split(/([a-zA-Z]+)/);
    return tokens.map((token, index) => {
      if (index % 2 === 0) {
        return <span key={index} className="whitespace-pre-wrap">{token}</span>;
      }

      const isGuessed = guessedWords.has(normalize(token));
      if (isGuessed) {
        return <span key={index} className="text-slate-900 font-bold">{token}</span>;
      }

      return (
        <span 
          key={index} 
          className="missing-word inline-block mx-[2px] align-middle translate-y-[-2px] border-b-2 border-slate-300 rounded-sm"
          style={{
            width: `${token.length * 11 - 1}px`,
            height: '18px',
            background: 'repeating-linear-gradient(to right, #e2e8f0, #e2e8f0 10px, transparent 10px, transparent 11px)'
          }}
        ></span>
      );
    });
  };

  return (
    <div style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 30px' }}>
      {renderText(item.text)}
    </div>
  );
}, (prevProps, nextProps) => {
  const sizeDiff = Math.abs(nextProps.guessedWords.size - prevProps.guessedWords.size);
  if (sizeDiff !== 1) return false;

  if (nextProps.lastGuessedWord) {
    if (!nextProps.item.text.toLowerCase().includes(nextProps.lastGuessedWord)) {
      return true; 
    }
  }

  return false;
});


// 3. MAIN COMPONENT
export default function PlayableText({ title, items, isIndex = false }: { title: string, items: PlayableItem[], isIndex?: boolean }) {
  const [guessedWords, setGuessedWords] = useState<Set<string>>(new Set());
  const [lastGuessedWord, setLastGuessedWord] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('infinite-monkey-save');
    if (saved) {
      try {
        setGuessedWords(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Corrupted save file found, resetting progress.");
        localStorage.removeItem('infinite-monkey-save');
        setGuessedWords(new Set());
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('infinite-monkey-save', JSON.stringify(Array.from(guessedWords)));
    }
  }, [guessedWords, isMounted]);

  const uniqueWordsInText = useMemo(() => {
    const allText = items.map(i => i.text).join(' ');
    const words = allText.split(/[^a-zA-Z]+/).filter(Boolean).map(w => w.toLowerCase());
    return new Set(words);
  }, [items]);

  const validGuesses = useMemo(() => {
    return Array.from(guessedWords).filter(word => uniqueWordsInText.has(word));
  }, [guessedWords, uniqueWordsInText]);

  const pagePercent = uniqueWordsInText.size > 0 
    ? Math.floor((validGuesses.length / uniqueWordsInText.size) * 100) 
    : 0;

  const globalPercent = Math.floor((guessedWords.size / TOTAL_SHAKESPEARE_WORDS) * 100);

  const handleCorrectGuess = (word: string) => {
    setLastGuessedWord(word);
    setGuessedWords(prev => {
      const next = new Set(prev);
      next.add(word);
      return next;
    });
  };

  const renderIndexLinks = (content: string) => {
    if (!isMounted) return null;
    const tokens = content.split(/([a-zA-Z]+)/);
    return tokens.map((token, index) => {
      if (index % 2 === 0) return <span key={index} className="whitespace-pre-wrap">{token}</span>;
      if (guessedWords.has(normalize(token))) return <span key={index} className="text-slate-900 font-bold">{token}</span>;
      return (
        <span 
          key={index} 
          className="missing-word inline-block mx-[2px] align-middle translate-y-[-2px] border-b-2 border-slate-300 rounded-sm"
          style={{ width: `${token.length * 11 - 1}px`, height: '18px', background: 'repeating-linear-gradient(to right, #e2e8f0, #e2e8f0 10px, transparent 10px, transparent 11px)' }}
        ></span>
      );
    });
  };

  const isItemFullyGuessed = (text: string) => {
    const words = text.split(/[^a-zA-Z]+/).filter(Boolean).map(w => normalize(w));
    return words.every(word => guessedWords.has(word));
  };

  return (
    <div className="max-w-3xl mx-auto pt-0 pb-12 sm:py-12 px-4 sm:px-6">
      
      {/* Mobile: Flush top edge. Desktop: Floating rounded box */}
      <div className="sticky top-0 sm:top-4 -mx-4 sm:mx-0 px-4 py-3 sm:p-4 bg-white/95 sm:bg-white/90 backdrop-blur shadow-sm border-b sm:border border-slate-200 sm:rounded-2xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between z-10 gap-3 sm:gap-4">
        
        {/* min-w-0 prevents flexbox from blowing past screen width on long titles */}
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight truncate">
            {title}
          </h1>
          {isMounted && (
            <div className="flex gap-1.5 sm:gap-2">
              <span className="whitespace-nowrap font-mono text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md">
                Page: {pagePercent}%
              </span>
              <span className="whitespace-nowrap font-mono text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md">
                Global: {globalPercent}% ({guessedWords.size} words)
              </span>
            </div>
          )}
        </div>
        
        <div className="w-full sm:max-w-xs sm:ml-auto shrink-0">
          {isMounted && (
            <GameInput 
              uniqueWordsInText={uniqueWordsInText}
              guessedWords={guessedWords}
              onCorrectGuess={handleCorrectGuess}
            />
          )}
        </div>
      </div>

      <div className={`${isIndex ? 'text-xl leading-loose' : 'text-base leading-relaxed'} font-serif text-slate-800 break-words ${isIndex ? 'flex flex-col gap-3' : ''}`}>
        {items.map((item, i) => {
          
          if (item.id) {
            const unlocked = isMounted && isItemFullyGuessed(item.text);

            if (unlocked) {
              return (
                <Link 
                  key={i} 
                  href={`/${item.id}`}
                  className="block p-4 border border-blue-300 bg-blue-50 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="group-hover:scale-[1.01] transition-transform origin-left flex justify-between items-center gap-3">
                    <div className="min-w-0">{renderIndexLinks(item.text)}</div>
                    {/* shrink-0 prevents the arrow text from getting squished by long titles */}
                    <span className="shrink-0 text-sm text-blue-600 font-sans font-bold whitespace-nowrap">Play →</span>
                  </div>
                </Link>
              );
            }

            return (
              <div 
                key={i} 
                className="block p-4 border border-slate-200 bg-white/50 rounded-xl transition-all cursor-not-allowed opacity-80 flex justify-between items-center gap-3"
              >
                <div className="min-w-0">{renderIndexLinks(item.text)}</div>
                <span className="shrink-0 text-sm text-slate-400 font-sans font-bold whitespace-nowrap">Locked</span>
              </div>
            );
          }

          return (
            <div 
              key={i} 
              className={isIndex && !item.id ? "text-2xl sm:text-3xl font-black text-center mt-4 mb-8" : ""}
            >
              {isMounted && (
                <MemoizedParagraph 
                  item={item} 
                  guessedWords={guessedWords} 
                  lastGuessedWord={lastGuessedWord} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}