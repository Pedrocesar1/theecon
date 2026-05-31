import { createFileRoute } from "@tanstack/react-router";
import { IndexForm } from "@/components/admin/IndexForm";

export const Route = createFileRoute("/_authenticated/admin/indices/new")({
  component: () => <IndexForm />,
});