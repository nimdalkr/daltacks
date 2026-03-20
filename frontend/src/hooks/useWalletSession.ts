import { useEffect, useState } from "react";
import { connectWallet, disconnectWallet, getCurrentPrincipal, isWalletConnected } from "../services/wallet";

export function useWalletSession() {
  const [principal, setPrincipal] = useState<string | null>(() => getCurrentPrincipal());
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => isWalletConnected());

  useEffect(() => {
    setPrincipal(getCurrentPrincipal());
    setIsSignedIn(isWalletConnected());
  }, []);

  return {
    principal,
    isSignedIn,
    async connect() {
      const nextPrincipal = await connectWallet();
      setPrincipal(nextPrincipal);
      setIsSignedIn(Boolean(nextPrincipal));
    },
    disconnect() {
      disconnectWallet();
      setPrincipal(null);
      setIsSignedIn(false);
    }
  };
}
