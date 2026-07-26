const configuredUrl = process.env.API_BASE_URL;

export const API_BASE_URL =
  configuredUrl?.replace(/\/+$/, '') ??
  'http://138.68.140.83:8000';