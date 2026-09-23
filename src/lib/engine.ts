import type {
  AllocationDraft,
  LlpFund,
  PortfolioProperty,
  ReservedInvestment,
  ValidationError,
  ValidationResult,
} from "../types";

/** Rupee-level tolerance for float/rounding comparisons across the engine. */
const EPSILON = 1;

export function targetRaise(fund: LlpFund): number {
  return fund.totalValuation * (fund.trancheEquityPercent / 100);
}

export function fundHeadroom(fund: LlpFund): number {
  return Math.max(0, targetRaise(fund) - fund.currentRaisedAmount);
}

export function fundRaisedPercent(fund: LlpFund): number {
  const cap = targetRaise(fund);
  return cap > 0 ? Math.min(100, (fund.currentRaisedAmount / cap) * 100) : 0;
}

export type FundStatus = "NEWLY_LAUNCHED" | "OPEN" | "CLOSING_SOON" | "FULLY_SUBSCRIBED";

export function fundStatus(fund: LlpFund): FundStatus {
  const pct = fundRaisedPercent(fund);
  if (pct >= 100) return "FULLY_SUBSCRIBED";
  if (pct >= 85) return "CLOSING_SOON";
  if (pct <= 8) return "NEWLY_LAUNCHED";
  return "OPEN";
}

export const FUND_STATUS_LABEL: Record<FundStatus, string> = {
  NEWLY_LAUNCHED: "Newly Launched",
  OPEN: "Open for Investment",
  CLOSING_SOON: "Closing Soon",
  FULLY_SUBSCRIBED: "Fully Subscribed",
};

export function maxInvestableLimit(property: PortfolioProperty): number {
  return property.currentValuation * 0.1;
}

export function propertyHeadroom(property: PortfolioProperty): number {
  return Math.max(0, maxInvestableLimit(property) - property.currentInvestedAmount);
}

export function isCapped(property: PortfolioProperty): boolean {
  return propertyHeadroom(property) <= 0;
}

export function partnershipSharePercent(fund: LlpFund, ticketAmount: number): number {
  return (ticketAmount / fund.totalValuation) * 100;
}

/**
 * Mode A — Auto-Balanced Pro-Rata.
 * Spreads `ticketAmount` across open properties weighted by remaining headroom,
 * then reconciles rounding with a largest-remainder pass so the allocations sum
 * to exactly `ticketAmount` (never over any single property's headroom).
 */
export function autoBalanceAllocations(
  properties: PortfolioProperty[],
  ticketAmount: number,
): AllocationDraft {
  const open = properties.filter((p) => !isCapped(p));
  const totalHeadroom = open.reduce((sum, p) => sum + propertyHeadroom(p), 0);

  const draft: AllocationDraft = {};
  for (const p of properties) draft[p.id] = 0;
  if (totalHeadroom <= 0 || ticketAmount <= 0) return draft;

  const investable = Math.min(ticketAmount, totalHeadroom);

  const raw = open.map((p) => {
    const weight = propertyHeadroom(p) / totalHeadroom;
    const exact = investable * weight;
    return { id: p.id, floor: Math.floor(exact), remainder: exact - Math.floor(exact), headroom: propertyHeadroom(p) };
  });

  let allocated = raw.reduce((sum, r) => sum + r.floor, 0);
  let remaining = Math.round(investable - allocated);

  const byRemainder = [...raw].sort((a, b) => b.remainder - a.remainder);
  for (const r of byRemainder) {
    if (remaining <= 0) break;
    const room = r.headroom - r.floor;
    if (room <= 0) continue;
    const bump = Math.min(1, remaining, room);
    r.floor += bump;
    remaining -= bump;
  }

  for (const r of raw) draft[r.id] = Math.min(r.floor, r.headroom);
  return draft;
}

/**
 * Mode B — Custom Portfolio Builder.
 * Converts investor-set weights (0-100, need not be pre-validated) into rupee
 * amounts, clamping each to that property's remaining headroom.
 */
