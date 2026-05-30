import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function CoverUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("covers")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Capa enviada");
    } catch (e) {
      toast.error("Falha ao enviar capa");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group rounded-md overflow-hidden border bg-muted">
          <img src={value} alt="Capa" className="w-full max-h-72 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-background/90 border rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remover capa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
          <ImagePlus className="h-8 w-8" />
          <p className="text-sm">Nenhuma capa selecionada</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando..." : value ? "Substituir capa" : "Enviar capa"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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