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
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono text-sm shadow-inner"
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
    // contentVisibility: 'auto' forces Chrome/Safari to skip rendering this if it's off-screen
    <div style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 30px' }}>
      {renderText(item.text)}
    </div>
  );
}, (prevProps, nextProps) => {
  // If loading a bulk save file, force everything to update
  const sizeDiff = Math.abs(nextProps.guessedWords.size - prevProps.guessedWords.size);
  if (sizeDiff !== 1) return false;

  // The Magic Check: If the word they just typed doesn't even exist in this specific 
  // paragraph's text, tell React to completely skip checking it.
  if (nextProps.lastGuessedWord) {
    if (!nextProps.item.text.toLowerCase().includes(nextProps.lastGuessedWord)) {
      return true; // Return TRUE means "Props are effectively equal, SKIP RENDER"
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

  // Dedicated lightweight renderer specifically for the Index page links
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
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="sticky top-4 bg-white/90 backdrop-blur shadow-sm border border-slate-200 p-4 rounded-2xl mb-8 flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">
            {title}
          </h1>
          {isMounted && (
            <div className="flex gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md">
                Page: {pagePercent}%
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                Global: {globalPercent}% ({guessedWords.size} words)
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 w-full max-w-xs ml-auto">
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
          
          // Render Interactive Index Links
          if (item.id) {
            const unlocked = isMounted && isItemFullyGuessed(item.text);

            if (unlocked) {
              return (
                <Link 
                  key={i} 
                  href={`/${item.id}`}
                  className="block p-4 border border-blue-300 bg-blue-50 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="group-hover:scale-[1.01] transition-transform origin-left flex justify-between items-center">
                    <div>{renderIndexLinks(item.text)}</div>
                    <span className="ml-4 text-sm text-blue-600 font-sans font-bold whitespace-nowrap">Play →</span>
                  </div>
                </Link>
              );
            }

            return (
              <div 
                key={i} 
                className="block p-4 border border-slate-200 bg-white/50 rounded-xl transition-all cursor-not-allowed opacity-80 flex justify-between items-center"
              >
                <div>{renderIndexLinks(item.text)}</div>
                <span className="ml-4 text-sm text-slate-400 font-sans font-bold whitespace-nowrap">Locked</span>
              </div>
            );
          }

          // Render Normal Play Text (Hyper-Optimized)
          return (
            <div 
              key={i} 
              className={isIndex && !item.id ? "text-3xl font-black text-center mt-4 mb-8" : ""}
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