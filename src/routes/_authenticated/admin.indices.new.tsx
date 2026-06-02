import { createFileRoute } from "@tanstack/react-router";
import { IndexWizard } from "@/components/admin/IndexWizard";

export const Route = createFileRoute("/_authenticated/admin/indices/new")({
  component: () => <IndexWizard />,
});