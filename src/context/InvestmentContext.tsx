import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FUNDS, INITIAL_INVESTMENTS, PROPERTIES } from "../data/mockData";
import { clearState, loadState, saveState } from "../lib/storage";
import type { AllocationDraft, LlpFund, PortfolioProperty, ReservedInvestment } from "../types";

const RESERVATION_MS = 15 * 60 * 1000;

interface InvestmentContextValue {
  funds: LlpFund[];
  properties: PortfolioProperty[];
  investments: ReservedInvestment[];
  now: number;
  getFund: (fundId: string) => LlpFund | undefined;
  getFundProperties: (fundId: string) => PortfolioProperty[];
  createReservation: (fundId: string, ticketAmount: number, allocations: AllocationDraft) => ReservedInvestment;
  cancelInvestment: (investmentId: string) => void;
  executeInvestment: (investmentId: string) => void;
  resetDemoData: () => void;
}

const InvestmentContext = createContext<InvestmentContextValue | null>(null);

// Funds/properties are reference data that ships with the app and can change
// between sessions (new firms, new images, corrected figures). Only their
// mutable amounts are user-generated, so that's all that gets persisted —
// baking the *whole* objects into localStorage would let a stale snapshot
// permanently shadow legitimate content updates for a returning visitor.
function hydrateFunds(): LlpFund[] {
  const raisedOverrides = loadState<Record<string, number>>("fundRaisedOverrides", {});
  return FUNDS.map((f) => (f.id in raisedOverrides ? { ...f, currentRaisedAmount: raisedOverrides[f.id] } : f));
}

function hydrateProperties(): PortfolioProperty[] {
  const investedOverrides = loadState<Record<string, number>>("propertyInvestedOverrides", {});
  return PROPERTIES.map((p) =>
    p.id in investedOverrides ? { ...p, currentInvestedAmount: investedOverrides[p.id] } : p,
  );
}

