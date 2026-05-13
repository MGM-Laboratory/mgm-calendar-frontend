// Tiny 4-color signature mark. Per design doc §5.5: triangle, square,
// circle, X — one shape in each brand color, arranged in a 2×2.

interface Props {
  size?: number;
  className?: string;
}

export function ShapeSignature({ size = 28, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* TL: blue triangle */}
      <polygon points="2,10 10,10 6,2" fill="#3a6dc5" />
      {/* TR: yellow square */}
      <rect x="14" y="2" width="8" height="8" fill="#f7bf33" />
      {/* BL: red circle */}
      <circle cx="6" cy="18" r="4" fill="#f94141" />
      {/* BR: green X */}
      <g stroke="#0f8657" strokeWidth="2.2" strokeLinecap="round">
        <line x1="14.5" y1="14.5" x2="21.5" y2="21.5" />
        <line x1="21.5" y1="14.5" x2="14.5" y2="21.5" />
      </g>
    </svg>
  );
}
