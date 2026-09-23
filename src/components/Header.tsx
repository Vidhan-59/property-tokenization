import { Landmark } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/llps", label: "Browse LLPs" },
  { to: "/portfolio", label: "My Portfolio" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <NavLink to="/llps" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-gold-400">
            <Landmark size={18} strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-neutral-900 tracking-tight">Ansh</p>
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Capital Partners</p>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `pb-[18px] -mb-[18px] border-b-2 transition-colors ${
                  isActive ? "border-gold-400 text-neutral-900" : "border-transparent hover:text-neutral-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-medium text-neutral-800">Amit Patidar</p>
            <p className="text-xs text-neutral-500">Investor Account</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center text-sm font-semibold text-gold-700">
            AP
          </div>
        </div>
      </div>
    </header>
  );
}
