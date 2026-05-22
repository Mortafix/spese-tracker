"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { normalizeCategoryIcon } from "@/lib/category-icons";
import { parseCurrencyToCents, parseSignedCurrencyToCents } from "@/lib/money";
import {
  createCategory,
  createExpense,
  createIncome,
  createInvestment,
  createInvestmentTracking,
  createLoan,
  createOneTimePayment,
  deleteCategory,
  deleteExpense,
  deleteIncome,
  deleteInvestment,
  deleteInvestmentTracking,
  deleteLoan,
  deleteOneTimePayment,
  updateCategory,
  updateExpense,
  updateIncome,
  updateInvestment,
  updateInvestmentTracking,
  updateLoan,
  updateOneTimePayment,
  updateSettings,
  upsertCashBalance,
} from "@/lib/repository";
import type { Recurrence } from "@/types/domain";

const ownerSchema = z.enum(["mine", "partner", "shared"]);
const recurrenceSchema = z.enum([
  "weekly",
  "monthly",
  "bimonthly",
  "quarterly",
  "fourMonthly",
  "semiannual",
  "annual",
]);
const oneTimePaymentDirectionSchema = z.enum(["expense", "income"]);
const oneTimePaymentTypeSchema = z.enum(["deposit", "installment", "balance", "single"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : undefined;
}

function checkbox(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function numberValue(formData: FormData, key: string) {
  return Number(formData.get(key));
}

function moneyValue(formData: FormData, key: string) {
  return parseCurrencyToCents(formData.get(key));
}

function signedMoneyValue(formData: FormData, key: string) {
  return parseSignedCurrencyToCents(formData.get(key));
}

function revalidateApp() {
  revalidatePath("/", "layout");
}

function parseId(formData: FormData) {
  const id = text(formData, "id");

  if (!id) {
    throw new Error("Missing id.");
  }

  return id;
}

const settingsSchema = z.object({
  mineName: z.string().min(1),
  partnerName: z.string().min(1),
  mineRatio: z.number().min(0).max(100),
  currency: z.string().min(3).max(3),
});

export async function updateSettingsAction(formData: FormData) {
  await requireSession();
  const parsed = settingsSchema.parse({
    mineName: text(formData, "mineName"),
    partnerName: text(formData, "partnerName"),
    mineRatio: numberValue(formData, "mineRatio"),
    currency: text(formData, "currency").toUpperCase(),
  });

  await updateSettings({
    id: "default",
    profileNames: {
      mine: parsed.mineName,
      partner: parsed.partnerName,
    },
    sharedRatio: {
      mine: parsed.mineRatio,
      partner: 100 - parsed.mineRatio,
    },
    currency: parsed.currency,
  });
  revalidateApp();
}

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().optional().transform((value) => normalizeCategoryIcon(value)),
});

export async function createCategoryAction(formData: FormData) {
  await requireSession();
  const parsed = categorySchema.parse({
    name: text(formData, "name"),
    color: text(formData, "color"),
    icon: text(formData, "icon"),
  });

  await createCategory(parsed);
  revalidateApp();
}

export async function updateCategoryAction(formData: FormData) {
  await requireSession();
  const id = parseId(formData);
  const parsed = categorySchema.parse({
    name: text(formData, "name"),
    color: text(formData, "color"),
    icon: text(formData, "icon"),
  });

  await updateCategory(id, parsed);
  revalidateApp();
}

export async function deleteCategoryAction(formData: FormData) {
  await requireSession();
  await deleteCategory(parseId(formData));
  revalidateApp();
}

const incomeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner: ownerSchema,
  monthlyAmountCents: z.number().int().min(0),
  active: z.boolean(),
});

function parseIncome(formData: FormData) {
  return incomeSchema.parse({
    name: text(formData, "name"),
    description: optionalText(formData, "description"),
    owner: ownerSchema.parse(formData.get("owner")),
    monthlyAmountCents: moneyValue(formData, "monthlyAmount"),
    active: checkbox(formData, "active"),
  });
}

export async function createIncomeAction(formData: FormData) {
  await requireSession();
  await createIncome(parseIncome(formData));
  revalidateApp();
}

export async function updateIncomeAction(formData: FormData) {
  await requireSession();
  await updateIncome(parseId(formData), parseIncome(formData));
  revalidateApp();
}

export async function deleteIncomeAction(formData: FormData) {
  await requireSession();
  await deleteIncome(parseId(formData));
  revalidateApp();
}

const expenseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  owner: ownerSchema,
  amountCents: z.number().int().min(0),
  recurrence: recurrenceSchema,
  firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDayOfMonth: z.number().int().min(1).max(31).optional(),
  weekday: z.number().int().min(1).max(7).optional(),
  active: z.boolean(),
});

function parseExpense(formData: FormData) {
  const recurrence = recurrenceSchema.parse(formData.get("recurrence")) as Recurrence;

  return expenseSchema.parse({
    name: text(formData, "name"),
    description: optionalText(formData, "description"),
    categoryId: text(formData, "categoryId"),
    owner: ownerSchema.parse(formData.get("owner")),
    amountCents: moneyValue(formData, "amount"),
    recurrence,
    firstDueDate: text(formData, "firstDueDate"),
    active: checkbox(formData, "active"),
  });
}

export async function createExpenseAction(formData: FormData) {
  await requireSession();
  await createExpense(parseExpense(formData));
  revalidateApp();
}

