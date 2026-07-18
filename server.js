// ==================== SERVEUR PORTFOLIO ====================
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware de sécurité
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Headers de sécurité globaux
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// Rate limiting - UNIQUEMENT pour les API (pas les fichiers statiques)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_API_REQUESTS = 30; // 30 requêtes API par minute

const apiRateLimiter = (req, res, next) => {
    // Ignorer les fichiers statiques
    const ext = path.extname(req.url).toLowerCase();
    const staticExts = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.json', '.pdf', '.mp4', '.webm'];
    
    if (staticExts.includes(ext) || req.url === '/' || req.url === '/index.html') {
        return next(); // Pas de rate limit pour les fichiers statiques
    }
    
    // Rate limit seulement pour /api/
    if (!req.url.startsWith('/api/')) {
        return next();
    }
    
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }
    
    const requests = rateLimit.get(ip).filter(t => t > now - RATE_LIMIT_WINDOW);
    requests.push(now);
    rateLimit.set(ip, requests);
    
    if (requests.length > MAX_API_REQUESTS) {
        return res.status(429).json({ 
            success: false, 
            message: 'Trop de requêtes API. Veuillez patienter 1 minute.',
            retryAfter: 60
        });
    }
    
    // Nettoyage périodique
    if (Math.random() < 0.05) {
        for (const [key, times] of rateLimit.entries()) {
            const filtered = times.filter(t => t > now - RATE_LIMIT_WINDOW);
            if (filtered.length === 0) rateLimit.delete(key);
            else rateLimit.set(key, filtered);
        }
    }
    
    next();
};

app.use(apiRateLimiter);

// Bloquer l'accès aux fichiers sensibles
app.use((req, res, next) => {
    const blockedPatterns = ['.env', '.git', 'node_modules', '.htaccess', '.htpasswd', 'package.json', 'package-lock.json', 'server.js'];
    const url = req.url.toLowerCase();
    
    for (const pattern of blockedPatterns) {
        if (url.includes(pattern)) {
            return res.status(403).json({ success: false, message: 'Accès interdit' });
        }
    }
    next();
});

// ==================== SERVIR LES FICHIERS STATIQUES ====================
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        
        const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.ico': 'image/x-icon'
        };
        
        if (mimeTypes[ext]) {
            res.setHeader('Content-Type', mimeTypes[ext]);
        }
        
        if (['.html', '.json'].includes(ext)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (['.css', '.js'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    },
    dotfiles: 'deny',
    index: false,
    fallthrough: true
}));

// ==================== LOGGING ====================
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        let emoji = '✅';
        if (status >= 400) emoji = '⚠️';
        if (status >= 500) emoji = '❌';
        if (status === 429) emoji = '🚫';
        
        // Logger seulement les erreurs ou les requêtes lentes
        if (status >= 400 || duration > 100) {
            console.log(`${emoji} ${req.method} ${req.url} → ${status} (${duration}ms)`);
        }
    });
    
    next();
});

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Ping
app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

// API Visites
app.post('/api/visits', (req, res) => {
    const { page } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`📊 Visite: ${page || '/'} - IP: ${ip}`);
    res.json({ success: true });
});

// API Contact
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Email invalide.' });
    }
    
    console.log('📧 Contact:', { name, email, subject });
    res.json({ success: true, message: 'Message envoyé avec succès !' });
});

// ==================== GESTION ERREURS ====================
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    next();
});

app.use((req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API non trouvée' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('❌ Erreur:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
});

// ==================== DÉMARRAGE ====================
app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('🚀 Portfolio prêt !');
    console.log('='.repeat(60));
    console.log(`   📡 http://127.0.0.1:${PORT}`);
    console.log(`   📡 http://localhost:${PORT}`);
    console.log(`   ⚡ Rate limit: ${MAX_API_REQUESTS} req/min (API seulement)`);
    console.log('='.repeat(60));
    console.log('   Ctrl+C pour arrêter\n');
});

['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
        console.log('\n🛑 Arrêt...');
        process.exit(0);
    });
});