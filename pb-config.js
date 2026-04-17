/**
 * Configuration de PocketBase (Local vs Production)
 * 
 * DEV  → ouverture via file://, localhost ou 127.0.0.1
 * PROD → tout autre hostname (ex: buddzybuddz.github.io, fly.dev, etc.)
 */
const _hostname = window.location.hostname;
const _protocol = window.location.protocol;

const IS_DEV = (
    _protocol === 'file:'           ||  // Ouverture directe via fichier (ex: VS Code, double-clic)
    _hostname === 'localhost'       ||  // Serveur local classique
    _hostname === '127.0.0.1'           // Serveur local IP
);

// URL de développement (PocketBase local sur port 8091)
const DEV_PB_URL = 'http://127.0.0.1:8091';

// URL de production (Fly.io)
const PROD_PB_URL = 'https://nutridash-pb.fly.dev';

const PB_URL = IS_DEV ? DEV_PB_URL : PROD_PB_URL;

console.log(`[PocketBase] Mode: ${IS_DEV ? 'DEVELOPPEMENT' : 'PRODUCTION'}`);
console.log(`[PocketBase] URL: ${PB_URL}`);
console.log(`[PocketBase] Hostname: "${_hostname}" | Protocol: "${_protocol}"`);

// Clé API Gemini (en dur pour plus de simplicité)
const GEMINI_API_KEY = "AIzaSyAsOSf7V9XCDy3tgkU6JfSjvnOGt9kOgC4";

// Exposer globalement pour les autres scripts
window.PB_CONFIG = {
    url: PB_URL,
    isDev: IS_DEV,
    geminiApiKey: GEMINI_API_KEY
};