export function InvestmentProvider({ children }: { children: ReactNode }) {
  const [funds, setFunds] = useState<LlpFund[]>(hydrateFunds);
  const [properties, setProperties] = useState<PortfolioProperty[]>(hydrateProperties);
  const [investments, setInvestments] = useState<ReservedInvestment[]>(() =>
    loadState("investments", INITIAL_INVESTMENTS),
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // One-time cleanup of the legacy full-object storage keys from an earlier
  // version of this app that persisted entire fund/property records.
  useEffect(() => {
    clearState("funds");
    clearState("properties");
  }, []);

  // Persist to localStorage so an investor's reservations and holdings
  // survive a page refresh — this is a frontend-only prototype with no
  // backend, so this is the only durability layer available.
  useEffect(() => {
    saveState("fundRaisedOverrides", Object.fromEntries(funds.map((f) => [f.id, f.currentRaisedAmount])));
  }, [funds]);
  useEffect(() => {
    saveState(
      "propertyInvestedOverrides",
      Object.fromEntries(properties.map((p) => [p.id, p.currentInvestedAmount])),
    );
  }, [properties]);
  useEffect(() => saveState("investments", investments), [investments]);

  const releaseHold = useCallback((investment: ReservedInvestment) => {
    setProperties((prev) =>
      prev.map((p) => {
        const row = investment.allocations.find((a) => a.propertyId === p.id);
        return row
          ? { ...p, currentInvestedAmount: Math.max(0, p.currentInvestedAmount - row.allocatedAmount) }
          : p;
      }),
    );
    setFunds((prev) =>
      prev.map((f) =>
        f.id === investment.fundId
          ? { ...f, currentRaisedAmount: Math.max(0, f.currentRaisedAmount - investment.amountInvested) }
          : f,
      ),
    );
  }, []);

  // 15-minute reservation expiry worker: releases the hold and marks the
  // investment EXPIRED once its window has elapsed, mirroring the spec's
  // background job that sweeps stale RESERVED rows every interval.
  useEffect(() => {
    setInvestments((prev) => {
      const expired = prev.filter((inv) => inv.status === "RESERVED" && inv.reservationExpiresAt < now);
      if (expired.length === 0) return prev;
      for (const inv of expired) releaseHold(inv);
      return prev.map((inv) =>
        inv.status === "RESERVED" && inv.reservationExpiresAt < now ? { ...inv, status: "EXPIRED" } : inv,
      );
    });
  }, [now, releaseHold]);

  const getFund = useCallback((fundId: string) => funds.find((f) => f.id === fundId), [funds]);

  const getFundProperties = useCallback(
    (fundId: string) => properties.filter((p) => p.fundId === fundId),
    [properties],
  );

  const createReservation = useCallback(
    (fundId: string, ticketAmount: number, allocations: AllocationDraft): ReservedInvestment => {
      const fundProperties = properties.filter((p) => p.fundId === fundId);
      const allocationRows = fundProperties
        .map((p) => ({
          propertyId: p.id,
          allocatedAmount: allocations[p.id] ?? 0,
          percentageOfTicket: ticketAmount > 0 ? ((allocations[p.id] ?? 0) / ticketAmount) * 100 : 0,
        }))
        .filter((a) => a.allocatedAmount > 0);

      const fund = funds.find((f) => f.id === fundId)!;
      const newInvestment: ReservedInvestment = {
        id: `inv-${Date.now()}`,
        fundId,
        amountInvested: ticketAmount,
        partnershipPercentage: (ticketAmount / fund.totalValuation) * 100,
        allocations: allocationRows,
        reservationExpiresAt: Date.now() + RESERVATION_MS,
        createdAt: Date.now(),
        status: "RESERVED",
      };

      setProperties((prev) =>
        prev.map((p) => ({
          ...p,
          currentInvestedAmount: p.currentInvestedAmount + (allocations[p.id] ?? 0),
        })),
      );
      setFunds((prev) =>
        prev.map((f) => (f.id === fundId ? { ...f, currentRaisedAmount: f.currentRaisedAmount + ticketAmount } : f)),
      );
      setInvestments((prev) => [newInvestment, ...prev]);
      return newInvestment;
    },
    [funds, properties],
  );

  const cancelInvestment = useCallback(
    (investmentId: string) => {
      setInvestments((prev) => {
        const investment = prev.find((inv) => inv.id === investmentId);
        if (!investment || investment.status !== "RESERVED") return prev;
        releaseHold(investment);
        return prev.map((inv) => (inv.id === investmentId ? { ...inv, status: "CANCELLED" } : inv));
      });
    },
    [releaseHold],
  );

  const executeInvestment = useCallback((investmentId: string) => {
    setInvestments((prev) =>
      prev.map((inv) => (inv.id === investmentId && inv.status === "RESERVED" ? { ...inv, status: "EXECUTED" } : inv)),
    );
  }, []);

  const resetDemoData = useCallback(() => {
    setFunds(FUNDS);
    setProperties(PROPERTIES);
    setInvestments(INITIAL_INVESTMENTS);
    clearState("fundRaisedOverrides");
    clearState("propertyInvestedOverrides");
  }, []);

  const value = useMemo<InvestmentContextValue>(
    () => ({
      funds,
      properties,
      investments,
      now,
      getFund,
      getFundProperties,
      createReservation,
      cancelInvestment,
      executeInvestment,
      resetDemoData,
    }),
    [
      funds,
      properties,
      investments,
      now,
      getFund,
      getFundProperties,
      createReservation,
      cancelInvestment,
      executeInvestment,
      resetDemoData,
    ],
  );

  return <InvestmentContext.Provider value={value}>{children}</InvestmentContext.Provider>;
}

export function useInvestments(): InvestmentContextValue {
  const ctx = useContext(InvestmentContext);
  if (!ctx) throw new Error("useInvestments must be used within an InvestmentProvider");
  return ctx;
}
