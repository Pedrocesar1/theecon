import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/indices")({
  head: () => ({
    meta: [
      { title: "Índices | The Econ" },
      { name: "description", content: "Índices econômicos interativos sobre o Brasil." },
    ],
  }),
  component: IndicesPage,
});

function IndicesPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl mb-2">Índices</h1>
        <p className="text-muted-foreground">
          Índices publicados aparecerão aqui em breve.
        </p>
      </div>
    </PublicLayout>
  );
}
