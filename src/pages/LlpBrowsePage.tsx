import { Landmark } from "lucide-react";
import { useInvestments } from "../context/InvestmentContext";
import { LlpFirmCard } from "../components/LlpFirmCard";
import { formatINR, targetRaise } from "../lib/engine";

export function LlpBrowsePage() {
  const { funds, properties } = useInvestments();

  const totalNav = funds.reduce((sum, f) => sum + f.totalValuation, 0);
  const totalCap = funds.reduce((sum, f) => sum + targetRaise(f), 0);
  const totalRaised = funds.reduce((sum, f) => sum + f.currentRaisedAmount, 0);

  return (
    <div>
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium tracking-wide text-gold-400">
            <Landmark size={12} /> LLP Capital Contribution Platform
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            Registered LLP Firms
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-500">
            Each LLP below holds title to its own audited portfolio of properties. Admitted partners
            contribute capital directly into a Parent LLP, diversified across its assets — never a single
            property SPV.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <Stat label="LLP Firms" value={String(funds.length)} />
            <Stat label="Portfolio Assets" value={String(properties.length)} />
            <Stat label="Combined NAV" value={formatINR(totalNav)} />
            <Stat label="Combined Cap Raised" value={`${formatINR(totalRaised)} / ${formatINR(totalCap)}`} small />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {funds.map((fund) => (
            <LlpFirmCard key={fund.id} fund={fund} properties={properties.filter((p) => p.fundId === fund.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`mt-0.5 font-semibold text-neutral-900 ${small ? "text-sm" : "text-lg"}`}>{value}</p>
    </div>
  );
}
