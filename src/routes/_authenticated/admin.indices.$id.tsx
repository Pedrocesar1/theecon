import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IndexForm } from "@/components/admin/IndexForm";

export const Route = createFileRoute("/_authenticated/admin/indices/$id")({
  component: EditIndex,
});

function EditIndex() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "index", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indexes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }
  if (error || !data) {
    return <div className="text-destructive">Índice não encontrado.</div>;
  }
  return <IndexForm initial={data} />;
}