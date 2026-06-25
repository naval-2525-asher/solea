import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSaleProducts } from "@/hooks/useAdminData";
import { useRegion } from "@/context/RegionContext";
import { getStyleSizeStock, LOW_STOCK_THRESHOLD } from "@/lib/inventory";

type VariantOption = { label: string; name: string; price_diff: number };
type CustomInput = {
  id: string;
  label: string;
  type: "text" | "date" | "color" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "92vh" }}>
      <button type="button" onClick={onClose} style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%", background: "#8B1A2F", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
      <img src={src} alt="Full size" style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 12, objectFit: "contain", display: "block" }} />
    </div>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();

  const { data: dbProduct, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  const staticProduct = staticProducts.find((p) => p.id === Number(id));
  const product = dbProduct || staticProduct;
  const { addToCart, items: cartItems } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"tee" | "tank">("tee");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(1);
    setQuantityError("");
  }, [selectedSize, selectedType]);

  // Once dbProduct loads, set correct default style based on available_as
  useEffect(() => {
    if (!dbProduct) return;
    const availableAs: string[] = (dbProduct as any)?.available_as || [];
    const hasTee = availableAs.length === 0 || availableAs.includes("tee");
    const hasTank = availableAs.length === 0 || availableAs.includes("tank");
    if (!hasTee && hasTank) setSelectedType("tank");
    else setSelectedType("tee");
  }, [(dbProduct as any)?.id]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, VariantOption>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideZoomed, setSizeGuideZoomed] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // validation
  const [shakeGroups, setShakeGroups] = useState<string[]>([]);
  const [errorGroups, setErrorGroups] = useState<string[]>([]);
  const [customErrors, setCustomErrors] = useState<string[]>([]);

  // Sale data — must be before any early returns (React rules of hooks)
  const { data: saleData = [] } = useSaleProducts();
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState("");
  const { region, formatPrice } = useRegion();

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1000px] mx-auto mt-10 px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-start pb-20">
          <div className="rounded-[1.5rem] bg-secondary/30 aspect-[3/4] animate-pulse" />
          <div className="pt-4 space-y-4">
            <div className="h-8 bg-secondary/30 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-secondary/30 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-foreground font-serif text-xl">Product not found.</p>
      </main>
    );
  }

  // Stock from inventory — placed after early returns so product is defined
  const rawStock = (dbProduct as any)?.stock_count;
  const stockCount: number = (rawStock !== null && rawStock !== undefined) ? Number(rawStock) : Infinity;

  const dbSizes: string[] = dbProduct?.sizes || [];
  const staticSizes = (product as any).sizes || ["S", "M", "L", "XL"];
  const availableSizes = dbSizes.length > 0 ? dbSizes : staticSizes;

  const isTeeProduct = dbProduct?.category === "Tees & Tank Tops" ||
    (product as any).category === "beaded tee" || (product as any).category === "beaded tank";
  const isLimited = dbProduct?.category === "Limited Edition";
  const hasSizes = isTeeProduct || isLimited;

  const availableAs: string[] = (dbProduct as any)?.available_as || [];
  const teeSizes  = availableSizes.filter((s: string) => s !== "XL" ? true : true); // all sizes including XL
  const tankSizes = availableSizes.filter((s: string) => s !== "XL");

  // For limited edition and tees-tanks: show sizes matching the selected style
  // If available_as has only "tank", always show tank sizes regardless of selectedType
  const effectiveType: "tee" | "tank" =
    (isTeeProduct || isLimited)
      ? (availableAs.includes("tank") && !availableAs.includes("tee") ? "tank"
        : availableAs.includes("tee") && !availableAs.includes("tank") ? "tee"
        : selectedType)
      : selectedType;

  const currentSizes = (isTeeProduct || isLimited)
    ? (effectiveType === "tee" ? teeSizes : tankSizes)
    : availableSizes;

  // Tee and Tank stock are tracked as separate pools per size — a Tee S and
  // a Tank S sale never touch the same number.
  const getSizeStock = (size: string): number => {
    if (!hasSizes) return stockCount;
    return getStyleSizeStock(dbProduct, effectiveType, size);
  };

  // Subtract what's already sitting in the cart so the customer can never
  // add more than what's truly left.
  const inCartQty = (size: string | null): number => {
    if (!size) return 0;
    return cartItems
      .filter((i) => i.productId === (typeof product.id === "number" ? product.id : 9999) && i.size === size && i.style === (hasSizes ? effectiveType : "tee"))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const remainingForSize = (size: string): number => {
    const raw = getSizeStock(size);
    return raw === Infinity ? Infinity : Math.max(0, raw - inCartQty(size));
  };

  const selectedSizeStock = hasSizes
    ? (selectedSize ? remainingForSize(selectedSize) : Infinity)
    : (stockCount === Infinity ? Infinity : Math.max(0, stockCount - inCartQty(null)));

  const allSizesOOS = hasSizes && currentSizes.length > 0 && currentSizes.every((s: string) => getSizeStock(s) <= 0);
  const isLowStock = hasSizes
    ? (selectedSize ? (selectedSizeStock > 0 && selectedSizeStock <= LOW_STOCK_THRESHOLD) : false)
    : (stockCount > 0 && stockCount <= LOW_STOCK_THRESHOLD);
  const isOOS = stockCount === 0 || (product as any).stock_status === "out_of_stock" || (product as any).stock_status === "Out of Stock" || allSizesOOS
    || (hasSizes && !!selectedSize && getSizeStock(selectedSize) <= 0);

  const allImages: string[] = (() => {
    if (dbProduct) {
      const imgs = dbProduct.images as string[] | null;
      if (imgs && imgs.length > 0) return imgs;
      return dbProduct.image ? [dbProduct.image] : [];
    }
    const sp = product as any;
    if (sp.images && sp.images.length > 0) return sp.images;
    return sp.image ? [sp.image] : [];
  })();

  const sizeGuideImage = effectiveType === "tee"
    ? ((dbProduct as any)?.size_guide_tee || "/images/size-guide-tees.png")
    : ((dbProduct as any)?.size_guide_tank || "/images/size-guide-tanks.jpg");

  const variants: VariantOption[] = ((dbProduct as any)?.variants || (product as any).variants || []).filter((v: any) => v && v.name);
  const customInputs: CustomInput[] = ((dbProduct as any)?.custom_inputs || (product as any).custom_inputs || []).filter((ci: any) => ci && ci.id);

  const variantGroups: Record<string, VariantOption[]> = {};
  variants.forEach((v) => {
    if (!variantGroups[v.label]) variantGroups[v.label] = [];
    variantGroups[v.label].push(v);
  });

  // Per-style color circles — driven by admin's tee_colors / tank_colors picks
  const PRESET_COLOR_HEX: Record<string, string> = {
    Black: "#000000", White: "#FFFFFF", Red: "#DC2626",
    Pink: "#F9A8D4", Yellow: "#FDE047", Blue: "#3B82F6",
    Green: "#22C55E", Purple: "#A855F7", Other: "#D4A574",
  };
  const teeColors: string[] = (dbProduct as any)?.tee_colors || [];
  const tankColors: string[] = (dbProduct as any)?.tank_colors || [];
  const activeColors = selectedType === "tee" ? teeColors : tankColors;

  const extraPrice = Object.values(selectedVariants).reduce((sum, v) => sum + (v.price_diff || 0), 0);
  const displayPrice = (product.price || 0) + extraPrice;

  const saleItem = (saleData as any[]).find((s: any) => s.product_id === product.id);
  const salePrice = saleItem ? Number(saleItem.sale_price) + extraPrice : null;
  const salePriceGbp = saleItem?.sale_price_gbp != null ? Number(saleItem.sale_price_gbp) + extraPrice : null;
  const discount = salePrice
    ? region === "UK" && salePriceGbp && (dbProduct as any)?.price_gbp
      ? Math.round((((dbProduct as any).price_gbp - saleItem.sale_price_gbp) / (dbProduct as any).price_gbp) * 100)
      : Math.round(((product.price - saleItem.sale_price) / product.price) * 100)
    : null;

  const handleTypeChange = (type: "tee" | "tank") => {
    setSelectedType(type);
    setSelectedColor(null);
    const sizesForType = type === "tee" ? teeSizes : tankSizes;
    if (selectedSize && (!sizesForType.includes(selectedSize) || getStyleSizeStock(dbProduct, type, selectedSize) <= 0)) {
      setSelectedSize(null);
    }
  };

  const triggerShake = (groups: string[]) => {
    setShakeGroups(groups);
    setTimeout(() => setShakeGroups([]), 600);
  };

  const handleAddToCart = () => {
    // 1. Size validation
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    // 1b. Size stock validation — block out-of-stock sizes outright
    if (hasSizes && selectedSize && getSizeStock(selectedSize) <= 0) {
      toast.error(`${selectedSize} is out of stock.`);
      return;
    }

    // 2. Variant group validation
    const missingVariants = Object.keys(variantGroups).filter((g) => !selectedVariants[g]);
    if (missingVariants.length > 0) {
      setErrorGroups(missingVariants);
      triggerShake(missingVariants);
      return;
    }

    // 3. Required custom input validation
    const missingInputs = customInputs.filter((ci) => ci.required && !customValues[ci.id]?.trim()).map((ci) => ci.id);
    if (missingInputs.length > 0) {
      setCustomErrors(missingInputs);
      triggerShake([]);
      toast.error("Please fill all required fields");
      return;
    }

    setErrorGroups([]);
    setCustomErrors([]);

    // Stock quantity validation — accounts for what's already sitting in the cart
    if (selectedSizeStock !== Infinity && quantity > selectedSizeStock) {
      setQuantityError(
        hasSizes
          ? `Only ${selectedSizeStock} of size ${selectedSize} available (some may already be in your cart).`
          : `Only ${selectedSizeStock} of this item available in stock.`
      );
      return;
    }
    setQuantityError("");

    // Build customisation record for cart display
    const customisation: Record<string, string> = {};
    // Add variant selections
    Object.entries(selectedVariants).forEach(([label, opt]) => {
      customisation[label] = opt.name;
    });
    if (selectedColor) customisation["Colour"] = selectedColor;
    // Add custom input values
    customInputs.forEach((ci) => {
      if (customValues[ci.id]) {
        customisation[ci.label] = customValues[ci.id];
      }
    });

    const regionPrice = region === "UK"
      ? (salePriceGbp ?? (((dbProduct as any)?.price_gbp ?? 0) + extraPrice))
      : (salePrice ?? displayPrice);

    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: (dbProduct as any)?.id ?? (typeof product.id === "number" ? product.id : 9999),
        name: product.name,
        image: allImages[0] || (product as any).image || "",
        price: regionPrice,
        size: selectedSize || "One Size",
        style: hasSizes ? effectiveType : "tee",
        customisation: Object.keys(customisation).length > 0 ? customisation : undefined,
      });
    }
    toast.success(`${product.name} added to cart!`);
  };

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
          to={
            dbProduct?.category === "Limited Edition" ? "/limited-edition"
            : dbProduct?.category === "Accessories"   ? "/accessories"
            : "/shop"
          }
          className="text-foreground font-serif text-sm no-underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          ← Back
        </Link>
      </div>

      <div className="max-w-[1000px] mx-auto mt-10 px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-start pb-20">

        {/* Images */}
        <div>
          <div className="rounded-[1.5rem] overflow-hidden bg-secondary aspect-[3/4] relative cursor-zoom-in"
            onClick={() => allImages.length > 0 && setLightboxOpen(true)}>
            {allImages.length > 0 ? (
              <img src={allImages[imgIndex]} alt={product.name} className="w-full h-full object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const parent = (e.currentTarget as HTMLImageElement).parentElement;
                  if (parent) parent.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem">🪡</div>';
                }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🪡</div>
            )}

            {/* Low stock badge */}
            {isLowStock && !isOOS && (
              <div style={{
                position: "absolute", top: 10, right: 10, zIndex: 10,
                background: "#FEF08A", color: "#854D0E",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "11px", fontWeight: 700,
                padding: "3px 10px", borderRadius: "999px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
              }}>
                Few items left
              </div>
            )}

            {allImages.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i - 1 + allImages.length) % allImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border-none flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-colors">
                  <ChevronLeft size={18} className="text-foreground" />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setImgIndex((i) => (i + 1) % allImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border-none flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-colors">
                  <ChevronRight size={18} className="text-foreground" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button type="button" key={i} onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                      className="border-none cursor-pointer rounded-full transition-all"
                      style={{ width: i === imgIndex ? 20 : 8, height: 8, backgroundColor: i === imgIndex ? "hsl(var(--primary))" : "rgba(255,255,255,0.7)" }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {allImages.map((src, i) => (
                <button type="button" key={i} onClick={() => setImgIndex(i)}
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
          {salePrice ? (
            <div className="flex items-center gap-3 mb-8">
              <p className="text-foreground font-serif text-2xl font-bold">
                {region === "UK"
                  ? salePriceGbp
                    ? `£${salePriceGbp.toLocaleString("en-GB")}`
                    : `£${(((dbProduct as any)?.price_gbp ?? 0) + extraPrice).toLocaleString("en-GB")}`
                  : `Rs. ${salePrice.toLocaleString()}`}
              </p>
              <p className="font-serif text-lg" style={{ textDecoration: "line-through", opacity: 0.45 }}>
                {formatPrice(displayPrice, (dbProduct as any)?.price_gbp ?? 0)}
              </p>
              {discount !== null && (
                <span style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.7rem", padding: "3px 10px", borderRadius: "2rem" }}>
                  -{discount}%
                </span>
              )}
            </div>
          ) : (
            <p className="text-foreground font-serif text-2xl font-bold mb-8">
              {formatPrice(displayPrice, ((dbProduct as any)?.price_gbp ?? 0) + extraPrice)}
              {extraPrice > 0 && region === "PK" && <span className="text-sm font-normal text-muted-foreground ml-2">(+Rs. {extraPrice.toLocaleString()} for selected option)</span>}
              {extraPrice > 0 && region === "UK" && <span className="text-sm font-normal text-muted-foreground ml-2">(+£{extraPrice.toLocaleString("en-GB")} for selected option)</span>}
            </p>
          )}

          {/* Style toggle */}
          {(isTeeProduct || isLimited) && (() => {
            const availableAs: string[] = (dbProduct as any)?.available_as || [];
            const hasTee = availableAs.length === 0 || availableAs.includes("tee");
            const hasTank = availableAs.length === 0 || availableAs.includes("tank");
            if (!hasTee || !hasTank) return null;
            return (
              <>
                <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Style</p>
                <div className="flex gap-2 mb-8">
                  {(["tee", "tank"] as const).filter((t) => availableAs.length === 0 || availableAs.includes(t)).map((type) => (
                    <button type="button" key={type} onClick={() => handleTypeChange(type)}
                      className="px-6 py-2 rounded-full font-serif text-sm font-bold cursor-pointer transition-all duration-200 border-2"
                      style={{ borderColor: selectedType === type ? "hsl(var(--primary))" : "hsl(var(--border))", backgroundColor: selectedType === type ? "hsl(var(--primary))" : "transparent", color: selectedType === type ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
                      {type === "tee" ? "Tee" : "Tank"}
                    </button>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Size */}
          {currentSizes.length > 0 && (
            <>
              <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Size</p>
              <div className="flex gap-2 mb-1 flex-wrap">
                {currentSizes.map((size: string) => {
                  const stock = getSizeStock(size);
                  const sizeOut = stock !== Infinity && stock <= 0;
                  const sizeLow = stock !== Infinity && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                  return (
                  <div key={size} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
                    <button type="button"
                      onClick={() => !sizeOut && setSelectedSize(size)}
                      disabled={sizeOut}
                      className="w-12 h-12 rounded-full font-serif text-sm font-bold transition-all duration-200 border-2"
                      style={{
                        cursor: sizeOut ? "not-allowed" : "pointer",
                        borderColor: sizeOut ? "hsl(var(--border))" : selectedSize === size ? "hsl(var(--primary))" : "hsl(var(--border))",
                        backgroundColor: selectedSize === size && !sizeOut ? "hsl(var(--primary))" : "transparent",
                        color: sizeOut ? "hsl(var(--muted-foreground))" : selectedSize === size ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                        opacity: sizeOut ? 0.45 : 1,
                        textDecoration: sizeOut ? "line-through" : "none",
                      }}>
                      {size}
                    </button>
                    {sizeLow && (
                      <span style={{ fontFamily: "Georgia, serif", fontSize: "0.65rem", fontWeight: 700, color: "#B45309", whiteSpace: "nowrap" }}>
                        {stock} left
                      </span>
                    )}
                    {sizeOut && (
                      <span style={{ fontFamily: "Georgia, serif", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>
                        Sold out
                      </span>
                    )}
                  </div>
                  );
                })}
              </div>
              <div className="mb-7" />
            </>
          )}

          {/* Color circles — shown per active style (tee/tank), only if admin set any */}
          {hasSizes && activeColors.length > 0 && (
            <div style={{ marginBottom: "1.75rem" }}>
              <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", color: "hsl(var(--foreground))", marginBottom: "0.5rem" }}>
                Color
                {selectedColor && (
                  <span style={{ fontWeight: 400, color: "hsl(var(--muted-foreground))", marginLeft: 8, fontSize: "0.78rem" }}>— {selectedColor}</span>
                )}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {activeColors.map((colorName) => {
                  const hex = PRESET_COLOR_HEX[colorName] || "#888";
                  const isSelected = selectedColor === colorName;
                  return (
                    <button
                      type="button"
                      key={colorName}
                      title={colorName}
                      onClick={() => setSelectedColor(isSelected ? null : colorName)}
                      style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: hex,
                        border: isSelected ? "3px solid hsl(var(--primary))" : "2px solid hsl(var(--border))",
                        outline: isSelected ? "2px solid hsl(var(--primary))" : "none",
                        outlineOffset: 2,
                        cursor: "pointer",
                        boxShadow: colorName === "White" ? "inset 0 0 0 1px #ccc" : "none",
                        position: "relative",
                        transition: "all 0.15s",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <span style={{
                          position: "absolute", inset: 0, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 900,
                          color: ["White", "Yellow", "Pink"].includes(colorName) ? "#000" : "#fff",
                        }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant groups */}
          {Object.entries(variantGroups).map(([groupLabel, options]) => {
            const selected = selectedVariants[groupLabel];
            const isColorGroup = groupLabel.toLowerCase() === "color" || groupLabel.toLowerCase() === "colour";
            const hasError = errorGroups.includes(groupLabel);
            const isShaking = shakeGroups.includes(groupLabel);
            return (
              <div key={groupLabel} style={{ marginBottom: "1.75rem" }}>
                <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", color: "hsl(var(--foreground))", marginBottom: "0.5rem" }}>
                  {groupLabel}
                  <span style={{ color: "#8B1A2F", marginLeft: 2 }}>*</span>
                  {selected && !isColorGroup && (
                    <span style={{ fontWeight: 400, color: "hsl(var(--muted-foreground))", marginLeft: 6 }}>— {selected.name}</span>
                  )}
                </p>
                <div
                  className={isShaking ? "shake-field" : ""}
                  style={{
                    display: "flex", flexWrap: "wrap", gap: "0.5rem",
                    padding: "8px 10px", borderRadius: "0.85rem",
                    border: hasError ? "1.5px solid #8B1A2F" : "1.5px solid transparent",
                    background: hasError ? "rgba(139,26,47,0.04)" : "transparent",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  {options.map((opt) => {
                    const isSelected = selected?.name === opt.name;
                    if (isColorGroup) {
                      return (
                        <button type="button" key={opt.name} title={opt.name}
                          onClick={() => { setSelectedVariants((prev) => ({ ...prev, [groupLabel]: opt })); setErrorGroups((e) => e.filter((x) => x !== groupLabel)); }}
                          style={{ width: 32, height: 32, borderRadius: "50%", background: opt.name, border: isSelected ? "3px solid hsl(var(--primary))" : "2px solid hsl(var(--border))", cursor: "pointer", outline: isSelected ? "2px solid hsl(var(--primary))" : "none", outlineOffset: 2, transition: "all 0.15s" }} />
                      );
                    }
                    return (
                      <button type="button" key={opt.name}
                        onClick={() => { setSelectedVariants((prev) => ({ ...prev, [groupLabel]: opt })); setErrorGroups((e) => e.filter((x) => x !== groupLabel)); }}
                        style={{ padding: "0.4rem 1rem", borderRadius: "2rem", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", border: "2px solid", borderColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))", background: isSelected ? "hsl(var(--primary))" : "transparent", color: isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
                        {opt.name}{opt.price_diff !== 0 && <span style={{ fontSize: "0.68rem", marginLeft: 4, opacity: 0.75 }}>{region === "UK" ? `+£${opt.price_diff}` : `+Rs. ${opt.price_diff}`}</span>}
                      </button>
                    );
                  })}
                </div>
                {hasError && (
                  <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.73rem", color: "#8B1A2F", marginTop: "0.35rem", marginLeft: "0.5rem" }}>
                    Please select a {groupLabel.toLowerCase()} to continue
                  </p>
                )}
              </div>
            );
          })}

          {/* Custom input fields */}
          {customInputs.length > 0 && (
            <div style={{ marginBottom: "1.75rem" }}>
              {customInputs.map((ci) => {
                const hasErr = customErrors.includes(ci.id);
                return (
                  <div key={ci.id} style={{ marginBottom: "1.1rem" }}>
                    <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", color: "hsl(var(--foreground))", marginBottom: "0.5rem" }}>
                      {ci.label}{ci.required && <span style={{ color: "#8B1A2F", marginLeft: 2 }}>*</span>}
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Stock status */}
          {isLowStock && !isOOS && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 14px", marginBottom: 12 }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "0.78rem", fontWeight: 700, color: "#92400e", margin: 0 }}>
                ⚠ Only {selectedSizeStock} left{hasSizes && selectedSize ? ` in size ${selectedSize}` : " in stock"} — order soon!
              </p>
            </div>
          )}

          {/* Quantity selector */}
          {!isOOS && (
            <div className="mb-4">
              <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Quantity</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button"
                  onClick={() => {
                    if (hasSizes && !selectedSize) { toast.error("Please select a size first"); return; }
                    const q = Math.max(1, quantity - 1); setQuantity(q); setQuantityError("");
                  }}
                  disabled={hasSizes && !selectedSize}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid hsl(var(--border))", background: "transparent", cursor: hasSizes && !selectedSize ? "not-allowed" : "pointer", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "1.1rem", color: hasSizes && !selectedSize ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))", display: "flex", alignItems: "center", justifyContent: "center", opacity: hasSizes && !selectedSize ? 0.4 : 1 }}
                >−</button>
                <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "1rem", color: hasSizes && !selectedSize ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))", minWidth: 24, textAlign: "center", opacity: hasSizes && !selectedSize ? 0.4 : 1 }}>{quantity}</span>
                <button type="button"
                  onClick={() => {
                    if (hasSizes && !selectedSize) { toast.error("Please select a size first"); return; }
                    const max = selectedSizeStock !== Infinity ? selectedSizeStock : 99;
                    if (quantity >= max) {
                      setQuantityError(
                        hasSizes && selectedSize
                          ? `Only ${max} of size ${selectedSize} available.`
                          : `Only ${max} of this item available in stock.`
                      );
                      return;
                    }
                    setQuantity(quantity + 1);
                    setQuantityError("");
                  }}
                  disabled={hasSizes && !selectedSize}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid hsl(var(--border))", background: "transparent", cursor: hasSizes && !selectedSize ? "not-allowed" : "pointer", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "1.1rem", color: hasSizes && !selectedSize ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))", display: "flex", alignItems: "center", justifyContent: "center", opacity: hasSizes && !selectedSize ? 0.4 : 1 }}
                >+</button>
              </div>
              {hasSizes && !selectedSize && (
                <p style={{ fontFamily: "Georgia, serif", fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: 6 }}>Select a size to set quantity</p>
              )}
              {quantityError && (
                <p style={{ fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "#dc2626", marginTop: 6 }}>{quantityError}</p>
              )}
            </div>
          )}

          {/* Add to cart */}
          {isOOS ? (
            <button type="button" disabled className="w-full border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase mb-8"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", cursor: "not-allowed", opacity: 0.65 }}>
              Out of Stock
            </button>
          ) : (
            <button type="button" onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase cursor-pointer transition-transform duration-200 hover:scale-[1.02] mb-8">
              Add to Cart
            </button>
          )}

          {/* Accordions */}
          {(isTeeProduct || isLimited) && (() => {
            const availableAs: string[] = (dbProduct as any)?.available_as || [];
            const hasTee = availableAs.length === 0 || availableAs.includes("tee");
            const hasTank = availableAs.length === 0 || availableAs.includes("tank");
            const label = hasTee && hasTank
              ? `Size Guide — ${effectiveType === "tee" ? "Tee" : "Tank"}`
              : hasTank ? "Size Guide — Tank" : "Size Guide — Tee";
            return (
              <div className="border-t border-border">
                <button type="button" onClick={() => setSizeGuideOpen((p) => !p)}
                  className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer text-foreground font-serif text-base font-bold">
                  {label}
                  <span className="text-xl transition-transform duration-200" style={{ transform: sizeGuideOpen ? "rotate(180deg)" : "rotate(0)" }}>⌄</span>
                </button>
                {sizeGuideOpen && (
                  <div className="pb-4">
                    <img src={sizeGuideImage} alt="Size Guide" className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSizeGuideZoomed(true)} />
                  </div>
                )}
              </div>
            );
          })()}

          <div className="border-t border-border">
            <button type="button" onClick={() => setDescOpen((p) => !p)}
              className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer text-foreground font-serif text-base font-bold">
              Description
              <span className="text-xl transition-transform duration-200" style={{ transform: descOpen ? "rotate(180deg)" : "rotate(0)" }}>⌄</span>
            </button>
            {descOpen && <p className="text-foreground font-serif text-sm leading-relaxed opacity-75 pb-4">
              {(isTeeProduct || isLimited)
                ? (effectiveType === "tee"
                    ? ((dbProduct as any)?.tee_description || "")
                    : ((dbProduct as any)?.tank_description || ""))
                : product.description}
            </p>}
          </div>

          <div className="border-t border-b border-border">
            <button type="button" onClick={() => setCareOpen((p) => !p)}
              className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer text-foreground font-serif text-base font-bold">
              Care Instructions
              <span className="text-xl transition-transform duration-200" style={{ transform: careOpen ? "rotate(180deg)" : "rotate(0)" }}>⌄</span>
            </button>
            {careOpen && (
              <p className="text-foreground font-serif text-sm leading-relaxed opacity-75 pb-4">
                Hand wash cold. Do not tumble dry. Iron on reverse side only. Handle beaded embroidery with care — avoid snagging.
              </p>
            )}
          </div>
        </div>
      </div>

      {sizeGuideZoomed && (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[10vh]"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setSizeGuideZoomed(false)}>
          <div className="relative max-w-[500px] w-[90vw] mx-auto bg-card rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSizeGuideZoomed(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center font-black text-sm cursor-pointer border-none">✕</button>
            <img src={sizeGuideImage} alt="Size Guide" className="w-full h-auto block" />
          </div>
        </div>
      )}

      {lightboxOpen && allImages.length > 0 && (
        <Lightbox src={allImages[imgIndex]} onClose={() => setLightboxOpen(false)} />
      )}

      <Footer />
    </main>
  );
};

export default ProductDetail;