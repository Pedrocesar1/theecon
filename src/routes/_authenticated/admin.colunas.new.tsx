import { createFileRoute, Link } from "@tanstack/react-router";
import { ColumnFormClient } from "@/components/admin/ColumnFormClient";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/colunas/new")({
  component: NewColumn,
});

function NewColumn() {
  return (
    <div className="space-y-4">
      <Link
        to="/admin/colunas"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Voltar para colunas
      </Link>
      <ColumnFormClient />
    </div>
  );
}