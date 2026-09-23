import { ArrowUpRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { LlpFund, PortfolioProperty } from "../types";
import { FUND_STATUS_LABEL, formatINR, fundHeadroom, fundRaisedPercent, fundStatus, targetRaise } from "../lib/engine";
import { CapMeter } from "./CapMeter";

interface LlpFirmCardProps {
  fund: LlpFund;
  properties: PortfolioProperty[];
}

const STATUS_STYLES: Record<string, string> = {
  NEWLY_LAUNCHED: "bg-gold-50 text-gold-700 border-gold-300",
  OPEN: "bg-neutral-900/90 text-gold-400 border-neutral-900",
  CLOSING_SOON: "bg-danger-50 text-danger-600 border-danger-400/30",
  FULLY_SUBSCRIBED: "bg-neutral-150 text-neutral-500 border-neutral-300",
};

export function LlpFirmCard({ fund, properties }: LlpFirmCardProps) {
  const status = fundStatus(fund);
  const assetTypes = [...new Set(properties.map((p) => p.assetType))];
  const cities = [...new Set(properties.map((p) => p.location.split(",").pop()?.trim() ?? p.location))].slice(0, 3);
  const avgYield =
    properties.length > 0 ? properties.reduce((s, p) => s + p.rentalYieldPercent, 0) / properties.length : 0;

  return (
    <div className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:shadow-lg hover:shadow-neutral-200/60 hover:border-gold-200 transition-all">
      <div className="relative h-40 w-full overflow-hidden bg-neutral-100">
        <img
          src={fund.imageUrl}
          alt={fund.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-black/0" />

        <div className="absolute inset-x-4 top-3 flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur ${STATUS_STYLES[status]}`}
          >
            {FUND_STATUS_LABEL[status]}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-600 backdrop-blur">
            <Building2 size={12} /> {properties.length} assets
          </span>
        </div>

        <h3 className="absolute inset-x-4 bottom-3 text-base font-semibold leading-snug text-white drop-shadow">
          {fund.name}
        </h3>
      </div>

      <div className="p-6 pt-4">
        <p className="text-xs text-neutral-500">
          {assetTypes.join(" · ")} &middot; {cities.join(", ")}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-neutral-400">Portfolio NAV</p>
            <p className="mt-0.5 font-semibold text-neutral-900">{formatINR(fund.totalValuation)}</p>
          </div>
          <div>
            <p className="text-neutral-400">Offering Cap</p>
            <p className="mt-0.5 font-semibold text-neutral-900">{formatINR(targetRaise(fund))}</p>
          </div>
          <div>
            <p className="text-neutral-400">Avg. Yield</p>
            <p className="mt-0.5 font-semibold text-gold-600">{avgYield.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4">
          <CapMeter raised={fund.currentRaisedAmount} cap={targetRaise(fund)} compact />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            {status === "FULLY_SUBSCRIBED"
              ? "Tranche closed to new subscriptions"
              : `${formatINR(fundHeadroom(fund))} headroom · ${fundRaisedPercent(fund).toFixed(0)}% raised`}
          </p>
          <Link
            to={`/llps/${fund.id}`}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-gold-400 group-hover:bg-neutral-800 transition-colors"
          >
            View Firm <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
