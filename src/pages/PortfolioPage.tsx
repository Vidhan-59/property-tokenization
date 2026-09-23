import type { ReactNode } from "react";
import { Briefcase, Landmark, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useInvestments } from "../context/InvestmentContext";
import { InvestmentCard } from "../components/InvestmentCard";
import { formatINR, projectedMonthlyDistribution } from "../lib/engine";

export function PortfolioPage() {
  const { funds, properties, investments, now, cancelInvestment, executeInvestment } = useInvestments();

  const active = investments.filter((inv) => inv.status === "RESERVED" || inv.status === "EXECUTED");
  const history = investments.filter((inv) => inv.status === "CANCELLED" || inv.status === "EXPIRED");

  const totalDeployed = active.reduce((sum, inv) => sum + inv.amountInvested, 0);
  const firmsInvested = new Set(active.map((inv) => inv.fundId)).size;
  const propertiesHeld = new Set(active.flatMap((inv) => inv.allocations.map((a) => a.propertyId))).size;
  const blendedEquity = active.reduce((sum, inv) => sum + inv.partnershipPercentage, 0);
  const monthlyDistribution = projectedMonthlyDistribution(properties, investments);

  const sorted = [...investments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium tracking-wide text-gold-400">
            <Briefcase size={12} /> Partner Dashboard
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">My Portfolio</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-500">
            Every capital contribution you've made across Veracity LLP firms, with a live projection of monthly
            rental distributions from your admitted partnership shares.
          </p>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryTile icon={<Wallet size={16} />} label="Capital Deployed" value={formatINR(totalDeployed)} />
            <SummaryTile icon={<Landmark size={16} />} label="LLP Firms" value={String(firmsInvested)} />
            <SummaryTile icon={<Briefcase size={16} />} label="Properties Held" value={String(propertiesHeld)} />
            <SummaryTile
              icon={<TrendingUp size={16} />}
              label="Est. Monthly Distribution"
              value={formatINR(monthlyDistribution)}
              highlight
            />
          </div>
          {active.length > 0 && (
            <p className="mt-3 text-xs text-neutral-400">
              Aggregate partnership interest across active firms: <span className="font-medium text-neutral-600">{blendedEquity.toFixed(4)}%</span>
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-sm text-neutral-500">You haven't made any capital contributions yet.</p>
            <Link to="/llps" className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-neutral-800">
              Browse LLP Firms
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {sorted.map((inv) => {
              const fund = funds.find((f) => f.id === inv.fundId);
              const fundProperties = properties.filter((p) => p.fundId === inv.fundId);
              return (
                <InvestmentCard
                  key={inv.id}
                  investment={inv}
                  fundName={fund?.name ?? "Unknown LLP"}
                  properties={fundProperties}
                  now={now}
                  onCancel={() => cancelInvestment(inv.id)}
                  onExecute={() => executeInvestment(inv.id)}
                />
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <p className="mt-6 text-xs text-neutral-400">
            {history.length} past reservation{history.length > 1 ? "s" : ""} expired or cancelled &middot; capital
            headroom was released back to the respective LLP.
          </p>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-gold-300 bg-gold-50/50" : "border-neutral-200 bg-neutral-50"}`}>
      <div className={`flex items-center gap-1.5 text-xs ${highlight ? "text-gold-700" : "text-neutral-500"}`}>
        {icon} {label}
      </div>
      <p className={`mt-1.5 text-lg font-semibold ${highlight ? "text-gold-700" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}
