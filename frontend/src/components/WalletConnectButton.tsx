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
      className="tactical-button-secondary panel-cut px-4 py-3 text-sm"
    >
      Disconnect Wallet
    </button>
  ) : (
    <button
      type="button"
      onClick={onConnect}
      className="tactical-button panel-cut px-5 py-3 text-sm"
    >
      Connect Wallet
    </button>
  );
}
