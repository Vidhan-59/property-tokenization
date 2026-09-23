import { Briefcase, Landmark } from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/llps", label: "Browse LLPs", icon: Landmark },
  { to: "/portfolio", label: "My Portfolio", icon: Briefcase },
];

export function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-2">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? "text-neutral-900" : "text-neutral-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon size={18} className={isActive ? "text-gold-500" : ""} />
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
