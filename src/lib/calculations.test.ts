import { describe, expect, it } from "vitest";
import {
  computeDashboardMetrics,
  computeInvestmentPortfolioMetrics,
  estimatedLoanEndDate,
  expenseMonthlyImpact,
  expenseMatchesCategoryFilter,
  investmentCurrentValueCents,
  investmentGainLossCents,
  investmentNetContributedCents,
  investmentReturnPercent,
  loanIsCompleted,
  nextExpenseDueDate,
  ownerMatchesExpenseView,
  paidInstallments,
  remainingExpenseThisMonth,
} from "@/lib/calculations";
import {
  DEFAULT_CATEGORY_ICON,
  categoryIconFor,
  normalizeCategoryIcon,
  normalizeCategoryIconInput,
} from "@/lib/category-icons";
import { formatDate } from "@/lib/dates";
import type {
  AppData,
  Expense,
  Investment,
  InvestmentTracking,
  Loan,
  Recurrence,
} from "@/types/domain";

const baseDate = new Date("2026-05-18T12:00:00");

function makeExpense(
  recurrence: Recurrence,
  amountCents: number,
  firstDueDate: string,
  overrides: Partial<Expense> = {},
): Expense {
  return {
    id: `expense-${recurrence}`,
    name: recurrence,
    categoryId: "category-1",
    owner: "shared",
    amountCents,
    recurrence,
    firstDueDate,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const monthlyExpense = makeExpense("monthly", 100000, "2026-05-20");
const weeklyExpense = makeExpense("weekly", 5000, "2026-05-02", {
  owner: "mine",
});

const legacyMonthlyExpense: Expense = {
  id: "legacy-monthly",
  name: "Legacy",
  categoryId: "category-1",
  owner: "shared",
  amountCents: 100000,
  recurrence: "monthly",
  dueDayOfMonth: 20,
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const loan: Loan = {
  id: "loan-1",
  name: "Auto",
  owner: "shared",
  paymentCents: 20000,
  paymentDayOfMonth: 15,
  firstPaymentDate: "2026-01-15",
  totalInstallments: 12,
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const investment: Investment = {
  id: "investment-1",
  name: "ETF",
  owner: "mine",
  initialAmountCents: 100000,
  startDate: "2026-01-01",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const sharedInvestment: Investment = {
  id: "investment-2",
  name: "Comune",
  owner: "shared",
  initialAmountCents: 200000,
  startDate: "2026-02-01",
  active: true,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

const inactiveInvestment: Investment = {
  ...investment,
  id: "investment-inactive",
  name: "Vecchio",
  initialAmountCents: 500000,
  active: false,
};

const investmentTrackings: InvestmentTracking[] = [
  {
    id: "tracking-1",
    investmentId: investment.id,
    movementCents: 50000,
    currentValueCents: 160000,
    trackedAt: "2026-03-01",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "tracking-2",
    investmentId: investment.id,
    movementCents: -20000,
    currentValueCents: 150000,
    trackedAt: "2026-05-01",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "tracking-3",
    investmentId: sharedInvestment.id,
    movementCents: 100000,
    currentValueCents: 330000,
    trackedAt: "2026-04-01",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
];

const data: AppData = {
  settings: {
    id: "default",
    profileNames: { mine: "Io", partner: "Lei" },
    sharedRatio: { mine: 60, partner: 40 },
    currency: "EUR",
  },
  categories: [
    {
      id: "category-1",
      name: "Casa",
      color: "#2563eb",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  incomes: [
    {
      id: "income-1",
      name: "Stipendio",
      owner: "mine",
      monthlyAmountCents: 200000,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "income-2",
      name: "Comune",
      owner: "shared",
      monthlyAmountCents: 100000,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  expenses: [monthlyExpense, weeklyExpense],
  loans: [loan],
  investments: [investment, sharedInvestment],
  investmentTrackings,
  cashBalances: [
    {
      id: "cash-1",
      owner: "mine",
      balanceCents: 10000,
      asOfDate: "2026-05-01",
      updatedAt: "2026-05-01T00:00:00.000Z",
    },
    {
      id: "cash-2",
      owner: "shared",
      balanceCents: 50000,
      asOfDate: "2026-05-01",
      updatedAt: "2026-05-01T00:00:00.000Z",
    },
  ],
};

describe("recurring expense calculations", () => {
  it("uses the requested monthly impact for every cadence", () => {
    expect(expenseMonthlyImpact(makeExpense("weekly", 1000, "2026-01-01"))).toBe(4000);
    expect(expenseMonthlyImpact(makeExpense("monthly", 12000, "2026-01-01"))).toBe(12000);
    expect(expenseMonthlyImpact(makeExpense("bimonthly", 12000, "2026-01-01"))).toBe(6000);
    expect(expenseMonthlyImpact(makeExpense("quarterly", 12000, "2026-01-01"))).toBe(4000);
    expect(expenseMonthlyImpact(makeExpense("fourMonthly", 12000, "2026-01-01"))).toBe(3000);
    expect(expenseMonthlyImpact(makeExpense("semiannual", 12000, "2026-01-01"))).toBe(2000);
    expect(expenseMonthlyImpact(makeExpense("annual", 12000, "2026-01-01"))).toBe(1000);
  });

  it("calculates next due date from firstDueDate", () => {
    const quarterly = makeExpense("quarterly", 10000, "2026-01-31");
    expect(nextExpenseDueDate(quarterly, baseDate).toISOString().slice(0, 10)).toBe(
      "2026-07-31",
    );
  });

  it("sums weekly occurrences still due in the current month", () => {
    expect(remainingExpenseThisMonth(weeklyExpense, baseDate)).toBe(10000);
  });

  it("keeps non-weekly expenses residual only when their due date is still in month", () => {
    expect(remainingExpenseThisMonth(monthlyExpense, baseDate)).toBe(100000);
    expect(
      remainingExpenseThisMonth(monthlyExpense, new Date("2026-05-21T12:00:00")),
    ).toBe(0);
  });

  it("keeps compatibility with legacy monthly documents", () => {
    expect(remainingExpenseThisMonth(legacyMonthlyExpense, baseDate)).toBe(100000);
    expect(
      nextExpenseDueDate(legacyMonthlyExpense, baseDate).toISOString().slice(0, 10),
    ).toBe("2026-05-20");
  });
});

describe("loan calculations", () => {
  it("calculates paid installments and estimated end date", () => {
    expect(paidInstallments(loan, baseDate)).toBe(5);
    expect(estimatedLoanEndDate(loan)).toBe("2026-12-15");
  });

  it("detects completed loans", () => {
    const completedLoan = {
      ...loan,
      firstPaymentDate: "2025-01-15",
      totalInstallments: 3,
    };

    expect(loanIsCompleted(completedLoan, baseDate)).toBe(true);
    expect(loanIsCompleted(loan, baseDate)).toBe(false);
  });
});

describe("dashboard metrics", () => {
  it("applies shared ratio in personal views", () => {
    const metrics = computeDashboardMetrics(data, "mine", baseDate);

    expect(metrics.incomeCents).toBe(260000);
    expect(metrics.expenseCents).toBe(80000);
    expect(metrics.loanCents).toBe(12000);
    expect(metrics.availableCents).toBe(168000);
  });

  it("uses full totals in common view", () => {
    const metrics = computeDashboardMetrics(data, "common", baseDate);

    expect(metrics.incomeCents).toBe(300000);
    expect(metrics.recurringCents).toBe(140000);
  });

  it("calculates the shared account top-up from shared outflows", () => {
    expect(computeDashboardMetrics(data, "mine", baseDate).sharedAccountTopUpCents).toBe(72000);
    expect(computeDashboardMetrics(data, "common", baseDate).sharedAccountTopUpCents).toBe(120000);
  });

  it("keeps original upcoming payment amounts next to split amounts", () => {
    const payment = computeDashboardMetrics(data, "mine", baseDate).upcomingPayments.find(
      (item) => item.id === monthlyExpense.id,
    );

    expect(payment?.amountCents).toBe(60000);
    expect(payment?.originalAmountCents).toBe(100000);
  });

  it("excludes completed active loans from dashboard metrics", () => {
    const completedLoan = {
      ...loan,
      id: "completed-loan",
      firstPaymentDate: "2025-01-15",
      totalInstallments: 3,
      paymentCents: 50000,
    };
    const metrics = computeDashboardMetrics(
      { ...data, loans: [loan, completedLoan] },
      "common",
      baseDate,
    );

    expect(metrics.loanCents).toBe(20000);
    expect(metrics.loanProgress.map((item) => item.id)).not.toContain("completed-loan");
    expect(metrics.upcomingPayments.map((item) => item.id)).not.toContain("completed-loan");
  });
});

describe("investment calculations", () => {
  it("uses the latest tracking as current value", () => {
    expect(investmentCurrentValueCents(investment, investmentTrackings)).toBe(150000);
    expect(investmentCurrentValueCents(sharedInvestment, [])).toBe(200000);
  });

  it("calculates net contribution with deposits and withdrawals", () => {
    expect(investmentNetContributedCents(investment, investmentTrackings)).toBe(130000);
    expect(investmentGainLossCents(investment, investmentTrackings)).toBe(20000);
    expect(investmentReturnPercent(investment, investmentTrackings)).toBeCloseTo(15.3846);
  });

  it("excludes inactive investments from portfolio metrics", () => {
    const metrics = computeInvestmentPortfolioMetrics(
      {
        ...data,
        investments: [investment, inactiveInvestment],
        investmentTrackings,
      },
      "common",
    );

    expect(metrics.investmentValueCents).toBe(150000);
    expect(metrics.positions.map((position) => position.id)).not.toContain(inactiveInvestment.id);
  });

  it("applies owner split to investments and cash balances", () => {
    const mineMetrics = computeInvestmentPortfolioMetrics(data, "mine");

    expect(mineMetrics.investmentValueCents).toBe(348000);
    expect(mineMetrics.cashCents).toBe(40000);
    expect(mineMetrics.totalValueCents).toBe(388000);
  });

  it("uses full portfolio totals in common view", () => {
    const commonMetrics = computeInvestmentPortfolioMetrics(data, "common");

    expect(commonMetrics.investmentValueCents).toBe(480000);
    expect(commonMetrics.cashCents).toBe(60000);
    expect(commonMetrics.gainLossCents).toBe(50000);
  });

  it("calculates current-year performance without counting movements as gain", () => {
    const commonMetrics = computeInvestmentPortfolioMetrics(data, "common", baseDate);

    expect(commonMetrics.performanceTotalsCurrentYear).toEqual([
      { name: "ETF", value: 20000, color: "#34d399" },
      { name: "Comune", value: 30000, color: "#34d399" },
    ]);
  });

  it("builds a trend series for each investment", () => {
    const commonMetrics = computeInvestmentPortfolioMetrics(data, "common", baseDate);

    expect(commonMetrics.trend.map((series) => series.name)).toEqual(["ETF", "Comune"]);
    expect(commonMetrics.trend[0].data.map((point) => point.date)).toEqual([
      "2026-01-01",
      "2026-03-01",
      "2026-05-01",
    ]);
  });
});

describe("category icons", () => {
  it("uses a stable fallback for old or invalid category documents", () => {
    expect(normalizeCategoryIcon(undefined)).toBe(DEFAULT_CATEGORY_ICON);
    expect(normalizeCategoryIcon("unknown-icon")).toBe(DEFAULT_CATEGORY_ICON);
    expect(categoryIconFor("house").label).toBe("Casa");
  });

  it("normalizes manual Font Awesome names while keeping legacy keys renderable", () => {
    expect(normalizeCategoryIconInput("faHeartPulse")).toBe("heart-pulse");
    expect(normalizeCategoryIcon("fa-house")).toBe("house");
    expect(normalizeCategoryIcon("faUserGroup")).toBe("user-group");
    expect(categoryIconFor("heartPulse").icon.iconName).toBe("heart-pulse");
    expect(categoryIconFor("faUserGroup").icon.iconName).toBe("user-group");
  });
});

describe("date formatting", () => {
  it("formats date-only values in dd.mm.yyyy", () => {
    expect(formatDate("2026-05-20")).toBe("20.05.2026");
    expect(formatDate(new Date("2026-05-20T12:00:00"))).toBe("20.05.2026");
  });
});

describe("expense view filters", () => {
  it("shows shared expenses in personal views and only shared ones in common view", () => {
    expect(ownerMatchesExpenseView("mine", "mine")).toBe(true);
    expect(ownerMatchesExpenseView("shared", "mine")).toBe(true);
    expect(ownerMatchesExpenseView("partner", "mine")).toBe(false);
    expect(ownerMatchesExpenseView("partner", "partner")).toBe(true);
    expect(ownerMatchesExpenseView("shared", "common")).toBe(true);
    expect(ownerMatchesExpenseView("mine", "common")).toBe(false);
  });

  it("filters expenses by category when requested", () => {
    expect(expenseMatchesCategoryFilter(monthlyExpense)).toBe(true);
    expect(expenseMatchesCategoryFilter(monthlyExpense, "category-1")).toBe(true);
    expect(expenseMatchesCategoryFilter(monthlyExpense, "other-category")).toBe(false);
  });
});