export function amountsFromWeights(
  properties: PortfolioProperty[],
  ticketAmount: number,
  weights: Record<string, number>,
): AllocationDraft {
  const draft: AllocationDraft = {};
  for (const p of properties) {
    const w = weights[p.id] ?? 0;
    const exact = ticketAmount * (w / 100);
    draft[p.id] = Math.min(Math.round(exact), propertyHeadroom(p));
  }
  return draft;
}

export function sumAllocations(draft: AllocationDraft): number {
  return Object.values(draft).reduce((sum, v) => sum + (v || 0), 0);
}

/**
 * The four-test Transaction Invariant Engine from the spec (§2.4):
 * ticket bounds, weight conservation, per-asset capacity, fund-level headroom.
 */
export function validateInvestment(
  fund: LlpFund,
  properties: PortfolioProperty[],
  ticketAmount: number,
  allocations: AllocationDraft,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (ticketAmount < fund.minTicket) {
    errors.push({
      code: "TICKET_MIN",
      message: `Investment ticket must be at least ${formatINR(fund.minTicket)}.`,
    });
  }
  if (ticketAmount > fund.maxTicket) {
    errors.push({
      code: "TICKET_MAX",
      message: `Investment ticket cannot exceed ${formatINR(fund.maxTicket)} per order.`,
    });
  }

  const allocatedTotal = sumAllocations(allocations);
  if (Math.abs(allocatedTotal - ticketAmount) > EPSILON) {
    errors.push({
      code: "WEIGHT_SUM",
      message: `Allocated amount (${formatINR(allocatedTotal)}) must equal the total investment (${formatINR(
        ticketAmount,
      )}).`,
    });
  }

  for (const property of properties) {
    const allocated = allocations[property.id] ?? 0;
    const headroom = propertyHeadroom(property);
    if (allocated - headroom > EPSILON) {
      errors.push({
        code: "ASSET_CAP_OVERFLOW",
        propertyId: property.id,
        message: `Allocation of ${formatINR(allocated)} exceeds available headroom of ${formatINR(
          headroom,
        )} for ${property.title}.`,
      });
    }
  }

  const headroomFund = fundHeadroom(fund);
  if (ticketAmount - headroomFund > EPSILON) {
    errors.push({
      code: "FUND_CAP_OVERFLOW",
      message: `Investment exceeds the fund's remaining tranche headroom of ${formatINR(headroomFund)}.`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Net operating margin assumed on gross rental yield after LLP-level opex,
 * maintenance reserves and management fees, used only to project distributions.
 */
const NET_DISTRIBUTABLE_FACTOR = 0.88;

/** R_net(P_i) — the property's net distributable rental income for one month. */
export function monthlyNetRental(property: PortfolioProperty): number {
  return (property.currentValuation * (property.rentalYieldPercent / 100) * NET_DISTRIBUTABLE_FACTOR) / 12;
}

/**
 * §7 Rental Yield Distribution Engine.
 * D_u = sum_i( R_net(P_i) * a_{u,i} / R_i ) — a partner's monthly dividend is
 * their share of each property's net rental income, weighted by their rupee
 * contribution into that specific property relative to everyone's (R_i).
 */
export function projectedMonthlyDistribution(
  properties: PortfolioProperty[],
  investments: ReservedInvestment[],
): number {
  const userAllocationByProperty = new Map<string, number>();
  for (const inv of investments) {
    if (inv.status !== "EXECUTED") continue;
    for (const row of inv.allocations) {
      userAllocationByProperty.set(
        row.propertyId,
        (userAllocationByProperty.get(row.propertyId) ?? 0) + row.allocatedAmount,
      );
    }
  }

  let total = 0;
  for (const property of properties) {
    const a_ui = userAllocationByProperty.get(property.id);
    if (!a_ui || property.currentInvestedAmount <= 0) continue;
    total += monthlyNetRental(property) * (a_ui / property.currentInvestedAmount);
  }
  return total;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}
