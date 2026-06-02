import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";
import { buildScale, type ClassMethod } from "@/lib/classify";

interface Props {
  values: number[];
  method: ClassMethod;
  nClasses: number;
  colorScheme: string;
  unitLabel?: string | null;
}

export function IndexHistogram({ values, method, nClasses, colorScheme, unitLabel }: Props) {
  const { bars, colors } = useMemo(() => {
    const scale = buildScale(values, method, nClasses, colorScheme);
    if (scale.breaks.length < 2) return { bars: [], colors: [] as string[] };
    const counts = new Array(scale.colors.length).fill(0);
    for (const v of values) {
      if (!Number.isFinite(v)) continue;
      let placed = false;
      for (let i = 1; i < scale.breaks.length; i++) {
        if (v <= scale.breaks[i]) {
          counts[i - 1]++;
          placed = true;
          break;
        }
      }
      if (!placed) counts[counts.length - 1]++;
    }
    const fmt = (n: number) =>
      n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    const bars = counts.map((count, i) => ({
      range: `${fmt(scale.breaks[i])}–${fmt(scale.breaks[i + 1])}`,
      count,
    }));
    return { bars, colors: scale.colors };
  }, [values, method, nClasses, colorScheme]);

  if (bars.length === 0) {
    return (
      <div className="text-sm text-muted-foreground border rounded-md p-4">
        Sem dados suficientes para o histograma.
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Distribuição{unitLabel ? ` · ${unitLabel}` : ""}
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={bars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={0} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{ fontSize: 12 }}
              formatter={(v) => [String(v), "Unidades"]}
            />
            <Bar dataKey="count">
              {bars.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}