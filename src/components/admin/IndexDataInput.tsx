import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface IndexRow {
  code: string;
  name?: string;
  value: number;
}

interface Props {
  value: IndexRow[];
  onChange: (rows: IndexRow[]) => void;
}

function parseCsvText(text: string): IndexRow[] {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length) {
    throw new Error(result.errors[0].message);
  }
  const rows: IndexRow[] = [];
  for (const r of result.data) {
    const code = (r.code ?? r.codigo ?? r.id ?? "").toString().trim();
    const name = (r.name ?? r.nome ?? "").toString().trim() || undefined;
    const raw = (r.value ?? r.valor ?? "").toString().replace(",", ".").trim();
    const value = Number(raw);
    if (!code || !Number.isFinite(value)) continue;
    rows.push({ code, name, value });
  }
  if (rows.length === 0) throw new Error("Nenhuma linha válida encontrada");
  return rows;
}

export function IndexDataInput({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState("");

  const applyText = (text: string) => {
    try {
      const rows = parseCsvText(text);
      onChange(rows);
      toast.success(`${rows.length} linhas importadas`);
      setPaste("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CSV inválido");
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    applyText(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Importar CSV
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
          >
            Limpar dados
          </Button>
        )}
        <span className="text-xs text-muted-foreground self-center">
          Cabeçalhos esperados: <code>code,name,value</code>
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="space-y-2">
        <Textarea
          rows={4}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"code,name,value\n33,Rio de Janeiro,0.78\n35,São Paulo,0.82"}
          className="font-mono text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!paste.trim()}
          onClick={() => applyText(paste)}
        >
          Aplicar CSV colado
        </Button>
      </div>

      {value.length > 0 && (
        <div className="border rounded-md max-h-72 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-28 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.slice(0, 200).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell className="text-sm">{r.name ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{r.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {value.length > 200 && (
            <div className="text-xs text-muted-foreground text-center py-2 border-t">
              Mostrando 200 de {value.length} linhas
            </div>
          )}
        </div>
      )}
    </div>
  );
}