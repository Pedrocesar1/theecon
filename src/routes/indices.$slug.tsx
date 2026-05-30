import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/indices/$slug")({
  component: IndiceDetail,
});

function IndiceDetail() {
  const { slug } = Route.useParams();
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-sm text-muted-foreground">Índice: {slug}</p>
        <p className="mt-4">Mapa interativo será carregado em breve.</p>
      </div>
    </PublicLayout>
  );
}
