import type {
  AppData,
  AppSettings,
  CashBalance,
  ChartDatum,
  DashboardMetrics,
  Expense,
  Investment,
  InvestmentPortfolioMetrics,
  InvestmentPosition,
  InvestmentTracking,
  InvestmentTrendPoint,
  InvestmentTrendSeries,
  Loan,
  Owner,
  Recurrence,
  UpcomingPayment,
  ViewMode,
} from "@/types/domain";

const OWNER_COLORS: Record<Owner, string> = {
  mine: "#38bdf8",
  partner: "#f472b6",
  shared: "#2dd4bf",
};

const APP_TIME_ZONE = "Europe/Rome";
const DAY_MS = 24 * 60 * 60 * 1000;

export const recurrenceOptions: Array<{ value: Recurrence; label: string }> = [
  { value: "weekly", label: "Settimanale" },
  { value: "monthly", label: "Mensile" },
  { value: "bimonthly", label: "Bimestrale" },
  { value: "quarterly", label: "Trimestrale" },
  { value: "fourMonthly", label: "Quadrimestrale" },
  { value: "semiannual", label: "Semestrale" },
  { value: "annual", label: "Annuale" },
];

const recurrenceMonthIntervals: Partial<Record<Recurrence, number>> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  fourMonthly: 4,
  semiannual: 6,
  annual: 12,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function dateInAppTimeZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    12,
    0,
    0,
    0,
  );
}

export function parseViewMode(value?: string | string[]): ViewMode {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "mine" || raw === "partner" || raw === "common") {
    return raw;
  }

  return "common";
}

export function recurrenceLabel(recurrence: Recurrence) {
  return recurrenceOptions.find((option) => option.value === recurrence)?.label || "Mensile";
}

export function recurrencePeriodLabel(recurrence: Recurrence) {
  if (recurrence === "weekly") return "settimana";
  if (recurrence === "monthly") return "mese";
  if (recurrence === "bimonthly") return "bimestre";
  if (recurrence === "quarterly") return "trimestre";
  if (recurrence === "fourMonthly") return "4 mesi";
  if (recurrence === "semiannual") return "semestre";
  return "anno";
}

export function ownerLabel(owner: Owner, settings: AppSettings) {
  if (owner === "mine") return settings.profileNames.mine;
  if (owner === "partner") return settings.profileNames.partner;
  return "Comune";
}

export function ownerMatchesExpenseView(owner: Owner, view: ViewMode) {
  if (view === "mine") {
    return owner === "mine" || owner === "shared";
  }

  if (view === "partner") {
    return owner === "partner" || owner === "shared";
  }

  return owner === "shared";
}

export function expenseMatchesCategoryFilter(expense: Expense, categoryId?: string | string[]) {
  const raw = Array.isArray(categoryId) ? categoryId[0] : categoryId;

  if (!raw) {
    return true;
  }

  return expense.categoryId === raw;
}

export function splitFactor(owner: Owner, view: ViewMode, settings: AppSettings) {
  if (view === "common") {
    return 1;
  }

  if (view === "mine") {
    if (owner === "mine") return 1;
    if (owner === "shared") return settings.sharedRatio.mine / 100;
    return 0;
  }

  if (owner === "partner") return 1;
  if (owner === "shared") return settings.sharedRatio.partner / 100;
  return 0;
}

export function applySplit(cents: number, owner: Owner, view: ViewMode, settings: AppSettings) {
  return Math.round(cents * splitFactor(owner, view, settings));
}

