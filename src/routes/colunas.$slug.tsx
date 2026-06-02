import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { supabase } from "@/integrations/supabase/client";

const columnQueryOptions = (slug: string) =>
  queryOptions({
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

export const Route = createFileRoute("/colunas/$slug")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(columnQueryOptions(params.slug)),
  head: ({ loaderData, params }) => {
    const title = loaderData?.title
      ? `${loaderData.title} | The Econ`
      : "Coluna | The Econ";
    const description =
      loaderData?.subtitle ?? "Coluna editorial publicada no The Econ.";
    const url = `https://theecon.lovable.app/colunas/${params.slug}`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ];
    if (loaderData?.cover_url) {
      meta.push({ property: "og:image", content: loaderData.cover_url });
      meta.push({ name: "twitter:image", content: loaderData.cover_url });
      meta.push({ name: "twitter:card", content: "summary_large_image" });
    }
    return { meta };
  },
  component: ColunaDetail,
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl">Erro ao carregar coluna</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    </PublicLayout>
  ),
});

function ColunaDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(columnQueryOptions(slug));

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/colunas"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Todas as colunas
        </Link>

        {!data && (
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
