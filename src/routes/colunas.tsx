import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/colunas")({
  head: () => ({
    meta: [
      { title: "Colunas | The Econ" },
      { name: "description", content: "Colunas editoriais publicadas no The Econ." },
    ],
  }),
  component: ColunasPage,
});

function ColunasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "columns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("columns")
        .select("id,title,subtitle,slug,category,cover_url,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="font-serif text-5xl">Colunas</h1>
          <p className="text-muted-foreground mt-2">
            Análises e ensaios sobre economia brasileira.
          </p>
        </header>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}
        {!isLoading && (!data || data.length === 0) && (
          <p className="text-muted-foreground">Nenhuma coluna publicada ainda.</p>
        )}

        <div className="grid gap-10 md:grid-cols-2">
          {data?.map((c) => (
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
      </div>
    </PublicLayout>
  );
}
