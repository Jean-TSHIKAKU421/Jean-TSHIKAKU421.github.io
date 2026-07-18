// ==================== ROTATEUR D'IMAGES DE PROFIL ====================
const ImageRotator = (() => {
    'use strict';
    
    let currentIndex = 0;
    let rotationInterval = null;
    let imageCache = new Map();
    let isTransitioning = false;
    
    // Préchargement des images
    const preloadImages = async (config) => {
        const { folder, prefix, extension, count } = config;
        const loadPromises = [];
        
        for (let i = 1; i <= count; i++) {
            const imagePath = `${folder}/${prefix}${i}.${extension}`;
            
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    imageCache.set(i, img);
                    resolve({ index: i, loaded: true });
                };
                
                img.onerror = () => {
                    console.warn(`Failed to load image: ${imagePath}`);
                    // Fallback : utiliser un emoji ou une couleur de fond
                    resolve({ index: i, loaded: false, error: true });
                };
                
                // Ajout d'un timestamp pour éviter le cache navigateur
                img.src = `${imagePath}?t=${Date.now()}`;
            });
            
            loadPromises.push(promise);
        }
        
        try {
            const results = await Promise.allSettled(loadPromises);
            const loadedCount = results.filter(r => 
                r.status === 'fulfilled' && r.value.loaded
            ).length;
            
            console.log(`✅ ${loadedCount}/${count} images loaded successfully`);
            return loadedCount;
        } catch (error) {
            console.error('Image preloading failed:', error);
            return 0;
        }
    };
    
    // Changement d'image avec animation
    const changeImage = (element, config) => {
        if (isTransitioning || imageCache.size === 0) return;
        
        isTransitioning = true;
        currentIndex = (currentIndex % config.count) + 1;
        
        // Appliquer l'animation de sortie
        element.classList.add('changing');
        
        setTimeout(() => {
            // Changer l'image
            const cachedImage = imageCache.get(currentIndex);
            if (cachedImage && cachedImage.complete) {
                element.style.backgroundImage = `url(${cachedImage.src})`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.style.backgroundRepeat = 'no-repeat';
                
                // Enlever l'emoji si présent
                element.textContent = '';
                
                // Mettre à jour le compteur
                const counter = element.parentElement.querySelector('.photo-counter');
                if (counter) {
                    counter.textContent = `${currentIndex}/${config.count}`;
                }
            }
            
            // Animation d'entrée
            element.classList.remove('changing');
            
            setTimeout(() => {
                isTransitioning = false;
            }, 800);
        }, 400);
    };
    
    // Démarrage de la rotation
    const startRotation = (element, config) => {
        if (!element || !config || rotationInterval) return;
        
        // Appliquer la première image si disponible
        const firstImage = imageCache.get(1);
        if (firstImage && firstImage.complete) {
            element.style.backgroundImage = `url(${firstImage.src})`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
            element.textContent = '';
            currentIndex = 1;
        }
        
        // Ajouter le compteur s'il n'existe pas déjà
        if (!element.parentElement.querySelector('.photo-counter')) {
            const counter = document.createElement('div');
            counter.className = 'photo-counter';
            counter.textContent = `1/${config.count}`;
            element.parentElement.appendChild(counter);
        }
        
        // Démarrer l'intervalle de rotation
        rotationInterval = setInterval(() => {
            changeImage(element, config);
        }, config.changeInterval || 3000);
        
        console.log('🔄 Image rotation started');
    };
    
    // Arrêt de la rotation
    const stopRotation = () => {
        if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
    };
    
    // Initialisation
    const init = async (config) => {
        const profileImage = document.querySelector('.profile-image');
        if (!profileImage || !config) {
            console.warn('Profile image element or config not found');
            return;
        }
        
        // Arrêter toute rotation existante
        stopRotation();
        
        // Précharger les images
        const loadedCount = await preloadImages(config);
        
        if (loadedCount > 0) {
            // Démarrer la rotation
            startRotation(profileImage, config);
            
            // Pause au survol
            profileImage.parentElement.addEventListener('mouseenter', () => {
                stopRotation();
            });
            
            profileImage.parentElement.addEventListener('mouseleave', () => {
                startRotation(profileImage, config);
            });
            
            // Navigation manuelle au clic
            profileImage.parentElement.addEventListener('click', (e) => {
                e.preventDefault();
                stopRotation();
                changeImage(profileImage, config);
                startRotation(profileImage, config);
            });
        } else {
            console.warn('No images loaded, keeping default avatar');
        }
    };
    
    // Nettoyage
    const cleanup = () => {
        stopRotation();
        imageCache.clear();
        currentIndex = 0;
    };
    
    return {
        init,
        stop: stopRotation,
        cleanup
    };
})();