import { lazy, Suspense, useEffect, useState } from "react";
import type { ComponentProps } from "react";

const Inner = lazy(() =>
  import("./ColumnForm").then((m) => ({ default: m.ColumnForm }))
);

type Props = ComponentProps<typeof Inner>;

const Fallback = () => (
  <div className="border rounded-md p-6 text-sm text-muted-foreground">
    Carregando editor...
  </div>
);

export function ColumnFormClient(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Fallback />;
  return (
    <Suspense fallback={<Fallback />}>
      <Inner {...props} />
    </Suspense>
  );
}