import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  fas,
  faBaby,
  faBasketShopping,
  faBicycle,
  faBolt,
  faBook,
  faBriefcase,
  faBuildingColumns,
  faBus,
  faCalendarDays,
  faCar,
  faCartShopping,
  faChartLine,
  faClock,
  faCloud,
  faCoins,
  faCreditCard,
  faDroplet,
  faDumbbell,
  faFileInvoiceDollar,
  faFilm,
  faFire,
  faGamepad,
  faGasPump,
  faGift,
  faGlobe,
  faGraduationCap,
  faHammer,
  faHeadphones,
  faHeartPulse,
  faHouse,
  faHouseSignal,
  faKey,
  faLandmark,
  faLaptop,
  faLeaf,
  faLightbulb,
  faLock,
  faMobileScreenButton,
  faMoneyBillWave,
  faMotorcycle,
  faMusic,
  faPaintRoller,
  faPaw,
  faPeopleRoof,
  faPiggyBank,
  faPlane,
  faPlug,
  faReceipt,
  faRecycle,
  faSackDollar,
  faScaleBalanced,
  faScrewdriver,
  faScrewdriverWrench,
  faSeedling,
  faServer,
  faShieldHalved,
  faShirt,
  faStethoscope,
  faTrain,
  faTrash,
  faTv,
  faUtensils,
  faWallet,
  faWifi,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";

export const DEFAULT_CATEGORY_ICON = "receipt";

export const categoryIconRegistry = {
  house: { label: "Casa", icon: faHouse },
  peopleRoof: { label: "Casa comune", icon: faPeopleRoof },
  lightbulb: { label: "Luce", icon: faLightbulb },
  bolt: { label: "Elettricita", icon: faBolt },
  droplet: { label: "Acqua", icon: faDroplet },
  fire: { label: "Gas", icon: faFire },
  plug: { label: "Utenze", icon: faPlug },
  wifi: { label: "Internet", icon: faWifi },
  houseSignal: { label: "Casa connessa", icon: faHouseSignal },
  phone: { label: "Telefono", icon: faMobileScreenButton },
  cloud: { label: "Cloud", icon: faCloud },
  server: { label: "Server", icon: faServer },
  car: { label: "Auto", icon: faCar },
  gasPump: { label: "Carburante", icon: faGasPump },
  motorcycle: { label: "Moto", icon: faMotorcycle },
  bicycle: { label: "Bici", icon: faBicycle },
  bus: { label: "Bus", icon: faBus },
  train: { label: "Treno", icon: faTrain },
  plane: { label: "Viaggi", icon: faPlane },
  globe: { label: "Mondo", icon: faGlobe },
  cartShopping: { label: "Shopping", icon: faCartShopping },
  basketShopping: { label: "Spesa", icon: faBasketShopping },
  utensils: { label: "Cibo", icon: faUtensils },
  stethoscope: { label: "Medico", icon: faStethoscope },
  heartPulse: { label: "Salute", icon: faHeartPulse },
  dumbbell: { label: "Sport", icon: faDumbbell },
  tv: { label: "TV", icon: faTv },
  film: { label: "Cinema", icon: faFilm },
  music: { label: "Musica", icon: faMusic },
  headphones: { label: "Audio", icon: faHeadphones },
  gamepad: { label: "Gaming", icon: faGamepad },
  landmark: { label: "Banca", icon: faLandmark },
  buildingColumns: { label: "Istituto", icon: faBuildingColumns },
  creditCard: { label: "Carta", icon: faCreditCard },
  receipt: { label: "Ricevuta", icon: faReceipt },
  fileInvoiceDollar: { label: "Fattura", icon: faFileInvoiceDollar },
  wallet: { label: "Wallet", icon: faWallet },
  piggyBank: { label: "Risparmio", icon: faPiggyBank },
  coins: { label: "Monete", icon: faCoins },
  moneyBillWave: { label: "Contanti", icon: faMoneyBillWave },
  sackDollar: { label: "Budget", icon: faSackDollar },
  chartLine: { label: "Investimenti", icon: faChartLine },
  scaleBalanced: { label: "Legale", icon: faScaleBalanced },
  briefcase: { label: "Lavoro", icon: faBriefcase },
  graduationCap: { label: "Studio", icon: faGraduationCap },
  book: { label: "Libri", icon: faBook },
  laptop: { label: "Computer", icon: faLaptop },
  wrench: { label: "Manutenzione", icon: faWrench },
  hammer: { label: "Lavori", icon: faHammer },
  screwdriver: { label: "Riparazioni", icon: faScrewdriver },
  screwdriverWrench: { label: "Officina", icon: faScrewdriverWrench },
  paintRoller: { label: "Ristrutturazione", icon: faPaintRoller },
  shieldHalved: { label: "Assicurazioni", icon: faShieldHalved },
  key: { label: "Chiavi", icon: faKey },
  lock: { label: "Sicurezza", icon: faLock },
  gift: { label: "Regali", icon: faGift },
  calendarDays: { label: "Calendario", icon: faCalendarDays },
  clock: { label: "Tempo", icon: faClock },
  baby: { label: "Bambini", icon: faBaby },
  shirt: { label: "Abbigliamento", icon: faShirt },
  paw: { label: "Animali", icon: faPaw },
  leaf: { label: "Green", icon: faLeaf },
  seedling: { label: "Piante", icon: faSeedling },
  recycle: { label: "Riciclo", icon: faRecycle },
  trash: { label: "Rifiuti", icon: faTrash },
} as const satisfies Record<string, { label: string; icon: IconDefinition }>;

