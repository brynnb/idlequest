/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TEST_MODE: string;
    readonly VITE_WT_CERT_HASH?: string;
    // Add other env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
