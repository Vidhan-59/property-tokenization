import type { LlpFund } from "../types";
import { fundHeadroom, formatINR, targetRaise } from "../lib/engine";
import { CapMeter } from "./CapMeter";

interface HeroBannerProps {
  fund: LlpFund;
  pendingTotal: number;
}

export function HeroBanner({ fund, pendingTotal }: HeroBannerProps) {
  const cap = targetRaise(fund);
  const headroom = fundHeadroom(fund);

  return (
    <section id="offering" className="border-b border-neutral-200 bg-white">
      <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-neutral-100">
        <img src={fund.imageUrl} alt={fund.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-6 w-full">
          <span className="inline-block rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold tracking-wide text-neutral-900">
            LLP Capital Contribution
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow">
            {fund.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <p className="max-w-xl text-sm text-neutral-500">
            Admitted partnership across a diversified, audited portfolio of commercial, industrial and
            retail assets held by the Parent LLP.
          </p>

          <div className="flex gap-2">
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
              <span className="block text-neutral-500">Min Ticket</span>
              <span className="font-semibold text-neutral-900">{formatINR(fund.minTicket)}</span>
            </span>
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
              <span className="block text-neutral-500">Max Ticket</span>
              <span className="font-semibold text-neutral-900">{formatINR(fund.maxTicket)}</span>
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Total Portfolio NAV</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">{formatINR(fund.totalValuation)}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Offering Cap (10%): <span className="font-medium text-neutral-700">{formatINR(cap)}</span>
            </p>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-neutral-700">Fund-Level Dilution Ceiling</span>
              <span className="text-neutral-500">
                {formatINR(headroom - pendingTotal > 0 ? headroom - pendingTotal : 0)} headroom remaining
              </span>
            </div>
            <CapMeter raised={fund.currentRaisedAmount} pending={pendingTotal} cap={cap} />
          </div>
        </div>
      </div>
    </section>
  );
}
