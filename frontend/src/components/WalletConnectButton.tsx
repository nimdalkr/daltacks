interface WalletConnectButtonProps {
  isSignedIn: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export function WalletConnectButton({
  isSignedIn,
  onConnect,
  onDisconnect
}: WalletConnectButtonProps) {
  return isSignedIn ? (
    <button
      type="button"
      onClick={onDisconnect}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-coral/60"
    >
      Disconnect
    </button>
  ) : (
    <button
      type="button"
      onClick={onConnect}
      className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
    >
      Connect Wallet
    </button>
  );
}

