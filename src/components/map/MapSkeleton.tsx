interface Props {
  height?: number | string;
  label?: string;
}

export function MapSkeleton({ height = 520, label = "Carregando malha territorial..." }: Props) {
  return (
    <div
      className="relative rounded-md border bg-muted/20 overflow-hidden"
      style={{ height }}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-1/2 max-w-[280px] text-muted-foreground theecon-skeleton-pulse"
          aria-hidden
        >
          <path
            d="M60 20 L110 14 L140 34 L168 40 L160 78 L176 110 L150 150 L120 186 L84 178 L58 150 L36 120 L28 76 L44 44 Z"
            fill="currentColor"
            opacity="0.18"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M60 20 L84 60 L58 150 M110 14 L120 70 L150 150 M28 76 L84 60 L168 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.35"
          />
        </svg>
      </div>
      <div className="absolute bottom-4 right-4 space-y-2">
        <div className="h-2 w-40 rounded-full bg-muted-foreground/20 theecon-skeleton-pulse" />
        <div className="h-2 w-24 rounded-full bg-muted-foreground/20 theecon-skeleton-pulse" />
      </div>
      <div className="absolute bottom-4 left-4 font-serif text-sm text-muted-foreground theecon-skeleton-pulse">
        {label}
      </div>
    </div>
  );
}

export default MapSkeleton;
