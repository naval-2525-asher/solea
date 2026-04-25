import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useHeroBanners, useReviews, useNewArrivals, useBestSellers, useSpottedImages, useSaleProducts, useSiteSettings } from "@/hooks/useAdminData";

const calcDiscount = (original: number, sale: number) =>
  Math.round(((original - sale) / original) * 100);

const SaleBanner = ({ saleItems }: { saleItems: any[] }) => {
  const { data: settings = [] } = useSiteSettings();
  const isLive = settings.find((s: any) => s.key === "sale_live")?.value === "true";
  if (!isLive || saleItems.length === 0) return null;
  return (
    <Link to="/sale" className="no-underline block">
      <div style={{
        background: "#dc2626",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* bg watermark */}
        <span style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "120px", fontWeight: 900,
          color: "rgba(255,255,255,0.05)", fontFamily: "Georgia, serif",
          userSelect: "none", pointerEvents: "none", letterSpacing: "-0.05em",
        }}>SALE</span>

        {/* Arrow left - removed */}
        <div style={{ width: 28, flexShrink: 0 }} />

        {/* Text */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(22px, 5vw, 40px)",
            fontWeight: 900, color: "#fff",
            letterSpacing: "0.12em", margin: 0,
            textShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}>🏷️ SALE IS LIVE 🏷️</p>
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(11px, 2vw, 15px)",
            color: "rgba(255,255,255,0.88)",
            margin: "6px 0 0", letterSpacing: "0.15em",
          }}>limited time only ✦ your favourites at steal prices ✦ shop now</p>
        </div>

        {/* Arrow right */}
        <ArrowRight style={{ color: "#fff", opacity: 0.8, width: 28, height: 28, flexShrink: 0 }} />
      </div>
    </Link>
  );
};

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useScrollReveal(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px", ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ── Reveal wrapper ──────────────────────────────────────────────────────────
type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "fade";
  className?: string;
  style?: React.CSSProperties;
};
const Reveal = ({ children, delay = 0, direction = "up", className, style }: RevealProps) => {
  const { ref, visible } = useScrollReveal();
  const hiddenTransform =
    direction === "up" ? "translateY(40px)" :
    direction === "left" ? "translateX(-40px)" :
    direction === "right" ? "translateX(40px)" : "none";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : hiddenTransform,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const categories = [
  { name: "Tees & Tank Tops", desc: "Hand embroidered beaded tees and tanks", href: "/shop", image: "/images/categories/tees-tanks.jpg" },
  { name: "Limited Edition", desc: "One-of-a-kind exclusive pieces", href: "/limited-edition", image: "/images/categories/limited-edition.jpg" },
  { name: "Accessories", desc: "Beaded charms, keychains & more", href: "/accessories", image: "/images/categories/accessories.jpg" },
];

const fallbackSpotted = [
  "/images/spotted/spotted-1.png",
  "/images/spotted/spotted-2.png",
  "/images/spotted/spotted-3.png",
  "/images/spotted/spotted-4.png",
  "/images/spotted/spotted-5.png",
  "/images/spotted/spotted-6.png",
  "/images/spotted/spotted-7.png",
  "/images/spotted/spotted-8.png",
];

const DecorativeLine = ({ side }: { side: "left" | "right" }) => (
  <svg width="120" height="20" viewBox="0 0 120 20" fill="none" className="flex-shrink-0" style={{ transform: side === "right" ? "scaleX(-1)" : undefined }}>
    <path d="M0 10 Q30 2 60 10 Q90 18 115 10" stroke="hsl(var(--solea-rose))" strokeWidth="1.2" fill="none" />
    <polygon points="0,6 5,10 0,14" fill="hsl(var(--solea-rose))" />
  </svg>
);

const FloatingHeart = ({ rot, delay }: { rot: string; delay: string }) => (
  <span aria-hidden="true" style={{
    display: "inline-block", color: "#8B1A2F", fontSize: "1.4em", opacity: 0.7,
    transform: `rotate(${rot})`, animation: "heartFloat 2.2s ease-in-out infinite",
    animationDelay: delay, verticalAlign: "middle", marginInline: "6px",
  }}> 𖹭 </span>
);

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeInModal 0.25s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
        <button onClick={onClose} style={{
          position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%",
          background: "#8B1A2F", color: "white", border: "none", cursor: "pointer",
          fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        }}>✕</button>
        <img src={src} alt="Full size" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain", display: "block" }} />
      </div>
    </div>
  );
};

