// ==================== COUCHE DE SÉCURITÉ AVANCÉE ====================
const SecurityLayer = (() => {
    'use strict';
    
    // Configuration de sécurité
    const CONFIG = {
        maxRequestsPerMinute: 30,
        honeypotFieldName: 'website_url_custom',
        suspiciousPatterns: [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /onerror\s*=/gi,
            /onload\s*=/gi,
            /eval\(/gi,
            /document\.cookie/gi,
            /window\.location/gi
        ],
        blockedIPs: new Set(),
        tokenKey: 'csrf_token_portfolio'
    };
    
    // État de sécurité
    let securityState = {
        initialized: false,
        integrityChecked: false,
        requestCount: 0,
        lastRequestTime: Date.now()
    };
    
    // Génération de token CSRF avec hachage amélioré
    const generateCSRFToken = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const entropy = performance.now().toString(36).replace('.', '');
        
        // Fonction de hachage personnalisée (simulation crypto)
        const hash = (str) => {
            let h1 = 0xdeadbeef ^ str.length;
            let h2 = 0x41c6ce57 ^ str.length;
            
            for (let i = 0; i < str.length; i++) {
                const ch = str.charCodeAt(i);
                h1 = Math.imul(h1 ^ ch, 2654435761);
                h2 = Math.imul(h2 ^ ch, 1597334677);
            }
            
            h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
            h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489909);
            h1 = h1 ^ (h1 >>> 16);
            
            h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
            h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
            h2 = h2 ^ (h2 >>> 16);
            
            return (h2 >>> 0).toString(16).padStart(8, '0') + 
                   (h1 >>> 0).toString(16).padStart(8, '0');
        };
        
        return `${hash(timestamp)}.${hash(random)}.${hash(entropy)}`;
    };
    
    // Stockage sécurisé du token
    const storeToken = (token) => {
        try {
            const encodedToken = btoa(token);
            sessionStorage.setItem(CONFIG.tokenKey, encodedToken);
            
            // Double protection avec cookie httpOnly simulé
            document.cookie = `${CONFIG.tokenKey}=${encodedToken}; path=/; SameSite=Strict; max-age=3600`;
        } catch (e) {
            console.warn('Token storage failed:', e);
        }
    };
    
    // Validation du token
    const validateToken = (token) => {
        try {
            const stored = sessionStorage.getItem(CONFIG.tokenKey);
            return stored && btoa(token) === stored;
        } catch {
            return false;
        }
    };
    
    // Détection d'injection XSS
    const detectXSS = (input) => {
        if (typeof input !== 'string') return false;
        return CONFIG.suspiciousPatterns.some(pattern => pattern.test(input));
    };
    
    // Rate limiting
    const checkRateLimit = () => {
        const now = Date.now();
        const timeWindow = 60000; // 1 minute
        
        if (now - securityState.lastRequestTime > timeWindow) {
            securityState.requestCount = 0;
            securityState.lastRequestTime = now;
        }
        
        securityState.requestCount++;
        return securityState.requestCount <= CONFIG.maxRequestsPerMinute;
    };
    
    // Protection anti-debugging basique
    const antiDebugProtection = () => {
        const threshold = 160;
        
        setInterval(() => {
            const start = performance.now();
            debugger;
            const duration = performance.now() - start;
            
            if (duration > threshold) {
                // Comportement suspect détecté
                document.body.innerHTML = '';
                window.location.href = 'about:blank';
            }
        }, 1000);
    };
    
    // Vérification d'intégrité du DOM
    const checkDOMIntegrity = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Vérifier les nouveaux éléments pour du contenu suspect
                        if (node.tagName === 'SCRIPT' && !node.hasAttribute('data-authorized')) {
                            node.remove();
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    };
    
    // Nettoyage des entrées - VERSION CORRIGÉE (sans échapper les /)
    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        
        // Ne pas échapper les URLs et les caractères nécessaires aux liens
        const map = {
            '&': '&',
            '<': '&lt;',
            '>': '&gt;',
            //'"': '&quot;',
            "'": '\''
            // Le caractère '/' n'est plus échappé pour préserver les URLs
        };
        
        return input.replace(/[&<>"']/g, (char) => map[char]);
    };
    
    // Initialisation de la sécurité
    const init = () => {
        if (securityState.initialized) return;
        
        // Génération et stockage du token CSRF
        const token = generateCSRFToken();
        storeToken(token);
        
        // Activation des protections
        checkDOMIntegrity();
        
        // Protection anti-debugging (désactivée en production si besoin)
        // antiDebugProtection();
        
        // Ajout du token aux formulaires
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!form.querySelector(`input[name="${CONFIG.tokenKey}"]`)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = CONFIG.tokenKey;
                input.value = token;
                form.appendChild(input);
            }
        });
        
        securityState.initialized = true;
        securityState.integrityChecked = true;
        
        console.log('🛡️ Security layer initialized');
    };
    
    // API publique
    return {
        init,
        sanitize: sanitizeInput,
        detectXSS,
        validateToken,
        checkRateLimit,
        generateToken: generateCSRFToken
    };
})();

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    SecurityLayer.init();
});