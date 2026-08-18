import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";
import type { Layer, LeafletMouseEvent, Map as LeafletMap, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";
import { buildScale, type ClassMethod } from "@/lib/classify";
import { Button } from "@/components/ui/button";
import { Download, MonitorDot, Sun } from "lucide-react";
import { MapSkeleton } from "@/components/map/MapSkeleton";
import { MapTooltip, type TooltipState } from "@/components/map/MapTooltip";
import { MapLegend } from "@/components/map/MapLegend";
import { MapRankingPanel } from "@/components/map/MapRankingPanel";

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

const NO_DATA_FILL = "#d4d4d8";
const HATCH_ID = "theecon-nodata-hatch";

function getFeatureKey(feature: Feature, key: string): string | undefined {
  const props = feature.properties as Record<string, unknown> | null | undefined;
  if (!props) return undefined;
  const v = props[key];
  return v == null ? undefined : String(v);
}

/** Injects the hatch pattern into the Leaflet overlay SVG and exposes the map instance. */
function MapBridge({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    const svg = map.getPanes().overlayPane.querySelector("svg");
    if (svg && !svg.querySelector(`#${HATCH_ID}`)) {
      const ns = "http://www.w3.org/2000/svg";
      const defs = document.createElementNS(ns, "defs");
      const pattern = document.createElementNS(ns, "pattern");
      pattern.setAttribute("id", HATCH_ID);
      pattern.setAttribute("width", "6");
      pattern.setAttribute("height", "6");
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("patternTransform", "rotate(45)");
      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("width", "6");
      bg.setAttribute("height", "6");
      bg.setAttribute("fill", NO_DATA_FILL);
      const line = document.createElementNS(ns, "rect");
      line.setAttribute("width", "2");
      line.setAttribute("height", "6");
      line.setAttribute("fill", "rgba(0,0,0,0.22)");
      pattern.appendChild(bg);
      pattern.appendChild(line);
      defs.appendChild(pattern);
      svg.insertBefore(defs, svg.firstChild);
    }
  }, [map, onReady]);
  return null;
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
  const [dark, setDark] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [activeClass, setActiveClass] = useState<number | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersByCode = useRef<Map<string, Layer>>(new Map());

  const dataByCode = useMemo(() => {
    const map = new Map<string, ChoroplethRow>();
    for (const r of rows) map.set(String(r.code), r);
    return map;
  }, [rows]);

  const scale = useMemo(
    () => buildScale(rows.map((r) => r.value), method, nClasses, colorScheme),
    [rows, method, nClasses, colorScheme]
  );

  const classOf = useCallback(
    (v: number | null | undefined) => {
      if (v == null || !Number.isFinite(v) || scale.breaks.length < 2) return null;
      for (let i = 1; i < scale.breaks.length; i++) {
        if (v <= scale.breaks[i]) return i - 1;
      }
      return scale.colors.length - 1;
    },
    [scale]
  );

  useEffect(() => {
    let cancelled = false;
    setGeo(null);
    setError(null);
    layersByCode.current = new Map();
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

  const handleExportPng = async () => {
    if (!mapWrapperRef.current) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(mapWrapperRef.current, {
        useCORS: true,
        backgroundColor: dark ? "#111318" : "#ffffff",
        ignoreElements: (el) =>
          el instanceof HTMLElement && el.classList.contains("leaflet-tile-pane"),
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${exportFileName}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  const style = useCallback(
    (feature?: Feature): PathOptions => {
      if (!feature) return {};
      const key = getFeatureKey(feature, joinKey);
      const row = key ? dataByCode.get(key) : undefined;
      const cls = classOf(row?.value);
      const dimmed = activeClass != null && cls !== activeClass;
      return {
        fillColor: row ? scale.getColor(row.value) : NO_DATA_FILL,
        weight: 0.5,
        color: dark ? "rgba(255,255,255,0.35)" : "#ffffff",
        fillOpacity: row ? (dimmed ? 0.18 : 0.9) : 0.55,
      };
    },
    [joinKey, dataByCode, scale, classOf, activeClass, dark]
  );

  const applyNoDataPattern = useCallback((layer: Layer, hasData: boolean) => {
    const el = (layer as unknown as { getElement?: () => SVGPathElement | null }).getElement?.();
    if (!el) return;
    el.classList.add("theecon-poly");
    if (!hasData) el.setAttribute("fill", `url(#${HATCH_ID})`);
  }, []);

  const onEachFeature = useCallback(
    (feature: Feature, layer: Layer) => {
      const key = getFeatureKey(feature, joinKey);
      const row = key ? dataByCode.get(key) : undefined;
      const props = feature.properties as Record<string, unknown> | null;
      const name =
        row?.name ??
        (props?.name as string | undefined) ??
        (props?.nome as string | undefined) ??
        key ??
        "—";
      if (key) layersByCode.current.set(key, layer);

      requestAnimationFrame(() => applyNoDataPattern(layer, !!row));

      const el = () =>
        (layer as unknown as { getElement?: () => SVGPathElement | null }).getElement?.();

      layer.on({
        mousemove: (e: LeafletMouseEvent) => {
          const rect = mapWrapperRef.current?.getBoundingClientRect();
          const ox = e.originalEvent as MouseEvent;
          setTooltip({
            name,
            value: row?.value ?? null,
            x: rect ? ox.clientX - rect.left : 0,
            y: rect ? ox.clientY - rect.top : 0,
          });
        },
        mouseover: () => {
          const node = el();
          node?.classList.add("theecon-poly-hover");
          node?.parentNode?.appendChild(node);
        },
        mouseout: () => {
          el()?.classList.remove("theecon-poly-hover");
          setTooltip(null);
        },
        click: () => {
          if (key) flyToCode(key);
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [joinKey, dataByCode, applyNoDataPattern]
  );

  const flyToCode = useCallback((code: string) => {
    const layer = layersByCode.current.get(code) as
      | (Layer & { getBounds?: () => L.LatLngBounds; getElement?: () => SVGPathElement | null })
      | undefined;
    const map = mapRef.current;
    if (!layer || !map || !layer.getBounds) return;
    setActiveCode(code);
    map.flyToBounds(layer.getBounds(), { duration: 1.1, padding: [40, 40], maxZoom: 8 });
    const node = layer.getElement?.();
    if (node) {
      node.classList.add("theecon-poly-hover");
      setTimeout(() => node.classList.remove("theecon-poly-hover"), 1800);
    }
  }, []);

  const hasNoData = useMemo(() => {
    if (!geo) return false;
    return geo.features.some((f) => {
      const k = getFeatureKey(f, joinKey);
      return !k || !dataByCode.has(k);
    });
  }, [geo, joinKey, dataByCode]);

  const min = scale.breaks[0] ?? 0;
  const max = scale.breaks[scale.breaks.length - 1] ?? 1;

  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

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

  if (!geo) return <MapSkeleton height={height} />;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className={dark ? "theecon-map-dark space-y-2" : "space-y-2"}>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDark((d) => !d)}
              aria-pressed={dark}
            >
              {dark ? <Sun className="h-4 w-4 mr-1" /> : <MonitorDot className="h-4 w-4 mr-1" />}
              {dark ? "Modo claro" : "Modo terminal"}
            </Button>
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

          <div
            ref={mapWrapperRef}
            className="relative rounded-md overflow-hidden border"
            style={{ height, backgroundColor: dark ? "#111318" : "#ffffff" }}
            onMouseLeave={() => setTooltip(null)}
          >
            <MapContainer
              style={{ height: "100%", width: "100%" }}
              center={[-14.5, -52]}
              zoom={4}
              scrollWheelZoom
            >
              <MapBridge onReady={(m) => (mapRef.current = m)} />
              <TileLayer
                key={dark ? "dark" : "light"}
                attribution="© OpenStreetMap · © CARTO"
                url={tileUrl}
              />
              <GeoJSON
                key={`${geojsonUrl}-${rows.length}-${colorScheme}-${nClasses}-${method}-${activeClass}-${dark}`}
                data={geo as GeoJsonObject}
                style={style}
                onEachFeature={onEachFeature}
              />
            </MapContainer>

            <MapTooltip
              state={tooltip}
              colors={scale.colors}
              min={min}
              max={max}
              unitLabel={unitLabel}
              dark={dark}
            />

            <MapLegend
              breaks={scale.breaks}
              colors={scale.colors}
              unitLabel={unitLabel}
              dark={dark}
              hoverValue={tooltip?.value ?? null}
              activeClass={activeClass}
              onSelectClass={setActiveClass}
              hasNoData={hasNoData}
            />
          </div>
        </div>

        <MapRankingPanel
          rows={rows}
          unitLabel={unitLabel}
          onSelect={flyToCode}
          activeCode={activeCode}
        />
      </div>
    </div>
  );
}
