/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUMPROOM_API_KEY: string;
    readonly VITE_PUMPROOM_REALM: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
