import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export interface RankingRow {
  code: string;
  name?: string;
  value: number;
}

interface Props {
  rows: RankingRow[];
  unitLabel?: string | null;
  onSelect: (code: string) => void;
  activeCode?: string | null;
}

const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export function MapRankingPanel({ rows, unitLabel, onSelect, activeCode }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.value - a.value), [rows]);
  const top = sorted.slice(0, 10);
  const bottom = sorted.slice(-10);

  const results = useMemo(() => {
    if (!debounced) return null;
    return sorted
      .filter(
        (r) =>
          (r.name ?? "").toLowerCase().includes(debounced) ||
          r.code.toLowerCase().includes(debounced)
      )
      .slice(0, 12);
  }, [debounced, sorted]);

  const renderList = (list: RankingRow[], offset = 0) => (
    <ul className="divide-y">
      {list.map((r, i) => (
        <li key={r.code}>
          <button
            type="button"
            onClick={() => onSelect(r.code)}
            className={`flex w-full items-baseline justify-between gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
              activeCode === r.code ? "bg-muted" : ""
            }`}
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="w-5 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {offset + i + 1}
              </span>
              <span className="truncate">{r.name ?? r.code}</span>
            </span>
            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
              {fmt(r.value)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="rounded-md border bg-card">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar local ou código..."
            className="h-8 pl-7 text-sm"
          />
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        {results ? (
          <div>
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Resultados{unitLabel ? ` · ${unitLabel}` : ""}
            </div>
            {results.length === 0 ? (
              <p className="px-2 pb-3 text-sm text-muted-foreground">Nada encontrado.</p>
            ) : (
              renderList(results)
            )}
          </div>
        ) : (
          <>
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Top 10
            </div>
            {renderList(top)}
            <div className="border-t px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Bottom 10
            </div>
            {renderList(bottom, sorted.length - bottom.length)}
          </>
        )}
      </div>
    </aside>
  );
}

export default MapRankingPanel;
