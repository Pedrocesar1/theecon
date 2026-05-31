import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeoJsonUpload } from "./GeoJsonUpload";
import { IndexDataInput, type IndexRow } from "./IndexDataInput";
import { ChoroplethMapClient } from "@/components/ChoroplethMapClient";
import { slugify } from "@/lib/slug";
import { COLOR_SCHEMES, type ClassMethod } from "@/lib/classify";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type IndexRecord = Database["public"]["Tables"]["indexes"]["Row"];
type GeoLevel = Database["public"]["Enums"]["geo_level"];
type Status = Database["public"]["Enums"]["content_status"];

interface Props {
  initial?: IndexRecord;
}

export function IndexForm({ initial }: Props) {
  const navigate = useNavigate();
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [methodology, setMethodology] = useState(initial?.methodology ?? "");
  const [level, setLevel] = useState<GeoLevel>(initial?.level ?? "state");
  const [colorScheme, setColorScheme] = useState(initial?.color_scheme ?? "Viridis");
  const [nClasses, setNClasses] = useState(initial?.n_classes ?? 5);
  const [classificationMethod, setClassificationMethod] = useState<ClassMethod>(
    (initial?.classification_method as ClassMethod) ?? "equal_intervals"
  );
  const [unitLabel, setUnitLabel] = useState(initial?.unit_label ?? "Índice 0-1");
  const [geojsonUrl, setGeojsonUrl] = useState<string | null>(initial?.geojson_url ?? null);
  const [joinKey, setJoinKey] = useState(initial?.join_key ?? "code");
  const [rows, setRows] = useState<IndexRow[]>(
    Array.isArray(initial?.data) ? (initial!.data as unknown as IndexRow[]) : []
  );
  const [status, setStatus] = useState<Status>(initial?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const save = async (nextStatus: Status) => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const finalSlug = slug.trim() || slugify(name);
    if (!finalSlug) {
      toast.error("Slug inválido");
      return;
    }
    if (nextStatus === "published" && (!geojsonUrl || rows.length === 0)) {
      toast.error("Para publicar, envie GeoJSON e dados");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      methodology: methodology.trim() || null,
      level,
      color_scheme: colorScheme,
      n_classes: nClasses,
      classification_method: classificationMethod,
      unit_label: unitLabel.trim() || null,
      geojson_url: geojsonUrl,
      join_key: joinKey.trim() || "code",
      data: rows as unknown as Database["public"]["Tables"]["indexes"]["Insert"]["data"],
      variables: [] as unknown as Database["public"]["Tables"]["indexes"]["Insert"]["variables"],
      status: nextStatus,
      published_at:
        nextStatus === "published"
          ? initial?.published_at ?? new Date().toISOString()
          : null,
    };

    try {
      if (isEdit && initial) {
        const { error } = await supabase
          .from("indexes")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        setStatus(nextStatus);
        toast.success(nextStatus === "published" ? "Índice publicado" : "Rascunho salvo");
      } else {
        const { data, error } = await supabase
          .from("indexes")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        toast.success(nextStatus === "published" ? "Índice publicado" : "Rascunho criado");
        navigate({ to: "/admin/indices/$id", params: { id: data.id } });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const canPreview = geojsonUrl && rows.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">
            {isEdit ? "Editar índice" : "Novo índice"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={status === "published" ? "default" : "secondary"}>
              {status === "published" ? "Publicado" : "Rascunho"}
            </Badge>
            {initial?.updated_at && (
              <span className="text-xs text-muted-foreground">
                Atualizado em {new Date(initial.updated_at).toLocaleString("pt-BR")}
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
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Índice de Desenvolvimento Municipal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Resumo curto exibido na listagem e no topo do índice."
            />
          </div>

          <Tabs defaultValue="data">
            <TabsList>
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="geo">Mapa</TabsTrigger>
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
              <TabsTrigger value="preview" disabled={!canPreview}>
                Pré-visualização
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="pt-4">
              <IndexDataInput value={rows} onChange={setRows} />
            </TabsContent>

            <TabsContent value="geo" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Arquivo GeoJSON</Label>
                <GeoJsonUpload value={geojsonUrl} onChange={setGeojsonUrl} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinKey">Propriedade de junção (no GeoJSON)</Label>
                <Input
                  id="joinKey"
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value)}
                  placeholder="ex: code, id, codarea"
                />
                <p className="text-xs text-muted-foreground">
                  Campo em <code>properties</code> de cada feature que casa com a coluna{" "}
                  <code>code</code> dos dados.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="methodology" className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="methodology">Metodologia</Label>
                <Textarea
                  id="methodology"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  rows={10}
                  placeholder="Descreva fontes, variáveis e fórmulas usadas para construir o índice."
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="pt-4">
              {canPreview && geojsonUrl ? (
                <ChoroplethMapClient
                  geojsonUrl={geojsonUrl}
                  joinKey={joinKey}
                  rows={rows}
                  colorScheme={colorScheme}
                  nClasses={nClasses}
                  method={classificationMethod}
                  unitLabel={unitLabel}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Envie GeoJSON e dados para visualizar.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="slug-do-indice"
            />
            <p className="text-xs text-muted-foreground">
              URL: /indices/{slug || "..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nível geográfico</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as GeoLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state">Estado (UF)</SelectItem>
                <SelectItem value="municipality">Município</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Rótulo da unidade</Label>
            <Input
              id="unit"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder="ex: Índice 0-1, %, R$"
            />
          </div>

          <div className="space-y-2">
            <Label>Esquema de cores</Label>
            <Select value={colorScheme} onValueChange={setColorScheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_SCHEMES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nclasses">Número de classes</Label>
            <Input
              id="nclasses"
              type="number"
              min={3}
              max={9}
              value={nClasses}
              onChange={(e) => setNClasses(Math.max(3, Math.min(9, Number(e.target.value) || 5)))}
            />
          </div>

          <div className="space-y-2">
            <Label>Método de classificação</Label>
            <Select
              value={classificationMethod}
              onValueChange={(v) => setClassificationMethod(v as ClassMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal_intervals">Intervalos iguais</SelectItem>
                <SelectItem value="jenks">Jenks (quebras naturais)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </aside>
      </div>
    </div>
  );
}