const SpottedSection = () => {
  const { data: dbImages = [] } = useSpottedImages();
  const images = dbImages.length > 0 ? dbImages.map((img: any) => img.image) : fallbackSpotted;
  const [startIndex, setStartIndex] = useState(0);
  const visible = 4;
  const prev = () => setStartIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setStartIndex((i) => (i + 1) % images.length);
  const visibleImages = Array.from({ length: visible }, (_, i) => {
    const idx = (startIndex + i) % images.length;
    return { src: images[idx], key: `${idx}-${i}` };
  });
  return (
    <section className="py-20 px-8 bg-background">
      <div className="flex items-center justify-center gap-4 mb-2">
        <DecorativeLine side="left" />
        <h2 className="text-foreground font-serif text-4xl font-black whitespace-nowrap">Spotted in soléa</h2>
        <DecorativeLine side="right" />
      </div>
      <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">our community wearing their favorites</p>
      <div className="relative max-w-[1000px] mx-auto px-10">
        <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex gap-4 overflow-hidden">
          {visibleImages.map(({ src, key }) => (
            <div key={key} className="flex-shrink-0 w-[220px] h-[320px] rounded-xl overflow-hidden">
              <img src={src} alt="spotted" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors">
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </section>
  );
};

// Shared product card — bigger size
const ProductCard = ({ product }: { product: any }) => {
  const href = product.category === "Accessories" || product.category === "Bagcharms"
    ? `/accessories/${product.id}`
    : `/product/${product.id}`;
  return (
    <Link to={href} className="no-underline" style={{ width: "280px", display: "block" }}>
      <div className="bg-solea-warm rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 border border-border shadow-sm" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Fixed aspect ratio image box — same size for every card */}
        <div style={{ width: "110%", aspectRatio: "1 / 1", overflow: "hidden", flexShrink: 0 }}>
          {(product.image || product.images?.[0]) ? (
            <img src={product.image || product.images?.[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 25px, hsl(var(--solea-beige)) 25px, hsl(var(--solea-beige)) 50px)" }}>
              <span className="text-3xl">🪡</span>
            </div>
          )}
        </div>
        <div className="p-5" style={{ flexGrow: 1 }}>
          <p className="text-foreground font-serif font-bold text-base">{product.name}</p>
          <p className="text-foreground font-serif text-sm opacity-70 mt-1">PKR {product.price?.toLocaleString() || "—"}</p>
        </div>
      </div>
    </Link>
  );
};

const Home = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { data: banners = [] } = useHeroBanners();
  const { data: reviews = [] } = useReviews();
  const { data: newArrivals = [] } = useNewArrivals();
  const { data: bestSellers = [] } = useBestSellers();
  const { data: saleItems = [] } = useSaleProducts();

  useEffect(() => {
    const FADE_START_MS = 400;
    const TOTAL_MS = 800;
    const fadeTimer = setTimeout(() => setSplashFading(true), FADE_START_MS);
    const doneTimer = setTimeout(() => {
      setSplashDone(true);
      setTimeout(() => setVisible(true), 50);
    }, TOTAL_MS);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, []);

  const exploreImages = banners.map((b: any) => b.image);

  const staticNewArrivals = newArrivals
    .filter((a: any) => a.products)
    .map((a: any) => a.products);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&display=swap');

        @keyframes heartFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
          50% { transform: translateY(-12px) rotate(var(--rot, 0deg)); }
        }
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sparkleGlisten {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          25% { opacity: 0.4; transform: scale(0.85) rotate(-15deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(10deg); }
          75% { opacity: 0.5; transform: scale(0.9) rotate(-5deg); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 300; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes drawThread {
          from { stroke-dashoffset: 500; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 0.35; }
        }
        .about-draw-line {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: drawLine 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
        }
        .about-draw-thread {
          stroke-dasharray: 500;
          stroke-dashoffset: 500;
          animation: drawThread 2.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
        }
        .review-card {
          border-radius: 20px !important;
          border: 1.5px dashed #c97a8a !important;
          background: linear-gradient(135deg, #fff8f8, #fef0f0) !important;
          box-shadow: 0 4px 18px rgba(180, 80, 100, 0.10) !important;
          transition: all 0.3s ease !important;
          position: relative;
          overflow: hidden;
        }
        .review-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 10px 30px rgba(180, 80, 100, 0.22) !important;
        }

        /* About Us responsive */
        .about-us-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          align-items: start;
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .about-us-grid {
            grid-template-columns: 1fr;
          }
          .about-us-text {
            padding-right: 0 !important;
            padding-bottom: 32px;
          }
          .about-us-image {
            margin-top: 0 !important;
          }
          .about-us-heading {
            font-size: 72px !important;
          }
        }
      `}</style>

      {/* Splash Screen */}
      {!splashDone && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 40px, hsl(var(--solea-beige)) 40px, hsl(var(--solea-beige)) 80px)",
            opacity: splashFading ? 0 : 1, transition: "opacity 0.8s ease",
          }}>
          <p className="text-foreground font-serif font-black text-6xl">soléa</p>
        </div>
      )}

      <main className="min-h-screen bg-background" style={{
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <Navbar />

        {/* Sale Banner — shown right below navbar when sale is live */}
        <div style={{ paddingTop: "20px" }}>
          <SaleBanner saleItems={saleItems} />
        </div>
        <section className="bg-background pt-20 pb-20">
          <Reveal>
            <h2 className="text-center text-foreground font-serif text-5xl font-black mb-1">Explore Now</h2>
            <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">
              handmade with love <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>🌶️</span>🌶️
            </p>
          </Reveal>
          {exploreImages.length > 0 && (
            <Reveal delay={150} direction="fade">
              <div className="overflow-hidden w-full">
                <div className="image-scroll-track">
                  {[...exploreImages, ...exploreImages].map((src, i) => (
                    <div key={i} className="flex-shrink-0 w-[300px] h-[400px] rounded-lg overflow-hidden">
                      <img src={src} alt={`explore-${i}`} className="w-full h-full object-cover block" />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </section>

        {/* Shop by Category */}
        <section className="py-20 px-8 bg-background">
          <Reveal>
            <h2 className="text-center text-foreground font-serif text-4xl font-black mb-2">Shop by Category</h2>
            <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">find your perfect piece</p>
          </Reveal>
          <div className="grid gap-6 max-w-[1000px] mx-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {categories.map((cat, i) => (
              <Reveal key={cat.name} delay={i * 100} direction="up">
                <Link to={cat.href} className="no-underline">
                  <div className="rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105" style={{
                    background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 30px, hsl(var(--solea-beige)) 30px, hsl(var(--solea-beige)) 60px)",
                  }}>
                    <div className="h-[280px] p-3 pb-0">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                    </div>
                    <div className="py-5 px-5">
                      <p className="text-foreground font-serif font-black text-xl">{cat.name}</p>
                      <p className="text-foreground font-serif text-sm mt-1.5 opacity-75">{cat.desc}</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="py-20 px-8 bg-background">
          <Reveal>
            <h2 className="text-center text-foreground font-serif text-4xl font-black mb-2">Best Sellers</h2>
            <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">⁺₊⋆ our most loved pieces ⋆⁺₊</p>
          </Reveal>

          <div className="relative max-w-[1100px] mx-auto">
            <div className="absolute pointer-events-none" style={{
              left: 0, top: "50%", transform: "translateY(-50%)",
              width: "calc((100% - 820px) / 2)",
            }}>
              <svg width="100%" height="50" viewBox="0 0 180 50" preserveAspectRatio="none" fill="none">
                <path d="M180 25 Q150 8 120 25 Q90 42 60 25 Q30 8 0 25" stroke="#8B1A2F" strokeWidth="2.2" fill="none"/>
                <path d="M180 33 Q150 16 120 33 Q90 50 60 33 Q30 16 0 33" stroke="#8B1A2F" strokeWidth="1" fill="none" opacity="0.3"/>
                <polygon points="0,19 10,25 0,31" fill="#8B1A2F"/>
              </svg>
            </div>

            <div className="absolute pointer-events-none" style={{
              right: 0, top: "50%", transform: "translateY(-50%)",
              width: "calc((100% - 820px) / 2)",
            }}>
              <svg width="100%" height="50" viewBox="0 0 180 50" preserveAspectRatio="none" fill="none">
                <path d="M0 25 Q30 8 60 25 Q90 42 120 25 Q150 8 180 25" stroke="#8B1A2F" strokeWidth="2.2" fill="none"/>
                <path d="M0 33 Q30 16 60 33 Q90 50 120 33 Q150 16 180 33" stroke="#8B1A2F" strokeWidth="1" fill="none" opacity="0.3"/>
                <polygon points="180,19 170,25 180,31" fill="#8B1A2F"/>
              </svg>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
              {bestSellers.length > 0 ? bestSellers.map((bs: any, i: number) => (
                bs.products && (
                  <Reveal key={bs.id} delay={i * 80} direction="up">
                    <ProductCard product={bs.products} />
                  </Reveal>
                )
              )) : (
                [1, 2, 3, 4].map((i) => (
                  <Reveal key={i} delay={i * 80} direction="up">
                    <div className="bg-solea-warm rounded-2xl overflow-hidden border border-border shadow-sm" style={{ width: "260px" }}>
                      <div style={{ width: "100%", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 25px, hsl(var(--solea-beige)) 25px, hsl(var(--solea-beige)) 50px)" }}>
                        <span className="text-3xl">🪡</span>
                      </div>
                      <div className="p-5">
                        <p className="text-foreground font-serif font-bold text-base">Coming Soon</p>
                        <p className="text-foreground font-serif text-sm opacity-70 mt-1">PKR —</p>
                      </div>
                    </div>
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="bg-background py-16 px-8">
          <Reveal direction="up">
            <div className="max-w-[1100px] mx-auto rounded-3xl overflow-hidden" style={{
            background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 70px, hsl(var(--solea-beige)) 70px, hsl(var(--solea-beige)) 140px)",
          }}>
            <div style={{ padding: "44px 40px 48px" }}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span aria-hidden="true" style={{ display: "inline-block", color: "#8B1A2F", fontSize: "1em", animation: "sparkleGlisten 1.8s ease-in-out infinite", animationDelay: "0s" }}>✦</span>
                <h2 className="text-center text-foreground font-serif text-4xl font-black">New Arrivals</h2>
                <span aria-hidden="true" style={{ display: "inline-block", color: "#8B1A2F", fontSize: "1em", animation: "sparkleGlisten 1.8s ease-in-out infinite", animationDelay: "0.6s" }}>✦</span>
              </div>
              <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mb-10">
                fresh pieces, just dropped
              </p>
              {staticNewArrivals.length > 0 ? (
                <Link to="/shop" className="no-underline block max-w-[500px] mx-auto">
                  <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl" style={{ height: "320px" }}>
                    <img
                      src={staticNewArrivals[0].image}
                      alt="New arrival"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <p className="font-serif text-sm tracking-[0.25em] uppercase mt-3 opacity-90">
                        Shop Now →
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex justify-center">
                  <p className="text-center text-foreground font-serif text-base opacity-50 tracking-wide">fresh pieces dropping soon — stay tuned!</p>
                </div>
              )}
            </div>
          </div>
          </Reveal>
        </section>

        {/* Sale */}
        {saleItems.length > 0 && (
          <section className="py-20 px-8 bg-background">
            <Reveal>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span style={{ color: "#dc2626", fontSize: "1.2em" }}>🏷️</span>
                <h2 className="text-center text-foreground font-serif text-4xl font-black">On Sale</h2>
                <span style={{ color: "#dc2626", fontSize: "1.2em" }}>🏷️</span>
              </div>
              <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">limited time deals — grab them while you can</p>
            </Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
              {saleItems.filter((s: any) => s.products).map((s: any, i: number) => {
                const product = s.products;
                const href = product.category === "Accessories" || product.category === "Bagcharms"
                  ? `/accessories/${product.id}`
                  : `/product/${product.id}`;
                return (
                  <Reveal key={s.id} delay={i * 80} direction="up">
                    <Link to={href} className="no-underline" style={{ width: "280px", display: "block" }}>
                      <div className="bg-solea-warm rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 border border-border shadow-sm" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <div style={{ width: "110%", aspectRatio: "1 / 1", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                          {(product.image || product.images?.[0]) ? (
                            <img src={product.image || product.images?.[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 25px, hsl(var(--solea-beige)) 25px, hsl(var(--solea-beige)) 50px)" }}>
                              <span className="text-3xl">🪡</span>
                            </div>
                          )}
                          <span style={{ position: "absolute", top: 10, left: 10, background: "#dc2626", color: "white", fontFamily: "serif", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>SALE</span>
                        </div>
                        <div className="p-5" style={{ flexGrow: 1 }}>
                          <p className="text-foreground font-serif font-bold text-base">{product.name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <p className="font-serif text-sm" style={{ textDecoration: "line-through", opacity: 0.5 }}>PKR {product.price?.toLocaleString()}</p>
                            <p className="font-serif text-sm font-bold" style={{ color: "#dc2626" }}>PKR {Number(s.sale_price).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {/* Spotted in soléa */}
        <Reveal direction="up">
          <SpottedSection />
        </Reveal>

        {/* Happy Customers */}
        <section className="py-20 px-8 bg-background">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-center text-foreground font-serif text-4xl font-black mb-2">
                Happy Customers 🤍
              </h2>
              <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-1">reviews from our DMs</p>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
            {reviews.map((customer: any, i: number) => (
              <Reveal key={customer.id} delay={i * 60} direction="up">
                <div className="review-card p-8" style={{ minWidth: "240px", maxWidth: "410px", flex: "1 1 250px" }}>
                  <span className="absolute top-2 left-3 font-serif text-[72px] leading-none text-solea-rose/20 select-none pointer-events-none">"</span>
                  <span className="absolute bottom-0 right-3 font-serif text-[72px] leading-none text-solea-rose/20 select-none pointer-events-none">"</span>
                  <p className="text-foreground font-serif text-sm leading-relaxed opacity-85 italic relative z-10">{customer.review_text}</p>
                  <span aria-hidden="true"></span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

{/* ── About Us ── */}
<section className="bg-background py-16 px-8">
  <Reveal direction="up">
  <div
    className="max-w-[1100px] mx-auto rounded-3xl overflow-hidden"
    style={{
      background: "repeating-linear-gradient(to right, hsl(var(--solea-pink) / 0.45), hsl(var(--solea-pink) / 0.45) 70px, hsl(var(--solea-beige) / 0.55) 70px, hsl(var(--solea-beige) / 0.55) 140px)",
    }}
  >
    <div style={{ padding: "56px 48px 56px" }}>
      <div className="about-us-grid">

        {/* Left — text */}
        <div className="about-us-text" style={{ paddingTop: "16px", paddingRight: "48px", position: "relative", zIndex: 2 }}>

          {/* Minimal decorative thread stitch line */}
         

          <h2
            className="about-us-heading font-serif"
            style={{
              fontSize: "clamp(52px, 5vw, 90px)",
              fontWeight: 900,
              color: "#8B1A2F",
              lineHeight: 0.92,
              margin: "0 0 32px 0",
              letterSpacing: "-0.02em",
            }}
          >
            About<br />Us
          </h2>

          {/* Thin maroon rule */}
          <div style={{ width: "48px", height: "2px", background: "#8B1A2F", opacity: 0.35, borderRadius: "2px", marginBottom: "28px" }} />

          <p
            className="font-serif"
            style={{
              fontSize: "17px",
              color: "#8B1A2F",
              lineHeight: 1.9,
              opacity: 1.4,
              margin: "0 0 32px 0",
              maxWidth: "360px",
            }}
          >
            Soléa is a bead embroidery brand specializing in hand-embroidered designs 
            that bring personality and charm to everyday clothing. Drawing inspiration 
            from nostalgia and playful motifs, each Soléa piece is carefully crafted to 
            feel timeless. Our work celebrates slow fashion and individuality.
          </p>

          <p
            style={{
              fontFamily: "'Dancing Script', 'Brush Script MT'",
              fontSize: "30px",
              color: "#8B1A2F",
              margin: "0 0 32px 0",
              lineHeight: 2,
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            delicate details that turn everyday clothing into something truly your own
          </p>

          {/* Small embroidery-style sparkles */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.45 }}>
            <span style={{ color: "#8B1A2F", fontSize: "10px" }}>✦</span>
            <span style={{ color: "#8B1A2F", fontSize: "7px" }}>✦</span>
            <span style={{ color: "#8B1A2F", fontSize: "10px" }}>✦</span>
          </div>
        </div>

        {/* Right — image */}
        <div className="about-us-image" style={{ marginTop: "-20px", position: "relative" }}>
          {/* Offset decorative border behind image */}
          <div style={{
            position: "absolute", inset: 0,
            border: "1.5px dashed #8B1A2F",
            borderRadius: "24px",
            opacity: 0.25,
            transform: "translate(10px, 10px)",
            pointerEvents: "none",
          }} />
          <img
            src="/about-us.jpg"
            alt="Soléa — art you can wear"
            onError={(e) => {
              // try .png fallback if .jpg fails
              const t = e.currentTarget;
              if (!t.src.endsWith(".png")) t.src = "/images/about/about-us.png";
            }}
            style={{
              width: "100%",
              height: "480px",
              objectFit: "cover",
              borderRadius: "20px",
              display: "block",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

      </div>
    </div>
  </div>
  </Reveal>
</section>


        <Footer />
      </main>
    </>
  );
};

export default Home;