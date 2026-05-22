import { ObjectId, type Collection, type Db } from "mongodb";
import { demoData, defaultCategories, defaultSettings } from "@/lib/demo-data";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import type {
  AppData,
  AppSettings,
  CashBalance,
  Category,
  Expense,
  Income,
  Investment,
  InvestmentTracking,
  Loan,
} from "@/types/domain";

type WithMongoId<T> = Omit<T, "id"> & { _id: ObjectId | string };

const COLLECTIONS = {
  settings: "settings",
  categories: "categories",
  incomes: "incomes",
  expenses: "expenses",
  loans: "loans",
  investments: "investments",
  investmentTrackings: "investmentTrackings",
  cashBalances: "cashBalances",
} as const;

const CATEGORY_NAME_COLLATION = { locale: "it", strength: 2 } as const;

function nowIso() {
  return new Date().toISOString();
}

function objectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid id.");
  }

  return new ObjectId(id);
}

function mapMongoDoc<T extends { _id: ObjectId | string }>(doc: T) {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  };
}

function mapSettingsDoc(doc: (AppSettings & { _id?: ObjectId | string }) | null) {
  if (!doc) {
    return defaultSettings;
  }

  return {
    id: doc.id,
    profileNames: doc.profileNames,
    sharedRatio: doc.sharedRatio,
    currency: doc.currency,
  };
}

function normalizeCategoryName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");
}

function isIndexNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    ("codeName" in error || "code" in error) &&
    ((error as { codeName?: string }).codeName === "IndexNotFound" ||
      (error as { code?: number }).code === 27)
  );
}

async function dedupeCategories(db: Db) {
  const categories = db.collection<WithMongoId<Category>>(COLLECTIONS.categories);
  const existing = await categories.find({}).sort({ createdAt: 1 }).toArray();
  const grouped = new Map<string, Array<WithMongoId<Category>>>();

  existing.forEach((category) => {
    const key = normalizeCategoryName(category.name);

    if (!key) {
      return;
    }

    grouped.set(key, [...(grouped.get(key) || []), category]);
  });

  for (const group of grouped.values()) {
    if (group.length < 2) {
      continue;
    }

    const [keeper, ...duplicates] = group.sort(
      (a, b) =>
        (a.createdAt || "").localeCompare(b.createdAt || "") ||
        String(a._id).localeCompare(String(b._id)),
    );
    const keeperId = String(keeper._id);
    const duplicateIds = duplicates.map((category) => category._id);
    const duplicateCategoryIds = duplicates.map((category) => String(category._id));

    await db.collection(COLLECTIONS.expenses).updateMany(
      { categoryId: { $in: duplicateCategoryIds } },
      { $set: { categoryId: keeperId, updatedAt: nowIso() } },
    );
    await categories.deleteMany({ _id: { $in: duplicateIds } });
  }
}

