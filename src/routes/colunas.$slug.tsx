import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/colunas/$slug")({
  component: ColunaDetail,
});

function ColunaDetail() {
  const { slug } = Route.useParams();
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-sm text-muted-foreground">Coluna: {slug}</p>
        <p className="mt-4">Conteúdo será carregado em breve.</p>
      </div>
    </PublicLayout>
  );
}
