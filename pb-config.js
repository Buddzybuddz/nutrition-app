const _hostname = window.location.hostname;
const _protocol = window.location.protocol;

const IS_DEV = (
    _protocol === 'file:'           ||
    _hostname === 'localhost'       ||
    _hostname === '127.0.0.1'
);

const DEV_PB_URL = 'http://127.0.0.1:8090';
const PROD_PB_URL = 'https://nutridash-pb.fly.dev';
const PB_URL = IS_DEV ? DEV_PB_URL : PROD_PB_URL;

if (IS_DEV) {
    console.log(`[PocketBase] Mode: DEVELOPPEMENT`);
    console.log(`[PocketBase] URL: ${PB_URL}`);
}

window.PB_CONFIG = {
    url: PB_URL,
    isDev: IS_DEV
};