export type CategoryIconName = keyof typeof categoryIconRegistry;

export const categoryIconOptions = Object.entries(categoryIconRegistry).map(
  ([value, item]) => ({
    value: value as CategoryIconName,
    label: item.label,
    icon: item.icon,
  }),
);

export const categoryIconNames = categoryIconOptions.map((option) => option.value);

export function isCategoryIconName(value?: string): value is CategoryIconName {
  return Boolean(value && value in categoryIconRegistry);
}

export function normalizeCategoryIconInput(value?: string) {
  const tokens = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lastToken = tokens[tokens.length - 1];

  if (!lastToken) {
    return "";
  }

  let normalized = lastToken.trim();

  if (/^fa-[a-z0-9-]+$/i.test(normalized)) {
    normalized = normalized.slice(3);
  } else if (/^fa[A-Z0-9]/.test(normalized)) {
    normalized = normalized.slice(2);
  }

  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function iconExportName(slug: string) {
  return `fa${slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
}

function freeSolidIconForSlug(slug: string) {
  const iconPack = fas as Record<string, IconDefinition | undefined>;
  return iconPack[iconExportName(slug)];
}

export function normalizeCategoryIcon(value?: string) {
  const raw = String(value || "").trim();

  if (isCategoryIconName(raw)) {
    return raw;
  }

  const slug = normalizeCategoryIconInput(raw);

  if (!slug) {
    return DEFAULT_CATEGORY_ICON;
  }

  if (isCategoryIconName(slug) || freeSolidIconForSlug(slug)) {
    return slug;
  }

  return DEFAULT_CATEGORY_ICON;
}

export function categoryIconFor(value?: string): { label: string; icon: IconDefinition } {
  const raw = String(value || "").trim();

  if (isCategoryIconName(raw)) {
    return categoryIconRegistry[raw];
  }

  const slug = normalizeCategoryIconInput(raw);

  if (isCategoryIconName(slug)) {
    return categoryIconRegistry[slug];
  }

  const freeSolidIcon = freeSolidIconForSlug(slug);

  if (freeSolidIcon) {
    return { label: slug, icon: freeSolidIcon };
  }

  return categoryIconRegistry[DEFAULT_CATEGORY_ICON];
}
