// Base URL of the REST API. Override per environment with EXPO_PUBLIC_API_URL.
// Note: on an Android emulator, localhost is 10.0.2.2 — set the env var accordingly.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
