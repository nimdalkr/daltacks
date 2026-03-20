import { connect, disconnect, getLocalStorage, isConnected } from "@stacks/connect";
import type { StacksNetworkName } from "@daltacks/stx-utils";

const NETWORK = (import.meta.env.VITE_STACKS_NETWORK ?? "mainnet") as StacksNetworkName;

function resolvePrincipal() {
  if (!isConnected()) {
    return null;
  }

  const data = getLocalStorage();
  const address = data?.addresses.stx[0]?.address;
  return address ?? null;
}

export function getCurrentPrincipal() {
  return resolvePrincipal();
}

export function isWalletConnected() {
  return isConnected();
}

export async function connectWallet() {
  const result = await connect({
    network: NETWORK,
    forceWalletSelect: true,
    persistWalletSelect: true,
    enableLocalStorage: true
  });

  return result.addresses[0]?.address ?? null;
}

export function disconnectWallet() {
  disconnect();
}
