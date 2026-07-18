// js/imageHelper.js - Utilitaire d'images optimisées
const ImageHelper = (() => {
  'use strict';
  
  const BASE = 'assets/images/optimized';
  
  /**
   * Retourne l'URL de l'image optimisée (taille medium par défaut)
   * @param {string} category - 'profil', 'genot', 'jtplay', 'orientation'
   * @param {string} prefix - 'profil', 'site_genot', 'site_jtplay', 'site_orientation'
   * @param {number} index - numéro de l'image
   * @param {string} size - 'thumbnail', 'medium', 'large'
   * @returns {string} URL
   */
  const getUrl = (category, prefix, index, size = 'medium') => {
    return `${BASE}/${category}/${prefix}_${index}-${size}.webp`;
  };
  
  /**
   * Vérifie si une image optimisée existe (pour fallback)
   */
  const exists = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => { resolve(false); }, 2000);
      img.onload = () => { clearTimeout(timeout); resolve(true); };
      img.onerror = () => { clearTimeout(timeout); resolve(false); };
      img.src = url;
    });
  };
  
  /**
   * Détecte les images disponibles dans une catégorie
   */
  const detectImages = async (category, prefix, maxCount = 25) => {
    const images = [];
    for (let i = 1; i <= maxCount; i++) {
      const url = getUrl(category, prefix, i);
      const found = await exists(url);
      if (found) {
        images.push({ index: i, url, category, prefix });
      } else if (images.length > 0 && i > images.length + 3) {
        break;
      }
    }
    return images;
  };
  
  return { getUrl, exists, detectImages, BASE };
})();