import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "./RichTextEditor";
import { CoverUpload } from "./CoverUpload";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Column = Database["public"]["Tables"]["columns"]["Row"];
type Status = Database["public"]["Enums"]["content_status"];

interface Props {
  initial?: Column;
}

export function ColumnForm({ initial }: Props) {
  const navigate = useNavigate();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [category, setCategory] = useState(initial?.category ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_url ?? null);
  const [contentHtml, setContentHtml] = useState(initial?.content_html ?? "");
  const [inlineAssets, setInlineAssets] = useState<string[]>(
    Array.isArray(initial?.inline_assets) ? (initial!.inline_assets as string[]) : []
  );
  const [status, setStatus] = useState<Status>(initial?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const save = async (nextStatus: Status) => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    if (!finalSlug) {
      toast.error("Slug inválido");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      slug: finalSlug,
      category: category.trim() || null,
      cover_url: coverUrl,
      content_html: contentHtml,
      inline_assets: inlineAssets,
      status: nextStatus,
      published_at:
        nextStatus === "published"
          ? initial?.published_at ?? new Date().toISOString()
          : null,
    };

    try {
      if (isEdit && initial) {
        const { error } = await supabase
          .from("columns")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        setStatus(nextStatus);
        toast.success(nextStatus === "published" ? "Coluna publicada" : "Rascunho salvo");
      } else {
        const { data, error } = await supabase
          .from("columns")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        toast.success(nextStatus === "published" ? "Coluna publicada" : "Rascunho criado");
        navigate({ to: "/admin/colunas/$id", params: { id: data.id } });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">
            {isEdit ? "Editar coluna" : "Nova coluna"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={status === "published" ? "default" : "secondary"}>
              {status === "published" ? "Publicada" : "Rascunho"}
            </Badge>
            {initial?.updated_at && (
              <span className="text-xs text-muted-foreground">
                Atualizada em {new Date(initial.updated_at).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={() => save("draft")}>
            Salvar rascunho
          </Button>
          <Button disabled={saving} onClick={() => save("published")}>
            {status === "published" ? "Atualizar publicação" : "Publicar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da coluna"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Textarea
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Linha de apoio / lead"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <RichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
              onAssetUploaded={(url) =>
                setInlineAssets((prev) => (prev.includes(url) ? prev : [...prev, url]))
              }
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="space-y-2">
            <Label>Capa</Label>
            <CoverUpload value={coverUrl} onChange={setCoverUrl} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="slug-da-coluna"
            />
            <p className="text-xs text-muted-foreground">
              URL: /colunas/{slug || "..."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ex: Macroeconomia"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}