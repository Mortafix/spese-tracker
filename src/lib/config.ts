const REQUIRED_PRODUCTION_ENV = [
  "APP_USERNAME",
  "APP_PASSWORD_HASH",
  "SESSION_SECRET",
  "MONGODB_URI",
] as const;

type RequiredProductionEnv = (typeof REQUIRED_PRODUCTION_ENV)[number];

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function readProductionEnv(name: RequiredProductionEnv) {
  const value = process.env[name]?.trim();

  if (!value && isProduction()) {
    throw new Error(`${name} is required in production.`);
  }

  return value;
}

export function validateProductionConfig() {
  REQUIRED_PRODUCTION_ENV.forEach(readProductionEnv);
}

export function getConfiguredUsername() {
  return readProductionEnv("APP_USERNAME") || "admin";
}

export function getConfiguredPasswordHash() {
  return readProductionEnv("APP_PASSWORD_HASH");
}

export function getConfiguredSessionSecret() {
  return readProductionEnv("SESSION_SECRET") || "local-development-secret";
}

export function getConfiguredMongoUri() {
  return readProductionEnv("MONGODB_URI");
}

export function getConfiguredMongoDbName() {
  return process.env.MONGODB_DB?.trim() || "spese_tracker";
}
