import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Lock, PartyPopper, Sparkles, SlidersHorizontal } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useInvestments } from "../context/InvestmentContext";
import { StepIndicator } from "../components/StepIndicator";
import { InvestmentCard } from "../components/InvestmentCard";
import type { AllocationDraft } from "../types";
import {
  autoBalanceAllocations,
  formatINR,
  fundHeadroom,
  isCapped,
  partnershipSharePercent,
  propertyHeadroom,
  sumAllocations,
  validateInvestment,
} from "../lib/engine";

const QUICK_CHIPS = [25_000, 100_000, 500_000, 1_000_000];
const STEPS = [{ label: "Ticket Size" }, { label: "Allocation Mode" }, { label: "Allocate" }, { label: "Review" }];

export function InvestWizardPage() {
  const { fundId } = useParams<{ fundId: string }>();
  const navigate = useNavigate();
  const { getFund, getFundProperties, investments, now, createReservation, cancelInvestment, executeInvestment } =
    useInvestments();

  const fund = fundId ? getFund(fundId) : undefined;
  const properties = useMemo(() => (fund ? getFundProperties(fund.id) : []), [fund, getFundProperties]);

  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [ticketAmount, setTicketAmount] = useState(0);
  const [mode, setMode] = useState<"AUTO" | "CUSTOM">("AUTO");
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [clampAlerts, setClampAlerts] = useState<Record<string, string | null>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const autoAllocations = useMemo(() => autoBalanceAllocations(properties, ticketAmount), [properties, ticketAmount]);

  const allocations: AllocationDraft = useMemo(() => {
    if (mode === "AUTO") return autoAllocations;
    const draft: AllocationDraft = {};
    for (const p of properties) draft[p.id] = Math.min(customAmounts[p.id] ?? 0, propertyHeadroom(p));
    return draft;
  }, [mode, autoAllocations, customAmounts, properties]);

  if (!fund) return <Navigate to="/llps" replace />;

  const closed = fundHeadroom(fund) <= 0;
  if (closed && !confirmedId) return <Navigate to={`/llps/${fund.id}`} replace />;

  const confirmedInvestment = confirmedId ? investments.find((inv) => inv.id === confirmedId) : undefined;

  const allocatedTotal = sumAllocations(allocations);
  const unallocated = ticketAmount - allocatedTotal;
  const validation = validateInvestment(fund, properties, ticketAmount, allocations);
  const equityPct = partnershipSharePercent(fund, ticketAmount);

  const step1Valid = ticketAmount > 0 && !validation.errors.some((e) => e.code === "TICKET_MIN" || e.code === "TICKET_MAX" || e.code === "FUND_CAP_OVERFLOW");
  const step3Valid = Math.abs(unallocated) < 1 && validation.valid;

  function goTo(next: number) {
    setStep(next);
    setFurthestStep((f) => Math.max(f, next));
  }

  function handleModeChange(next: "AUTO" | "CUSTOM") {
    if (next === "CUSTOM" && mode === "AUTO") setCustomAmounts({ ...autoAllocations });
    setMode(next);
  }

  function handleCustomAmountChange(propertyId: string, headroom: number, rawValue: number) {
    const clamped = Math.max(0, Math.min(rawValue, headroom));
    setCustomAmounts((prev) => ({ ...prev, [propertyId]: clamped }));
    if (rawValue > headroom) {
      setClampAlerts((prev) => ({ ...prev, [propertyId]: `Input clamped: Asset capacity limited to ${formatINR(headroom)}` }));
      window.setTimeout(() => setClampAlerts((prev) => ({ ...prev, [propertyId]: null })), 3500);
    } else {
      setClampAlerts((prev) => ({ ...prev, [propertyId]: null }));
    }
  }

  function handleConfirm() {
    if (!step3Valid) return;
    const investment = createReservation(fund.id, ticketAmount, allocations);
    setConfirmedId(investment.id);
  }

  // --- Success state: reservation just confirmed ---
  if (confirmedInvestment) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-2 mb-1">
          <PartyPopper size={20} className="text-gold-500" />
          <h1 className="text-xl font-semibold text-neutral-900">Reservation Confirmed</h1>
        </div>
        <p className="text-sm text-neutral-500 mb-6">
          Your capital headroom is held for 15 minutes across the assets below while KYC and settlement complete.
        </p>

        <InvestmentCard
          investment={confirmedInvestment}
          fundName={fund.name}
          properties={properties}
          now={now}
          onCancel={() => {
            cancelInvestment(confirmedInvestment.id);
            navigate(`/llps/${fund.id}`);
          }}
          onExecute={() => executeInvestment(confirmedInvestment.id)}
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/portfolio" className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-neutral-800">
            View My Portfolio
          </Link>
          <Link to="/llps" className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Browse More LLP Firms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link to={`/llps/${fund.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800">
        <ArrowLeft size={13} /> Back to {fund.name}
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-neutral-900">Invest in {fund.name}</h1>
      <p className="text-sm text-neutral-500 mb-7">
        {formatINR(fund.minTicket)} &ndash; {formatINR(fund.maxTicket)} per order &middot; {formatINR(fundHeadroom(fund))} fund headroom remaining
      </p>

      <div className="mb-8">
        <StepIndicator steps={STEPS} currentStep={step} furthestStep={furthestStep} onStepClick={goTo} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 min-h-[320px]">
        {step === 1 && (
          <TicketStep
            fund={fund}
            ticketAmount={ticketAmount}
            setTicketAmount={setTicketAmount}
            errors={validation.errors.filter((e) => e.code === "TICKET_MIN" || e.code === "TICKET_MAX" || e.code === "FUND_CAP_OVERFLOW")}
          />
        )}
        {step === 2 && <ModeStep mode={mode} onChange={handleModeChange} />}
        {step === 3 && (
          <AllocateStep
            properties={properties}
            mode={mode}
            allocations={allocations}
            ticketAmount={ticketAmount}
            customAmounts={customAmounts}
            clampAlerts={clampAlerts}
            onCustomAmountChange={handleCustomAmountChange}
            unallocated={unallocated}
          />
        )}
        {step === 4 && (
          <ReviewStep
            fund={fund}
            properties={properties}
            ticketAmount={ticketAmount}
            mode={mode}
            allocations={allocations}
            equityPct={equityPct}
          />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => goTo(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-600 disabled:opacity-0"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => goTo(step + 1)}
            disabled={(step === 1 && !step1Valid) || (step === 3 && !step3Valid)}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              (step === 1 && !step1Valid) || (step === 3 && !step3Valid)
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-neutral-900 text-gold-400 hover:bg-neutral-800"
            }`}
          >
            Continue <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={!step3Valid}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
              !step3Valid ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : "bg-neutral-900 text-gold-400 hover:bg-neutral-800"
            }`}
          >
            Confirm Reservation <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- Step bodies ----------------

function TicketStep({
  fund,
  ticketAmount,
  setTicketAmount,
  errors,
}: {
  fund: ReturnType<typeof useInvestments>["funds"][number];
  ticketAmount: number;
  setTicketAmount: (n: number) => void;
  errors: { message: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">Investment Ticket</label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-neutral-300 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 px-3 py-3 bg-white max-w-sm">
        <span className="text-neutral-400 font-medium">₹</span>
        <input
          type="number"
          step={5000}
          value={ticketAmount || ""}
          placeholder="0"
          onChange={(e) => setTicketAmount(Math.max(0, Number(e.target.value)))}
          className="w-full outline-none text-neutral-900 font-semibold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-neutral-400 whitespace-nowrap">{formatINR(ticketAmount)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setTicketAmount(chip)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              ticketAmount === chip ? "border-gold-400 bg-gold-50 text-gold-700" : "border-neutral-200 text-neutral-600 hover:border-gold-300 hover:text-gold-700"
            }`}
          >
            {formatINR(chip)}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        Min {formatINR(fund.minTicket)} &middot; Max {formatINR(fund.maxTicket)} per order
      </p>

      {ticketAmount > 0 && errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs font-medium text-danger-600">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {err.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeStep({ mode, onChange }: { mode: "AUTO" | "CUSTOM"; onChange: (m: "AUTO" | "CUSTOM") => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={() => onChange("AUTO")}
        className={`text-left rounded-xl border-2 p-5 transition-colors ${
          mode === "AUTO" ? "border-gold-400 bg-gold-50/40" : "border-neutral-200 hover:border-neutral-300"
        }`}
      >
        <Sparkles size={20} className={mode === "AUTO" ? "text-gold-500" : "text-neutral-400"} />
        <h3 className="mt-2.5 font-semibold text-neutral-900">Auto-Balanced Pro-Rata</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Capital is spread automatically across every open property, weighted by its remaining 10% headroom.
          Fastest way to diversify across the whole LLP.
        </p>
      </button>

      <button
        onClick={() => onChange("CUSTOM")}
        className={`text-left rounded-xl border-2 p-5 transition-colors ${
          mode === "CUSTOM" ? "border-gold-400 bg-gold-50/40" : "border-neutral-200 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal size={20} className={mode === "CUSTOM" ? "text-gold-500" : "text-neutral-400"} />
        <h3 className="mt-2.5 font-semibold text-neutral-900">Custom Portfolio Builder</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Set your own rupee amount per property with sliders, clamped to each asset's remaining cap. Best when
          you want conviction weighting toward specific assets.
        </p>
      </button>
    </div>
  );
}

function AllocateStep({
  properties,
  mode,
  allocations,
  ticketAmount,
  customAmounts,
  clampAlerts,
  onCustomAmountChange,
  unallocated,
}: {
  properties: ReturnType<typeof useInvestments>["properties"];
  mode: "AUTO" | "CUSTOM";
  allocations: AllocationDraft;
  ticketAmount: number;
  customAmounts: Record<string, number>;
  clampAlerts: Record<string, string | null>;
  onCustomAmountChange: (propertyId: string, headroom: number, value: number) => void;
  unallocated: number;
}) {
  const settled = Math.abs(unallocated) < 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">
          {mode === "AUTO" ? "Computed distribution across open properties." : "Set a rupee amount for each property."}
        </p>
        <span className={`text-xs font-semibold ${settled ? "text-neutral-500" : "text-danger-600"}`}>
          Unallocated: {formatINR(unallocated)}
        </span>
      </div>

      <div className="space-y-3">
        {properties.map((property) => {
          const capped = isCapped(property);
          const headroom = propertyHeadroom(property);
          const amount = allocations[property.id] ?? 0;
          const pct = ticketAmount > 0 ? (amount / ticketAmount) * 100 : 0;
          const alert = clampAlerts[property.id];

          return (
            <div key={property.id} className={`rounded-xl border px-4 py-3.5 ${capped ? "border-neutral-200 bg-neutral-50" : "border-neutral-200"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-800">{property.title}</span>
                  {capped && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 border border-danger-400/30 px-2 py-0.5 text-[10px] font-semibold text-danger-600">
                      <Lock size={9} /> CAPPED
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-neutral-900">
                  {formatINR(amount)}
                  <span className="ml-1.5 text-xs font-normal text-neutral-400">({pct.toFixed(1)}%)</span>
                </div>
              </div>

              {mode === "CUSTOM" ? (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    className="asset-slider"
                    min={0}
                    max={Math.max(headroom, 1)}
                    step={1000}
                    value={Math.min(customAmounts[property.id] ?? 0, headroom)}
                    disabled={capped}
                    onChange={(e) => onCustomAmountChange(property.id, headroom, Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="w-28 shrink-0 rounded-md border border-neutral-300 px-2 py-1 text-xs text-right outline-none focus:border-gold-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={customAmounts[property.id] ?? 0}
                    disabled={capped}
                    onChange={(e) => onCustomAmountChange(property.id, headroom, Number(e.target.value))}
                  />
                </div>
              ) : (
                <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div className={`h-full ${capped ? "bg-neutral-300" : "bg-gold-400"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              )}

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400">
                <span>{formatINR(headroom)} headroom available</span>
                {alert && (
                  <span className="flex items-center gap-1 font-medium text-danger-600">
                    <AlertTriangle size={11} /> {alert}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({
  fund,
  properties,
  ticketAmount,
  mode,
  allocations,
  equityPct,
}: {
  fund: ReturnType<typeof useInvestments>["funds"][number];
  properties: ReturnType<typeof useInvestments>["properties"];
  ticketAmount: number;
  mode: "AUTO" | "CUSTOM";
  allocations: AllocationDraft;
  equityPct: number;
}) {
  const rows = properties.filter((p) => (allocations[p.id] ?? 0) > 0);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">LLP Firm</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">{fund.name}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Capital Contribution</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">{formatINR(ticketAmount)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Allocation Mode</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">{mode === "AUTO" ? "Auto-Balanced" : "Custom Split"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">Acquired LLP Equity</p>
          <p className="mt-0.5 text-sm font-semibold text-gold-600">{equityPct.toFixed(4)}%</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Schedule A &middot; Property Deployment</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
              <th className="px-4 py-2 font-medium text-right">% of Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 text-neutral-800">{p.title}</td>
                <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{formatINR(allocations[p.id] ?? 0)}</td>
                <td className="px-4 py-2.5 text-right text-neutral-500">
                  {ticketAmount > 0 ? (((allocations[p.id] ?? 0) / ticketAmount) * 100).toFixed(1) : "0.0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Confirming reserves this headroom for 15 minutes across the assets above while KYC and escrow settlement
        complete, per the Supplementary LLP Partnership Deed.
      </p>
    </div>
  );
}
