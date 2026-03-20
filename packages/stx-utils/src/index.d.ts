export type StacksNetworkName = "mainnet" | "testnet" | "devnet";
export declare function isPrincipalLike(value: string): boolean;
export declare function assertPrincipal(value: string): asserts value is string;
export declare function truncatePrincipal(value: string, width?: number): string;
export declare function getStacksApiBaseUrl(network: StacksNetworkName): string;
export declare function fromMicroStx(value: bigint | number | string | null | undefined): number | null;
export declare function toHexPrefixed(value: string): string;