export async function updateExpenseAction(formData: FormData) {
  await requireSession();
  await updateExpense(parseId(formData), parseExpense(formData));
  revalidateApp();
}

export async function deleteExpenseAction(formData: FormData) {
  await requireSession();
  await deleteExpense(parseId(formData));
  revalidateApp();
}

const loanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  owner: ownerSchema,
  paymentCents: z.number().int().min(0),
  paymentDayOfMonth: z.number().int().min(1).max(31),
  firstPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalInstallments: z.number().int().min(1).max(600),
  active: z.boolean(),
});

function parseLoan(formData: FormData) {
  return loanSchema.parse({
    name: text(formData, "name"),
    description: optionalText(formData, "description"),
    owner: ownerSchema.parse(formData.get("owner")),
    paymentCents: moneyValue(formData, "paymentAmount"),
    paymentDayOfMonth: numberValue(formData, "paymentDayOfMonth"),
    firstPaymentDate: text(formData, "firstPaymentDate"),
    totalInstallments: numberValue(formData, "totalInstallments"),
    active: checkbox(formData, "active"),
  });
}

export async function createLoanAction(formData: FormData) {
  await requireSession();
  await createLoan(parseLoan(formData));
  revalidateApp();
}

export async function updateLoanAction(formData: FormData) {
  await requireSession();
  await updateLoan(parseId(formData), parseLoan(formData));
  revalidateApp();
}

export async function deleteLoanAction(formData: FormData) {
  await requireSession();
  await deleteLoan(parseId(formData));
  revalidateApp();
}

const investmentSchema = z.object({
  name: z.string().min(1),
  owner: ownerSchema,
  initialAmountCents: z.number().int().min(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  active: z.boolean(),
});

function parseInvestment(formData: FormData) {
  return investmentSchema.parse({
    name: text(formData, "name"),
    owner: ownerSchema.parse(formData.get("owner")),
    initialAmountCents: moneyValue(formData, "initialAmount"),
    startDate: text(formData, "startDate"),
    active: checkbox(formData, "active"),
  });
}

export async function createInvestmentAction(formData: FormData) {
  await requireSession();
  await createInvestment(parseInvestment(formData));
  revalidateApp();
}

export async function updateInvestmentAction(formData: FormData) {
  await requireSession();
  await updateInvestment(parseId(formData), parseInvestment(formData));
  revalidateApp();
}

export async function deleteInvestmentAction(formData: FormData) {
  await requireSession();
  await deleteInvestment(parseId(formData));
  revalidateApp();
}

const investmentTrackingSchema = z.object({
  investmentId: z.string().min(1),
  movementCents: z.number().int(),
  currentValueCents: z.number().int().min(0),
  trackedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
});

function parseInvestmentTracking(formData: FormData) {
  return investmentTrackingSchema.parse({
    investmentId: text(formData, "investmentId"),
    movementCents: signedMoneyValue(formData, "movement"),
    currentValueCents: moneyValue(formData, "currentValue"),
    trackedAt: text(formData, "trackedAt"),
    note: optionalText(formData, "note"),
  });
}

export async function createInvestmentTrackingAction(formData: FormData) {
  await requireSession();
  await createInvestmentTracking(parseInvestmentTracking(formData));
  revalidateApp();
}

export async function updateInvestmentTrackingAction(formData: FormData) {
  await requireSession();
  await updateInvestmentTracking(parseId(formData), parseInvestmentTracking(formData));
  revalidateApp();
}

export async function deleteInvestmentTrackingAction(formData: FormData) {
  await requireSession();
  await deleteInvestmentTracking(parseId(formData));
  revalidateApp();
}

const cashBalanceSchema = z.object({
  owner: ownerSchema,
  balanceCents: z.number().int().min(0),
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function upsertCashBalanceAction(formData: FormData) {
  await requireSession();
  const parsed = cashBalanceSchema.parse({
    owner: ownerSchema.parse(formData.get("owner")),
    balanceCents: moneyValue(formData, "balance"),
    asOfDate: text(formData, "asOfDate"),
  });

  await upsertCashBalance(parsed);
  revalidateApp();
}

const oneTimePaymentSchema = z.object({
  direction: oneTimePaymentDirectionSchema,
  type: oneTimePaymentTypeSchema,
  categoryId: z.string().min(1),
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountCents: z.number().int().min(0),
  isCash: z.boolean(),
  note: z.string().optional(),
});

function parseOneTimePayment(formData: FormData) {
  return oneTimePaymentSchema.parse({
    direction: oneTimePaymentDirectionSchema.parse(formData.get("direction")),
    type: oneTimePaymentTypeSchema.parse(formData.get("type")),
    categoryId: text(formData, "categoryId"),
    name: text(formData, "name"),
    date: text(formData, "date"),
    amountCents: moneyValue(formData, "amount"),
    isCash: checkbox(formData, "isCash"),
    note: optionalText(formData, "note"),
  });
}

export async function createOneTimePaymentAction(formData: FormData) {
  await requireSession();
  await createOneTimePayment(parseOneTimePayment(formData));
  revalidateApp();
}

export async function updateOneTimePaymentAction(formData: FormData) {
  await requireSession();
  await updateOneTimePayment(parseId(formData), parseOneTimePayment(formData));
  revalidateApp();
}

export async function deleteOneTimePaymentAction(formData: FormData) {
  await requireSession();
  await deleteOneTimePayment(parseId(formData));
  revalidateApp();
}
