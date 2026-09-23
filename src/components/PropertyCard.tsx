import { Lock, MapPin, TrendingUp } from "lucide-react";
import type { PortfolioProperty } from "../types";
import { formatINR, isCapped, maxInvestableLimit } from "../lib/engine";
import { CapMeter } from "./CapMeter";

interface PropertyCardProps {
  property: PortfolioProperty;
  pendingAmount: number;
}

const ASSET_STYLES: Record<string, string> = {
  Commercial: "bg-gold-50 text-gold-700 border-gold-200",
  Industrial: "bg-neutral-100 text-neutral-700 border-neutral-300",
  Retail: "bg-neutral-100 text-neutral-700 border-neutral-300",
};

export function PropertyCard({ property, pendingAmount }: PropertyCardProps) {
  const capped = isCapped(property);
  const cap = maxInvestableLimit(property);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition-shadow ${
        capped ? "border-neutral-200" : "border-neutral-200 hover:shadow-md hover:shadow-neutral-200/60"
      }`}
    >
      <div className="relative h-36 w-full overflow-hidden bg-neutral-100">
        <img
          src={property.imageUrl}
          alt={property.title}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-300 ${
            capped ? "grayscale-[60%] opacity-70" : "hover:scale-105"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur ${ASSET_STYLES[property.assetType]}`}
          >
            {property.assetType}
          </span>

          {capped ? (
            <span
              title="This asset has exhausted its 10% allocation cap and cannot accept new capital."
              className="inline-flex items-center gap-1 rounded-full bg-danger-50 border border-danger-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-danger-600"
            >
              <Lock size={11} /> 10% CAP REACHED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2.5 py-0.5 text-[11px] font-semibold text-gold-400 backdrop-blur">
              OPEN
            </span>
          )}
        </div>
      </div>

      <div className={`p-5 ${capped ? "bg-neutral-50/60" : ""}`}>
        <h3 className="font-semibold text-neutral-900 leading-snug">{property.title}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
          <MapPin size={12} /> {property.location}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-neutral-500">Valuation</p>
            <p className="font-medium text-neutral-800">{formatINR(property.currentValuation)}</p>
          </div>
          <div>
            <p className="text-neutral-500 flex items-center gap-1">
              <TrendingUp size={12} /> Rental Yield
            </p>
            <p className="font-medium text-neutral-800">{property.rentalYieldPercent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4">
          <CapMeter
            raised={property.currentInvestedAmount}
            pending={pendingAmount}
            cap={cap}
            capped={capped}
            compact
          />
        </div>
      </div>
    </div>
  );
}
