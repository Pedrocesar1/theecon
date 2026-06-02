import { createFileRoute } from "@tanstack/react-router";
import { IndexWizardClient } from "@/components/admin/IndexWizardClient";

export const Route = createFileRoute("/_authenticated/admin/indices/new")({
  component: () => <IndexWizardClient />,
});