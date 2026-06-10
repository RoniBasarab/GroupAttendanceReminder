// Live DB client only. Import tables from "@gar/core/schema" instead — that path
// has no connection side-effect (so it works without DATABASE_URL, e.g. in tests).
export * from './client';
