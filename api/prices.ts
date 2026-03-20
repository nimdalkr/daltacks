import { getTrackedCoinGeckoIds } from "../packages/stx-utils/src/index";

const COINGECKO_API_BASE_URL = process.env.COINGECKO_API_BASE_URL ?? "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? "";

type RequestLike = {
  method?: string;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method && request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const endpoint = new URL(`${COINGECKO_API_BASE_URL}/simple/price`);
  endpoint.searchParams.set("ids", getTrackedCoinGeckoIds().join(","));
  endpoint.searchParams.set("vs_currencies", "usd");

  const headers: Record<string, string> = {};

  if (COINGECKO_API_KEY) {
    headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
  }

  try {
    const upstream = await fetch(endpoint.toString(), { headers });

    if (!upstream.ok) {
      response.status(upstream.status).json({ error: "Failed to fetch CoinGecko prices" });
      return;
    }

    const payload = (await upstream.json()) as Record<string, { usd?: number }>;
    const prices = Object.fromEntries(
      Object.entries(payload)
        .map(([coinId, value]) => [coinId, value.usd] as const)
        .filter((entry): entry is readonly [string, number] => typeof entry[1] === "number")
    );

    response.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    response.status(200).json({
      prices,
      source: "coingecko"
    });
  } catch {
    response.status(502).json({ error: "Price upstream unavailable" });
  }
}
