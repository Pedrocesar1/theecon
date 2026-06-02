import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";
import { buildScale, type ClassMethod } from "@/lib/classify";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export interface ChoroplethRow {
  code: string;
  name?: string;
  value: number;
}

interface Props {
  geojsonUrl: string;
  joinKey: string;
  rows: ChoroplethRow[];
  colorScheme: string;
  nClasses: number;
  method: ClassMethod;
  unitLabel?: string | null;
  height?: number | string;
  exportFileName?: string;
}

function getFeatureKey(feature: Feature, key: string): string | undefined {
  const props = feature.properties as Record<string, unknown> | null | undefined;
  if (!props) return undefined;
  const v = props[key];
  return v == null ? undefined : String(v);
}

export default function ChoroplethMap({
  geojsonUrl,
  joinKey,
  rows,
  colorScheme,
  nClasses,
  method,
  unitLabel,
  height = 520,
  exportFileName = "mapa",
}: Props) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPng = async () => {
    if (!mapWrapperRef.current) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(mapWrapperRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        // Skip tiles since most providers reject CORS; vector layers still render.
        ignoreElements: (el) =>
          el instanceof HTMLElement && el.classList.contains("leaflet-tile-pane"),
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setGeo(null);
    setError(null);
    fetch(geojsonUrl)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar GeoJSON");
        return r.json();
      })
      .then((j: FeatureCollection) => {
        if (!cancelled) setGeo(j);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro");
      });
    return () => {
      cancelled = true;
    };
  }, [geojsonUrl]);

  const dataByCode = useMemo(() => {
    const map = new Map<string, ChoroplethRow>();
    for (const r of rows) map.set(String(r.code), r);
    return map;
  }, [rows]);

  const scale = useMemo(
    () => buildScale(rows.map((r) => r.value), method, nClasses, colorScheme),
    [rows, method, nClasses, colorScheme]
  );

  const style = (feature?: Feature): PathOptions => {
    if (!feature) return {};
    const key = getFeatureKey(feature, joinKey);
    const row = key ? dataByCode.get(key) : undefined;
    return {
      fillColor: scale.getColor(row?.value),
      weight: 0.5,
      color: "#ffffff",
      fillOpacity: row ? 0.9 : 0.35,
    };
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const key = getFeatureKey(feature, joinKey);
    const row = key ? dataByCode.get(key) : undefined;
    const props = feature.properties as Record<string, unknown> | null;
    const name =
      row?.name ??
      (props?.name as string | undefined) ??
      (props?.nome as string | undefined) ??
      key ??
      "—";
    const valTxt = row ? row.value.toLocaleString("pt-BR") : "sem dado";
    layer.bindTooltip(
      `<strong>${name}</strong><br/>${valTxt}${unitLabel ? ` ${unitLabel}` : ""}`,
      { sticky: true }
    );
  };

  if (error) {
    return (
      <div
        className="rounded-md border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {error}
      </div>
    );
  }

  if (!geo) {
    return (
      <div
        className="rounded-md border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Carregando mapa...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportPng}
          disabled={exporting}
        >
          <Download className="h-4 w-4 mr-1" />
          {exporting ? "Exportando..." : "Baixar PNG"}
        </Button>
      </div>
      <div ref={mapWrapperRef} className="rounded-md overflow-hidden border bg-white" style={{ height }}>
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={[-14.5, -52]}
          zoom={4}
          scrollWheelZoom
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            key={`${geojsonUrl}-${rows.length}-${colorScheme}-${nClasses}-${method}`}
            data={geo as GeoJsonObject}
            style={style}
            onEachFeature={onEachFeature}
          >
            <Tooltip sticky />
          </GeoJSON>
        </MapContainer>
      </div>

      {scale.breaks.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted-foreground mr-1">Legenda{unitLabel ? ` (${unitLabel})` : ""}:</span>
          {scale.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="inline-block w-4 h-4 rounded-sm border"
                style={{ backgroundColor: c }}
              />
              <span className="text-muted-foreground">
                {scale.breaks[i].toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                {" – "}
                {scale.breaks[i + 1].toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}