import { Link } from "react-router";
import { ExternalLink, FileSearch, FileText, LayoutDashboard } from "lucide-react";

const NAV_ITEMS = [
  { label: "e-GP Process", to: "/", icon: LayoutDashboard, external: false },
  {
    label: "OCR Invoice",
    to: "https://invocr-fr6cr6ti.manus.space/",
    icon: FileSearch,
    external: true,
  },
  {
    label: "TOR Create",
    to: "https://sobprab-drugs-tor.lovable.app/",
    icon: FileText,
    external: true,
  },
];

export function AppNavbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 font-bold text-white">
            eP
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              e-EP Tracking Viewer
            </p>
            <p className="text-xs text-slate-400">ห้องยา รพ.สบปราบ</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.to}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
