import { AnimatePresence, motion } from "framer-motion";

export interface TooltipState {
  name: string;
  value: number | null;
  x: number;
  y: number;
}

interface Props {
  state: TooltipState | null;
  colors: string[];
  min: number;
  max: number;
  unitLabel?: string | null;
  dark?: boolean;
}

export function MapTooltip({ state, colors, min, max, unitLabel, dark }: Props) {
  const gradient =
    colors.length > 0
      ? `linear-gradient(to right, ${colors.join(", ")})`
      : "linear-gradient(to right, #e5e7eb, #9ca3af)";

  const pct =
    state && state.value != null && max > min
      ? Math.max(0, Math.min(1, (state.value - min) / (max - min)))
      : null;

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          className={`pointer-events-none absolute z-[1000] min-w-[190px] max-w-[260px] rounded-md border px-3 py-2 shadow-lg backdrop-blur-md ${
            dark
              ? "border-white/15 bg-black/70 text-white"
              : "border-border bg-card/90 text-card-foreground"
          }`}
          style={{ left: state.x + 14, top: state.y + 14 }}
        >
          <div className="font-serif text-sm leading-tight">{state.name}</div>
          <div className="mt-1 font-sans text-lg font-semibold tabular-nums">
            {state.value == null
              ? "sem dado"
              : state.value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
            {state.value != null && unitLabel ? (
              <span className="ml-1 text-xs font-normal opacity-70">{unitLabel}</span>
            ) : null}
          </div>
          <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div className="absolute inset-0" style={{ background: gradient }} />
            {pct == null && <div className="absolute inset-0 bg-black/40" />}
          </div>
          {pct != null && (
            <div className="relative h-2">
              <div
                className={`absolute top-0 h-2 w-0.5 -translate-x-1/2 ${
                  dark ? "bg-white" : "bg-foreground"
                }`}
                style={{ left: `${pct * 100}%` }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MapTooltip;
