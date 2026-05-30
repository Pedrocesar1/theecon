import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ColumnForm } from "@/components/admin/ColumnForm";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/colunas/$id")({
  component: EditColumn,
});

function EditColumn() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "column", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("columns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <Link
        to="/admin/colunas"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Voltar para colunas
      </Link>
      {isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && (
        <p className="text-destructive">Erro ao carregar: {(error as Error).message}</p>
      )}
      {data && <ColumnForm initial={data} />}
    </div>
  );
}