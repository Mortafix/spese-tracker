import { describe, expect, it } from "vitest";
import {
  computeDashboardMetrics,
  computeInvestmentPortfolioMetrics,
  computeOneTimePaymentMetrics,
  estimatedLoanEndDate,
  expenseMonthlyImpact,
  expenseMonthlyTotalCents,
  expenseMatchesCategoryFilter,
  filterOneTimePaymentsByPeriod,
  investmentCurrentValueCents,
  investmentGainLossCents,
  investmentNetContributedCents,
  investmentReturnPercent,
  loanIsCompleted,
  nextExpenseDueDate,
  oneTimePaymentAvailableYears,
  ownerMatchesExpenseView,
  ownerMatchesInvestmentView,
  paidInstallments,
  parseOneTimePaymentPeriod,
  parseOneTimePaymentYear,
  remainingExpenseThisMonth,
  remainingExpenseUntil,
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
  oneTimePayments: [
    {
      id: "one-time-1",
      direction: "income",
      type: "single",
      categoryId: "category-1",
      name: "Tredicesima",
      date: "2026-12-15",
      amountCents: 180000,
      isCash: false,
      createdAt: "2026-12-15T00:00:00.000Z",
      updatedAt: "2026-12-15T00:00:00.000Z",
    },
    {
      id: "one-time-2",
      direction: "expense",
      type: "deposit",
      categoryId: "category-1",
      name: "Acconto",
      date: "2026-05-10",
      amountCents: 50000,
      isCash: true,
      createdAt: "2026-05-10T00:00:00.000Z",
      updatedAt: "2026-05-10T00:00:00.000Z",
    },
    {
      id: "one-time-3",
      direction: "expense",
      type: "balance",
      categoryId: "category-1",
      name: "Saldo",
      date: "2026-06-02",
      amountCents: 75000,
      isCash: false,
      createdAt: "2026-06-02T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    },
    {
      id: "one-time-4",
      direction: "income",
      type: "single",
      categoryId: "category-1",
      name: "Rimborso",
      date: "2025-05-20",
      amountCents: 20000,
      isCash: true,
      createdAt: "2025-05-20T00:00:00.000Z",
      updatedAt: "2025-05-20T00:00:00.000Z",
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

  it("sums recurring expenses until a custom period end", () => {
    const periodEnd = new Date("2026-06-10T12:00:00");

    expect(remainingExpenseUntil(monthlyExpense, periodEnd, baseDate)).toBe(100000);
    expect(remainingExpenseUntil(weeklyExpense, periodEnd, baseDate)).toBe(15000);
  });

  it("keeps compatibility with legacy monthly documents", () => {
    expect(remainingExpenseThisMonth(legacyMonthlyExpense, baseDate)).toBe(100000);
    expect(
      nextExpenseDueDate(legacyMonthlyExpense, baseDate).toISOString().slice(0, 10),
    ).toBe("2026-05-20");
  });

  it("sums active monthly totals for the current view and category", () => {
    const inactiveExpense = makeExpense("monthly", 90000, "2026-05-20", {
      id: "inactive-expense",
      active: false,
    });
    const partnerExpense = makeExpense("monthly", 70000, "2026-05-20", {
      id: "partner-expense",
      owner: "partner",
      categoryId: "category-2",
    });
    const expenses = [monthlyExpense, weeklyExpense, inactiveExpense, partnerExpense];

    expect(expenseMonthlyTotalCents(expenses, "mine", data.settings)).toBe(20000);
    expect(expenseMonthlyTotalCents(expenses, "common", data.settings)).toBe(100000);
    expect(expenseMonthlyTotalCents(expenses, "partner", data.settings, "category-2")).toBe(
      70000,
    );
    expect(expenseMonthlyTotalCents(expenses, "mine", data.settings, "category-2")).toBe(0);
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
  it("uses only personal totals in personal views", () => {
    const metrics = computeDashboardMetrics(data, "mine", baseDate);

    expect(metrics.incomeCents).toBe(200000);
    expect(metrics.expenseCents).toBe(20000);
    expect(metrics.loanCents).toBe(0);
    expect(metrics.availableCents).toBe(180000);
    expect(metrics.upcomingPayments.map((item) => item.id)).not.toContain(monthlyExpense.id);
  });

  it("uses only shared totals in common view", () => {
    const metrics = computeDashboardMetrics(data, "common", baseDate);

    expect(metrics.incomeCents).toBe(100000);
    expect(metrics.recurringCents).toBe(120000);
    expect(metrics.upcomingPayments.map((item) => item.id)).not.toContain(weeklyExpense.id);
  });

  it("can compute all-owner totals for personal dashboard comparisons", () => {
    const metrics = computeDashboardMetrics(data, "common", baseDate, {
      commonScope: "allOwners",
    });

    expect(metrics.incomeCents).toBe(300000);
    expect(metrics.recurringCents).toBe(140000);
  });

  it("calculates remaining payments through the 10th of next month", () => {
    const earlyLoan = {
      ...loan,
      id: "early-loan",
      paymentDayOfMonth: 5,
    };
    const metrics = computeDashboardMetrics(
      { ...data, loans: [earlyLoan] },
      "common",
      baseDate,
    );

    expect(metrics.remainingThisMonthCents).toBe(120000);
  });

  it("calculates the shared account top-up from shared outflows", () => {
    expect(computeDashboardMetrics(data, "mine", baseDate).sharedAccountTopUpCents).toBe(72000);
    expect(computeDashboardMetrics(data, "common", baseDate).sharedAccountTopUpCents).toBe(120000);
  });

  it("breaks down owner chart by personal and common shares", () => {
    const partnerExpense = makeExpense("monthly", 70000, "2026-05-20", {
      id: "partner-expense",
      owner: "partner",
    });
    const dataWithPartnerExpense = {
      ...data,
      expenses: [...data.expenses, partnerExpense],
    };

    const mineMetrics = computeDashboardMetrics(dataWithPartnerExpense, "mine", baseDate);
    const partnerMetrics = computeDashboardMetrics(dataWithPartnerExpense, "partner", baseDate);
    const commonMetrics = computeDashboardMetrics(dataWithPartnerExpense, "common", baseDate);

    expect(mineMetrics.expenseCents).toBe(20000);
    expect(mineMetrics.ownerTotals).toEqual([
      { name: "Quota comune", value: 72000, color: "#2dd4bf" },
      { name: "Io", value: 20000, color: "#38bdf8" },
    ]);
    expect(partnerMetrics.expenseCents).toBe(70000);
    expect(partnerMetrics.ownerTotals).toEqual([
      { name: "Quota comune", value: 48000, color: "#2dd4bf" },
      { name: "Lei", value: 70000, color: "#f472b6" },
    ]);
    expect(commonMetrics.recurringCents).toBe(120000);
    expect(commonMetrics.ownerTotals).toEqual([
      { name: "Comune", value: 120000, color: "#2dd4bf" },
      { name: "Io", value: 20000, color: "#38bdf8" },
      { name: "Lei", value: 70000, color: "#f472b6" },
    ]);
  });

  it("keeps original upcoming payment amounts for visible personal expenses", () => {
    const payment = computeDashboardMetrics(data, "mine", baseDate).upcomingPayments.find(
      (item) => item.id === weeklyExpense.id,
    );

    expect(payment?.amountCents).toBe(5000);
    expect(payment?.originalAmountCents).toBe(5000);
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
      "mine",
    );

    expect(metrics.investmentValueCents).toBe(150000);
    expect(metrics.positions.map((position) => position.id)).not.toContain(inactiveInvestment.id);
  });

  it("uses full values only for the selected personal owner", () => {
    const mineMetrics = computeInvestmentPortfolioMetrics(data, "mine");

    expect(mineMetrics.investmentValueCents).toBe(150000);
    expect(mineMetrics.cashCents).toBe(10000);
    expect(mineMetrics.totalValueCents).toBe(160000);
    expect(mineMetrics.positions.map((position) => position.name)).toEqual(["ETF"]);
  });

  it("uses only shared investments and cash in common view", () => {
    const commonMetrics = computeInvestmentPortfolioMetrics(data, "common");

    expect(commonMetrics.investmentValueCents).toBe(330000);
    expect(commonMetrics.cashCents).toBe(50000);
    expect(commonMetrics.totalValueCents).toBe(380000);
    expect(commonMetrics.gainLossCents).toBe(30000);
    expect(commonMetrics.positions.map((position) => position.name)).toEqual(["Comune"]);
  });

  it("excludes shared investments and cash from partner views", () => {
    const partnerMetrics = computeInvestmentPortfolioMetrics(data, "partner");

    expect(partnerMetrics.investmentValueCents).toBe(0);
    expect(partnerMetrics.cashCents).toBe(0);
    expect(partnerMetrics.positions).toEqual([]);
  });

  it("calculates current-year performance without counting movements as gain", () => {
    const commonMetrics = computeInvestmentPortfolioMetrics(data, "common", baseDate);

    expect(commonMetrics.performanceTotalsCurrentYear).toEqual([
      { name: "Comune", value: 30000, color: "#34d399" },
    ]);
  });

  it("builds trend series only for investments in the current view", () => {
    const commonMetrics = computeInvestmentPortfolioMetrics(data, "common", baseDate);
    const mineMetrics = computeInvestmentPortfolioMetrics(data, "mine", baseDate);

    expect(commonMetrics.trend.map((series) => series.name)).toEqual(["Comune"]);
    expect(mineMetrics.trend.map((series) => series.name)).toEqual(["ETF"]);
    expect(mineMetrics.trend[0].data.map((point) => point.date)).toEqual([
      "2026-01-01",
      "2026-03-01",
      "2026-05-01",
    ]);
  });

  it("matches investment owners strictly by view", () => {
    expect(ownerMatchesInvestmentView("shared", "common")).toBe(true);
    expect(ownerMatchesInvestmentView("mine", "common")).toBe(false);
    expect(ownerMatchesInvestmentView("mine", "mine")).toBe(true);
    expect(ownerMatchesInvestmentView("shared", "mine")).toBe(false);
    expect(ownerMatchesInvestmentView("partner", "partner")).toBe(true);
  });
});

describe("one-time payment calculations", () => {
  it("parses available years and falls back to the newest year", () => {
    expect(oneTimePaymentAvailableYears(data.oneTimePayments, baseDate)).toEqual([
      2026,
      2025,
      2024,
      2023,
      2022,
    ]);
    expect(parseOneTimePaymentYear("2025", data.oneTimePayments, baseDate)).toBe(2025);
    expect(parseOneTimePaymentYear("2030", data.oneTimePayments, baseDate)).toBe(2026);
    expect(parseOneTimePaymentPeriod("all")).toBe("all");
    expect(parseOneTimePaymentPeriod("q2")).toBe("q2");
    expect(parseOneTimePaymentPeriod("q4")).toBe("q4");
    expect(parseOneTimePaymentPeriod("last3Years")).toBe("last3Years");
    expect(parseOneTimePaymentPeriod("allYears")).toBe("allYears");
    expect(parseOneTimePaymentPeriod("unknown")).toBe("all");
  });

  it("filters payments by year, quarter and multi-year periods", () => {
    expect(
      filterOneTimePaymentsByPeriod(data.oneTimePayments, 2026, "q2").map((payment) => payment.id),
    ).toEqual(["one-time-3", "one-time-2"]);
    expect(
      filterOneTimePaymentsByPeriod(data.oneTimePayments, 2026, "q4").map((payment) => payment.id),
    ).toEqual(["one-time-1"]);
    expect(
      filterOneTimePaymentsByPeriod(data.oneTimePayments, 2025, "last3Years").map(
        (payment) => payment.id,
      ),
    ).toEqual(["one-time-4"]);
    expect(
      filterOneTimePaymentsByPeriod(data.oneTimePayments, 2026, "allYears").map(
        (payment) => payment.id,
      ),
    ).toEqual(["one-time-1", "one-time-3", "one-time-2", "one-time-4"]);
  });

  it("aggregates income, expenses, cash and monthly trend independently", () => {
    const metrics = computeOneTimePaymentMetrics(data, 2026, "q2");

    expect(metrics.incomeCents).toBe(0);
    expect(metrics.expenseCents).toBe(125000);
    expect(metrics.netCents).toBe(-125000);
    expect(metrics.cashCents).toBe(50000);
    expect(metrics.count).toBe(2);
    expect(metrics.categoryTotals).toEqual([{ name: "Casa", value: 125000, color: "#2563eb" }]);
    expect(metrics.trendGranularity).toBe("month");
    expect(metrics.monthlyTrend.find((item) => item.month === "05")?.expenseCents).toBe(50000);
    expect(metrics.monthlyTrend.find((item) => item.month === "12")?.incomeCents).toBe(180000);
  });

  it("aggregates trend by year for multi-year periods", () => {
    const lastThreeYears = computeOneTimePaymentMetrics(data, 2026, "last3Years");
    const allYears = computeOneTimePaymentMetrics(data, 2026, "allYears");

    expect(lastThreeYears.trendGranularity).toBe("year");
    expect(lastThreeYears.monthlyTrend.map((item) => item.month)).toEqual([
      "2024",
      "2025",
      "2026",
    ]);
    expect(lastThreeYears.monthlyTrend.find((item) => item.month === "2026")?.expenseCents).toBe(
      125000,
    );
    expect(allYears.trendGranularity).toBe("year");
    expect(allYears.monthlyTrend.map((item) => item.month)).toEqual(["2025", "2026"]);
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
  it("keeps personal and common expense views separate", () => {
    expect(ownerMatchesExpenseView("mine", "mine")).toBe(true);
    expect(ownerMatchesExpenseView("shared", "mine")).toBe(false);
    expect(ownerMatchesExpenseView("partner", "mine")).toBe(false);
    expect(ownerMatchesExpenseView("partner", "partner")).toBe(true);
    expect(ownerMatchesExpenseView("shared", "partner")).toBe(false);
    expect(ownerMatchesExpenseView("shared", "common")).toBe(true);
    expect(ownerMatchesExpenseView("mine", "common")).toBe(false);
  });

  it("filters expenses by category when requested", () => {
    expect(expenseMatchesCategoryFilter(monthlyExpense)).toBe(true);
    expect(expenseMatchesCategoryFilter(monthlyExpense, "category-1")).toBe(true);
    expect(expenseMatchesCategoryFilter(monthlyExpense, "other-category")).toBe(false);
  });
});
