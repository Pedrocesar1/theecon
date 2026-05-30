import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-1">Dashboard</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Visão geral do conteúdo do The Econ.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/admin/colunas"
          className="border bg-card rounded-lg p-6 hover:border-primary transition"
        >
          <FileText className="h-6 w-6 text-primary mb-2" />
          <div className="font-medium">Colunas</div>
          <p className="text-sm text-muted-foreground mt-1">
            Criar, editar e publicar colunas editoriais.
          </p>
        </Link>
        <Link
          to="/admin/indices"
          className="border bg-card rounded-lg p-6 hover:border-primary transition"
        >
          <BarChart3 className="h-6 w-6 text-primary mb-2" />
          <div className="font-medium">Índices</div>
          <p className="text-sm text-muted-foreground mt-1">
            Construir índices econômicos a partir de planilhas.
          </p>
        </Link>
      </div>
    </div>
  );
}
