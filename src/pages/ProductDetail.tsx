import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSaleProducts } from "@/hooks/useAdminData";

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
      <button onClick={onClose} style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%", background: "#8B1A2F", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
      <img src={src} alt="Full size" style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 12, objectFit: "contain", display: "block" }} />
    </div>
  </div>
);

const LOW_STOCK_THRESHOLD = 5;

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
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"tee" | "tank">("tee");
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

  const dbSizes: string[] = dbProduct?.sizes || [];
  const staticSizes = (product as any).sizes || ["S", "M", "L", "XL"];
  const availableSizes = dbSizes.length > 0 ? dbSizes : staticSizes;

  const isTeeProduct = dbProduct?.category === "Tees & Tank Tops" ||
    (product as any).category === "beaded tee" || (product as any).category === "beaded tank";
  const isLimited = dbProduct?.category === "Limited Edition";
  const hasSizes = isTeeProduct || isLimited;

  const teeSizes = availableSizes;
  const tankSizes = availableSizes.filter((s: string) => s !== "XL");
  const currentSizes = isTeeProduct ? (selectedType === "tee" ? teeSizes : tankSizes) : availableSizes;

  const sizeGuideImage = selectedType === "tee" ? "/images/size-guide-tees.png" : "/images/size-guide-tanks.jpg";

  const variants: VariantOption[] = (dbProduct as any)?.variants || (product as any).variants || [];
  const customInputs: CustomInput[] = (dbProduct as any)?.custom_inputs || (product as any).custom_inputs || [];

  const variantGroups: Record<string, VariantOption[]> = {};
  variants.forEach((v) => {
    if (!variantGroups[v.label]) variantGroups[v.label] = [];
    variantGroups[v.label].push(v);
  });

  // Stock
  const isLowStock = (product as any).stock_status === "low_stock";
  const isOOS = (product as any).stock_status === "out_of_stock" || (product as any).stock_status === "Out of Stock";

  const extraPrice = Object.values(selectedVariants).reduce((sum, v) => sum + (v.price_diff || 0), 0);
  const displayPrice = (product.price || 0) + extraPrice;

  const saleItem = (saleData as any[]).find((s: any) => s.product_id === product.id);
  const salePrice = saleItem ? Number(saleItem.sale_price) + extraPrice : null;
  const discount = salePrice ? Math.round(((product.price - saleItem.sale_price) / product.price) * 100) : null;

  const handleTypeChange = (type: "tee" | "tank") => {
    setSelectedType(type);
    if (type === "tank" && selectedSize === "XL") setSelectedSize(null);
  };

  const triggerShake = (groups: string[]) => {
    setShakeGroups(groups);
    setTimeout(() => setShakeGroups([]), 600);
  };

  const handleAddToCart = () => {
    // 1. Size validation
    if (hasSizes && !selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
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
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setErrorGroups([]);
    setCustomErrors([]);

    // Build customisation record for cart display
    const customisation: Record<string, string> = {};
    // Add variant selections
    Object.entries(selectedVariants).forEach(([label, opt]) => {
      customisation[label] = opt.name;
    });
    // Add custom input values
    customInputs.forEach((ci) => {
      if (customValues[ci.id]) {
        customisation[ci.label] = customValues[ci.id];
      }
    });

    addToCart({
      productId: typeof product.id === "number" ? product.id : 9999,
      name: product.name,
      image: allImages[0] || (product as any).image || "",
      price: salePrice ?? displayPrice,
      size: selectedSize || "One Size",
      style: isTeeProduct ? selectedType : "tee",
      customisation: Object.keys(customisation).length > 0 ? customisation : undefined,
    });
    toast({ title: `${product.name} added to cart!` });
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
        <Link to="/shop" className="text-foreground font-serif text-sm no-underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
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
              {allImages.map((src, i) => (
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
          {salePrice ? (
            <div className="flex items-center gap-3 mb-8">
              <p className="text-foreground font-serif text-2xl font-bold">
                PKR {salePrice.toLocaleString()}
              </p>
              <p className="font-serif text-lg" style={{ textDecoration: "line-through", opacity: 0.45 }}>
                PKR {displayPrice.toLocaleString()}
              </p>
              <span style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: "0.7rem", padding: "3px 10px", borderRadius: "2rem" }}>
                -{discount}%
              </span>
            </div>
          ) : (
            <p className="text-foreground font-serif text-2xl font-bold mb-8">
              PKR {displayPrice.toLocaleString()}
              {extraPrice > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">(+PKR {extraPrice.toLocaleString()} for selected option)</span>}
            </p>
          )}

          {/* Style toggle */}
          {isTeeProduct && (
            <>
              <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Style</p>
              <div className="flex gap-2 mb-8">
                {(["tee", "tank"] as const).map((type) => (
                  <button key={type} onClick={() => handleTypeChange(type)}
                    className="px-6 py-2 rounded-full font-serif text-sm font-bold cursor-pointer transition-all duration-200 border-2"
                    style={{ borderColor: selectedType === type ? "hsl(var(--primary))" : "hsl(var(--border))", backgroundColor: selectedType === type ? "hsl(var(--primary))" : "transparent", color: selectedType === type ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
                    {type === "tee" ? "Tee" : "Tank"}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Size */}
          {currentSizes.length > 0 && (
            <>
              <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Size</p>
              <div className="flex gap-2 mb-8">
                {currentSizes.map((size: string) => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    className="w-12 h-12 rounded-full font-serif text-sm font-bold cursor-pointer transition-all duration-200 border-2"
                    style={{ borderColor: selectedSize === size ? "hsl(var(--primary))" : "hsl(var(--border))", backgroundColor: selectedSize === size ? "hsl(var(--primary))" : "transparent", color: selectedSize === size ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
                    {size}
                  </button>
                ))}
              </div>
            </>
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
                        <button key={opt.name} title={opt.name}
                          onClick={() => { setSelectedVariants((prev) => ({ ...prev, [groupLabel]: opt })); setErrorGroups((e) => e.filter((x) => x !== groupLabel)); }}
                          style={{ width: 32, height: 32, borderRadius: "50%", background: opt.name, border: isSelected ? "3px solid hsl(var(--primary))" : "2px solid hsl(var(--border))", cursor: "pointer", outline: isSelected ? "2px solid hsl(var(--primary))" : "none", outlineOffset: 2, transition: "all 0.15s" }} />
                      );
                    }
                    return (
                      <button key={opt.name}
                        onClick={() => { setSelectedVariants((prev) => ({ ...prev, [groupLabel]: opt })); setErrorGroups((e) => e.filter((x) => x !== groupLabel)); }}
                        style={{ padding: "0.4rem 1rem", borderRadius: "2rem", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", border: "2px solid", borderColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))", background: isSelected ? "hsl(var(--primary))" : "transparent", color: isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
                        {opt.name}{opt.price_diff !== 0 && <span style={{ fontSize: "0.68rem", marginLeft: 4, opacity: 0.75 }}>+PKR {opt.price_diff}</span>}
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
                            <button key={col} title={col}
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

          {/* Add to cart */}
          {isOOS ? (
            <button disabled className="w-full border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase mb-8"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", cursor: "not-allowed", opacity: 0.65 }}>
              Out of Stock
            </button>
          ) : (
            <button onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground border-none rounded-full py-4 font-serif font-extrabold text-sm tracking-[0.2em] uppercase cursor-pointer transition-transform duration-200 hover:scale-[1.02] mb-8">
              Add to Cart
            </button>
          )}

          {/* Accordions */}
          {isTeeProduct && (
            <div className="border-t border-border">
              <button onClick={() => setSizeGuideOpen((p) => !p)}
                className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer text-foreground font-serif text-base font-bold">
                Size Guide
                <span className="text-xl transition-transform duration-200" style={{ transform: sizeGuideOpen ? "rotate(180deg)" : "rotate(0)" }}>⌄</span>
              </button>
              {sizeGuideOpen && (
                <div className="pb-4">
                  <img src={sizeGuideImage} alt="Size Guide" className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSizeGuideZoomed(true)} />
                </div>
              )}
            </div>
          )}

          <div className="border-t border-border">
            <button onClick={() => setDescOpen((p) => !p)}
              className="w-full bg-transparent border-none py-4 flex justify-between items-center cursor-pointer text-foreground font-serif text-base font-bold">
              Description
              <span className="text-xl transition-transform duration-200" style={{ transform: descOpen ? "rotate(180deg)" : "rotate(0)" }}>⌄</span>
            </button>
            {descOpen && <p className="text-foreground font-serif text-sm leading-relaxed opacity-75 pb-4">{product.description}</p>}
          </div>

          <div className="border-t border-b border-border">
            <button onClick={() => setCareOpen((p) => !p)}
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
            <button onClick={() => setSizeGuideZoomed(false)}
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
