import { whoisDomain, firstResult } from "whoiser";

export interface WhoisResult {
  domain: string;
  registrar: string | null;
  creationDate: string | null;
  expiryDate: string | null;
  nameServers: string[];
  status: string[];
  rawData: Record<string, unknown>;
  error: string | null;
}

export async function lookupDomain(domainName: string): Promise<WhoisResult> {
  try {
    const rawWhois = await whoisDomain(domainName, {
      follow: 2,
      timeout: 10000,
    });

    const servers = Object.keys(rawWhois);
    if (servers.length === 0) {
      return makeErrorResult(domainName, "No WHOIS data returned");
    }

    // Prefer the registrar response (usually second) over registry
    const data =
      servers.length > 1
        ? (rawWhois as Record<string, Record<string, unknown>>)[servers[1]]
        : (rawWhois as Record<string, Record<string, unknown>>)[servers[0]];

    if (!data) {
      return makeErrorResult(domainName, "No WHOIS data returned");
    }

    const expiryRaw =
      data["Expiry Date"] ||
      data["Registry Expiry Date"] ||
      data["Registrar Registration Expiration Date"] ||
      data["paid-till"] ||
      data["Expiration Date"] ||
      data["expire"] ||
      null;

    const expiryDate = expiryRaw
      ? new Date(String(expiryRaw)).toISOString()
      : null;

    const creationRaw =
      data["Creation Date"] ||
      data["Created Date"] ||
      data["created"] ||
      data["Created"] ||
      null;

    const creationDate = creationRaw
      ? new Date(String(creationRaw)).toISOString()
      : null;

    const registrar =
      data["Registrar"] || data["registrar"] || null;

    const nsRaw = data["Name Server"] || data["nserver"] || [];
    const nameServers = Array.isArray(nsRaw)
      ? nsRaw.map(String)
      : typeof nsRaw === "string"
        ? [nsRaw]
        : [];

    const statusRaw = data["Domain Status"] || data["Status"] || data["status"] || [];
    const status = Array.isArray(statusRaw)
      ? statusRaw.map(String)
      : [String(statusRaw)];

    return {
      domain: domainName,
      registrar: typeof registrar === "string" ? registrar : null,
      creationDate,
      expiryDate,
      nameServers,
      status,
      rawData: rawWhois as Record<string, unknown>,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown WHOIS error";
    return makeErrorResult(domainName, message);
  }
}

function makeErrorResult(domain: string, error: string): WhoisResult {
  return {
    domain,
    registrar: null,
    creationDate: null,
    expiryDate: null,
    nameServers: [],
    status: [],
    rawData: {},
    error,
  };
}
