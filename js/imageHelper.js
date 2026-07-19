// js/imageHelper.js - Utilitaire d'images optimisées
const ImageHelper = (() => {
  'use strict';
  
  const BASE = 'assets/images/optimized';
  
  /**
   * Détecte la taille d'image à utiliser selon l'écran
   */
  const getSize = () => {
    const width = window.innerWidth;
    if (width <= 480) return 'thumbnail';
    if (width <= 1024) return 'medium';
    return 'large';
  };
  
  /**
   * Retourne l'URL de l'image optimisée
   * @param {string} category - 'profil', 'genot', 'jtplay', 'orientation'
   * @param {string} prefix - 'profil', 'site_genot', 'site_jtplay', 'site_orientation'
   * @param {number} index - numéro de l'image
   * @returns {string} URL
   */
  const getUrl = (category, prefix, index) => {
    const size = getSize();
    // Exemple: assets/images/optimized/profil/profil1-large.webp
    // Exemple: assets/images/optimized/genot/site_genot_1-large.webp
    return `${BASE}/${category}/${prefix}${index}-${size}.webp`;
  };
  
  /**
   * Vérifie si une image existe
   */
  const exists = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      let resolved = false;
      const timeout = setTimeout(() => { 
        if (!resolved) { resolved = true; resolve(false); }
      }, 2000);
      img.onload = () => { 
        if (!resolved) { resolved = true; clearTimeout(timeout); resolve(true); }
      };
      img.onerror = () => { 
        if (!resolved) { resolved = true; clearTimeout(timeout); resolve(false); }
      };
      img.src = url;
    });
  };
  
  /**
   * Détecte les images disponibles
   */
  const detectImages = async (category, prefix, maxCount = 25) => {
    const images = [];
    
    console.log(`🔍 Détection: cat="${category}", prefix="${prefix}"`);
    
    for (let i = 1; i <= maxCount; i++) {
      const url = getUrl(category, prefix, i);
      const found = await exists(url);
      
      if (found) {
        console.log(`  ✅ ${url}`);
        images.push({ index: i, url, category, prefix });
      } else if (images.length > 0 && i > images.length + 3) {
        break;
      }
    }
    
    console.log(`📸 ${images.length} images trouvées pour "${prefix}"`);
    return images;
  };
  
  return { getUrl, exists, detectImages, BASE, getSize };
})();