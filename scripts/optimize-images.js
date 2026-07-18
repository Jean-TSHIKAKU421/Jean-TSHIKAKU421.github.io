// scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  inputDir: './assets/images/originals',
  outputDir: './assets/images/optimized',
  sizes: { thumbnail: 400, medium: 800, large: 1200 },
  quality: 80,
  formats: ['webp']
};

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Vérifier si l'image optimisée existe déjà et est plus récente que l'originale
function needsOptimization(inputPath, outputPath) {
  if (!fs.existsSync(outputPath)) return true; // N'existe pas → à créer
  
  const inputStat = fs.statSync(inputPath);
  const outputStat = fs.statSync(outputPath);
  
  // Si l'originale a été modifiée après l'optimisée → réoptimiser
  return inputStat.mtime > outputStat.mtime;
}

async function optimizeImage(inputPath, outputDir, fileName) {
  const nameWithoutExt = path.parse(fileName).name;
  let optimized = false;
  
  for (const [sizeName, width] of Object.entries(CONFIG.sizes)) {
    const outputFileName = `${nameWithoutExt}-${sizeName}.webp`;
    const outputPath = path.join(outputDir, outputFileName);
    
    if (!needsOptimization(inputPath, outputPath)) continue; // Déjà à jour
    
    try {
      await sharp(inputPath)
        .resize(width, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: CONFIG.quality })
        .toFile(outputPath);
      
      const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
      console.log(`  ✅ ${outputFileName} (${sizeKB} Ko)`);
      optimized = true;
    } catch (error) {
      console.error(`  ❌ ${outputFileName}: ${error.message}`);
    }
  }
  
  return optimized;
}

async function processDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relPath = path.join(relativePath, item.name);
    
    if (item.isDirectory()) {
      count += await processDirectory(fullPath, relPath);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(item.name)) {
      const outDir = path.join(CONFIG.outputDir, relativePath);
      ensureDirExists(outDir);
      
      // Vérifier si au moins une taille manque
      const nameWithoutExt = path.parse(item.name).name;
      const firstOutput = path.join(outDir, `${nameWithoutExt}-medium.webp`);
      
      if (needsOptimization(fullPath, firstOutput)) {
        console.log(`🖼️  ${relPath}`);
        const optimized = await optimizeImage(fullPath, outDir, item.name);
        if (optimized) count++;
      }
    }
  }
  
  return count;
}

async function main() {
  console.log('🚀 Optimisation des images...\n');
  
  if (!fs.existsSync(CONFIG.inputDir)) {
    console.error(`❌ Dossier introuvable : ${CONFIG.inputDir}`);
    process.exit(1);
  }
  
  ensureDirExists(CONFIG.outputDir);
  
  const start = Date.now();
  const count = await processDirectory(CONFIG.inputDir);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  
  if (count === 0) {
    console.log('✅ Toutes les images sont déjà optimisées.\n');
  } else {
    console.log(`\n✨ ${count} image(s) optimisée(s) en ${elapsed}s\n`);
  }
}

main().catch(err => { console.error('❌', err); process.exit(1); });