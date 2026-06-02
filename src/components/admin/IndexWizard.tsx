import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChoroplethMapClient } from "@/components/ChoroplethMapClient";
import { IndexHistogram } from "@/components/IndexHistogram";
import { slugify } from "@/lib/slug";
import { COLOR_SCHEMES, type ClassMethod } from "@/lib/classify";
import {
  IBGE_GEOJSON,
  type GeoLevel,
  type VariableConfig,
  type SourceRow,
  type IndexData,
  detectVariables,
  equalWeights,
  normalizeWeights,
  activeWeightSum,
  weightsValid,
  calculateIndex,
  computeStats,
} from "@/lib/indexProcessing";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";

type IndexRecord = Database["public"]["Tables"]["indexes"]["Row"];
type Status = Database["public"]["Enums"]["content_status"];

const STEPS = [
  "Upload",
  "Mapeamento",
  "Variáveis",
  "Cálculo",
  "Mapa",
  "Publicar",
] as const;

interface ProcessingConfig {
  ibgeCodeColumn: string;
  ibgeNameColumn: string | null;
  missingValueStrategy: "renormalize_available_weights";
  variables: VariableConfig[];
  normalizedWeightSum: number;
  calculatedAt: string;
}

interface Props {
  initial?: IndexRecord;
}

