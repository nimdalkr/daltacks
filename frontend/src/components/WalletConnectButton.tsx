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
      className="tactical-button-secondary panel-cut rounded-[1rem] px-4 py-3 text-sm uppercase tracking-[0.18em]"
    >
      Disconnect Wallet
    </button>
  ) : (
    <button
      type="button"
      onClick={onConnect}
      className="tactical-button panel-cut rounded-[1rem] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
    >
      Connect Wallet
    </button>
  );
}
