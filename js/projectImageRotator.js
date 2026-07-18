// ==================== ROTATEUR D'IMAGES POUR LES PROJETS ====================
const ProjectImageRotator = (() => {
    'use strict';
    
    const activeRotators = new Map();
    
    const titleToSlug = (title) => {
        return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    };
    
    const imageExists = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            let resolved = false;
            const timeout = setTimeout(() => { if (!resolved) { resolved = true; img.src = ''; resolve(false); } }, 2000);
            img.onload = () => { if (!resolved) { resolved = true; clearTimeout(timeout); resolve(true); } };
            img.onerror = () => { if (!resolved) { resolved = true; clearTimeout(timeout); resolve(false); } };
            img.src = url + '?t=' + Date.now();
        });
    };
    
    const detectImages = async (projectTitle) => {
        const slug = titleToSlug(projectTitle);
        const images = [];
        console.log(`🔍 [${projectTitle}] Slug: "${slug}"`);
        for (let i = 1; i <= 25; i++) {
            const path = `assets/site_${slug}_${i}.png`;
            const exists = await imageExists(path);
            if (exists) { console.log(`  ✅ ${path}`); images.push({ path, index: i }); }
            else if (images.length > 0 && i > images.length + 3) break;
        }
        console.log(`📸 [${projectTitle}] ${images.length} images trouvées`);
        return images;
    };
    
    const preloadImage = (imageInfo) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ ...imageInfo, element: img, loaded: true });
            img.onerror = () => resolve({ ...imageInfo, loaded: false });
            img.src = imageInfo.path + '?t=' + Date.now();
        });
    };
    
    const createUI = (container, total) => {
        container.querySelectorAll('.project-image-nav, .project-image-arrows, .project-image-counter, .project-overlay').forEach(el => el.remove());
        const arrows = document.createElement('div');
        arrows.className = 'project-image-arrows';
        arrows.innerHTML = '<button class="project-arrow prev" aria-label="Précédent">❮</button><button class="project-arrow next" aria-label="Suivant">❯</button>';
        container.appendChild(arrows);
        if (total > 1) {
            const dots = document.createElement('div');
            dots.className = 'project-image-nav';
            for (let i = 0; i < total; i++) { const dot = document.createElement('span'); dot.className = 'project-image-dot' + (i === 0 ? ' active' : ''); dot.dataset.index = i; dots.appendChild(dot); }
            container.appendChild(dots);
        }
        const counter = document.createElement('div');
        counter.className = 'project-image-counter';
        counter.textContent = `1 / ${total}`;
        container.appendChild(counter);
        const overlay = document.createElement('div');
        overlay.className = 'project-overlay';
        container.appendChild(overlay);
        return { arrows, counter };
    };
    
    const init = async (projectCard, projectData) => {
        if (!projectCard || !projectData) return;
        if (activeRotators.has(projectCard)) { const old = activeRotators.get(projectCard); if (old.stop) old.stop(); activeRotators.delete(projectCard); }
        
        const container = projectCard.querySelector('.project-image-container');
        const slider = projectCard.querySelector('.project-image-slider');
        const emoji = slider ? slider.querySelector('.project-emoji') : null;
        if (!container || !slider) { console.warn('❌ Container/slider introuvable'); return; }
        
        const detected = await detectImages(projectData.title);
        if (detected.length === 0) { console.log(`ℹ️ Aucune image pour "${projectData.title}"`); if (emoji) emoji.style.display = ''; return; }
        
        const loaded = [];
        for (const imgInfo of detected) { const result = await preloadImage(imgInfo); if (result.loaded) loaded.push(result); }
        if (loaded.length === 0) { console.warn('⚠️ Aucune image chargée'); return; }
        
        if (emoji) emoji.style.display = 'none';
        const { arrows, counter } = createUI(container, loaded.length);
        
        let currentIndex = 0, interval = null, locked = false;
        
        const showImage = (index) => {
            if (locked || index === currentIndex || loaded.length === 0) return;
            locked = true; slider.classList.add('changing');
            setTimeout(() => {
                currentIndex = index;
                if (loaded[currentIndex] && loaded[currentIndex].path) { slider.style.backgroundImage = `url('${loaded[currentIndex].path}')`; slider.style.backgroundSize = 'cover'; slider.style.backgroundPosition = 'center'; slider.style.backgroundRepeat = 'no-repeat'; }
                const dots = container.querySelectorAll('.project-image-dot');
                dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
                if (counter) counter.textContent = `${currentIndex + 1} / ${loaded.length}`;
                slider.classList.remove('changing');
                setTimeout(() => { locked = false; }, 800);
            }, 400);
        };
        
        const next = () => showImage((currentIndex + 1) % loaded.length);
        const prev = () => showImage((currentIndex - 1 + loaded.length) % loaded.length);
        const startRotation = () => { stopRotation(); if (loaded.length > 1) interval = setInterval(next, 4000); };
        const stopRotation = () => { if (interval) { clearInterval(interval); interval = null; } };
        
        const prevBtn = arrows.querySelector('.prev');
        const nextBtn = arrows.querySelector('.next');
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); stopRotation(); prev(); startRotation(); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); stopRotation(); next(); startRotation(); });
        
        container.addEventListener('click', (e) => {
            const dot = e.target.closest('.project-image-dot');
            if (dot) { e.stopPropagation(); const index = parseInt(dot.dataset.index); if (!isNaN(index)) { stopRotation(); showImage(index); startRotation(); } }
        });
        
        projectCard.addEventListener('mouseenter', stopRotation);
        projectCard.addEventListener('mouseleave', startRotation);
        
        let touchStart = 0;
        container.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
        container.addEventListener('touchend', (e) => {
            const diff = touchStart - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { e.preventDefault(); stopRotation(); diff > 0 ? next() : prev(); startRotation(); }
        });
        
        if (loaded[0] && loaded[0].path) { slider.style.backgroundImage = `url('${loaded[0].path}')`; slider.style.backgroundSize = 'cover'; slider.style.backgroundPosition = 'center'; slider.style.backgroundRepeat = 'no-repeat'; }
        startRotation();
        activeRotators.set(projectCard, { stop: stopRotation, count: loaded.length });
        console.log(`✅ Rotateur prêt: "${projectData.title}" (${loaded.length} images)`);
    };
    
    const cleanup = () => { activeRotators.forEach((r) => { if (r.stop) r.stop(); }); activeRotators.clear(); };
    
    console.log('🖼️ ProjectImageRotator prêt');
    return { init, cleanup };
})();