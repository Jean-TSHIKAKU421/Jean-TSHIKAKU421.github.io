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

async function optimizeImage(inputPath, outputDir, fileName) {
  const nameWithoutExt = path.parse(fileName).name;
  let totalSaved = 0;
  for (const [sizeName, width] of Object.entries(CONFIG.sizes)) {
    const outputFileName = `${nameWithoutExt}-${sizeName}.webp`;
    const outputPath = path.join(outputDir, outputFileName);
    try {
      const originalSize = fs.statSync(inputPath).size;
      await sharp(inputPath).resize(width, null, { withoutEnlargement: true, fit: 'inside' }).webp({ quality: CONFIG.quality }).toFile(outputPath);
      const optimizedSize = fs.statSync(outputPath).size;
      totalSaved += originalSize - optimizedSize;
      console.log(`  ✅ ${outputFileName} (${(optimizedSize/1024).toFixed(1)} Ko)`);
    } catch (error) {
      console.error(`  ❌ ${outputFileName}: ${error.message}`);
    }
  }
  return totalSaved;
}

async function processDirectory(dir, relativePath = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let totalSaved = 0;
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relPath = path.join(relativePath, item.name);
    if (item.isDirectory()) {
      totalSaved += await processDirectory(fullPath, relPath);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(item.name)) {
      const outDir = path.join(CONFIG.outputDir, relativePath);
      ensureDirExists(outDir);
      console.log(`🖼️  ${relPath}`);
      totalSaved += await optimizeImage(fullPath, outDir, item.name);
    }
  }
  return totalSaved;
}

async function main() {
  console.log('🚀 Optimisation des images...\n');
  if (!fs.existsSync(CONFIG.inputDir)) {
    console.error(`❌ Dossier introuvable : ${CONFIG.inputDir}`);
    console.log('Structure attendue : assets/images/originals/{profil,genot,jtplay,orientation}/');
    process.exit(1);
  }
  ensureDirExists(CONFIG.outputDir);
  const start = Date.now();
  const saved = await processDirectory(CONFIG.inputDir);
  console.log(`\n✨ Terminé en ${((Date.now()-start)/1000).toFixed(1)}s - Économisé : ${(saved/1024/1024).toFixed(2)} Mo`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });