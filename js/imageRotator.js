// js/imageRotator.js - Rotateur d'images unifié (Profil + Projets)
const ImageRotator = (() => {
  'use strict';
  
  const activeRotators = new Map();
  
  // Préchargement d'une image
  const preloadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ url, element: img, loaded: true });
      img.onerror = () => resolve({ url, loaded: false });
      img.src = url;
    });
  };
  
  // Créer les contrôles UI (flèches, dots, compteur)
  const createControls = (container, total, type = 'project') => {
    // Nettoyer les anciens contrôles
    container.querySelectorAll('.rotator-arrows, .rotator-dots, .rotator-counter').forEach(el => el.remove());
    
    // Flèches
    const arrows = document.createElement('div');
    arrows.className = 'rotator-arrows project-image-arrows';
    arrows.innerHTML = '<button class="project-arrow prev" aria-label="Précédent">❮</button><button class="project-arrow next" aria-label="Suivant">❯</button>';
    container.appendChild(arrows);
    
    // Dots (seulement si plus d'une image)
    if (total > 1 && type === 'project') {
      const dots = document.createElement('div');
      dots.className = 'rotator-dots project-image-nav';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = 'project-image-dot' + (i === 0 ? ' active' : '');
        dot.dataset.index = i;
        dots.appendChild(dot);
      }
      container.appendChild(dots);
    }
    
    // Compteur
    const counter = document.createElement('div');
    counter.className = 'rotator-counter';
    if (type === 'profile') {
      counter.className = 'photo-counter';
      counter.textContent = `1/${total}`;
    } else {
      counter.className = 'project-image-counter';
      counter.textContent = `1 / ${total}`;
    }
    container.appendChild(counter);
    
    return { arrows, counter };
  };
  
  // Initialiser un rotateur
  const init = async (element, config) => {
    if (!element || !config) return;
    
    // Nettoyer un rotateur existant sur cet élément
    if (activeRotators.has(element)) {
      const old = activeRotators.get(element);
      if (old.stop) old.stop();
      activeRotators.delete(element);
    }
    
    const { category, prefix, count, type = 'project', interval = 4000 } = config;
    const container = type === 'profile' ? element.parentElement : element.closest('.project-image-container');
    if (!container) return;
    
    // Détecter les images disponibles
    const images = await ImageHelper.detectImages(category, prefix, count || 25);
    if (images.length === 0) {
      console.log(`ℹ️ Aucune image trouvée pour ${prefix}`);
      return;
    }
    
    // Précharger toutes les images
    const loaded = [];
    for (const img of images) {
      const result = await preloadImage(img.url);
      if (result.loaded) loaded.push(result);
    }
    if (loaded.length === 0) return;
    
    // Masquer l'emoji fallback si présent
    const emoji = element.querySelector('.project-emoji') || element.querySelector('.profile-fallback-icon');
    if (emoji) {
      if (type === 'profile') {
        emoji.style.display = 'none';
      } else {
        emoji.style.display = 'none';
      }
    }
    
    // Créer les contrôles
    const { arrows, counter } = createControls(container, loaded.length, type);
    
    let currentIndex = 0;
    let timer = null;
    let locked = false;
    
    // Afficher une image
    const showImage = (index) => {
      if (locked || index === currentIndex || loaded.length === 0) return;
      locked = true;
      
      if (type === 'profile') {
        element.classList.add('changing');
      } else {
        element.classList.add('changing');
      }
      
      setTimeout(() => {
        currentIndex = index;
        const imgUrl = loaded[currentIndex].url;
        
        // Appliquer l'image en background
        element.style.backgroundImage = `url('${imgUrl}')`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
        
        // Mettre à jour les dots
        const dots = container.querySelectorAll('.project-image-dot');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
        
        // Mettre à jour le compteur
        if (counter) {
          counter.textContent = type === 'profile' 
            ? `${currentIndex + 1}/${loaded.length}` 
            : `${currentIndex + 1} / ${loaded.length}`;
        }
        
        element.classList.remove('changing');
        setTimeout(() => { locked = false; }, 800);
      }, 400);
    };
    
    const next = () => showImage((currentIndex + 1) % loaded.length);
    const prev = () => showImage((currentIndex - 1 + loaded.length) % loaded.length);
    const startTimer = () => { stopTimer(); if (loaded.length > 1) timer = setInterval(next, interval); };
    const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
    
    // Événements des flèches
    const prevBtn = arrows.querySelector('.prev');
    const nextBtn = arrows.querySelector('.next');
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); stopTimer(); prev(); startTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); stopTimer(); next(); startTimer(); });
    
    // Clic sur les dots
    container.addEventListener('click', (e) => {
      const dot = e.target.closest('.project-image-dot');
      if (dot) {
        e.stopPropagation();
        const index = parseInt(dot.dataset.index);
        if (!isNaN(index)) { stopTimer(); showImage(index); startTimer(); }
      }
    });
    
    // Clic sur l'image pour changer (mode profil)
    if (type === 'profile') {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        stopTimer();
        next();
        startTimer();
      });
    }
    
    // Pause au survol
    const hoverTarget = type === 'profile' ? container : element.closest('.project-card') || container;
    if (hoverTarget) {
      hoverTarget.addEventListener('mouseenter', stopTimer);
      hoverTarget.addEventListener('mouseleave', startTimer);
    }
    
    // Touch/swipe
    let touchStart = 0;
    container.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', (e) => {
      const diff = touchStart - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { e.preventDefault(); stopTimer(); diff > 0 ? next() : prev(); startTimer(); }
    });
    
    // Afficher la première image
    if (loaded[0] && loaded[0].url) {
      element.style.backgroundImage = `url('${loaded[0].url}')`;
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
      element.style.backgroundRepeat = 'no-repeat';
    }
    
    startTimer();
    
    activeRotators.set(element, { stop: stopTimer, count: loaded.length });
    console.log(`✅ Rotateur prêt: ${prefix} (${loaded.length} images)`);
  };
  
  // Nettoyage
  const cleanup = () => {
    activeRotators.forEach(r => { if (r.stop) r.stop(); });
    activeRotators.clear();
  };
  
  return { init, cleanup };
})();