export function expenseMonthlyImpact(expense: Expense) {
  if (expense.recurrence === "weekly") {
    return expense.amountCents * 4;
  }

  const interval = recurrenceMonthIntervals[expense.recurrence] || 1;
  return Math.round(expense.amountCents / interval);
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = makeDate(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function makeDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function addMonthsClamped(anchor: Date, months: number) {
  const targetYear = anchor.getFullYear();
  const targetMonth = anchor.getMonth() + months;
  const target = makeDate(targetYear, targetMonth, 1);
  target.setDate(
    clamp(
      anchor.getDate(),
      1,
      daysInMonth(target.getFullYear(), target.getMonth()),
    ),
  );
  return target;
}

function monthlyDueDate(day: number, today: Date) {
  const currentDay = clamp(
    day,
    1,
    daysInMonth(today.getFullYear(), today.getMonth()),
  );
  let dueDate = makeDate(today.getFullYear(), today.getMonth(), currentDay);

  if (dueDate < today) {
    const nextMonth = today.getMonth() + 1;
    dueDate = makeDate(
      today.getFullYear(),
      nextMonth,
      clamp(day, 1, daysInMonth(today.getFullYear(), nextMonth)),
    );
  }

  return dueDate;
}

function jsWeekdayToIso(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function weeklyDueDate(weekday: number, today: Date) {
  const normalized = clamp(weekday, 1, 7);
  const delta = (normalized - jsWeekdayToIso(today) + 7) % 7;
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + delta);
  dueDate.setHours(12, 0, 0, 0);
  return dueDate;
}

function legacyDueDate(expense: Expense, today: Date) {
  if (expense.recurrence === "weekly") {
    return weeklyDueDate(expense.weekday || 1, today);
  }

  return monthlyDueDate(expense.dueDayOfMonth || 1, today);
}

export function nextExpenseDueDate(expense: Expense, today = new Date()) {
  const zonedToday = dateInAppTimeZone(today);
  const firstDueDate = parseDateOnly(expense.firstDueDate);

  if (!firstDueDate) {
    return legacyDueDate(expense, zonedToday);
  }

  if (zonedToday <= firstDueDate) {
    return firstDueDate;
  }

  if (expense.recurrence === "weekly") {
    const elapsedDays = Math.floor((zonedToday.getTime() - firstDueDate.getTime()) / DAY_MS);
    const weeks = Math.ceil(elapsedDays / 7);
    const dueDate = new Date(firstDueDate);
    dueDate.setDate(firstDueDate.getDate() + weeks * 7);
    dueDate.setHours(12, 0, 0, 0);
    return dueDate;
  }

  const interval = recurrenceMonthIntervals[expense.recurrence] || 1;
  const elapsedMonths =
    (zonedToday.getFullYear() - firstDueDate.getFullYear()) * 12 +
    (zonedToday.getMonth() - firstDueDate.getMonth());
  let intervalCount = Math.max(0, Math.floor(elapsedMonths / interval));
  let dueDate = addMonthsClamped(firstDueDate, intervalCount * interval);

  while (dueDate < zonedToday) {
    intervalCount += 1;
    dueDate = addMonthsClamped(firstDueDate, intervalCount * interval);
  }

  return dueDate;
}

export function daysUntil(date: Date, today = new Date()) {
  const zonedToday = dateInAppTimeZone(today);
  return Math.max(0, Math.round((date.getTime() - zonedToday.getTime()) / DAY_MS));
}

export function remainingExpenseThisMonth(expense: Expense, today = new Date()) {
  const zonedToday = dateInAppTimeZone(today);

  if (!expense.active) {
    return 0;
  }

  const nextDueDate = nextExpenseDueDate(expense, zonedToday);
  const monthEnd = makeDate(
    zonedToday.getFullYear(),
    zonedToday.getMonth(),
    daysInMonth(zonedToday.getFullYear(), zonedToday.getMonth()),
  );

  if (nextDueDate > monthEnd) {
    return 0;
  }

  if (expense.recurrence !== "weekly") {
    return expense.amountCents;
  }

  let total = 0;
  const dueDate = new Date(nextDueDate);

  while (dueDate <= monthEnd) {
    total += expense.amountCents;
    dueDate.setDate(dueDate.getDate() + 7);
  }

  return total;
}

export function paidInstallments(loan: Loan, today = new Date()) {
  const zonedToday = dateInAppTimeZone(today);

  if (!loan.active) {
    return 0;
  }

  const first = new Date(`${loan.firstPaymentDate}T12:00:00`);

  if (Number.isNaN(first.getTime()) || zonedToday < first) {
    return 0;
  }

  const monthDelta =
    (zonedToday.getFullYear() - first.getFullYear()) * 12 +
    (zonedToday.getMonth() - first.getMonth());
  const currentMonthDueReached = zonedToday.getDate() >= loan.paymentDayOfMonth;
  const count = monthDelta + (currentMonthDueReached ? 1 : 0);

  return clamp(count, 0, loan.totalInstallments);
}

export function loanIsCompleted(loan: Loan, today = new Date()) {
  return paidInstallments(loan, today) >= loan.totalInstallments;
}

export function estimatedLoanEndDate(loan: Loan) {
  const first = new Date(`${loan.firstPaymentDate}T12:00:00`);
  const end = new Date(first);
  end.setMonth(first.getMonth() + loan.totalInstallments - 1);
  end.setDate(
    clamp(
      loan.paymentDayOfMonth,
      1,
      daysInMonth(end.getFullYear(), end.getMonth()),
    ),
  );
  return toDateOnly(end);
}

function buildUpcomingExpense(expense: Expense, data: AppData, today: Date) {
  const category = data.categories.find((item) => item.id === expense.categoryId);
  const dueDate = nextExpenseDueDate(expense, today);

  return {
    id: expense.id,
    type: "expense" as const,
    name: expense.name,
    owner: expense.owner,
    dueDate: toDateOnly(dueDate),
    daysUntil: daysUntil(dueDate, today),
    amountCents: expense.amountCents,
    originalAmountCents: expense.amountCents,
    categoryName: category?.name || "Senza categoria",
    categoryColor: category?.color || "#64748b",
    categoryIcon: category?.icon,
    color: category?.color || "#64748b",
  };
}

function buildUpcomingLoan(loan: Loan, today: Date) {
  const dueDate = monthlyDueDate(loan.paymentDayOfMonth, today);

  return {
    id: loan.id,
    type: "loan" as const,
    name: loan.name,
    owner: loan.owner,
    dueDate: toDateOnly(dueDate),
    daysUntil: daysUntil(dueDate, today),
    amountCents: loan.paymentCents,
    originalAmountCents: loan.paymentCents,
    categoryName: "Mutui",
    categoryColor: "#f59e0b",
    categoryIcon: "landmark",
    color: "#f59e0b",
  };
}

function pushChartValue(map: Map<string, ChartDatum>, key: string, value: number, color: string) {
  if (value <= 0) {
    return;
  }

  const current = map.get(key);

  if (current) {
    current.value += value;
    return;
  }

  map.set(key, { name: key, value, color });
}

function ownerChartName(owner: Owner, view: ViewMode, settings: AppSettings) {
  if (view === "common") {
    return ownerLabel(owner, settings);
  }

  if (owner === "shared") {
    return "Quota comune";
  }

  return view === "mine" ? settings.profileNames.mine : settings.profileNames.partner;
}

export function sharedMonthlyOutflowCents(data: AppData, today = new Date()) {
  const sharedExpenses = data.expenses
    .filter((expense) => expense.active && expense.owner === "shared")
    .reduce((sum, expense) => sum + expenseMonthlyImpact(expense), 0);
  const sharedLoans = data.loans
    .filter((loan) => loan.active && loan.owner === "shared" && !loanIsCompleted(loan, today))
    .reduce((sum, loan) => sum + loan.paymentCents, 0);

  return sharedExpenses + sharedLoans;
}

export function computeDashboardMetrics(
  data: AppData,
  view: ViewMode,
  today = new Date(),
): DashboardMetrics {
  const zonedToday = dateInAppTimeZone(today);
  const activeIncomes = data.incomes.filter((income) => income.active);
  const activeExpenses = data.expenses.filter((expense) => expense.active);
  const activeLoans = data.loans.filter((loan) => loan.active && !loanIsCompleted(loan, zonedToday));
  const categoryMap = new Map<string, ChartDatum>();
  const ownerMap = new Map<string, ChartDatum>();

  const incomeCents = activeIncomes.reduce(
    (sum, income) =>
      sum + applySplit(income.monthlyAmountCents, income.owner, view, data.settings),
    0,
  );

  const expenseCents = activeExpenses.reduce((sum, expense) => {
    const category = data.categories.find((item) => item.id === expense.categoryId);
    const monthlyImpact = expenseMonthlyImpact(expense);
    const splitAmount = applySplit(
      monthlyImpact,
      expense.owner,
      view,
      data.settings,
    );

    pushChartValue(
      categoryMap,
      category?.name || "Senza categoria",
      splitAmount,
      category?.color || "#64748b",
    );
    pushChartValue(
      ownerMap,
      ownerChartName(expense.owner, view, data.settings),
      splitAmount,
      expense.owner === "shared" ? OWNER_COLORS.shared : OWNER_COLORS[expense.owner],
    );

    return sum + splitAmount;
  }, 0);

  const loanCents = activeLoans.reduce((sum, loan) => {
    const splitAmount = applySplit(
      loan.paymentCents,
      loan.owner,
      view,
      data.settings,
    );

    pushChartValue(categoryMap, "Mutui e finanziamenti", splitAmount, "#f59e0b");
    pushChartValue(
      ownerMap,
      ownerChartName(loan.owner, view, data.settings),
      splitAmount,
      loan.owner === "shared" ? OWNER_COLORS.shared : OWNER_COLORS[loan.owner],
    );

    return sum + splitAmount;
  }, 0);

  const recurringCents = expenseCents + loanCents;
  const remainingExpenses = activeExpenses.reduce(
    (sum, expense) =>
      sum +
      applySplit(
        remainingExpenseThisMonth(expense, zonedToday),
        expense.owner,
        view,
        data.settings,
      ),
    0,
  );
  const remainingLoans = activeLoans.reduce((sum, loan) => {
    const dueThisMonth = zonedToday.getDate() <= loan.paymentDayOfMonth;
    return (
      sum +
      (dueThisMonth
        ? applySplit(loan.paymentCents, loan.owner, view, data.settings)
        : 0)
    );
  }, 0);
  const sharedAccountTotal = sharedMonthlyOutflowCents(data, zonedToday);
  const sharedAccountTopUpCents =
    view === "common"
      ? sharedAccountTotal
      : Math.round(sharedAccountTotal * splitFactor("shared", view, data.settings));

  const upcomingPayments: UpcomingPayment[] = [
    ...activeExpenses.map((expense) => buildUpcomingExpense(expense, data, zonedToday)),
    ...activeLoans.map((loan) => buildUpcomingLoan(loan, zonedToday)),
  ]
    .map((payment) => ({
      ...payment,
      amountCents: applySplit(payment.amountCents, payment.owner, view, data.settings),
    }))
    .filter((payment) => payment.amountCents > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  return {
    incomeCents,
    expenseCents,
    loanCents,
    recurringCents,
    availableCents: incomeCents - recurringCents,
    remainingThisMonthCents: remainingExpenses + remainingLoans,
    sharedAccountTopUpCents,
    categoryTotals: [...categoryMap.values()],
    ownerTotals: [...ownerMap.values()],
    upcomingPayments,
    loanProgress: activeLoans
      .filter((loan) => applySplit(loan.paymentCents, loan.owner, view, data.settings) > 0)
      .map((loan) => {
        const paid = paidInstallments(loan, zonedToday);
        return {
          id: loan.id,
          name: loan.name,
          paidInstallments: paid,
          totalInstallments: loan.totalInstallments,
          progressPercent: Math.round((paid / loan.totalInstallments) * 100),
          remainingInstallments: loan.totalInstallments - paid,
          estimatedEndDate: estimatedLoanEndDate(loan),
          monthlyAmountCents: applySplit(
            loan.paymentCents,
            loan.owner,
            view,
            data.settings,
          ),
        };
    }),
  };
}

const INVESTMENT_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#f472b6",
  "#2dd4bf",
];

function compareInvestmentTracking(a: InvestmentTracking, b: InvestmentTracking) {
  const trackedAtCompare = a.trackedAt.localeCompare(b.trackedAt);

  if (trackedAtCompare !== 0) {
    return trackedAtCompare;
  }

  return a.createdAt.localeCompare(b.createdAt);
}

function investmentColor(index: number) {
  return INVESTMENT_COLORS[index % INVESTMENT_COLORS.length];
}

export function sortInvestmentTrackings(trackings: InvestmentTracking[]) {
  return [...trackings].sort(compareInvestmentTracking);
}

export function investmentTrackingsFor(
  investment: Investment,
  trackings: InvestmentTracking[],
) {
  return sortInvestmentTrackings(
    trackings.filter((tracking) => tracking.investmentId === investment.id),
  );
}

export function investmentCurrentValueCents(
  investment: Investment,
  trackings: InvestmentTracking[],
) {
  const sortedTrackings = investmentTrackingsFor(investment, trackings);
  return sortedTrackings.at(-1)?.currentValueCents ?? investment.initialAmountCents;
}

export function investmentNetContributedCents(
  investment: Investment,
  trackings: InvestmentTracking[],
) {
  const relatedTrackings = trackings.filter(
    (tracking) => tracking.investmentId === investment.id,
  );

  return (
    investment.initialAmountCents +
    relatedTrackings.reduce((sum, tracking) => sum + tracking.movementCents, 0)
  );
}

export function investmentGainLossCents(
  investment: Investment,
  trackings: InvestmentTracking[],
) {
  return (
    investmentCurrentValueCents(investment, trackings) -
    investmentNetContributedCents(investment, trackings)
  );
}

export function investmentReturnPercent(
  investment: Investment,
  trackings: InvestmentTracking[],
) {
  const netContributed = investmentNetContributedCents(investment, trackings);

  if (netContributed <= 0) {
    return null;
  }

  return (investmentGainLossCents(investment, trackings) / netContributed) * 100;
}

export function ownerMatchesInvestmentView(owner: Owner, view: ViewMode) {
  if (view === "common") {
    return true;
  }

  if (view === "mine") {
    return owner === "mine" || owner === "shared";
  }

  return owner === "partner" || owner === "shared";
}

function emptyCashBalance(owner: Owner): CashBalance {
  return {
    id: `empty-cash-${owner}`,
    owner,
    balanceCents: 0,
    asOfDate: toDateOnly(dateInAppTimeZone()),
    updatedAt: new Date().toISOString(),
  };
}

export function cashBalanceForOwner(data: AppData, owner: Owner) {
  return data.cashBalances.find((cashBalance) => cashBalance.owner === owner) || emptyCashBalance(owner);
}

function buildInvestmentPosition(
  investment: Investment,
  trackings: InvestmentTracking[],
  view: ViewMode,
  settings: AppSettings,
): InvestmentPosition {
  const sortedTrackings = sortInvestmentTrackings(trackings);
  const factor = splitFactor(investment.owner, view, settings);
  const originalCurrentValue = investmentCurrentValueCents(investment, sortedTrackings);
  const originalNetContributed = investmentNetContributedCents(investment, sortedTrackings);
  const originalGainLoss = originalCurrentValue - originalNetContributed;
  const currentValue = Math.round(originalCurrentValue * factor);
  const netContributed = Math.round(originalNetContributed * factor);
  const gainLoss = currentValue - netContributed;

  return {
    id: investment.id,
    name: investment.name,
    owner: investment.owner,
    active: investment.active,
    startDate: investment.startDate,
    lastTrackedAt: sortedTrackings.at(-1)?.trackedAt,
    trackingCount: sortedTrackings.length,
    currentValueCents: currentValue,
    netContributedCents: netContributed,
    gainLossCents: gainLoss,
    returnPercent: netContributed > 0 ? (gainLoss / netContributed) * 100 : null,
    originalCurrentValueCents: originalCurrentValue,
    originalNetContributedCents: originalNetContributed,
    originalGainLossCents: originalGainLoss,
  };
}

function pushInvestmentValuePoint(points: Map<string, number>, date: string, valueCents: number) {
  points.set(date, valueCents);
}

function investmentValuePoints(
  investment: Investment,
  trackings: InvestmentTracking[],
  view: ViewMode,
  settings: AppSettings,
) {
  const factor = splitFactor(investment.owner, view, settings);
  const points = new Map<string, number>();

  pushInvestmentValuePoint(
    points,
    investment.startDate,
    Math.round(investment.initialAmountCents * factor),
  );

  investmentTrackingsFor(investment, trackings).forEach((tracking) => {
    pushInvestmentValuePoint(
      points,
      tracking.trackedAt,
      Math.round(tracking.currentValueCents * factor),
    );
  });

  return [...points.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function latestInvestmentValueAtOrBefore(
  points: InvestmentTrendPoint[],
  date: string,
) {
  return points.filter((point) => point.date <= date).at(-1)?.value ?? 0;
}

function latestInvestmentValueBefore(points: InvestmentTrendPoint[], date: string) {
  return points.filter((point) => point.date < date).at(-1)?.value ?? 0;
}

function buildInvestmentTrendSeries(
  investments: Investment[],
  trackings: InvestmentTracking[],
  view: ViewMode,
  settings: AppSettings,
  options: { startDate?: string; endDate?: string } = {},
) {
  return investments
    .map((investment, index) => {
      const allPoints = investmentValuePoints(investment, trackings, view, settings);
      let points = allPoints;

      if (options.startDate || options.endDate) {
        const startDate = options.startDate;
        const endDate = options.endDate;
        const periodPoints = new Map<string, number>();

        if (startDate && investment.startDate < startDate) {
          pushInvestmentValuePoint(
            periodPoints,
            startDate,
            latestInvestmentValueAtOrBefore(allPoints, startDate),
          );
        }

        allPoints
          .filter((point) => (!startDate || point.date >= startDate) && (!endDate || point.date <= endDate))
          .forEach((point) => pushInvestmentValuePoint(periodPoints, point.date, point.value));

        if (endDate && periodPoints.size > 0) {
          pushInvestmentValuePoint(
            periodPoints,
            endDate,
            latestInvestmentValueAtOrBefore(allPoints, endDate),
          );
        }

        points = [...periodPoints.entries()]
          .map(([date, value]) => ({ date, value }))
          .filter((point) => point.value > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
      }

      return {
        id: investment.id,
        name: investment.name,
        color: investmentColor(index),
        data: points,
      };
    })
    .filter((series) => series.data.length > 0) satisfies InvestmentTrendSeries[];
}

function investmentPeriodGainLossCents(
  investment: Investment,
  trackings: InvestmentTracking[],
  view: ViewMode,
  settings: AppSettings,
  startDate: string,
  endDate: string,
) {
  if (investment.startDate > endDate) {
    return 0;
  }

  const factor = splitFactor(investment.owner, view, settings);
  const points = investmentValuePoints(investment, trackings, view, settings);
  const startValue =
    investment.startDate >= startDate
      ? Math.round(investment.initialAmountCents * factor)
      : latestInvestmentValueBefore(points, startDate);
  const endValue = latestInvestmentValueAtOrBefore(points, endDate);
  const movementCents = investmentTrackingsFor(investment, trackings)
    .filter((tracking) => tracking.trackedAt >= startDate && tracking.trackedAt <= endDate)
    .reduce(
      (sum, tracking) => sum + Math.round(tracking.movementCents * factor),
      0,
    );

  return endValue - startValue - movementCents;
}

export function computeInvestmentPortfolioMetrics(
  data: AppData,
  view: ViewMode,
  today = new Date(),
): InvestmentPortfolioMetrics {
  const zonedToday = dateInAppTimeZone(today);
  const todayDate = toDateOnly(zonedToday);
  const currentYearStart = `${zonedToday.getFullYear()}-01-01`;
  const visibleInvestments = data.investments.filter((investment) =>
    ownerMatchesInvestmentView(investment.owner, view),
  );
  const activeInvestments = visibleInvestments.filter((investment) => investment.active);
  const positions = activeInvestments.map((investment) =>
    buildInvestmentPosition(
      investment,
      investmentTrackingsFor(investment, data.investmentTrackings),
      view,
      data.settings,
    ),
  );
  const cashCents = data.cashBalances.reduce((sum, cashBalance) => {
    if (!ownerMatchesInvestmentView(cashBalance.owner, view)) {
      return sum;
    }

    return (
      sum +
      applySplit(cashBalance.balanceCents, cashBalance.owner, view, data.settings)
    );
  }, 0);
  const investmentValueCents = positions.reduce(
    (sum, position) => sum + position.currentValueCents,
    0,
  );
  const netContributedCents = positions.reduce(
    (sum, position) => sum + position.netContributedCents,
    0,
  );
  const gainLossCents = investmentValueCents - netContributedCents;
  const allocationTotals: ChartDatum[] = [
    ...positions
      .filter((position) => position.currentValueCents > 0)
      .map((position, index) => ({
        name: position.name,
        value: position.currentValueCents,
        color: investmentColor(index),
      })),
    ...(cashCents > 0
      ? [{ name: "Contanti", value: cashCents, color: "#facc15" }]
      : []),
  ];
  const performanceTotals: ChartDatum[] = positions.map((position) => ({
    name: position.name,
    value: position.gainLossCents,
    color: position.gainLossCents >= 0 ? "#34d399" : "#fb7185",
  }));
  const performanceTotalsCurrentYear: ChartDatum[] = activeInvestments.map((investment) => {
    const value = investmentPeriodGainLossCents(
      investment,
      data.investmentTrackings,
      view,
      data.settings,
      currentYearStart,
      todayDate,
    );

    return {
      name: investment.name,
      value,
      color: value >= 0 ? "#34d399" : "#fb7185",
    };
  });

  return {
    investmentValueCents,
    cashCents,
    totalValueCents: investmentValueCents + cashCents,
    netContributedCents,
    gainLossCents,
    returnPercent:
      netContributedCents > 0 ? (gainLossCents / netContributedCents) * 100 : null,
    positions,
    allocationTotals,
    performanceTotals,
    performanceTotalsCurrentYear,
    trend: buildInvestmentTrendSeries(
      activeInvestments,
      data.investmentTrackings,
      view,
      data.settings,
    ),
    trendCurrentYear: buildInvestmentTrendSeries(
      activeInvestments,
      data.investmentTrackings,
      view,
      data.settings,
      { startDate: currentYearStart, endDate: todayDate },
    ),
  };
}
