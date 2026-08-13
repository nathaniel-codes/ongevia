interface ConnectInstagramButtonProps {
  label?: string;
  shortLabel?: string;
  className?: string;
  /** Show abbreviated "Connect" on small screens (top bar). */
  responsive?: boolean;
}

export default function ConnectInstagramButton({
  label = "Connect Instagram",
  shortLabel = "Connect",
  className = "shrink-0 whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded bg-accent text-white hover:bg-accent-hover",
  responsive = false,
}: ConnectInstagramButtonProps) {
  return (
    <a href="/api/instagram/connect" className={className}>
      {responsive ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </a>
  );
}
