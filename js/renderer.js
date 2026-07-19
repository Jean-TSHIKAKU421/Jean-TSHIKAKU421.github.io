// js/renderer.js - RENDERER DYNAMIQUE (adapté images optimisées)
const Renderer = (() => {
    'use strict';
    
    const createElement = (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attributes)) {
            if (key.startsWith('on')) continue;
            if (key === 'class') element.className = SecurityLayer.sanitize(value);
            else if (key === 'href' || key === 'src' || key === 'action' || key === 'data-url') {
                if (value && !value.toLowerCase().startsWith('javascript:') && !value.toLowerCase().startsWith('data:text/html')) element.setAttribute(key, value);
            } else if (key === 'style' || key === 'target' || key === 'rel' || key === 'aria-label' || key === 'title') element.setAttribute(key, value);
            else element.setAttribute(key, SecurityLayer.sanitize(String(value)));
        }
        children.forEach(child => {
            if (typeof child === 'string') element.appendChild(document.createTextNode(SecurityLayer.sanitize(child)));
            else if (child instanceof Node) element.appendChild(child);
        });
        return element;
    };
    
    // Helper : convertir un titre en slug
    const titleToSlug = (title) => {
        return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    };
    
    const renderNavigation = (navigationData) => {
        const navMenu = document.getElementById('nav-menu');
        if (!navMenu) return;
        navMenu.innerHTML = '';
        navigationData.forEach(item => {
            const iconHtml = item.icon ? `<i class="${item.icon}"></i> ` : '';
            const link = createElement('a', { href: `#${item.section}`, class: 'nav-link', 'data-section': item.section }, []);
            link.innerHTML = `${iconHtml}${SecurityLayer.sanitize(item.label)}`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(item.section);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
            navMenu.appendChild(link);
        });
    };
    
    const renderHero = (personalData) => {
        const container = document.getElementById('home-content');
        if (!container) return;
        
        const createContactButtons = () => {
            const actions = personalData.contactActions;
            if (!actions) return '';
            let buttons = '<div class="contact-buttons">';
            if (actions.whatsapp?.enabled) {
                const num = personalData.whatsapp.replace(/[\+\s\-\(\)]/g, '');
                buttons += `<a href="https://wa.me/${num}?text=${encodeURIComponent(actions.whatsapp.message || 'Bonjour !')}" class="contact-action-btn btn-whatsapp" target="_blank" rel="noopener noreferrer"><span class="btn-icon"><i class="fa-brands fa-whatsapp"></i></span><span class="btn-text">${SecurityLayer.sanitize(actions.whatsapp.label)}</span></a>`;
            }
            if (actions.email?.enabled) {
                buttons += `<a href="mailto:${personalData.email}?subject=${encodeURIComponent(actions.email.subject || 'Contact')}" class="contact-action-btn btn-email"><span class="btn-icon"><i class="fa-solid fa-envelope"></i></span><span class="btn-text">${SecurityLayer.sanitize(actions.email.label)}</span></a>`;
            }
            if (actions.call?.enabled) {
                buttons += `<a href="tel:${personalData.phone.replace(/[\s\-\(\)]/g, '')}" class="contact-action-btn btn-call"><span class="btn-icon"><i class="fa-solid fa-phone"></i></span><span class="btn-text">${SecurityLayer.sanitize(actions.call.label)}</span></a>`;
            }
            buttons += '</div>';
            return buttons;
        };
        
        container.innerHTML = `<div class="hero-content fade-in-up"><div class="hero-text"><h1>${SecurityLayer.sanitize(personalData.name)}</h1><span class="typed-text"><i class="fa-solid fa-terminal"></i> ${SecurityLayer.sanitize(personalData.title)}</span><p class="bio">${SecurityLayer.sanitize(personalData.bio)}</p><div class="cta-buttons"><a href="#projects" class="btn btn-primary"><i class="fa-solid fa-eye"></i> Voir mes projets</a><a href="#contact" class="btn btn-outline"><i class="fa-solid fa-paper-plane"></i> Me contacter</a></div>${createContactButtons()}</div><div class="hero-image"><div class="profile-image-wrapper"><div class="profile-image" style="background-image: none;"><i class="${personalData.avatar || 'fa-solid fa-user-tie'} profile-fallback-icon"></i></div></div></div></div>`;
        
        // ✅ CORRECTION : Initialiser le rotateur de profil
        if (personalData.profileImages && personalData.profileImages.count > 0) {
            setTimeout(() => {
                const profileEl = document.querySelector('.profile-image');
                if (profileEl && typeof ImageRotator !== 'undefined') {
                    ImageRotator.init(profileEl, {
                        category: 'profil',                                    // dossier : assets/images/optimized/profil/
                        prefix: personalData.profileImages.prefix || 'profil', // fichier : profil1-large.webp
                        count: personalData.profileImages.count,
                        type: 'profile',
                        interval: personalData.profileImages.changeInterval || 4000
                    });
                }
            }, 500);
        }
    };
    
    const renderAbout = (aboutData, personalData) => {
        const container = document.getElementById('about-content');
        if (!container) return;
        container.innerHTML = `<h2 class="section-title fade-in-up"><i class="fa-solid fa-user"></i> À propos</h2><div class="about-content fade-in-up"><div class="about-details"><p>${SecurityLayer.sanitize(aboutData.description)}</p><div class="info-grid">${aboutData.details.map(d => `<div class="info-item"><div class="info-label"><i class="${d.icon || 'fa-solid fa-circle-info'}"></i> ${SecurityLayer.sanitize(d.label)}</div><div class="info-value">${SecurityLayer.sanitize(d.value)}</div></div>`).join('')}</div></div><div class="about-stats"><div class="stat-card"><div class="stat-number"><i class="fa-solid fa-laptop-code"></i></div><div class="stat-label">${SecurityLayer.sanitize(personalData.title.split('&')[0].trim())}</div></div><div class="stat-card"><div class="stat-number"><i class="fa-solid fa-location-dot"></i></div><div class="stat-label">${SecurityLayer.sanitize(personalData.location)}</div></div></div></div>`;
    };
    
    const renderBiography = (biographyData) => {
        const container = document.getElementById('bio-content');
        if (!container) return;
        
        container.innerHTML = `
            <h2 class="section-title fade-in-up"><i class="${biographyData.icon || 'fa-solid fa-book-open'}"></i> ${SecurityLayer.sanitize(biographyData.title)}</h2>
            <div class="bio-wrapper fade-in-up">
                <div class="bio-intro" id="bio-intro">
                    <p>${SecurityLayer.sanitize(biographyData.intro)}</p>
                </div>
                <div class="bio-highlights" id="bio-highlights">
                    ${biographyData.highlights.map(h => `
                        <div class="bio-highlight-item">
                            <i class="${h.icon}"></i>
                            <span>${SecurityLayer.sanitize(h.text)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="bio-full" id="bio-full" style="display:none;">
                    ${biographyData.fullText.split('\n\n').map(p => `<p>${SecurityLayer.sanitize(p)}</p>`).join('')}
                </div>
                <button class="btn btn-outline bio-toggle" id="bio-toggle">
                    <i class="fa-solid fa-chevron-down"></i> Lire la suite
                </button>
            </div>
        `;
        
        // Gestionnaire clic "Voir plus"
        const toggleBtn = document.getElementById('bio-toggle');
        const bioFull = document.getElementById('bio-full');
        const bioIntro = document.getElementById('bio-intro');
        const bioHighlights = document.getElementById('bio-highlights');
        
        if (toggleBtn && bioFull) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = bioFull.style.display === 'none';
                
                if (isHidden) {
                    // Déplier : cacher l'intro et les highlights, montrer le texte complet
                    bioIntro.style.display = 'none';
                    bioHighlights.style.display = 'none';
                    bioFull.style.display = 'block';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Réduire';
                } else {
                    // Replier : montrer l'intro et les highlights, cacher le texte complet
                    bioIntro.style.display = 'block';
                    bioHighlights.style.display = 'grid';
                    bioFull.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Lire la suite';
                }
            });
        }
    };
    const renderSkills = (skillsData) => {
        const container = document.getElementById('skills-content');
        if (!container) return;
        container.innerHTML = `<h2 class="section-title fade-in-up"><i class="fa-solid fa-code"></i> Compétences</h2><div class="skills-grid">${skillsData.map((cat, i) => `<div class="skill-category fade-in-up" style="animation-delay: ${i * 0.1}s"><h3><i class="${cat.icon || 'fa-solid fa-star'}"></i> ${SecurityLayer.sanitize(cat.category)}</h3><div class="skill-list">${cat.technologies.map(t => `<span class="skill-tag">${SecurityLayer.sanitize(t)}</span>`).join('')}</div></div>`).join('')}</div>`;
    };
    
    const renderProjects = (projectsData) => {
        const container = document.getElementById('projects-content');
        if (!container) return;
        container.innerHTML = `<h2 class="section-title fade-in-up"><i class="fa-solid fa-diagram-project"></i> Projets Récents</h2><div class="projects-grid">${projectsData.map((p, i) => `<div class="project-card fade-in-up ${p.featured ? 'featured' : ''}" style="animation-delay: ${i * 0.15}s" data-project-title="${SecurityLayer.sanitize(p.title)}"><div class="project-image-container"><div class="project-image-slider" style="background-image: none;"><span class="project-emoji"><i class="${p.image || 'fa-solid fa-folder'}"></i></span></div></div>${p.featured ? '<span class="featured-badge"><i class="fa-solid fa-star"></i> Featured</span>' : ''}<div class="project-info"><h3>${SecurityLayer.sanitize(p.title)}</h3><p>${SecurityLayer.sanitize(p.description)}</p><div class="project-tech">${p.technologies.map(t => `<span class="tech-tag">${SecurityLayer.sanitize(t)}</span>`).join('')}</div><div class="project-links">${p.demoUrl ? `<a href="${p.demoUrl}" class="project-link" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe"></i> Démo Live</a>` : ''}${p.githubUrl ? `<a href="${p.githubUrl}" class="project-link" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Code Source</a>` : ''}</div></div></div>`).join('')}</div>`;
        
        // ✅ CORRECTION : Initialiser les rotateurs de projets
        const cards = container.querySelectorAll('.project-card');
        cards.forEach((card, i) => {
            const title = card.getAttribute('data-project-title');
            const projectData = projectsData.find(p => p.title === title);
            if (projectData && typeof ImageRotator !== 'undefined') {
                setTimeout(() => {
                    const slider = card.querySelector('.project-image-slider');
                    if (slider) {
                        const slug = titleToSlug(title);  // "Orientation" → "orientation"
                        ImageRotator.init(slider, {
                            category: slug,          // → "orientation" (nom du dossier)
                            prefix: 'site_' + slug,  // → "site_orientation" (préfixe du fichier)
                            count: 25,
                            type: 'project',
                            interval: 4000
                        });
                    }
                }, 300 + (i * 300));
            }
        });
    };
    
    const renderExperience = (experienceData) => {
        const container = document.getElementById('experience-content');
        if (!container) return;
        const work = experienceData.filter(e => e.type === 'work');
        const edu = experienceData.filter(e => e.type === 'education');
        let html = '<h2 class="section-title fade-in-up"><i class="fa-solid fa-briefcase"></i> Expérience</h2><div class="timeline">';
        if (work.length > 0) {
            html += '<h3 class="timeline-section-title" style="color:var(--primary);margin-bottom:1.5rem;"><i class="fa-solid fa-building"></i> Expérience Professionnelle</h3>';
            work.forEach((e, i) => html += `<div class="timeline-item fade-in-up" style="animation-delay:${i * 0.2}s"><div class="timeline-date"><i class="fa-regular fa-calendar"></i> ${SecurityLayer.sanitize(e.period)}</div><div class="timeline-content"><h3><i class="${e.icon || 'fa-solid fa-briefcase'}"></i> ${SecurityLayer.sanitize(e.title)}</h3><h4><i class="fa-solid fa-location-dot"></i> ${SecurityLayer.sanitize(e.company)}</h4><p>${SecurityLayer.sanitize(e.description)}</p></div></div>`);
        }
        if (edu.length > 0) {
            html += '<h3 class="timeline-section-title" style="color:var(--secondary);margin:2rem 0 1.5rem;"><i class="fa-solid fa-graduation-cap"></i> Formation</h3>';
            edu.forEach((e, i) => html += `<div class="timeline-item fade-in-up" style="animation-delay:${(work.length + i) * 0.2}s"><div class="timeline-date"><i class="fa-regular fa-calendar"></i> ${SecurityLayer.sanitize(e.period)}</div><div class="timeline-content education"><h3><i class="${e.icon || 'fa-solid fa-graduation-cap'}"></i> ${SecurityLayer.sanitize(e.title)}</h3><h4><i class="fa-solid fa-location-dot"></i> ${SecurityLayer.sanitize(e.company)}</h4><p>${SecurityLayer.sanitize(e.description)}</p></div></div>`);
        }
        container.innerHTML = html + '</div>';
    };
    
    const renderContact = (contactData, personalData) => {
        const container = document.getElementById('contact-content');
        if (!container) return;
        const socialLinksHtml = personalData.social.map(s => `<a href="${s.url}" class="social-link" target="_blank" rel="noopener noreferrer" title="${SecurityLayer.sanitize(s.platform)}"><i class="${s.icon}"></i></a>`).join('');
        const createActionButtons = () => {
            const a = personalData.contactActions;
            if (!a) return '';
            let b = '<div class="contact-buttons" style="margin-top:1.5rem;">';
            if (a.whatsapp?.enabled) { const n = personalData.whatsapp.replace(/[\+\s\-\(\)]/g, ''); b += `<a href="https://wa.me/${n}?text=${encodeURIComponent(a.whatsapp.message || 'Bonjour !')}" class="contact-action-btn btn-whatsapp" target="_blank" rel="noopener noreferrer"><span class="btn-icon"><i class="fa-brands fa-whatsapp"></i></span><span class="btn-text">WhatsApp</span></a>`; }
            if (a.email?.enabled) b += `<a href="mailto:${personalData.email}?subject=${encodeURIComponent(a.email.subject || '')}" class="contact-action-btn btn-email"><span class="btn-icon"><i class="fa-solid fa-envelope"></i></span><span class="btn-text">Email</span></a>`;
            if (a.call?.enabled) b += `<a href="tel:${personalData.phone.replace(/[\s\-\(\)]/g, '')}" class="contact-action-btn btn-call"><span class="btn-icon"><i class="fa-solid fa-phone"></i></span><span class="btn-text">Appeler</span></a>`;
            return b + '</div>';
        };
        container.innerHTML = `<h2 class="section-title fade-in-up"><i class="fa-solid fa-envelope"></i> Contact</h2><div class="contact-grid fade-in-up"><div class="contact-info"><h3><i class="fa-solid fa-comments"></i> Parlons de votre projet</h3><p>${SecurityLayer.sanitize(contactData.cta)}</p><div class="contact-details"><div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-envelope"></i></div><span><a href="mailto:${personalData.email}" style="color:inherit;text-decoration:none;">${SecurityLayer.sanitize(personalData.email)}</a></span></div><div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-phone"></i></div><span><a href="tel:${personalData.phone.replace(/[\s\-\(\)]/g, '')}" style="color:inherit;text-decoration:none;">${SecurityLayer.sanitize(personalData.phone)}</a></span></div><div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-location-dot"></i></div><span>${SecurityLayer.sanitize(personalData.location)}</span></div></div><div class="social-links">${socialLinksHtml}</div>${createActionButtons()}</div><div class="contact-form-container"><form class="contact-form" id="contact-form"><input type="hidden" name="access_key" value="4a466fe5-0c54-47df-b410-e0540fa08a98"><input type="hidden" name="subject" value="Nouveau message depuis le Portfolio"><input type="hidden" name="from_name" value="Portfolio Contact"><input type="hidden" name="redirect" value="false"><input type="text" name="website_url_custom" style="display:none!important;" tabindex="-1" autocomplete="off">${contactData.formFields.map(f => `<div class="form-group"><label for="field-${f.name}"><i class="${f.icon || 'fa-solid fa-pencil'}"></i> ${SecurityLayer.sanitize(f.label)}</label>${f.type === 'textarea' ? `<textarea id="field-${f.name}" name="${f.name}" placeholder="Votre ${f.label.toLowerCase()}" ${f.required ? 'required' : ''} maxlength="1000"></textarea>` : `<input id="field-${f.name}" type="${f.type}" name="${f.name}" placeholder="Votre ${f.label.toLowerCase()}" ${f.required ? 'required' : ''} maxlength="${f.type === 'email' ? '254' : '200'}">`}</div>`).join('')}<button type="submit" class="btn btn-primary"><i class="fa-solid fa-paper-plane"></i> Envoyer le message</button><p class="form-message" id="form-message" style="display:none;text-align:center;margin-top:1rem;"></p></form></div></div>`;
        
        const form = document.getElementById('contact-form');
        if (form) {
            const showMessage = (text, type) => {
                const msg = document.getElementById('form-message');
                if (!msg) return;
                if (!text) { msg.style.display = 'none'; return; }
                msg.textContent = text;
                msg.style.display = 'block';
                msg.className = 'form-message ' + type;
                if (type === 'success') setTimeout(() => msg.style.display = 'none', 5000);
            };
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalBtn = submitBtn.innerHTML;
                if (form.querySelector('input[name="website_url_custom"]').value) return;
                if (!SecurityLayer.checkRateLimit()) { showMessage('⚠️ Trop de tentatives.', 'error'); return; }
                const fd = new FormData(form);
                const name = fd.get('name')?.trim() || '';
                const email = fd.get('email')?.trim() || '';
                const subject = fd.get('subject')?.trim() || '';
                const message = fd.get('message')?.trim() || '';
                if (!name || !email || !message) { showMessage('⚠️ Champs obligatoires manquants.', 'error'); return; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMessage('⚠️ Email invalide.', 'error'); return; }
                if (SecurityLayer.detectXSS(name + email + subject + message)) { showMessage('⚠️ Contenu non autorisé.', 'error'); return; }
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';
                submitBtn.disabled = true;
                try {
                    form.querySelector('input[name="subject"]').value = `Portfolio : ${subject || 'Nouveau message'}`;
                    form.querySelector('input[name="from_name"]').value = name;
                    const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.success) { showMessage('✅ Message envoyé !', 'success'); form.reset(); }
                    else throw new Error(data.message);
                } catch (err) {
                    showMessage('❌ Erreur. Ouverture du client mail...', 'error');
                    setTimeout(() => { if (confirm('Ouvrir votre client mail ?')) window.location.href = `mailto:jtshikaku@gmail.com?subject=${encodeURIComponent(subject || 'Contact')}&body=${encodeURIComponent(`De : ${name} (${email})\n\n${message}`)}`; }, 500);
                } finally { submitBtn.innerHTML = originalBtn; submitBtn.disabled = false; }
            });
        }
    };
    
    const renderFooter = (footerData) => {
        const container = document.getElementById('footer-content');
        if (!container) return;
        container.innerHTML = `<div class="footer-content"><p>${SecurityLayer.sanitize(footerData.copyright.replace('2024', new Date().getFullYear()))}</p><p class="footer-message">${SecurityLayer.sanitize(footerData.message)}</p></div>`;
    };
    
    const renderAll = async () => {
        try {
            const data = await DataLoader.load();
            renderNavigation(data.navigation);
            renderHero(data.personal);
            renderAbout(data.about, data.personal);
            renderBiography(data.biography);
            renderSkills(data.skills);
            renderProjects(data.projects);
            renderExperience(data.experience);
            renderContact(data.contact, data.personal);
            renderFooter(data.footer);
            const loader = document.getElementById('security-loader');
            if (loader) setTimeout(() => loader.classList.add('hidden'), 800);
            console.log('✨ Portfolio rendered successfully');
        } catch (error) {
            console.error('❌ Render failed:', error);
            const loader = document.getElementById('security-loader');
            if (loader) loader.innerHTML = '<div class="loader-content error"><div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>Erreur de chargement</h3><p>Impossible de charger le portfolio.</p><button onclick="location.reload()" class="btn btn-primary" style="margin-top:1rem;"><i class="fa-solid fa-rotate"></i> Rafraîchir</button></div>';
        }
    };
    
    return { render: renderAll, createElement };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Renderer;