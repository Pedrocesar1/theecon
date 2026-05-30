import { Link, Outlet, useRouterState } from "@tanstack/react-router";

export function PublicLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navLink = (to: string, label: string) => {
    const active = pathname === to || pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`text-sm tracking-wide uppercase transition-colors ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-[var(--editorial-rule)] bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl tracking-tight">
            The Econ
          </Link>
          <nav className="flex items-center gap-6">
            {navLink("/colunas", "Colunas")}
            {navLink("/indices", "Índices")}
            <Link
              to="/admin/login"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--editorial-rule)] mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <div className="font-serif text-lg text-foreground">The Econ</div>
            <p className="mt-1 max-w-md">
              Colunas e índices econômicos interativos sobre o Brasil.
            </p>
          </div>
          <div className="flex gap-6 items-center">
            <Link to="/colunas">Colunas</Link>
            <Link to="/indices">Índices</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
