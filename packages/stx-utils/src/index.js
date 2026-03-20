const STACKS_PRINCIPAL_REGEX = /^[SM][A-Z0-9]{20,}(?:\.[a-zA-Z0-9-]+)?$/;
export function isPrincipalLike(value) {
    return STACKS_PRINCIPAL_REGEX.test(value.trim());
}
export function assertPrincipal(value) {
    if (!isPrincipalLike(value)) {
        throw new Error(`Invalid Stacks principal: ${value}`);
    }
}
export function truncatePrincipal(value, width = 6) {
    if (value.length <= width * 2 + 1) {
        return value;
    }
    return `${value.slice(0, width)}...${value.slice(-width)}`;
}
export function getStacksApiBaseUrl(network) {
    switch (network) {
        case "mainnet":
            return "https://api.hiro.so";
        case "testnet":
            return "https://api.testnet.hiro.so";
        case "devnet":
            return "http://localhost:3999";
        default:
            return "https://api.testnet.hiro.so";
    }
}
export function fromMicroStx(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const micro = typeof value === "bigint" ? Number(value) : Number(value);
    if (Number.isNaN(micro)) {
        return null;
    }
    return micro / 1_000_000;
}
export function toHexPrefixed(value) {
    return value.startsWith("0x") ? value : `0x${value}`;
}
