export type KnownPriceSource = "market" | "stx-peg" | "usd-peg" | null;

export const DIRECT_PRICE_IDS_BY_SYMBOL: Record<string, string> = {
  STX: "stacks",
  STSTX: "stacking-dao",
  DIKO: "arkadiko",
  ZEST: "zest-protocol"
};

const STX_PEG_SYMBOLS = new Set(["STSTX", "RSTSTX", "LSTSTX", "WSTSTX"]);
const USD_PEG_SYMBOLS = new Set(["USDA", "AEUSDC", "USDC", "USDT"]);

export function normalizeTokenKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function getTrackedCoinGeckoIds() {
  return Array.from(new Set(Object.values(DIRECT_PRICE_IDS_BY_SYMBOL)));
}

export function resolveKnownTokenPrice(
  token: { name: string; symbol: string },
  knownUsdPrices: Map<string, number>
): { unitPriceUsd: number | null; priceSource: KnownPriceSource } {
  const symbol = normalizeTokenKey(token.symbol);
  const name = normalizeTokenKey(token.name);
  const directCoinId = DIRECT_PRICE_IDS_BY_SYMBOL[symbol];

  if (directCoinId) {
    const unitPriceUsd = knownUsdPrices.get(directCoinId) ?? null;

    if (unitPriceUsd !== null) {
      return {
        unitPriceUsd,
        priceSource: "market"
      };
    }
  }

  const stxPriceUsd = knownUsdPrices.get("stacks") ?? null;

  if (
    stxPriceUsd !== null &&
    (STX_PEG_SYMBOLS.has(symbol) || /STACKEDSTACKS|RESTAKEDSTACKS|LIQUIDSTACKS/.test(name))
  ) {
    return {
      unitPriceUsd: stxPriceUsd,
      priceSource: "stx-peg"
    };
  }

  if (USD_PEG_SYMBOLS.has(symbol) || /USDCOIN|ARKADIKODOLLAR|USDA/.test(name)) {
    return {
      unitPriceUsd: 1,
      priceSource: "usd-peg"
    };
  }

  return {
    unitPriceUsd: null,
    priceSource: null
  };
}
