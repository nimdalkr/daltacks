interface ImportMetaEnv {
  readonly VITE_STACKS_NETWORK?: "mainnet" | "testnet" | "devnet";
  readonly VITE_STACKS_API_BASE_URL?: string;
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_CONTRACT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

