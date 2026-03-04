import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  Book,
  BookOpen,
  ChevronFirst,
  ChevronLast,
  LayoutPanelTop,
  Menu,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { ROUTES } from "../../utils/constants";
import { GlobalRequestIndicator } from "../ui/GlobalRequestIndicator";

type MenuItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  { to: ROUTES.dashboard, label: "Painel", icon: LayoutPanelTop },
  { to: ROUTES.authors, label: "Autores", icon: Users },
  { to: ROUTES.books, label: "Livros", icon: Book },
  { to: ROUTES.loans, label: "Empréstimos", icon: ArrowLeftRight },
];

const menuButtonClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full items-center gap-3 rounded-[10px] px-4 py-3 font-semibold transition ${
    isActive
      ? "bg-destaque text-texto-principal shadow-md"
      : "text-texto-secundario hover:bg-destaque-suave"
  }`;

const storageKey = "biblioteca-tema-dark";

export const AppLayout = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const persisted = localStorage.getItem(storageKey);
    const enabled = persisted === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem(storageKey, next ? "1" : "0");
      return next;
    });
  };

  const activeTitle =
    menuItems.find((item) => item.to === location.pathname)?.label ?? "Painel";

  const iconButtonClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-[10px] bg-fundo-superficie-suave text-texto-secundario transition hover:bg-destaque-suave hover:text-destaque";

  return (
    <div className="min-h-screen bg-fundo-pagina text-texto-principal">
      <GlobalRequestIndicator />

      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-borda-padrao bg-fundo-navbar-sidebar px-3 lg:hidden">
        <div className="flex items-center">
          <Link to={ROUTES.dashboard} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-destaque text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black leading-none tracking-tight">
                Books
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-destaque">
                Manager
              </p>
            </div>
          </Link>

          <h1 className="border-l-2 border-borda-padrao ml-4 pl-3 text-2xl font-black">{activeTitle}</h1>
        </div>

        <button
          type="button"
          className={iconButtonClass}
          aria-label="Abrir menu"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </header>

      {isMobileMenuOpen && (
        <aside className="fixed inset-0 top-16 z-30 bg-fundo-navbar-sidebar p-4 lg:hidden flex flex-col justify-between">
          <nav
            className="space-y-2 text-lg"
            aria-label="Navegação principal mobile"
          >
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={menuButtonClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-borda-padrao">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-lg font-semibold text-texto-secundario transition hover:bg-destaque-suave hover:text-destaque"
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
            >
              {isDarkMode ? (
                <Sun className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
              <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
                Tema
              </span>
            </button>
          </div>
        </aside>
      )}

      <aside
        className={`fixed left-0 top-0 hidden h-full border-r border-borda-padrao bg-fundo-navbar-sidebar transition-all duration-300 lg:flex lg:flex-col ${
          isSidebarExpanded ? "w-72" : "w-20"
        }`}
      >
        <div
          className={`flex items-center py-6 px-3 ${
            isSidebarExpanded ? "justify-between" : "justify-center"
          }`}
        >
          <Link
            to={ROUTES.dashboard}
            className={`flex items-center gap-3 overflow-hidden ${
              isSidebarExpanded ? "opacity-100" : "hidden"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-destaque text-white">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <p className="font-black leading-none tracking-tight">Books</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-destaque">
                Manager
              </p>
            </div>
          </Link>
          <button
            type="button"
            className={`${iconButtonClass} h-10 w-10`}
            aria-label="Expandir ou recolher menu lateral"
            onClick={() => setIsSidebarExpanded((current) => !current)}
          >
            {isSidebarExpanded ? (
              <ChevronFirst className="h-5 w-5" />
            ) : (
              <ChevronLast className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav
          className="flex-1 space-y-2 px-3"
          aria-label="Navegação principal desktop"
        >
          {menuItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={menuButtonClass}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-borda-padrao py-3 mx-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[10px] px-4 py-3 font-semibold text-texto-secundario transition hover:bg-destaque-suave hover:text-destaque"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
          >
            {isDarkMode ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
            <span className={`${isSidebarExpanded ? "block" : "hidden"}`}>
              Tema
            </span>
          </button>
        </div>
      </aside>

      <div
        className={`pt-16 lg:pt-0 ${isSidebarExpanded ? "lg:pl-72" : "lg:pl-20"}`}
      >
        <header className="sticky top-0 z-20 hidden items-center justify-between bg-fundo-navbar-sidebar/80 px-8 py-6 backdrop-blur lg:flex">
          <h1 className="text-2xl font-black">{activeTitle}</h1>
        </header>

        <main className="mx-auto min-h-full max-w-full p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
