import { lazy, Suspense, useEffect, useState } from "react";
import type { ComponentProps } from "react";

const Inner = lazy(() =>
  import("./IndexWizard").then((m) => ({ default: m.IndexWizard }))
);

type Props = ComponentProps<typeof Inner>;

const Fallback = () => (
  <div className="border rounded-md p-6 text-sm text-muted-foreground">
    Carregando construtor de índice...
  </div>
);

export function IndexWizardClient(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Fallback />;
  return (
    <Suspense fallback={<Fallback />}>
      <Inner {...props} />
    </Suspense>
  );
}