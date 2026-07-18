// ==================== CHARGEUR DE DONNÉES SÉCURISÉ ====================
const DataLoader = (() => {
    'use strict';
    
    let cachedData = null;
    let loadingPromise = null;
    
    // Validation du schéma de données
    const validateDataSchema = (data) => {
        const requiredFields = ['personal', 'navigation', 'about', 'skills', 'projects', 'experience', 'contact'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Validation approfondie
        if (!data.personal.name || !data.personal.email) {
            throw new Error('Personal information incomplete');
        }
        
        if (!Array.isArray(data.navigation) || data.navigation.length === 0) {
            throw new Error('Navigation data is invalid');
        }
        
        return true;
    };
    
    // Décodage Base64 sécurisé
    const safeDecode = (str) => {
        try {
            // Vérification des caractères valides
            if (!/^[A-Za-z0-9+/=]+$/.test(str)) {
                return str;
            }
            return atob(str);
        } catch {
            return str;
        }
    };
    
    // Chargement des données avec cache et retry
    const loadData = async () => {
        // Retourner le cache si disponible
        if (cachedData) {
            return cachedData;
        }
        
        // Éviter les appels concurrents
        if (loadingPromise) {
            return loadingPromise;
        }
        
        loadingPromise = (async () => {
            const maxRetries = 3;
            let lastError = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Vérification rate limiting
                    if (!SecurityLayer.checkRateLimit()) {
                        throw new Error('Rate limit exceeded');
                    }
                    
                    // Ajout d'un paramètre anti-cache
                    const timestamp = new Date().getTime();
                    const response = await fetch(`data/portfolio.json?t=${timestamp}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    // Vérification du type de contenu
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Invalid content type');
                    }
                    
                    const rawData = await response.text();
                    
                    // Détection de contenu malveillant
                    if (SecurityLayer.detectXSS(rawData)) {
                        throw new Error('Potential XSS detected in data');
                    }
                    
                    const data = JSON.parse(rawData);
                    
                    // Validation du schéma
                    if (validateDataSchema(data)) {
                        cachedData = Object.freeze(data); // Immutable
                        console.log('✅ Data loaded and validated successfully');
                        return cachedData;
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
                    
                    if (attempt < maxRetries) {
                        // Attente exponentielle
                        await new Promise(resolve => 
                            setTimeout(resolve, Math.pow(2, attempt) * 1000)
                        );
                    }
                }
            }
            
            throw new Error(`Failed to load data after ${maxRetries} attempts: ${lastError}`);
        })();
        
        return loadingPromise;
    };
    
    // Nettoyage récursif des données
    const sanitizeData = (data) => {
        if (typeof data === 'string') {
            return SecurityLayer.sanitize(data);
        }
        
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }
        
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = sanitizeData(value);
            }
            return sanitized;
        }
        
        return data;
    };
    
    // Récupération sécurisée des données
    const getData = async () => {
        const data = await loadData();
        return sanitizeData(structuredClone(data)); // Deep clone
    };
    
    // Invalidation du cache (utile pour les mises à jour)
    const invalidateCache = () => {
        cachedData = null;
        loadingPromise = null;
    };
    
    return {
        load: getData,
        invalidateCache
    };
})();