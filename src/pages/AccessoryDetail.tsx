import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { getAccessoryVariantStock, getProductTotalStock, LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { useSaleProducts, useCategories } from "@/hooks/useAdminData";

type CustomInput = {
  id: string;
  label: string;
  type: "text" | "date" | "color" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  depends_on_group?: string;
  depends_on_option?: string;
  with_text_heading?: string;
  with_text_color?: string;
  price_pkr?: number;
  price_gbp?: number;
  compulsory?: boolean;
};

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "92vh" }}>
      <button onClick={onClose} style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%", background: "#8B1A2F", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
      <img src={src} alt="Full size" style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 12, objectFit: "contain", display: "block" }} />
    </div>
  </div>
);

const QuantityStepper = ({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) => (
  <div className="flex items-center gap-3 border-2 border-border rounded-full px-4 py-2 w-fit">
    <button onClick={() => onChange(Math.max(1, value - 1))} className="bg-transparent border-none cursor-pointer text-foreground font-serif text-lg font-bold w-5 h-5 flex items-center justify-center">−</button>
    <span className="font-serif text-sm font-bold text-foreground w-4 text-center">{value}</span>
    <button
      onClick={() => { if (max === undefined || value < max) onChange(value + 1); }}
      disabled={max !== undefined && value >= max}
      style={{ opacity: max !== undefined && value >= max ? 0.4 : 1, cursor: max !== undefined && value >= max ? "not-allowed" : "pointer" }}
      className="bg-transparent border-none text-foreground font-serif text-lg font-bold w-5 h-5 flex items-center justify-center">+</button>
  </div>
);

const AccessoryDetail = () => {
  const { id } = useParams();
  const location = useLocation();

  const { data: dbProduct, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  const rawProduct = dbProduct;

  const { addToCart } = useCart();
  const { region, formatPrice } = useRegion();
  const { data: saleItems = [] } = useSaleProducts();
  const { data: categoriesForBack = [] } = useCategories();
  const [descOpen, setDescOpen] = useState(false);

  // Find if this product is on sale
  const saleEntry = (saleItems as any[]).find((s: any) => String(s.product_id) === String(id));
  const activeSalePrice: number | null = saleEntry ? Number(saleEntry.sale_price) : null;
  const activeSalePriceGbp: number | null = saleEntry?.sale_price_gbp ? Number(saleEntry.sale_price_gbp) : null;
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // validation
  const [shakeVariant, setShakeVariant] = useState(false);
  const [variantError, setVariantError] = useState(false);
  // custom input fields (incl. "with text" toggle-button system)
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customErrors, setCustomErrors] = useState<string[]>([]);
  const [selectedWithText, setSelectedWithText] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setQty(1);
  }, [selectedVariant, selectedMulti.length]);

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1000px] mx-auto mt-10 px-10 grid grid-cols-1 md:grid-cols-2 gap-16 pb-20">
          <div className="rounded-[1.5rem] bg-secondary/30 aspect-[3/4] animate-pulse" />
          <div className="pt-4 space-y-4">
            <div className="h-8 bg-secondary/30 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-secondary/30 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </main>
    );
  }

  if (!rawProduct) {
    return (
      <main className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-foreground font-serif text-xl">Product not found.</p>
      </main>
    );
  }

  const product = {
    id: rawProduct.id,
    name: rawProduct.name,
    price: rawProduct.price,
    image: rawProduct.image || "",
    images: (() => {
      if (dbProduct) {
        const imgs = dbProduct.images as string[] | null;
        if (imgs && imgs.length > 0) return imgs;
        return dbProduct.image ? [dbProduct.image] : [];
      }
      return (rawProduct as any).image ? [(rawProduct as any).image] : [];
    })(),
    description: (rawProduct as any).description || "",
    variants: (() => {
      if (dbProduct) {
        const v = dbProduct.variants as any;
        if (Array.isArray(v)) return v;
        return [];
      }
      return (rawProduct as any).variants || [];
    })(),
  };

  const allImages = product.images;
  const hasVariants = product.variants.length > 0;

  const variantGroups: Record<string, { name: string; price_diff: number; required?: boolean }[]> = {};
  product.variants.forEach((v: any) => {
    if (!variantGroups[v.label]) variantGroups[v.label] = [];
    variantGroups[v.label].push({ name: v.name, price_diff: v.price_diff || 0, required: v.required });
  });
  const groupKeys = Object.keys(variantGroups);
  // A group is optional only if every option in it was explicitly marked not
  // required — same rule as the wearable product page, so admin behavior is
  // consistent everywhere.
  const isGroupRequired = (label: string) => !variantGroups[label].every((o) => o.required === false);
  const requiredGroupKeys = groupKeys.filter(isGroupRequired);
  const isMultiSelect = product.variants.length > 4;

  const customInputs: CustomInput[] = ((dbProduct as any)?.custom_inputs || [])
    .filter((ci: any) => ci && ci.id && ((ci.label && ci.label.trim()) || (ci.with_text_heading && ci.with_text_heading.trim())));

  // Add with-text price when customer has clicked the color button
  const withTextExtraPkr = customInputs.reduce((sum, ci) =>
    selectedWithText[ci.id] ? sum + (ci.price_pkr ?? 0) : sum, 0);
  const withTextExtraGbp = customInputs.reduce((sum, ci) =>
    selectedWithText[ci.id] ? sum + (ci.price_gbp ?? 0) : sum, 0);

  // Custom-input values (incl. the with-text color choice) merged into the
  // cart's customisation record, same shape as the wearable product page.
  const buildCustomInputCustomisation = (): Record<string, string> => {
    const customisation: Record<string, string> = {};
    customInputs.forEach((ci) => {
      if (customValues[ci.id]) {
        customisation[ci.label] = customValues[ci.id];
      }
      if (selectedWithText[ci.id] && ci.with_text_heading) {
        const colorLabel = ci.with_text_heading;
        const colorVal = ci.with_text_color || "black";
        const priceSuffix = region !== "UK" && ci.price_pkr
          ? ` +Rs. ${ci.price_pkr.toLocaleString()}`
          : region === "UK" && ci.price_gbp
          ? ` +£${Number(ci.price_gbp).toFixed(2)}`
          : "";
        customisation[colorLabel] = `${colorVal}${priceSuffix}`;
      }
    });
    return customisation;
  };

  // Required/compulsory custom-input validation — shared by all 3 add-to-
  // cart paths (multi-select, single-variant, no-variant). Returns an error
  // message to show, or null if everything required has been filled in.
  const validateCustomInputs = (): string | null => {
    const missingInputs = customInputs.filter(
      (ci) => ci.required && !ci.with_text_heading && !customValues[ci.id]?.trim()
    );
    if (missingInputs.length > 0) {
      setCustomErrors(missingInputs.map((ci) => ci.id));
      return "Please fill all required fields";
    }
    const missingCompulsory = customInputs.filter((ci) => {
      if (!ci.compulsory) return false;
      if (ci.with_text_heading) return !selectedWithText[ci.id] || !customValues[ci.id]?.trim();
      return !customValues[ci.id]?.trim();
    });
    if (missingCompulsory.length > 0) {
      const ci = missingCompulsory[0];
      if (ci.with_text_heading && !selectedWithText[ci.id]) {
        return `Please select the "${ci.with_text_heading}" option to continue`;
      }
      setCustomErrors([ci.id]);
      const verb = ci.type === "color" || ci.type === "select" ? "select" : "fill in";
      return `Please ${verb} the ${ci.label} ${ci.type === "color" || ci.type === "select" ? "option" : "field"} to continue`;
    }
    const selectedButEmpty = customInputs.filter((ci) => selectedWithText[ci.id] && !customValues[ci.id]?.trim());
    if (selectedButEmpty.length > 0) {
      const ci = selectedButEmpty[0];
      setCustomErrors([ci.id]);
      return `You selected the ${ci.with_text_heading || "text"} option — please fill in the text field`;
    }
    return null;
  };

  const toggleMulti = (v: string) => {
    setSelectedMulti((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
    setVariantError(false);
  };

  const basePrice = product.price;
  const gbpPrice: number | null = (dbProduct as any)?.price_gbp && Number((dbProduct as any).price_gbp) > 0
    ? Number((dbProduct as any).price_gbp) : null;

  // Safe region price — never use the PKR number with a £ sign
  const getRegionPrice = (pkrBase: number): number | null => {
    if (region === "UK") return gbpPrice; // null if not set
    return pkrBase;
  };

  const selectedVariantObj = product.variants.find((v: any) => v.name === selectedVariant);
  const singleTotal = (basePrice + (selectedVariantObj?.price_diff || 0) + withTextExtraPkr) * qty;
  const multiTotal = isMultiSelect
    ? selectedMulti.reduce((sum: number, name: string) => {
        const v = product.variants.find((vv: any) => vv.name === name);
        return sum + basePrice + (v?.price_diff || 0) + withTextExtraPkr;
      }, 0) * qty
    : 0;

  const productIdForCart = (rawProduct as any)?.id ?? (typeof product.id === "number" ? product.id : 9001);

  const getVariantStock = (variantName: string): number => getAccessoryVariantStock(rawProduct, variantName);

  // Display stock — straight from DB, not reduced by cart contents.
  // Stock only decrements when admin confirms an order.
  const remainingForVariant = (variantName: string): number => {
    const raw = getVariantStock(variantName);
    return raw === Infinity ? Infinity : Math.max(0, raw);
  };

  const totalRemaining = (() => {
    const raw = getProductTotalStock(rawProduct);
    return raw === Infinity ? Infinity : Math.max(0, raw);
  })();

  // What's actually selectable right now, for low-stock / OOS messaging
  const selectionRemaining = isMultiSelect
    ? (selectedMulti.length > 0 ? Math.min(...selectedMulti.map(remainingForVariant)) : Infinity)
    : hasVariants
      ? (selectedVariant ? remainingForVariant(selectedVariant) : Infinity)
      : totalRemaining;

  const allVariantsOOS = hasVariants && groupKeys.length > 0 &&
    Object.values(variantGroups).flat().every((v) => getVariantStock(v.name) <= 0);

  const isLowStock = selectionRemaining !== Infinity && selectionRemaining > 0 && selectionRemaining <= LOW_STOCK_THRESHOLD;
  const isOOS =
    (rawProduct as any).stock_status === "out_of_stock" || (rawProduct as any).stock_status === "Out of Stock" ||
    allVariantsOOS ||
    (selectionRemaining !== Infinity && selectionRemaining <= 0) ||
    (!hasVariants && totalRemaining !== Infinity && totalRemaining <= 0);

  const triggerShake = () => {
    setShakeVariant(true);
    setTimeout(() => setShakeVariant(false), 600);
  };

  const handleAdd = () => {
    // Custom input fields (incl. "with text" toggle) — validated before
    // variants, same order as the wearable product page.
    const customInputError = validateCustomInputs();
    if (customInputError) {
      toast.error(customInputError);
      return;
    }
    setCustomErrors([]);

    // Validate every required variant group actually has a selection.
    // (This component uses a single shared selection value/list across all
    // groups, so this only reliably distinguishes required vs optional when
    // there's one group — the common case for accessories today.)
    if (hasVariants && requiredGroupKeys.length > 0) {
      const selectedNames = isMultiSelect ? selectedMulti : (selectedVariant ? [selectedVariant] : []);
      const missingRequired = requiredGroupKeys.some(
        (label) => !variantGroups[label].some((o) => selectedNames.includes(o.name))
      );
      if (missingRequired) {
        setVariantError(true);
        triggerShake();
        return;
      }
    }
    if (isMultiSelect) {
      if (selectedMulti.length === 0) {
        setVariantError(true);
        triggerShake();
        return;
      }
      const oosPicked = selectedMulti.filter((v) => remainingForVariant(v) <= 0);
      if (oosPicked.length > 0) {
        toast.error(`${oosPicked.join(", ")} ${oosPicked.length > 1 ? "are" : "is"} out of stock`);
        return;
      }
      const shortQty = selectedMulti.find((v) => remainingForVariant(v) < qty);
      if (shortQty) {
        toast.error(`Only ${remainingForVariant(shortQty)} of "${shortQty}" available`);
        return;
      }
      selectedMulti.forEach((variantName) => {
        const variantPriceDiff = product.variants.find((v: any) => v.name === variantName)?.price_diff || 0;
        // Use sale price if available (sale price overrides the base; variant diff still applies on top)
        const saleGbp = activeSalePriceGbp && activeSalePriceGbp > 0 ? activeSalePriceGbp : null;
        const effectiveBaseRaw = activeSalePrice !== null
          ? (region === "UK" ? saleGbp : activeSalePrice)
          : getRegionPrice(basePrice);
        if (effectiveBaseRaw === null) {
          toast.error("GBP price not set for this product. Please contact us.");
          return;
        }
        const effectiveBase = effectiveBaseRaw;
        for (let i = 0; i < qty; i++) {
          addToCart({
            productId: productIdForCart,
            name: product.name,
            image: allImages[0] || product.image,
            price: (activeSalePrice !== null ? activeSalePrice + variantPriceDiff : basePrice + variantPriceDiff) + withTextExtraPkr,
            priceGbp: gbpPrice ? (effectiveBase + variantPriceDiff + withTextExtraGbp) : undefined,
            size: variantName,
            style: "accessory",
            customisation: { Style: variantName, ...buildCustomInputCustomisation() },
          });
        }
      });
      toast(`${selectedMulti.length * qty} item(s) added to cart!`);
    } else if (hasVariants) {
      if (!selectedVariant) {
        setVariantError(true);
        triggerShake();
        return;
      }
      const remaining = remainingForVariant(selectedVariant);
      if (remaining <= 0) {
        toast.error(`${selectedVariant} is out of stock`);
        return;
      }
      if (qty > remaining) {
        toast.error(`Only ${remaining} of "${selectedVariant}" available`);
        return;
      }
      const variantPriceDiff = selectedVariantObj?.price_diff || 0;
      const saleGbpV = activeSalePriceGbp && activeSalePriceGbp > 0 ? activeSalePriceGbp : null;
      const effectiveBaseForVariantRaw = activeSalePrice !== null
        ? (region === "UK" ? saleGbpV : activeSalePrice)
        : getRegionPrice(basePrice);
      if (effectiveBaseForVariantRaw === null) {
        toast.error("GBP price not set for this product. Please contact us.");
        return;
      }
      const effectiveBaseForVariant = effectiveBaseForVariantRaw;
      for (let i = 0; i < qty; i++) {
        addToCart({
          productId: productIdForCart,
          name: product.name,
          image: allImages[0] || product.image,
          price: (activeSalePrice !== null ? activeSalePrice + variantPriceDiff : basePrice + variantPriceDiff) + withTextExtraPkr,
          priceGbp: gbpPrice ? (effectiveBaseForVariant + variantPriceDiff + withTextExtraGbp) : undefined,
          size: selectedVariant,
          style: "accessory",
          customisation: { Style: selectedVariant, ...buildCustomInputCustomisation() },
        });
      }
      toast(`${product.name} (${selectedVariant}) added to cart!`);
    } else {
      if (totalRemaining !== Infinity && totalRemaining <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }
      if (totalRemaining !== Infinity && qty > totalRemaining) {
        toast.error(`Only ${totalRemaining} available`);
        return;
      }
      const saleGbpNV = activeSalePriceGbp && activeSalePriceGbp > 0 ? activeSalePriceGbp : null;
      const effectiveBaseNoVariantRaw = activeSalePrice !== null
        ? (region === "UK" ? saleGbpNV : activeSalePrice)
        : getRegionPrice(basePrice);
      if (effectiveBaseNoVariantRaw === null) {
        toast.error("GBP price not set for this product. Please contact us.");
        return;
      }
      const effectiveBaseNoVariant = effectiveBaseNoVariantRaw;
      const noVariantCustomisation = buildCustomInputCustomisation();
      for (let i = 0; i < qty; i++) {
        addToCart({
          productId: productIdForCart,
          name: product.name,
          image: allImages[0] || product.image,
          price: (activeSalePrice !== null ? activeSalePrice : basePrice) + withTextExtraPkr,
          priceGbp: gbpPrice ? (effectiveBaseNoVariant + withTextExtraGbp) : undefined,
          size: "One Size",
          style: "accessory",
          ...(Object.keys(noVariantCustomisation).length > 0 ? { customisation: noVariantCustomisation } : {}),
        });
      }
      toast(`${product.name} added to cart!`);
    }
  };

  return (
    <main className="bg-background min-h-screen">
      <style>{`
        @keyframes shakeField {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-5px); }
          30%      { transform: translateX(5px); }
          45%      { transform: translateX(-4px); }
          60%      { transform: translateX(4px); }
          75%      { transform: translateX(-2px); }
          90%      { transform: translateX(2px); }
        }
        .shake-field { animation: shakeField 0.55s ease; }
      `}</style>

      <Navbar />

      <div className="px-10 pt-6">
        <Link
          to={location.state?.from || (() => {
            const cat = (categoriesForBack as any[]).find((c) => c.name === (rawProduct as any)?.category);
            if (cat) return cat.is_legacy ? cat.legacy_href : `/category/${cat.slug}`;
            return (rawProduct as any)?.category === "Bagcharms" ? "/bagcharms" : "/accessories";
          })()}
          className="text-foreground font-serif text-sm no-underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          ← Back
        </Link>
      </div>

      <div className="max-w-[1000px] mx-auto mt-10 px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-start pb-20">

        {/* Image viewer */}
        <div>
          <div className="rounded-[1.5rem] overflow-hidden bg-secondary aspect-[3/4] relative cursor-zoom-in"
            onClick={() => allImages.length > 0 && setLightboxOpen(true)}>
            {allImages.length > 0 ? (
              <img src={allImages[imgIndex]} alt={product.name} className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const p = (e.currentTarget as HTMLImageElement).parentElement;
                  if (p) p.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem">🌶️</div>';
                }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🌶️</div>
            )}

            {/* Low stock badge */}
            {isLowStock && !isOOS && (
              <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, background: "#FEF08A", color: "#854D0E", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)" }}>
                Few items left
              </div>
            )}

            {allImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i - 1 + allImages.length) % allImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border-none flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-colors">
                  <ChevronLeft size={18} className="text-foreground" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i + 1) % allImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border-none flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-colors">
                  <ChevronRight size={18} className="text-foreground" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                      className="border-none cursor-pointer rounded-full transition-all"
                      style={{ width: i === imgIndex ? 20 : 8, height: 8, backgroundColor: i === imgIndex ? "hsl(var(--primary))" : "rgba(255,255,255,0.7)" }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {allImages.map((src: string, i: number) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer"
                  style={{ borderColor: i === imgIndex ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                  <img src={src} alt={`view ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="pt-4">
          <h1 className="text-foreground font-serif text-4xl font-black mb-2">{product.name}</h1>

          {/* Price */}
          {activeSalePrice !== null ? (
            <div className="mb-8">
              {/* Sale price display */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <p className="font-serif text-lg" style={{ textDecoration: "line-through", opacity: 0.5 }}>
                  {formatPrice(basePrice, (dbProduct as any)?.price_gbp)}
                </p>
                <p className="text-foreground font-serif text-2xl font-bold" style={{ color: "#dc2626" }}>
                  {region === "UK"
                    ? activeSalePriceGbp
                      ? `£${Number(activeSalePriceGbp).toLocaleString("en-GB")}`
                      : `£${Number((dbProduct as any)?.price_gbp ?? 0).toLocaleString("en-GB")}`
                    : `Rs. ${Number(activeSalePrice).toLocaleString()}`}
                </p>
                <span style={{
                  background: "#dc2626", color: "#fff",
                  fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.7rem",
                  padding: "3px 10px", borderRadius: "2rem", letterSpacing: "0.05em",
                }}>
                  -{Math.round(((basePrice - activeSalePrice) / basePrice) * 100)}%
                </span>
              </div>
            </div>
          ) : isMultiSelect && selectedMulti.length > 0 ? (
            <>
              <p className="text-foreground font-serif text-lg font-bold mb-1">{formatPrice(basePrice, (dbProduct as any)?.price_gbp)} each</p>
              <p className="text-foreground font-serif text-2xl font-bold mb-8">
                Total: {region === "UK" ? `£${((dbProduct as any)?.price_gbp ?? 0 * selectedMulti.length * qty).toLocaleString("en-GB")}` : `Rs. ${multiTotal.toLocaleString()}`}
                <span className="text-sm font-normal opacity-60 ml-2">({selectedMulti.length} × {qty})</span>
              </p>
            </>
          ) : (
            <p className="text-foreground font-serif text-2xl font-bold mb-8">
              {formatPrice(isMultiSelect ? basePrice : singleTotal / qty, (dbProduct as any)?.price_gbp)}
              {isMultiSelect && <span className="text-sm font-normal opacity-60 ml-2">each</span>}
            </p>
          )}

          {/* Variants grouped by label */}
          {hasVariants && groupKeys.map((label) => (
            <div key={label} className="mb-6">
              <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">
                {label}
                {isGroupRequired(label) ? (
                  <span style={{ color: "#8B1A2F", marginLeft: 2 }}>*</span>
                ) : (
                  <span className="font-normal opacity-50 text-xs ml-2">(optional)</span>
                )}
                {isMultiSelect && <span className="font-normal opacity-50 text-xs ml-2">(select multiple)</span>}
              </p>
              <div
                className={shakeVariant ? "shake-field" : ""}
                style={{
                  display: "flex", gap: "0.5rem", flexWrap: "wrap",
                  padding: "8px 10px", borderRadius: "0.85rem",
                  border: variantError ? "1.5px solid #8B1A2F" : "1.5px solid transparent",
                  background: variantError ? "rgba(139,26,47,0.04)" : "transparent",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                {variantGroups[label].map((v) => {
                  const isActive = isMultiSelect ? selectedMulti.includes(v.name) : selectedVariant === v.name;
                  const vStock = getVariantStock(v.name);
                  const vOut = vStock !== Infinity && vStock <= 0;
                  const vLow = vStock !== Infinity && vStock > 0 && vStock <= LOW_STOCK_THRESHOLD;
                  return (
                    <div key={v.name} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          if (vOut) return;
                          isMultiSelect ? toggleMulti(v.name) : setSelectedVariant(v.name);
                          setVariantError(false);
                        }}
                        disabled={vOut}
                        className="px-5 py-2 rounded-full font-serif text-sm font-bold transition-all duration-200 border-2"
                        style={{
                          cursor: vOut ? "not-allowed" : "pointer",
                          borderColor: isActive && !vOut ? "hsl(var(--primary))" : "hsl(var(--border))",
                          backgroundColor: isActive && !vOut ? "hsl(var(--primary))" : "transparent",
                          color: vOut ? "hsl(var(--muted-foreground))" : isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                          opacity: vOut ? 0.45 : 1,
                          textDecoration: vOut ? "line-through" : "none",
                        }}>
                        {v.name}{v.price_diff > 0 ? ` +${v.price_diff}` : v.price_diff < 0 ? ` ${v.price_diff}` : ""}
                      </button>
                      {vLow && (
                        <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: "#B45309" }}>
                          {vStock} left
                        </span>
                      )}
                      {vOut && (
                        <span style={{ fontFamily: "Georgia, serif", fontSize: "0.62rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>
                          Sold out
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {variantError && (
                <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.73rem", color: "#8B1A2F", marginTop: "0.35rem", marginLeft: "0.5rem" }}>
                  Please select {isMultiSelect ? "at least one option" : `a ${label.toLowerCase()}`} to continue
                </p>
              )}
            </div>
          ))}

          {/* Custom input fields (incl. "with text" toggle-button system) */}
          {customInputs.length > 0 && (() => {
            const inputStyle: React.CSSProperties = {
              width: "100%",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "hsl(var(--foreground))",
              background: "hsl(var(--background))",
              border: "1.5px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              padding: "0.55rem 0.85rem",
              outline: "none",
              boxSizing: "border-box",
            };
            return (
              <div style={{ marginBottom: "1.75rem" }}>
                {customInputs.map((ci) => {
                  const hasErr = customErrors.includes(ci.id);
                  const withTextActive = selectedWithText[ci.id];
                  const hasWithText = !!ci.with_text_heading;
                  return (
                    <div key={ci.id} style={{ marginBottom: "1.1rem" }}>
                      {/* With-text heading + color button */}
                      {hasWithText && (
                        <div style={{ marginBottom: "0.5rem" }}>
                          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", color: "hsl(var(--foreground))", marginBottom: "0.4rem" }}>
                            {ci.with_text_heading}{ci.compulsory && <span style={{ color: "#8B1A2F", marginLeft: 2 }}>*</span>}
                            {withTextActive && (
                              <span style={{ fontWeight: 400, color: "hsl(var(--muted-foreground))", marginLeft: 8, fontSize: "0.78rem" }}>
                                — {(ci.with_text_color || "Black").toLowerCase()}
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedWithText((prev) => ({ ...prev, [ci.id]: !prev[ci.id] }))}
                            style={{
                              fontFamily: "Georgia, 'Times New Roman', serif",
                              fontSize: "0.82rem", fontWeight: 700,
                              padding: "6px 16px", borderRadius: "999px",
                              border: "2px solid",
                              borderColor: withTextActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                              background: withTextActive ? "hsl(var(--primary))" : "transparent",
                              color: withTextActive ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            {(ci.with_text_color || "Black").toLowerCase()}
                            {ci.price_pkr && region !== "UK" ? ` +Rs. ${ci.price_pkr.toLocaleString()}` : ""}
                            {ci.price_gbp && region === "UK" ? ` +£${Number(ci.price_gbp).toFixed(2)}` : ""}
                          </button>
                        </div>
                      )}

                      {/* Text input: always show when no with-text heading, or show after button clicked */}
                      {(!hasWithText || withTextActive) && (
                        <>
                          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", color: "hsl(var(--foreground))", marginBottom: "0.5rem" }}>
                            {ci.label}{(ci.required || (ci.compulsory && withTextActive)) && <span style={{ color: "#8B1A2F", marginLeft: 2 }}>*</span>}
                          </p>

                          {ci.type === "text" && (
                            <input type="text" value={customValues[ci.id] || ""}
                              onChange={(e) => { setCustomValues((prev) => ({ ...prev, [ci.id]: e.target.value })); setCustomErrors((x) => x.filter((k) => k !== ci.id)); }}
                              placeholder={ci.placeholder || ""}
                              style={{ ...inputStyle, borderColor: hasErr ? "#8B1A2F" : "hsl(var(--border))" }} />
                          )}
                          {ci.type === "date" && (
                            <input type="date" value={customValues[ci.id] || ""}
                              onChange={(e) => { setCustomValues((prev) => ({ ...prev, [ci.id]: e.target.value })); setCustomErrors((x) => x.filter((k) => k !== ci.id)); }}
                              style={{ ...inputStyle, borderColor: hasErr ? "#8B1A2F" : "hsl(var(--border))" }} />
                          )}
                          {ci.type === "select" && ci.options && (
                            <select value={customValues[ci.id] || ""}
                              onChange={(e) => { setCustomValues((prev) => ({ ...prev, [ci.id]: e.target.value })); setCustomErrors((x) => x.filter((k) => k !== ci.id)); }}
                              style={{ ...inputStyle, borderColor: hasErr ? "#8B1A2F" : "hsl(var(--border))", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2rem" }}>
                              <option value="">Select…</option>
                              {ci.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          {ci.type === "color" && ci.options && ci.options.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem", padding: "8px 10px", borderRadius: "0.85rem", border: hasErr ? "1.5px solid #8B1A2F" : "1.5px solid transparent" }}>
                              {ci.options.map((col) => {
                                const isSelected = customValues[ci.id] === col;
                                return (
                                  <button type="button" key={col} title={col}
                                    onClick={() => { setCustomValues((prev) => ({ ...prev, [ci.id]: col })); setCustomErrors((x) => x.filter((k) => k !== ci.id)); }}
                                    style={{ width: 34, height: 34, borderRadius: "50%", background: col, border: isSelected ? "3px solid hsl(var(--primary))" : "2px solid hsl(var(--border))", cursor: "pointer", outline: isSelected ? "2px solid hsl(var(--primary))" : "none", outlineOffset: 2, transition: "all 0.15s" }} />
                                );
                              })}
                              {customValues[ci.id] && (
                                <span style={{ fontFamily: "inherit", fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", alignSelf: "center", marginLeft: 4 }}>{customValues[ci.id]}</span>
                              )}
                            </div>
                          )}
                          {hasErr && (
                            <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.73rem", color: "#8B1A2F", marginTop: "0.3rem" }}>
                              This field is required
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Stock status */}
          {isLowStock && !isOOS && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 14px", marginBottom: 12 }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700, color: "#92400e", margin: 0 }}>
                ⚠ Only {selectionRemaining} left — order soon!
              </p>
            </div>
          )}

          {/* Quantity */}
          <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Quantity</p>
          <div className="mb-10">
            <QuantityStepper value={qty} onChange={setQty} max={selectionRemaining === Infinity ? undefined : selectionRemaining} />
          </div>

          {/* Add to cart */}
          {isOOS ? (
            <button disabled className="w-full border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", cursor: "not-allowed", opacity: 0.65 }}>
              Out of Stock
            </button>
          ) : (
            <button onClick={handleAdd}
              className="w-full bg-primary text-primary-foreground border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
              Add to Cart
            </button>
          )}

          {/* Description */}
          {product.description && (
            <div className="border-t border-border mt-6">
              <button type="button" onClick={() => setDescOpen((p) => !p)}
                className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer text-foreground font-serif text-base font-bold">
                Description
                <span className="text-xl transition-transform duration-200" style={{ transform: descOpen ? "rotate(180deg)" : "rotate(0)" }}>⌄</span>
              </button>
              {descOpen && (
                <p className="text-foreground font-serif text-sm leading-relaxed opacity-75 pb-4">{product.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && allImages.length > 0 && (
        <Lightbox src={allImages[imgIndex]} onClose={() => setLightboxOpen(false)} />
      )}

      <Footer />
    </main>
  );
};

export default AccessoryDetail;