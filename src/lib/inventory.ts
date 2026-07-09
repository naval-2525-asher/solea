export type StyleType = "tee" | "tank" | "accessory";

export const TEE_SIZES = ["S", "M", "L", "XL"];
export const TANK_SIZES = ["S", "M", "L"];
export const LOW_STOCK_THRESHOLD = 5;

/** Safely coerce a Supabase Json value into a plain string→number map. */
export function parseStockMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(v);
    out[k] = Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return out;
}

const sumMap = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
const sumSizes = (m: Record<string, number>, sizes: string[]) => sizes.reduce((a, s) => a + (m[s] ?? 0), 0);

/** Per-size stock for a Tee or Tank, isolated from the other style's pool. */
export function getStyleSizeStock(product: any, style: "tee" | "tank", size: string): number {
  if (!product) return Infinity;
  const map = parseStockMap(style === "tank" ? product.tank_variants : product.tee_variants);
  if (Object.keys(map).length > 0) {
    return map[size] ?? 0;
  }
  const legacy = parseStockMap(product.size_stock);
  if (Object.keys(legacy).length > 0) {
    return legacy[size] ?? 0;
  }
  return Infinity;
}

/**
 * Stock for a specific size+color combination.
 * e.g. Tee S Black → tee_size_color_stock["S"]["Black"]
 * Returns Infinity if no size-color grid is configured for this product/style.
 */
export function getSizeColorStock(product: any, style: "tee" | "tank", size: string, color: string): number {
  if (!product || !color) return Infinity;
  const field = style === "tee" ? "tee_size_color_stock" : "tank_size_color_stock";
  const grid = product[field];
  if (!grid || typeof grid !== "object" || Array.isArray(grid)) return Infinity;
  const sizeRow = (grid as any)[size];
  if (!sizeRow || typeof sizeRow !== "object") return Infinity;
  const n = Number((sizeRow as any)[color]);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Whether a size-color grid exists and has been configured for this style. */
export function hasSizeColorGrid(product: any, style: "tee" | "tank"): boolean {
  if (!product) return false;
  const field = style === "tee" ? "tee_size_color_stock" : "tank_size_color_stock";
  const grid = product[field];
  if (!grid || typeof grid !== "object" || Array.isArray(grid)) return false;
  return Object.keys(grid).length > 0;
}

/** Per-variant stock for an Accessory (colour / style option). */
export function getAccessoryVariantStock(product: any, variantName: string): number {
  if (!product) return Infinity;
  const map = parseStockMap(product.color_stock);
  if (Object.keys(map).length > 0 && variantName in map) {
    return map[variantName] ?? 0;
  }
  return getProductTotalStock(product);
}

/** Flat total stock (used for products/accessories with no size or variant breakdown). */
export function getProductTotalStock(product: any): number {
  if (!product) return Infinity;
  const raw = product.stock_count;
  return raw !== null && raw !== undefined ? Number(raw) : Infinity;
}

/** Whether the whole product has been manually marked out of stock by an admin. */
export function isProductManuallyOOS(product: any): boolean {
  if (!product) return false;
  return product.stock_status === "out_of_stock" || product.stock_status === "Out of Stock";
}

/**
 * Effective remaining stock for a given cart item / selection, resolved the
 * same way everywhere (product page, cart, checkout):
 *   - tee/tank + a real size  → that style's per-size pool
 *   - accessory + a variant   → that variant's pool (or flat total if no variants)
 *   - anything else           → flat total
 */
export function getEffectiveStock(product: any, style: StyleType | string, size?: string | null): number {
  if (!product) return Infinity;
  if (isProductManuallyOOS(product)) return 0;

  if ((style === "tee" || style === "tank") && size && size !== "One Size") {
    return getStyleSizeStock(product, style, size);
  }
  if (style === "accessory" && size && size !== "One Size") {
    return getAccessoryVariantStock(product, size);
  }
  return getProductTotalStock(product);
}

export function isOutOfStock(product: any, style: StyleType | string, size?: string | null): boolean {
  const stock = getEffectiveStock(product, style, size);
  return stock !== Infinity && stock <= 0;
}

export function isLowStock(product: any, style: StyleType | string, size?: string | null): boolean {
  const stock = getEffectiveStock(product, style, size);
  return stock !== Infinity && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
}

/**
 * Recompute the flat `stock_count` + `stock_status` from the per-size /
 * per-variant pools, so listing-page badges ("Low Stock" pills, etc.) stay
 * accurate even though they only read the flat fields.
 */
export function recomputeTotals(opts: {
  teeStock?: Record<string, number>;
  tankStock?: Record<string, number>;
  colorStock?: Record<string, number>;
  hasSizeTracking: boolean; // true for Tees & Tank Tops / Limited Edition
}): { stock_count: number; stock_status: "in_stock" | "low_stock" | "out_of_stock" } {
  const total = opts.hasSizeTracking
    ? sumSizes(opts.teeStock ?? {}, TEE_SIZES) + sumSizes(opts.tankStock ?? {}, TANK_SIZES)
    : sumMap(opts.colorStock ?? {});
  const stock_status = total === 0 ? "out_of_stock" : total <= LOW_STOCK_THRESHOLD ? "low_stock" : "in_stock";
  return { stock_count: total, stock_status };
}