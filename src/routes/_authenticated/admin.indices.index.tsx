import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/indices/")({
  component: IndicesAdminList,
});

function IndicesAdminList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "indexes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indexes")
        .select("id,name,slug,status,level,unit_label,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("indexes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Índice removido");
    qc.invalidateQueries({ queryKey: ["admin", "indexes"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Índices</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie índices econômicos e seus mapas.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/indices/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo índice
          </Link>
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-32">Nível</TableHead>
              <TableHead className="w-32">Unidade</TableHead>
              <TableHead className="w-44">Atualizado</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  Nenhum índice ainda. Crie o primeiro.
                </TableCell>
              </TableRow>
            )}
            {data?.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <Link
                    to="/admin/indices/$id"
                    params={{ id: i.id }}
                    className="font-medium hover:underline"
                  >
                    {i.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">/{i.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={i.status === "published" ? "default" : "secondary"}>
                    {i.status === "published" ? "Publicado" : "Rascunho"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {i.level === "state" ? "Estado" : "Município"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {i.unit_label ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(i.updated_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {i.status === "published" && (
                      <Button asChild variant="ghost" size="icon" title="Ver no site">
                        <a href={`/indices/${i.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="icon" title="Editar">
                      <Link to="/admin/indices/$id" params={{ id: i.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Remover">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover índice?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O índice “{i.name}” será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(i.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}