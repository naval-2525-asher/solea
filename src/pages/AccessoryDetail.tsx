import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accessoryProductsStatic } from "./Accessories";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "92vh" }}>
      <button onClick={onClose} style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%", background: "#8B1A2F", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
      <img src={src} alt="Full size" style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 12, objectFit: "contain", display: "block" }} />
    </div>
  </div>
);

const QuantityStepper = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-3 border-2 border-border rounded-full px-4 py-2 w-fit">
    <button onClick={() => onChange(Math.max(1, value - 1))} className="bg-transparent border-none cursor-pointer text-foreground font-serif text-lg font-bold w-5 h-5 flex items-center justify-center">−</button>
    <span className="font-serif text-sm font-bold text-foreground w-4 text-center">{value}</span>
    <button onClick={() => onChange(value + 1)} className="bg-transparent border-none cursor-pointer text-foreground font-serif text-lg font-bold w-5 h-5 flex items-center justify-center">+</button>
  </div>
);

const AccessoryDetail = () => {
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

  const staticProduct = accessoryProductsStatic.find((p) => p.id === id);
  const rawProduct = dbProduct || staticProduct;

  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // validation
  const [shakeVariant, setShakeVariant] = useState(false);
  const [variantError, setVariantError] = useState(false);

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

  const variantGroups: Record<string, { name: string; price_diff: number }[]> = {};
  product.variants.forEach((v: any) => {
    if (!variantGroups[v.label]) variantGroups[v.label] = [];
    variantGroups[v.label].push({ name: v.name, price_diff: v.price_diff || 0 });
  });
  const groupKeys = Object.keys(variantGroups);
  const isMultiSelect = product.variants.length > 4;

  const toggleMulti = (v: string) => {
    setSelectedMulti((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
    setVariantError(false);
  };

  const basePrice = product.price;
  const selectedVariantObj = product.variants.find((v: any) => v.name === selectedVariant);
  const singleTotal = (basePrice + (selectedVariantObj?.price_diff || 0)) * qty;
  const multiTotal = isMultiSelect
    ? selectedMulti.reduce((sum: number, name: string) => {
        const v = product.variants.find((vv: any) => vv.name === name);
        return sum + basePrice + (v?.price_diff || 0);
      }, 0) * qty
    : 0;

  const isLowStock = (rawProduct as any).stock_status === "low_stock";
  const isOOS = (rawProduct as any).stock_status === "out_of_stock" || (rawProduct as any).stock_status === "Out of Stock";

  const triggerShake = () => {
    setShakeVariant(true);
    setTimeout(() => setShakeVariant(false), 600);
  };

  const handleAdd = () => {
    if (isMultiSelect) {
      if (selectedMulti.length === 0) {
        setVariantError(true);
        triggerShake();
        return;
      }
      selectedMulti.forEach((variantName) => {
        for (let i = 0; i < qty; i++) {
          addToCart({
            productId: typeof product.id === "number" ? product.id : 9001,
            name: product.name,
            image: allImages[0] || product.image,
            price: basePrice + (product.variants.find((v: any) => v.name === variantName)?.price_diff || 0),
            size: variantName,
            style: "accessory",
            customisation: { Style: variantName },
          });
        }
      });
      toast({ title: `${selectedMulti.length * qty} item(s) added to cart!` });
    } else if (hasVariants) {
      if (!selectedVariant) {
        setVariantError(true);
        triggerShake();
        return;
      }
      for (let i = 0; i < qty; i++) {
        addToCart({
          productId: typeof product.id === "number" ? product.id : 9001,
          name: product.name,
          image: allImages[0] || product.image,
          price: singleTotal / qty,
          size: selectedVariant,
          style: "accessory",
          customisation: { Style: selectedVariant },
        });
      }
      toast({ title: `${product.name} (${selectedVariant}) added to cart!` });
    } else {
      for (let i = 0; i < qty; i++) {
        addToCart({
          productId: typeof product.id === "number" ? product.id : 9001,
          name: product.name,
          image: allImages[0] || product.image,
          price: basePrice,
          size: "One Size",
          style: "accessory",
        });
      }
      toast({ title: `${product.name} added to cart!` });
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
        <Link to="/accessories" className="text-foreground font-serif text-sm no-underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
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
          {isMultiSelect && selectedMulti.length > 0 ? (
            <>
              <p className="text-foreground font-serif text-lg font-bold mb-1">PKR {basePrice.toLocaleString()} each</p>
              <p className="text-foreground font-serif text-2xl font-bold mb-8">
                Total: PKR {multiTotal.toLocaleString()}
                <span className="text-sm font-normal opacity-60 ml-2">({selectedMulti.length} × {qty})</span>
              </p>
            </>
          ) : (
            <p className="text-foreground font-serif text-2xl font-bold mb-8">
              PKR {(isMultiSelect ? basePrice : singleTotal / qty).toLocaleString()}
              {isMultiSelect && <span className="text-sm font-normal opacity-60 ml-2">each</span>}
            </p>
          )}

          {/* Variants grouped by label */}
          {hasVariants && groupKeys.map((label) => (
            <div key={label} className="mb-6">
              <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">
                {label}
                <span style={{ color: "#8B1A2F", marginLeft: 2 }}>*</span>
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
                  return (
                    <button key={v.name}
                      onClick={() => {
                        isMultiSelect ? toggleMulti(v.name) : setSelectedVariant(v.name);
                        setVariantError(false);
                      }}
                      className="px-5 py-2 rounded-full font-serif text-sm font-bold cursor-pointer transition-all duration-200 border-2"
                      style={{
                        borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                        backgroundColor: isActive ? "hsl(var(--primary))" : "transparent",
                        color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                      }}>
                      {v.name}{v.price_diff > 0 ? ` +${v.price_diff}` : v.price_diff < 0 ? ` ${v.price_diff}` : ""}
                    </button>
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

          {/* Quantity */}
          <p className="text-foreground font-serif text-sm font-bold tracking-wider mb-3">Quantity</p>
          <div className="mb-10">
            <QuantityStepper value={qty} onChange={setQty} />
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
              <p className="text-foreground font-serif text-sm leading-relaxed opacity-75 pt-4">{product.description}</p>
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
