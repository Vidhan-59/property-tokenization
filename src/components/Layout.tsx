import { Outlet } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Header } from "./Header";
import { MobileTabBar } from "./MobileTabBar";
import { useInvestments } from "../context/InvestmentContext";

export function Layout() {
  const { resetDemoData } = useInvestments();

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 md:pb-0">
      <Header />
      <Outlet />
      <MobileTabBar />
      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            Veracity Supply Chain Ltd. &middot; This platform simulates the LLP capital contribution flow
            defined in PRD-LLP-MASTER-2026.04. No real funds move here.
          </p>
          <button
            onClick={() => {
              if (window.confirm("Reset all demo data (reservations, holdings, cap usage) to the original state?")) {
                resetDemoData();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700"
          >
            <RotateCcw size={12} /> Reset demo data
          </button>
        </div>
      </footer>
    </div>
  );
}
