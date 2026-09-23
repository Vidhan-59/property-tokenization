export type AssetType = "Commercial" | "Industrial" | "Retail";

export interface LlpFund {
  id: string;
  name: string;
  totalValuation: number;
  trancheEquityPercent: number;
  currentRaisedAmount: number;
  minTicket: number;
  maxTicket: number;
  imageUrl: string;
}

export interface PortfolioProperty {
  id: string;
  fundId: string;
  title: string;
  location: string;
  assetType: AssetType;
  currentValuation: number;
  currentInvestedAmount: number;
  rentalYieldPercent: number;
  imageUrl: string;
}

export type AllocationMode = "AUTO" | "CUSTOM";

/** propertyId -> rupee amount allocated in the in-progress ticket */
export type AllocationDraft = Record<string, number>;

export interface ValidationError {
  code:
    | "TICKET_MIN"
    | "TICKET_MAX"
    | "WEIGHT_SUM"
    | "ASSET_CAP_OVERFLOW"
    | "FUND_CAP_OVERFLOW";
  propertyId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export type InvestmentStatus = "RESERVED" | "EXECUTED" | "CANCELLED" | "EXPIRED";

export interface AllocationRow {
  propertyId: string;
  allocatedAmount: number;
  percentageOfTicket: number;
}

export interface ReservedInvestment {
  id: string;
  fundId: string;
  amountInvested: number;
  partnershipPercentage: number;
  allocations: AllocationRow[];
  reservationExpiresAt: number;
  createdAt: number;
  status: InvestmentStatus;
}
