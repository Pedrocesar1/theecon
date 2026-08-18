import { motion } from "framer-motion";

interface Props {
  breaks: number[];
  colors: string[];
  unitLabel?: string | null;
  dark?: boolean;
  hoverValue?: number | null;
  activeClass: number | null;
  onSelectClass: (i: number | null) => void;
  hasNoData: boolean;
}

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export function MapLegend({
  breaks,
  colors,
  unitLabel,
  dark,
  hoverValue,
  activeClass,
  onSelectClass,
  hasNoData,
}: Props) {
  if (colors.length === 0 || breaks.length < 2) return null;
  const min = breaks[0];
  const max = breaks[breaks.length - 1];
  const pct =
    hoverValue != null && max > min
      ? Math.max(0, Math.min(1, (hoverValue - min) / (max - min)))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`absolute bottom-4 right-4 z-[900] w-[240px] rounded-md border p-3 shadow-lg backdrop-blur-md ${
        dark
          ? "border-white/15 bg-black/55 text-white"
          : "border-border bg-card/75 text-card-foreground"
      }`}
    >
      <div className="mb-2 text-[10px] uppercase tracking-widest opacity-70">
        Legenda{unitLabel ? ` · ${unitLabel}` : ""}
      </div>

      <div className="relative h-4 w-full overflow-hidden rounded-sm">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${colors.join(", ")})` }}
        />
        <div className="absolute inset-0 flex">
          {colors.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Faixa ${fmt(breaks[i])} a ${fmt(breaks[i + 1])}`}
              onClick={() => onSelectClass(activeClass === i ? null : i)}
              className={`h-full flex-1 border-r last:border-r-0 transition-colors ${
                dark ? "border-white/20" : "border-white/60"
              } ${activeClass != null && activeClass !== i ? "bg-black/45" : "hover:bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      <div className="relative h-3">
        {pct != null && (
          <div
            className={`absolute top-0 h-3 w-0.5 -translate-x-1/2 transition-all duration-150 ${
              dark ? "bg-white" : "bg-foreground"
            }`}
            style={{ left: `${pct * 100}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] tabular-nums opacity-75">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>

      {hasNoData && (
        <div className="mt-2 flex items-center gap-2 text-[10px] opacity-75">
          <span
            className="inline-block h-3 w-4 rounded-[2px] border"
            style={{
              backgroundColor: "#d4d4d8",
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 5px)",
            }}
          />
          sem dado
        </div>
      )}

      {activeClass != null && (
        <button
          type="button"
          onClick={() => onSelectClass(null)}
          className="mt-2 text-[10px] underline opacity-80 hover:opacity-100"
        >
          limpar destaque
        </button>
      )}
    </motion.div>
  );
}

export default MapLegend;
