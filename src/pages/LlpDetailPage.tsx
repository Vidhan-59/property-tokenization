import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useInvestments } from "../context/InvestmentContext";
import { HeroBanner } from "../components/HeroBanner";
import { PropertyCard } from "../components/PropertyCard";
import { fundHeadroom, fundStatus } from "../lib/engine";

export function LlpDetailPage() {
  const { fundId } = useParams<{ fundId: string }>();
  const { getFund, getFundProperties } = useInvestments();

  const fund = fundId ? getFund(fundId) : undefined;
  if (!fund) return <Navigate to="/llps" replace />;

  const properties = getFundProperties(fund.id);
  const closed = fundStatus(fund) === "FULLY_SUBSCRIBED" || fundHeadroom(fund) <= 0;

  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 pt-5">
        <Link to="/llps" className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800">
          <ArrowLeft size={13} /> Back to all LLP firms
        </Link>
      </div>

      <HeroBanner fund={fund} pendingTotal={0} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Asset Cap &amp; Headroom Audit</h2>
            <p className="text-sm text-neutral-500">
              Every asset held by this LLP is individually capped at 10% of its own valuation.
            </p>
          </div>

          {closed ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-500">
              <Lock size={14} /> Tranche closed to new subscriptions
            </span>
          ) : (
            <Link
              to={`/llps/${fund.id}/invest`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-neutral-800 transition-colors"
            >
              Start Investing in this LLP <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} pendingAmount={0} />
          ))}
        </div>
      </section>
    </div>
  );
}
