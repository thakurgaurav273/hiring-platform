/**
 * WaveDivider — the wave SVG used at the bottom of the dark header
 * on both the login and forgot-password pages.
 *
 * Usage:
 *   <WaveDivider />           — default, fills the parent element
 *   <WaveDivider height={60} /> — with custom height
 */
export function WaveDivider({ height = 60 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full text-white"
      style={{ height }}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0,40 C480,100 960,0 1440,40 L1440,100 L0,100 Z" />
    </svg>
  );
}
