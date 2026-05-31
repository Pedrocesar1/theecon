import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Map, X } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function GeoJsonUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (!parsed || (parsed.type !== "FeatureCollection" && parsed.type !== "Feature")) {
          throw new Error("Não parece um GeoJSON válido");
        }
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "GeoJSON inválido");
      }
      const path = `${crypto.randomUUID()}.geojson`;
      const { error } = await supabase.storage
        .from("geojson")
        .upload(path, new Blob([text], { type: "application/geo+json" }), {
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("geojson").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("GeoJSON enviado");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao enviar GeoJSON";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="border rounded-md p-3 bg-muted/30 flex items-start gap-2">
          <Map className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">GeoJSON carregado</div>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:underline truncate block"
            >
              {value.split("/").pop()}
            </a>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remover GeoJSON"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
          <Map className="h-6 w-6" />
          <p className="text-xs">Nenhum GeoJSON enviado</p>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Enviando..." : value ? "Substituir GeoJSON" : "Enviar GeoJSON"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}