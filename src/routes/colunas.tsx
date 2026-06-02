import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 8;

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/colunas")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Colunas | The Econ" },
      { name: "description", content: "Colunas editoriais publicadas no The Econ." },
      { property: "og:title", content: "Colunas | The Econ" },
      { property: "og:description", content: "Colunas editoriais publicadas no The Econ." },
    ],
  }),
  component: ColunasPage,
});

function ColunasPage() {
  const { q, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/colunas" });
  const [qInput, setQInput] = useState(q);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["public", "columns", q, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("columns")
        .select("id,title,subtitle,slug,category,cover_url,published_at", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(from, to);
      if (q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(
          `title.ilike.${term},subtitle.ilike.${term},category.ilike.${term}`,
        );
      }
      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: qInput.trim(), page: 1 } });
  };

  const goPage = (next: number) => {
    navigate({ search: (prev) => ({ ...prev, page: next }) });
  };

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="font-serif text-5xl">Colunas</h1>
          <p className="text-muted-foreground mt-2">
            Análises e ensaios sobre economia brasileira.
          </p>
          <form onSubmit={submitSearch} className="mt-6 flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Buscar por título ou categoria..."
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Buscar</Button>
          </form>
        </header>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && (!data || data.rows.length === 0) && (
          <p className="text-muted-foreground">
            {q ? "Nenhum resultado para essa busca." : "Nenhuma coluna publicada ainda."}
          </p>
        )}

        <div className="grid gap-10 md:grid-cols-2">
          {data?.rows.map((c) => (
            <Link
              key={c.id}
              to="/colunas/$slug"
              params={{ slug: c.slug }}
              className="group block"
            >
              {c.cover_url && (
                <div className="aspect-[16/10] overflow-hidden rounded-md bg-muted mb-4">
                  <img
                    src={c.cover_url}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              )}
              {c.category && (
                <div className="text-xs uppercase tracking-widest text-accent font-medium mb-2">
                  {c.category}
                </div>
              )}
              <h2 className="font-serif text-2xl leading-tight group-hover:text-primary transition-colors">
                {c.title}
              </h2>
              {c.subtitle && (
                <p className="text-muted-foreground mt-2 line-clamp-3">{c.subtitle}</p>
              )}
              {c.published_at && (
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(c.published_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </Link>
          ))}
        </div>

        {data && data.count > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--editorial-rule)]">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages} · {data.count} resultados
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
