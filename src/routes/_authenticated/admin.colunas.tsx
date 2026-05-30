import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/colunas")({
  component: () => (
    <div>
      <h1 className="font-serif text-3xl mb-2">Colunas</h1>
      <p className="text-muted-foreground text-sm">
        Gestão de colunas será implementada na próxima etapa.
      </p>
    </div>
  ),
});
