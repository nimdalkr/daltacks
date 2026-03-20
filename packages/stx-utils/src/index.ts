export type StacksNetworkName = "mainnet" | "testnet" | "devnet";

const STACKS_PRINCIPAL_REGEX = /^[SM][A-Z0-9]{20,}(?:\.[a-zA-Z0-9-]+)?$/;

export function isPrincipalLike(value: string): boolean {
  return STACKS_PRINCIPAL_REGEX.test(value.trim());
}

export function assertPrincipal(value: string): asserts value is string {
  if (!isPrincipalLike(value)) {
    throw new Error(`Invalid Stacks principal: ${value}`);
  }
}

export function truncatePrincipal(value: string, width = 6): string {
  if (value.length <= width * 2 + 1) {
    return value;
  }

  return `${value.slice(0, width)}...${value.slice(-width)}`;
}

export function getStacksApiBaseUrl(network: StacksNetworkName): string {
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

export function getExplorerTxUrl(network: StacksNetworkName, txid: string): string {
  const normalized = txid.startsWith("0x") ? txid : `0x${txid}`;

  switch (network) {
    case "mainnet":
      return `https://explorer.hiro.so/txid/${normalized}`;
    case "testnet":
      return `https://explorer.hiro.so/txid/${normalized}?chain=testnet`;
    case "devnet":
      return `http://localhost:8000/txid/${normalized}?chain=testnet`;
    default:
      return `https://explorer.hiro.so/txid/${normalized}?chain=testnet`;
  }
}

export function fromMicroStx(value: bigint | number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const micro = typeof value === "bigint" ? Number(value) : Number(value);

  if (Number.isNaN(micro)) {
    return null;
  }

  return micro / 1_000_000;
}

export function toHexPrefixed(value: string): string {
  return value.startsWith("0x") ? value : `0x${value}`;
}
