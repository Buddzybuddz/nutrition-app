/**
 * Configuration de PocketBase (Local vs Production)
 */
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL de développement (Celle que vous venez de lancer sur le port 8091)
const DEV_PB_URL = 'http://127.0.0.1:8091';

// URL de production (A remplir quand vous aurez créé votre instance Pockethost)
const PROD_PB_URL = 'https://nutridash-pb.fly.dev'; // Fly.io Production

const PB_URL = IS_DEV ? DEV_PB_URL : PROD_PB_URL;

console.log(`[PocketBase] Mode: ${IS_DEV ? 'DEVELOPPEMENT' : 'PRODUCTION'}`);
console.log(`[PocketBase] URL: ${PB_URL}`);

// Exposer globalement pour les autres scripts
window.PB_CONFIG = {
    url: PB_URL,
    isDev: IS_DEV
};
