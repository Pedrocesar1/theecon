import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Econ" },
      { name: "description", content: "Colunas e índices econômicos interativos sobre o Brasil." },
      { property: "og:title", content: "The Econ" },
      { property: "og:description", content: "Colunas e índices econômicos interativos sobre o Brasil." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="border-b border-[var(--editorial-rule)] pb-8 mb-10">
          <div className="text-xs uppercase tracking-widest text-accent mb-3">
            Edição mais recente
          </div>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-4xl">
            Economia brasileira lida pelos dados.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Colunas editoriais e índices econômicos interativos sobre estados e
            municípios brasileiros, em um só lugar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <section>
            <h2 className="font-serif text-2xl mb-4 border-b border-[var(--editorial-rule)] pb-2">
              Colunas
            </h2>
            <p className="text-muted-foreground text-sm">
              Em breve, as primeiras análises publicadas aparecerão aqui.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl mb-4 border-b border-[var(--editorial-rule)] pb-2">
              Índices econômicos
            </h2>
            <p className="text-muted-foreground text-sm">
              Mapas coropléticos interativos do Brasil, construídos a partir de
              planilhas e dados oficiais do IBGE.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
