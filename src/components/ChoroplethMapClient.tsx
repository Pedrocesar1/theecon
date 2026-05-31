import { lazy, Suspense, useEffect, useState } from "react";
import type { ComponentProps } from "react";

const Inner = lazy(() => import("./ChoroplethMap"));

type Props = ComponentProps<typeof Inner>;

export function ChoroplethMapClient(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className="rounded-md border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground"
        style={{ height: props.height ?? 520 }}
      >
        Carregando mapa...
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div
          className="rounded-md border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height: props.height ?? 520 }}
        >
          Carregando mapa...
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}