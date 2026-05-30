import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/indices")({
  component: () => (
    <div>
      <h1 className="font-serif text-3xl mb-2">Índices</h1>
      <p className="text-muted-foreground text-sm">
        Construtor de índices será implementado nas próximas etapas.
      </p>
    </div>
  ),
});
