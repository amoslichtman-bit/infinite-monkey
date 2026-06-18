require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to dig through folders and find every .txt file
function getAllTxtFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllTxtFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.txt')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function uploadPlays() {
  // Just point it at the top-level 'data' folder
  const dataDir = path.join(__dirname, 'data');
  
  try {
    const txtFiles = getAllTxtFiles(dataDir);

    if (txtFiles.length === 0) {
      console.log("No .txt files found anywhere in the data folder!");
      return;
    }

    console.log(`Found ${txtFiles.length} files. Starting upload...`);

    for (const filePath of txtFiles) {
      const file = path.basename(filePath);
      const id = file.replace('.txt', '');
      
      // Format the title (e.g., "romeo_and_juliet" -> "Romeo And Juliet")
      const title = id
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Auto-categorize sonnets vs plays
      const type = id.toLowerCase().includes('sonnet') ? 'sonnet' : 'play';
      
      const content = fs.readFileSync(filePath, 'utf8');

      console.log(`Uploading ${title}...`);

      const { error } = await supabase
        .from('works')
        .upsert({ id, title, content, type }); 

      if (error) {
        console.error(`Error uploading ${title}:`, error);
      } else {
        console.log(`Success: ${title} (${type})`);
      }
    }
    
    console.log("Upload complete!");
    
  } catch (err) {
    console.error("Critical Error:", err);
  }
}

uploadPlays();