import { useState } from "react";
import { CheckCircle2, Clock, FileSignature, TimerOff, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { PortfolioProperty, ReservedInvestment } from "../types";
import { formatINR, monthlyNetRental } from "../lib/engine";

interface InvestmentCardProps {
  investment: ReservedInvestment;
  fundName: string;
  properties: PortfolioProperty[];
  now: number;
  onCancel: () => void;
  onExecute: () => void;
}

const STATUS_META: Record<ReservedInvestment["status"], { label: string; className: string }> = {
  RESERVED: { label: "Reserved", className: "bg-gold-50 text-gold-700 border-gold-300" },
  EXECUTED: { label: "Active Holding", className: "bg-neutral-900 text-gold-400 border-neutral-900" },
  CANCELLED: { label: "Cancelled", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
  EXPIRED: { label: "Expired", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

export function InvestmentCard({ investment, fundName, properties, now, onCancel, onExecute }: InvestmentCardProps) {
  const [showKycNote, setShowKycNote] = useState(false);
  const titleFor = (id: string) => properties.find((p) => p.id === id)?.title ?? id;
  const meta = STATUS_META[investment.status];

  const remainingMs = investment.reservationExpiresAt - now;
  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  const monthlyDistribution =
    investment.status === "EXECUTED"
      ? investment.allocations.reduce((sum, row) => {
          const property = properties.find((p) => p.id === row.propertyId);
          if (!property || property.currentInvestedAmount <= 0) return sum;
          return sum + monthlyNetRental(property) * (row.allocatedAmount / property.currentInvestedAmount);
        }, 0)
      : 0;

  return (
    <div
      className={`rounded-2xl border p-6 ${
        investment.status === "RESERVED" ? "border-gold-300/60 bg-gradient-to-br from-gold-50/60 to-white" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              investment.status === "EXECUTED"
                ? "bg-neutral-900 text-gold-400"
                : investment.status === "RESERVED"
                  ? "bg-neutral-900 text-gold-400"
                  : "bg-neutral-200 text-neutral-500"
            }`}
          >
            {investment.status === "CANCELLED" || investment.status === "EXPIRED" ? (
              <TimerOff size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </span>
          <div>
            <p className="text-xs text-neutral-500">{fundName}</p>
            <h3 className="font-semibold text-neutral-900">{formatINR(investment.amountInvested)} Contribution</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
            {meta.label}
          </span>
          {investment.status === "RESERVED" && (
            <span className="flex items-center gap-1.5 rounded-full border border-gold-300 bg-white px-3 py-1 text-xs font-semibold text-gold-700">
              <Clock size={12} />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-neutral-400">Partnership Ratio</p>
          <p className="mt-0.5 font-semibold text-gold-600">{investment.partnershipPercentage.toFixed(4)}%</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-neutral-400">Assets Held</p>
          <p className="mt-0.5 font-semibold text-neutral-900">{investment.allocations.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 col-span-2 sm:col-span-1">
          <p className="text-neutral-400">Est. Monthly Distribution</p>
          <p className="mt-0.5 font-semibold text-neutral-900">
            {investment.status === "EXECUTED" ? formatINR(monthlyDistribution) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
          <p className="text-neutral-400">Booked</p>
          <p className="mt-0.5 font-semibold text-neutral-900">
            {new Date(investment.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Schedule A &middot; Property</th>
              <th className="px-4 py-2 font-medium text-right">Allocated</th>
              <th className="px-4 py-2 font-medium text-right">% of Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {investment.allocations.map((a) => (
              <tr key={a.propertyId}>
                <td className="px-4 py-2.5 text-neutral-800">{titleFor(a.propertyId)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-neutral-900">{formatINR(a.allocatedAmount)}</td>
                <td className="px-4 py-2.5 text-right text-neutral-500">{a.percentageOfTicket.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {investment.status === "RESERVED" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <XCircle size={15} /> Cancel &amp; Release Hold
          </button>
          <button
            onClick={() => {
              setShowKycNote(true);
              onExecute();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-gold-400 hover:bg-neutral-800"
          >
            <FileSignature size={15} /> Complete KYC &amp; Settle
          </button>
        </div>
      )}

      {showKycNote && investment.status === "EXECUTED" && (
        <p className="mt-3 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
          Aadhaar OTP / PAN verification and escrow settlement simulated instantly for this demo. Your
          Supplementary Partnership Deed and Statement of Capital Contribution are now reflected in{" "}
          <Link to="/portfolio" className="font-medium text-gold-700 underline underline-offset-2">
            My Portfolio
          </Link>
          .
        </p>
      )}
    </div>
  );
}