async function seedDefaultCategories(categories: Collection<WithMongoId<Category>>) {
  const timestamp = nowIso();

  for (const category of defaultCategories) {
    await categories.updateOne(
      { name: category.name },
      {
        $setOnInsert: {
          _id: new ObjectId(),
          name: category.name,
          color: category.color,
          icon: category.icon,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { upsert: true, collation: CATEGORY_NAME_COLLATION },
    );
  }
}

async function ensureCategoryNameIndex(categories: Collection<WithMongoId<Category>>) {
  const indexes = await categories.indexes();
  const legacyNameIndex = indexes.find((index) => index.name === "name_1" && !index.unique);

  if (legacyNameIndex) {
    try {
      await categories.dropIndex("name_1");
    } catch (error) {
      if (!isIndexNotFoundError(error)) {
        throw error;
      }
    }
  }

  await categories.createIndex(
    { name: 1 },
    {
      name: "categories_name_unique_ci",
      unique: true,
      collation: CATEGORY_NAME_COLLATION,
    },
  );
}

async function ensureDefaults(db: Db) {
  const settings = db.collection<AppSettings>(COLLECTIONS.settings);
  const categories =
    db.collection<WithMongoId<Category>>(COLLECTIONS.categories);

  await settings.updateOne(
    { id: "default" },
    { $setOnInsert: defaultSettings },
    { upsert: true },
  );

  await dedupeCategories(db);

  await Promise.all([
    ensureCategoryNameIndex(categories),
    db.collection(COLLECTIONS.expenses).createIndex({ active: 1, owner: 1 }),
    db.collection(COLLECTIONS.incomes).createIndex({ active: 1, owner: 1 }),
    db.collection(COLLECTIONS.loans).createIndex({ active: 1, owner: 1 }),
    db.collection(COLLECTIONS.investments).createIndex({ active: 1, owner: 1 }),
    db
      .collection(COLLECTIONS.investmentTrackings)
      .createIndex({ investmentId: 1, trackedAt: 1 }),
    db.collection(COLLECTIONS.cashBalances).createIndex({ owner: 1 }, { unique: true }),
  ]);

  const categoryCount = await categories.countDocuments();

  if (categoryCount === 0) {
    await seedDefaultCategories(categories);
  }
}

export async function getAppData(): Promise<AppData> {
  if (!isMongoConfigured()) {
    return demoData;
  }

  const db = await getDb();
  await ensureDefaults(db);

  const [
    settings,
    categories,
    incomes,
    expenses,
    loans,
    investments,
    investmentTrackings,
    cashBalances,
  ] = await Promise.all([
    db.collection<AppSettings>(COLLECTIONS.settings).findOne({ id: "default" }),
    db
      .collection<WithMongoId<Category>>(COLLECTIONS.categories)
      .find({})
      .sort({ name: 1 })
      .toArray(),
    db
      .collection<WithMongoId<Income>>(COLLECTIONS.incomes)
      .find({})
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<WithMongoId<Expense>>(COLLECTIONS.expenses)
      .find({})
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<WithMongoId<Loan>>(COLLECTIONS.loans)
      .find({})
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<WithMongoId<Investment>>(COLLECTIONS.investments)
      .find({})
      .sort({ createdAt: -1 })
      .toArray(),
    db
      .collection<WithMongoId<InvestmentTracking>>(COLLECTIONS.investmentTrackings)
      .find({})
      .sort({ trackedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection<WithMongoId<CashBalance>>(COLLECTIONS.cashBalances)
      .find({})
      .sort({ owner: 1 })
      .toArray(),
  ]);

  return {
    settings: mapSettingsDoc(settings),
    categories: categories.map(mapMongoDoc) as Category[],
    incomes: incomes.map(mapMongoDoc) as Income[],
    expenses: expenses.map(mapMongoDoc) as Expense[],
    loans: loans.map(mapMongoDoc) as Loan[],
    investments: investments.map(mapMongoDoc) as Investment[],
    investmentTrackings: investmentTrackings.map(mapMongoDoc) as InvestmentTracking[],
    cashBalances: cashBalances.map(mapMongoDoc) as CashBalance[],
  };
}

export async function getWritableDb() {
  const db = await getDb();
  await ensureDefaults(db);
  return db;
}

export async function updateSettings(settings: AppSettings) {
  const db = await getWritableDb();
  await db
    .collection<AppSettings>(COLLECTIONS.settings)
    .updateOne({ id: "default" }, { $set: settings }, { upsert: true });
}

export async function createCategory(
  category: Omit<Category, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  const timestamp = nowIso();
  await db.collection(COLLECTIONS.categories).insertOne({
    ...category,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateCategory(
  id: string,
  category: Omit<Category, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.categories).updateOne(
    { _id: objectId(id) },
    {
      $set: {
        ...category,
        updatedAt: nowIso(),
      },
    },
  );
}

export async function deleteCategory(id: string) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.categories).deleteOne({ _id: objectId(id) });
}

export async function createIncome(
  income: Omit<Income, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  const timestamp = nowIso();
  await db.collection(COLLECTIONS.incomes).insertOne({
    ...income,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateIncome(
  id: string,
  income: Omit<Income, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.incomes).updateOne(
    { _id: objectId(id) },
    {
      $set: {
        ...income,
        updatedAt: nowIso(),
      },
    },
  );
}

export async function deleteIncome(id: string) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.incomes).deleteOne({ _id: objectId(id) });
}

export async function createExpense(
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  const timestamp = nowIso();
  await db.collection(COLLECTIONS.expenses).insertOne({
    ...expense,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateExpense(
  id: string,
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.expenses).updateOne(
    { _id: objectId(id) },
    {
      $set: {
        ...expense,
        updatedAt: nowIso(),
      },
    },
  );
}

export async function deleteExpense(id: string) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.expenses).deleteOne({ _id: objectId(id) });
}

export async function createLoan(
  loan: Omit<Loan, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  const timestamp = nowIso();
  await db.collection(COLLECTIONS.loans).insertOne({
    ...loan,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateLoan(
  id: string,
  loan: Omit<Loan, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.loans).updateOne(
    { _id: objectId(id) },
    {
      $set: {
        ...loan,
        updatedAt: nowIso(),
      },
    },
  );
}

export async function deleteLoan(id: string) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.loans).deleteOne({ _id: objectId(id) });
}

export async function createInvestment(
  investment: Omit<Investment, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  const timestamp = nowIso();
  await db.collection(COLLECTIONS.investments).insertOne({
    ...investment,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateInvestment(
  id: string,
  investment: Omit<Investment, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.investments).updateOne(
    { _id: objectId(id) },
    {
      $set: {
        ...investment,
        updatedAt: nowIso(),
      },
    },
  );
}

export async function deleteInvestment(id: string) {
  const db = await getWritableDb();
  const _id = objectId(id);
  await Promise.all([
    db.collection(COLLECTIONS.investments).deleteOne({ _id }),
    db.collection(COLLECTIONS.investmentTrackings).deleteMany({ investmentId: id }),
  ]);
}

export async function createInvestmentTracking(
  tracking: Omit<InvestmentTracking, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  const timestamp = nowIso();
  await db.collection(COLLECTIONS.investmentTrackings).insertOne({
    ...tracking,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function updateInvestmentTracking(
  id: string,
  tracking: Omit<InvestmentTracking, "id" | "createdAt" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.investmentTrackings).updateOne(
    { _id: objectId(id) },
    {
      $set: {
        ...tracking,
        updatedAt: nowIso(),
      },
    },
  );
}

export async function deleteInvestmentTracking(id: string) {
  const db = await getWritableDb();
  await db
    .collection(COLLECTIONS.investmentTrackings)
    .deleteOne({ _id: objectId(id) });
}

export async function upsertCashBalance(
  cashBalance: Omit<CashBalance, "id" | "updatedAt">,
) {
  const db = await getWritableDb();
  await db.collection(COLLECTIONS.cashBalances).updateOne(
    { owner: cashBalance.owner },
    {
      $set: {
        ...cashBalance,
        updatedAt: nowIso(),
      },
      $setOnInsert: {
        _id: new ObjectId(),
      },
    },
    { upsert: true },
  );
}
