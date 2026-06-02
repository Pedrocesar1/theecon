import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, BarChart3, FileEdit, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [colsAll, colsPub, idxAll, idxPub] = await Promise.all([
        supabase.from("columns").select("id", { count: "exact", head: true }),
        supabase.from("columns").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("indexes").select("id", { count: "exact", head: true }),
        supabase.from("indexes").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      return {
        columnsTotal: colsAll.count ?? 0,
        columnsPublished: colsPub.count ?? 0,
        indexesTotal: idxAll.count ?? 0,
        indexesPublished: idxPub.count ?? 0,
      };
    },
  });

  const { data: recentColumns } = useQuery({
    queryKey: ["admin", "recent-columns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("columns")
        .select("id,title,status,updated_at")
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    { label: "Colunas (total)", value: stats?.columnsTotal ?? "—", icon: FileText },
    { label: "Colunas publicadas", value: stats?.columnsPublished ?? "—", icon: CheckCircle2 },
    { label: "Índices (total)", value: stats?.indexesTotal ?? "—", icon: BarChart3 },
    { label: "Índices publicados", value: stats?.indexesPublished ?? "—", icon: CheckCircle2 },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Visão geral do conteúdo do The Econ.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/colunas/new" className="inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition">
            <Plus className="h-4 w-4" /> Nova coluna
          </Link>
          <Link to="/admin/indices/new" className="inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition">
            <Plus className="h-4 w-4" /> Novo índice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">{c.label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <div className="font-serif text-3xl mt-2">{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
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

      <section>
        <h2 className="font-serif text-xl mb-3">Colunas recentes</h2>
        <div className="border rounded-lg bg-card divide-y">
          {(!recentColumns || recentColumns.length === 0) && (
            <div className="p-4 text-sm text-muted-foreground">Nenhuma coluna ainda.</div>
          )}
          {recentColumns?.map((c) => (
            <Link
              key={c.id}
              to="/admin/colunas/$id"
              params={{ id: c.id }}
              className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileEdit className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-sm">{c.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                  c.status === "published"
                    ? "bg-accent/15 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {c.status === "published" ? "Publicada" : "Rascunho"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
