import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

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
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl mb-2">Colunas</h1>
        <p className="text-muted-foreground">
          Listagem de colunas será publicada em breve.
        </p>
      </div>
    </PublicLayout>
  );
}
