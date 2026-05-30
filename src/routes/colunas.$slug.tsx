import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/colunas/$slug")({
  component: ColunaDetail,
});

function ColunaDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["public", "column", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("columns")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/colunas"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Todas as colunas
        </Link>

        {isLoading && <p className="mt-8 text-muted-foreground">Carregando...</p>}
        {error && <p className="mt-8 text-destructive">Erro ao carregar.</p>}
        {!isLoading && !data && (
          <p className="mt-8 text-muted-foreground">Coluna não encontrada.</p>
        )}

        {data && (
          <>
            <header className="mt-8 mb-8">
              {data.category && (
                <div className="text-xs uppercase tracking-widest text-accent font-medium mb-3">
                  {data.category}
                </div>
              )}
              <h1 className="font-serif text-4xl md:text-5xl leading-tight">
                {data.title}
              </h1>
              {data.subtitle && (
                <p className="mt-4 text-xl text-muted-foreground font-serif italic">
                  {data.subtitle}
                </p>
              )}
              {data.published_at && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {new Date(data.published_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </header>
            {data.cover_url && (
              <img
                src={data.cover_url}
                alt={data.title}
                className="w-full rounded-md mb-8"
              />
            )}
            <div
              className="prose-editorial"
              dangerouslySetInnerHTML={{ __html: data.content_html ?? "" }}
            />
          </>
        )}
      </article>
    </PublicLayout>
  );
}
