export type Owner = "mine" | "partner" | "shared";

export type ViewMode = "mine" | "partner" | "common";

export type Recurrence =
  | "weekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "fourMonthly"
  | "semiannual"
  | "annual";

export type AppSettings = {
  id: "default";
  profileNames: {
    mine: string;
    partner: string;
  };
  sharedRatio: {
    mine: number;
    partner: number;
  };
  currency: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
};

export type Income = {
  id: string;
  name: string;
  description?: string;
  owner: Owner;
  monthlyAmountCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  owner: Owner;
  amountCents: number;
  recurrence: Recurrence;
  firstDueDate?: string;
  /** Legacy fields kept for old documents created before firstDueDate. */
  dueDayOfMonth?: number;
  weekday?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Loan = {
  id: string;
  name: string;
  description?: string;
  owner: Owner;
  paymentCents: number;
  paymentDayOfMonth: number;
  firstPaymentDate: string;
  totalInstallments: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Investment = {
  id: string;
  name: string;
  owner: Owner;
  initialAmountCents: number;
  startDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InvestmentTracking = {
  id: string;
  investmentId: string;
  movementCents: number;
  currentValueCents: number;
  trackedAt: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type CashBalance = {
  id: string;
  owner: Owner;
  balanceCents: number;
  asOfDate: string;
  updatedAt: string;
};

export type OneTimePaymentDirection = "expense" | "income";

export type OneTimePaymentType = "deposit" | "installment" | "balance" | "single";

export type OneTimePayment = {
  id: string;
  direction: OneTimePaymentDirection;
  type: OneTimePaymentType;
  categoryId: string;
  name: string;
  date: string;
  amountCents: number;
  isCash: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  settings: AppSettings;
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  investments: Investment[];
  investmentTrackings: InvestmentTracking[];
  cashBalances: CashBalance[];
  oneTimePayments: OneTimePayment[];
};

export type UpcomingPayment = {
  id: string;
  type: "expense" | "loan";
  name: string;
  owner: Owner;
  dueDate: string;
  daysUntil: number;
  amountCents: number;
  originalAmountCents: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon?: string;
  color: string;
};

export type ChartDatum = {
  name: string;
  value: number;
  color: string;
};

export type LoanProgress = {
  id: string;
  name: string;
  paidInstallments: number;
  totalInstallments: number;
  progressPercent: number;
  remainingInstallments: number;
  estimatedEndDate: string;
  monthlyAmountCents: number;
};

export type DashboardMetrics = {
  incomeCents: number;
  expenseCents: number;
  loanCents: number;
  recurringCents: number;
  availableCents: number;
  remainingThisMonthCents: number;
  sharedAccountTopUpCents: number;
  categoryTotals: ChartDatum[];
  ownerTotals: ChartDatum[];
  upcomingPayments: UpcomingPayment[];
  loanProgress: LoanProgress[];
};

export type InvestmentPosition = {
  id: string;
  name: string;
  owner: Owner;
  active: boolean;
  startDate: string;
  lastTrackedAt?: string;
  trackingCount: number;
  currentValueCents: number;
  netContributedCents: number;
  gainLossCents: number;
  returnPercent: number | null;
  originalCurrentValueCents: number;
  originalNetContributedCents: number;
  originalGainLossCents: number;
};

export type InvestmentTrendPoint = {
  date: string;
  value: number;
};

export type InvestmentTrendSeries = {
  id: string;
  name: string;
  color: string;
  data: InvestmentTrendPoint[];
};

export type InvestmentPortfolioMetrics = {
  investmentValueCents: number;
  cashCents: number;
  totalValueCents: number;
  netContributedCents: number;
  gainLossCents: number;
  returnPercent: number | null;
  positions: InvestmentPosition[];
  allocationTotals: ChartDatum[];
  performanceTotals: ChartDatum[];
  performanceTotalsCurrentYear: ChartDatum[];
  trend: InvestmentTrendSeries[];
  trendCurrentYear: InvestmentTrendSeries[];
};

export type OneTimePaymentMonthlyDatum = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
};

export type OneTimePaymentMetrics = {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  cashCents: number;
  count: number;
  categoryTotals: ChartDatum[];
  directionTotals: ChartDatum[];
  trendGranularity: "month" | "year";
  monthlyTrend: OneTimePaymentMonthlyDatum[];
};