export function IndexWizard({ initial }: Props) {
  const navigate = useNavigate();
  const isEdit = Boolean(initial);
  const initCfg = (initial?.processing_config as unknown as ProcessingConfig | null) ?? null;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Metadata
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [methodology, setMethodology] = useState(initial?.methodology ?? "");
  const [level, setLevel] = useState<GeoLevel>((initial?.level ?? "state") as GeoLevel);
  const [colorScheme, setColorScheme] = useState(initial?.color_scheme ?? "Viridis");
  const [nClasses, setNClasses] = useState(initial?.n_classes ?? 5);
  const [classMethod, setClassMethod] = useState<ClassMethod>(
    (initial?.classification_method as ClassMethod) ?? "equal_intervals"
  );
  const [unitLabel, setUnitLabel] = useState(initial?.unit_label ?? "Índice 0-1");
  const [status, setStatus] = useState<Status>(initial?.status ?? "draft");

  // Wizard state
  const [fileName, setFileName] = useState<string | null>(null);
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [codeColumn, setCodeColumn] = useState<string>(initCfg?.ibgeCodeColumn ?? "");
  const [nameColumn, setNameColumn] = useState<string>(initCfg?.ibgeNameColumn ?? "");
  const [variables, setVariables] = useState<VariableConfig[]>(initCfg?.variables ?? []);
  const [indexData, setIndexData] = useState<IndexData>(
    Array.isArray(initial?.data) ? (initial!.data as unknown as IndexData) : []
  );
  const [duplicates, setDuplicates] = useState<string[]>([]);

  // Slug auto
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Re-detect variables when source/columns change
  useEffect(() => {
    if (sourceRows.length === 0) return;
    if (!codeColumn) return;
    const excludes = [codeColumn, nameColumn].filter(Boolean);
    const detected = detectVariables(sourceRows, excludes);
    // merge with previous user choices when possible
    setVariables((prev) =>
      detected.map((d) => {
        const prior = prev.find((p) => p.column === d.column);
        return prior
          ? { ...d, enabled: prior.enabled, direction: prior.direction, weight: prior.weight, label: prior.label }
          : d;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceRows, codeColumn, nameColumn]);

  /* ------------------------- STEP 1: Upload ------------------------- */
  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<SourceRow>(ws, { defval: null });
      if (rows.length === 0) {
        toast.error("Arquivo vazio.");
        return;
      }
      const hdrs = Object.keys(rows[0]);
      if (hdrs.length === 0) {
        toast.error("Arquivo sem cabeçalhos.");
        return;
      }
      setFileName(file.name);
      setSourceRows(rows);
      setHeaders(hdrs);
      // best-guess code column
      const guess =
        hdrs.find((h) => /codigo|c[oó]d|ibge|cd_mun|cd_uf|cd_geocodi/i.test(h)) ?? hdrs[0];
      setCodeColumn((prev) => prev || guess);
      const guessName = hdrs.find((h) => /nome|name|munic|estado|uf/i.test(h));
      setNameColumn((prev) => prev || guessName || "");
      toast.success(`${rows.length} linhas carregadas`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ler arquivo");
    }
  };

  /* ------------------------- STEP 3: Variables ------------------------- */
  const setVar = (col: string, patch: Partial<VariableConfig>) =>
    setVariables((vs) => vs.map((v) => (v.column === col ? { ...v, ...patch } : v)));

  const selectAll = () => setVariables((vs) => vs.map((v) => ({ ...v, enabled: true })));
  const clearSel = () =>
    setVariables((vs) => vs.map((v) => ({ ...v, enabled: false, weight: 0 })));

  const sumActive = activeWeightSum(variables);
  const okWeights = weightsValid(variables);

  /* ------------------------- STEP 4: Calculate ------------------------- */
  const runCalc = () => {
    if (!codeColumn) {
      toast.error("Selecione a coluna de código IBGE.");
      return;
    }
    if (duplicates.length > 0) {
      toast.error("Códigos duplicados detectados — corrija antes de continuar.");
    }
    if (!okWeights) {
      toast.error(`Pesos inválidos. Soma atual: ${sumActive.toFixed(3)}`);
      return;
    }
    const result = calculateIndex({
      rows: sourceRows,
      codeColumn,
      nameColumn: nameColumn || null,
      level,
      variables,
    });
    setIndexData(result.data);
    setDuplicates(result.duplicates);
    toast.success(
      `${result.withValue} localidades com índice válido, ${result.withoutValue} sem dado.`
    );
  };

  const stats = useMemo(() => {
    return computeStats(indexData.map((d) => d.value).filter((v): v is number => v != null));
  }, [indexData]);

  const mapRows = useMemo(
    () =>
      indexData
        .filter((d) => d.value != null)
        .map((d) => ({ code: d.ibge_code, name: d.ibge_name, value: d.value as number })),
    [indexData]
  );

  const topBottom = useMemo(() => {
    const valid = indexData.filter((d) => d.value != null).sort((a, b) => (b.value! - a.value!));
    return { top: valid.slice(0, 10), bottom: valid.slice(-10).reverse() };
  }, [indexData]);

  /* ------------------------- Persist ------------------------- */
  const buildPayload = (nextStatus: Status) => {
    const cfg: ProcessingConfig = {
      ibgeCodeColumn: codeColumn,
      ibgeNameColumn: nameColumn || null,
      missingValueStrategy: "renormalize_available_weights",
      variables,
      normalizedWeightSum: sumActive,
      calculatedAt: new Date().toISOString(),
    };
    return {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim() || null,
      methodology: methodology.trim() || null,
      level,
      color_scheme: colorScheme,
      n_classes: nClasses,
      classification_method: classMethod,
      unit_label: unitLabel.trim() || null,
      variables: variables as unknown as Database["public"]["Tables"]["indexes"]["Insert"]["variables"],
      data: indexData as unknown as Database["public"]["Tables"]["indexes"]["Insert"]["data"],
      processing_config: cfg as unknown as Database["public"]["Tables"]["indexes"]["Insert"]["processing_config"],
      status: nextStatus,
      published_at:
        nextStatus === "published"
          ? initial?.published_at ?? new Date().toISOString()
          : null,
    };
  };

  const save = async (nextStatus: Status) => {
    if (!name.trim()) return toast.error("Nome é obrigatório");
    if (nextStatus === "published") {
      if (!okWeights) return toast.error(`Pesos inválidos. Soma: ${sumActive.toFixed(3)}`);
      if (indexData.length === 0 || mapRows.length === 0)
        return toast.error("Calcule o índice antes de publicar.");
    }
    setSaving(true);
    try {
      if (isEdit && initial) {
        const { error } = await supabase
          .from("indexes")
          .update(buildPayload(nextStatus))
          .eq("id", initial.id);
        if (error) throw error;
        setStatus(nextStatus);
        toast.success(nextStatus === "published" ? "Índice publicado" : "Rascunho salvo");
      } else {
        const { data, error } = await supabase
          .from("indexes")
          .insert(buildPayload(nextStatus))
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

  /* ------------------------- Step gating ------------------------- */
  const canAdvance = () => {
    if (step === 0) return sourceRows.length > 0;
    if (step === 1) return Boolean(codeColumn) && duplicates.length === 0;
    if (step === 2) return okWeights;
    if (step === 3) return indexData.length > 0;
    return true;
  };

  const previewRows = sourceRows.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">{isEdit ? "Editar índice" : "Novo índice"}</h1>
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
            Publicar
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-accent/20 text-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* STEP 0: Upload */}
      {step === 0 && (
        <div className="space-y-4">
          <Label>Planilha (.xlsx ou .csv)</Label>
          <div className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            {fileName && (
              <p className="text-sm text-muted-foreground">
                <strong>{fileName}</strong> · {sourceRows.length} linhas
              </p>
            )}
          </div>
          {previewRows.length > 0 && (
            <div className="border rounded-md max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="text-xs font-mono">
                          {r[h] == null ? "—" : String(r[h])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* STEP 1: Mapping */}
      {step === 1 && (
        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Coluna de código IBGE</Label>
            <Select value={codeColumn} onValueChange={setCodeColumn}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Coluna de nome (opcional)</Label>
            <Select value={nameColumn || "__none"} onValueChange={(v) => setNameColumn(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Nenhum —</SelectItem>
                {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nível geográfico</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as GeoLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="state">Estado (2 dígitos / UF)</SelectItem>
                <SelectItem value="municipality">Município (7 dígitos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Live duplicates check */}
          <DuplicatesCheck
            rows={sourceRows}
            codeColumn={codeColumn}
            level={level}
            onResult={setDuplicates}
          />
          {duplicates.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <strong>{duplicates.length} código(s) duplicado(s):</strong>{" "}
              {duplicates.slice(0, 10).join(", ")}
              {duplicates.length > 10 && "..."}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Variables */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>Selecionar todas</Button>
            <Button size="sm" variant="outline" onClick={clearSel}>Limpar seleção</Button>
            <Button size="sm" variant="outline" onClick={() => setVariables(equalWeights)}>
              Peso igual nas selecionadas
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVariables(normalizeWeights)}>
              Normalizar pesos (soma = 1)
            </Button>
            <div className={`ml-auto text-sm self-center ${okWeights ? "text-accent" : "text-destructive"}`}>
              Soma dos pesos ativos: <strong>{sumActive.toFixed(3)}</strong>
              {!okWeights && " (deve ser 1.000)"}
            </div>
          </div>
          <div className="border rounded-md overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Coluna</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead className="w-40">Direção</TableHead>
                  <TableHead className="w-24">Peso</TableHead>
                  <TableHead className="w-20 text-right">Mín</TableHead>
                  <TableHead className="w-20 text-right">Máx</TableHead>
                  <TableHead className="w-20 text-right">Média</TableHead>
                  <TableHead className="w-20 text-right">Mediana</TableHead>
                  <TableHead className="w-24 text-right">Válidos</TableHead>
                  <TableHead className="w-24 text-right">Ausentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.length === 0 && (
                  <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nenhuma variável numérica detectada.
                  </TableCell></TableRow>
                )}
                {variables.map((v) => (
                  <TableRow key={v.column} className={v.enabled ? "" : "opacity-50"}>
                    <TableCell>
                      <Checkbox checked={v.enabled} onCheckedChange={(c) => setVar(v.column, { enabled: Boolean(c) })} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.column}</TableCell>
                    <TableCell>
                      <Input className="h-8" value={v.label} onChange={(e) => setVar(v.column, { label: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Select value={v.direction} onValueChange={(d) => setVar(v.column, { direction: d as VariableConfig["direction"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="higher_is_better">Maior é melhor</SelectItem>
                          <SelectItem value="lower_is_better">Menor é melhor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" min={0} className="h-8"
                        value={v.weight}
                        onChange={(e) => setVar(v.column, { weight: Math.max(0, Number(e.target.value) || 0) })} />
                    </TableCell>
                    <TableCell className="text-right text-xs">{v.min.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">{v.max.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">{v.mean.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">{v.median.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">{v.validCount}</TableCell>
                    <TableCell className="text-right text-xs">{v.missingCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* STEP 3: Calculate */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runCalc} disabled={!okWeights}>Calcular índice</Button>
            {stats && (
              <div className="text-sm text-muted-foreground">
                {indexData.length} localidades · mín {stats.min.toFixed(3)} · máx {stats.max.toFixed(3)} ·
                média {stats.mean.toFixed(3)} · mediana {stats.median.toFixed(3)}
              </div>
            )}
          </div>
          {indexData.length > 0 && (
            <>
              <div className="border rounded-md p-4 bg-card">
                <IndexHistogram
                  values={indexData.map((d) => d.value).filter((v): v is number => v != null)}
                  colorScheme={colorScheme}
                  nClasses={nClasses}
                  method={classMethod}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <RankList title="Top 10" rows={topBottom.top} unit={unitLabel} />
                <RankList title="Bottom 10" rows={topBottom.bottom} unit={unitLabel} />
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 4: Map preview */}
      {step === 4 && (
        <div className="space-y-3">
          {mapRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Calcule o índice primeiro.</p>
          ) : (
            <ChoroplethMapClient
              geojsonUrl={IBGE_GEOJSON[level]}
              joinKey={level === "state" ? "codarea" : "codarea"}
              rows={mapRows}
              colorScheme={colorScheme}
              nClasses={nClasses}
              method={classMethod}
              unitLabel={unitLabel}
            />
          )}
        </div>
      )}

      {/* STEP 5: Publish/metadata */}
      {step === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
              <p className="text-xs text-muted-foreground">URL: /indices/{slug || "..."}</p>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Metodologia</Label>
              <Textarea rows={6} value={methodology} onChange={(e) => setMethodology(e.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rótulo da unidade</Label>
              <Input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Esquema de cores</Label>
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número de classes</Label>
              <Input type="number" min={3} max={9} value={nClasses}
                onChange={(e) => setNClasses(Math.max(3, Math.min(9, Number(e.target.value) || 5)))} />
            </div>
            <div className="space-y-2">
              <Label>Método de classificação</Label>
              <Select value={classMethod} onValueChange={(v) => setClassMethod(v as ClassMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal_intervals">Intervalos iguais</SelectItem>
                  <SelectItem value="jenks">Jenks (quebras naturais)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button
          variant="outline"
          disabled={step >= STEPS.length - 1 || !canAdvance()}
          onClick={() => setStep(step + 1)}
        >
          Próximo <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function RankList({
  title, rows, unit,
}: { title: string; rows: IndexData; unit: string | null }) {
  return (
    <div className="border rounded-md bg-card">
      <div className="px-3 py-2 border-b text-sm font-medium">{title}</div>
      <Table>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.ibge_code}>
              <TableCell className="font-mono text-xs">{r.ibge_code}</TableCell>
              <TableCell className="text-sm">{r.ibge_name}</TableCell>
              <TableCell className="text-right text-sm">
                {r.value!.toFixed(3)} {unit ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DuplicatesCheck({
  rows, codeColumn, level, onResult,
}: {
  rows: SourceRow[];
  codeColumn: string;
  level: GeoLevel;
  onResult: (dups: string[]) => void;
}) {
  useEffect(() => {
    if (!codeColumn) return onResult([]);
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const r of rows) {
      const v = r[codeColumn];
      if (v == null) continue;
      const code = String(v).trim();
      if (!code) continue;
      if (seen.has(code)) dups.add(code);
      else seen.add(code);
    }
    onResult(Array.from(dups));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, codeColumn, level]);
  return null;
}