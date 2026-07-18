// ==================== APPLICATION PRINCIPALE ====================
const PortfolioApp = (() => {
    'use strict';
    
    let isInitialized = false;
    
    // Gestionnaire de navigation responsive
    const initNavigation = () => {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (!navToggle || !navMenu) return;
        
        navToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isActive);
        });
        
        // Fermeture au clic sur un lien
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Fermeture au clic en dehors du menu
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Fermeture avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    };
    
    // Animation au scroll
    const initScrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observer les éléments avec animation
        document.querySelectorAll('.fade-in-up').forEach(el => {
            observer.observe(el);
        });
    };
    
    // Navigation active au scroll
    const initActiveNavigation = () => {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        if (sections.length === 0 || navLinks.length === 0) return;
        
        const observerOptions = {
            threshold: 0.3,
            rootMargin: '-70px 0px 0px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, observerOptions);
        
        sections.forEach(section => observer.observe(section));
    };
    
    // Navbar scroll effect
    const initNavbarScroll = () => {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        
        let lastScrollY = 0;
        let ticking = false;
        
        const updateNavbar = () => {
            const scrollY = window.scrollY;
            
            // Ajouter/retirer la classe scrolled
            if (scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollY = scrollY;
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        }, { passive: true });
    };
    
    // Bouton retour en haut
    const initBackToTop = () => {
        const backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;
        
        let ticking = false;
        
        const toggleBackToTop = () => {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(toggleBackToTop);
                ticking = true;
            }
        }, { passive: true });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Vérifier l'état initial
        toggleBackToTop();
    };
    
    // Effet de frappe pour le texte animé
    const initTypeWriter = () => {
        const typedText = document.querySelector('.typed-text');
        if (!typedText) return;
        
        const text = typedText.textContent || '';
        typedText.textContent = '';
        
        let index = 0;
        const speed = 50;
        
        const typeWriter = () => {
            if (index < text.length) {
                typedText.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, speed);
            }
        };
        
        // Démarrer après un délai
        setTimeout(typeWriter, 1000);
    };
    
    // Smooth scroll pour les ancres
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };
    
    // Masquer le loader
    const hideLoader = () => {
        const loader = document.getElementById('security-loader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                // Supprimer le loader du DOM après l'animation
                setTimeout(() => {
                    if (loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                    }
                }, 600);
            }, 500);
        }
    };
    
    // Gestion des erreurs globales
    const initErrorHandling = () => {
        window.addEventListener('error', (event) => {
            console.error('❌ Erreur globale:', event.error ? event.error.message : event.message);
            // Log discret en production
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Promesse rejetée non gérée:', event.reason);
        });
    };
    
    // Protection contre le clickjacking
    const initFrameProtection = () => {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    };
    
    // Désactiver le clic droit (optionnel - décommenter pour activer)
    const initContextMenuProtection = () => {
        // document.addEventListener('contextmenu', (e) => {
        //     e.preventDefault();
        // });
        
        // Protection du clavier (F12, Ctrl+U, Ctrl+Shift+I)
        document.addEventListener('keydown', (e) => {
            // Bloquer F12
            if (e.key === 'F12') {
                // e.preventDefault();
            }
            // Bloquer Ctrl+Shift+I
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                // e.preventDefault();
            }
            // Bloquer Ctrl+U
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                // e.preventDefault();
            }
        });
    };
    
    // Ajouter les attributs de sécurité aux liens externes
    const initExternalLinks = () => {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            if (!link.hasAttribute('rel')) {
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    };
    
    // Observer les mutations pour les liens ajoutés dynamiquement
    const initLinkObserver = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Vérifier les liens dans le nœud ajouté
                        const links = node.querySelectorAll ? node.querySelectorAll('a[target="_blank"]') : [];
                        links.forEach(link => {
                            if (!link.hasAttribute('rel')) {
                                link.setAttribute('rel', 'noopener noreferrer');
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };
    
    // Afficher l'année courante dans le footer
    const initFooterYear = () => {
        const footerYear = document.getElementById('footer-year');
        if (footerYear) {
            footerYear.textContent = new Date().getFullYear();
        }
    };
    
    // Performance monitoring
    const initPerformanceMonitoring = () => {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 100) {
                            console.warn(`⚠️ Performance: ${entry.name} a pris ${entry.duration.toFixed(2)}ms`);
                        }
                    }
                });
                
                observer.observe({ entryTypes: ['measure', 'resource'] });
            } catch (e) {
                // PerformanceObserver non supporté
            }
        }
    };
    
    // Service Worker (optionnel - pour le mode hors ligne)
    const initServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            // Décommenter pour activer le service worker
            // navigator.serviceWorker.register('/sw.js')
            //     .then(registration => {
            //         console.log('✅ Service Worker enregistré');
            //     })
            //     .catch(error => {
            //         console.warn('Service Worker non enregistré:', error);
            //     });
        }
    };
    
    // Initialisation principale
    const init = async () => {
        if (isInitialized) return;
        
        try {
            console.log('🚀 Démarrage du portfolio...');
            
            // Protections de base
            initFrameProtection();
            initErrorHandling();
            initContextMenuProtection();
            
            // Rendu du contenu (dataLoader + renderer)
            await Renderer.render();
            
            // Initialisation des fonctionnalités UI
            initNavigation();
            initScrollAnimations();
            initActiveNavigation();
            initNavbarScroll();
            initBackToTop();
            initSmoothScroll();
            initExternalLinks();
            initLinkObserver();
            initFooterYear();
            
            // Effet de frappe (après le rendu)
            setTimeout(() => {
                initTypeWriter();
            }, 500);
            
            // Performance et Service Worker
            initPerformanceMonitoring();
            initServiceWorker();
            
            // Masquer le loader
            hideLoader();
            
            isInitialized = true;
            console.log('✅ Portfolio initialisé avec succès !');
            
        } catch (error) {
            console.error('❌ Échec de l\'initialisation:', error);
            
            // Afficher un message d'erreur convivial
            const securityLoader = document.getElementById('security-loader');
            if (securityLoader) {
                securityLoader.innerHTML = `
                    <div class="loader-content error">
                        <div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger le portfolio. Veuillez réessayer.</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                            <i class="fa-solid fa-rotate"></i> Rafraîchir la page
                        </button>
                    </div>
                `;
            }
        }
    };
    
    // Démarrage au chargement du DOM
    document.addEventListener('DOMContentLoaded', init);
    
    // API publique
    return {
        init,
        isInitialized: () => isInitialized
    };
})();

// Export pour les tests si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
}