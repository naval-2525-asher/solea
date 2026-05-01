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
      <div style={{ background: "#dc2626", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "120px", fontWeight: 900, color: "rgba(255,255,255,0.05)", fontFamily: "Georgia, serif", userSelect: "none", pointerEvents: "none", letterSpacing: "-0.05em" }}>SALE</span>
        <div style={{ width: 28, flexShrink: 0 }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(22px, 5vw, 40px)", fontWeight: 900, color: "#fff", letterSpacing: "0.12em", margin: 0, textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>🏷️ SALE IS LIVE 🏷️</p>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(11px, 2vw, 15px)", color: "rgba(255,255,255,0.88)", margin: "6px 0 0", letterSpacing: "0.15em" }}>limited time only ✦ your favourites at steal prices ✦ shop now</p>
        </div>
        <ArrowRight style={{ color: "#fff", opacity: 0.8, width: 28, height: 28, flexShrink: 0 }} />
      </div>
    </Link>
  );
};

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

type RevealProps = { children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right" | "fade"; className?: string; style?: React.CSSProperties };
const Reveal = ({ children, delay = 0, direction = "up", className, style }: RevealProps) => {
  const { ref, visible } = useScrollReveal();
  const hiddenTransform = direction === "up" ? "translateY(40px)" : direction === "left" ? "translateX(-40px)" : direction === "right" ? "translateX(40px)" : "none";
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translate(0,0)" : hiddenTransform, transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`, ...style }}>
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
  "/images/spotted/spotted-1.png", "/images/spotted/spotted-2.png",
  "/images/spotted/spotted-3.png", "/images/spotted/spotted-4.png",
  "/images/spotted/spotted-5.png", "/images/spotted/spotted-6.png",
  "/images/spotted/spotted-7.png", "/images/spotted/spotted-8.png",
];

const DecorativeLine = ({ side }: { side: "left" | "right" }) => (
  <svg width="120" height="20" viewBox="0 0 120 20" fill="none" className="flex-shrink-0" style={{ transform: side === "right" ? "scaleX(-1)" : undefined }}>
    <path d="M0 10 Q30 2 60 10 Q90 18 115 10" stroke="hsl(var(--solea-rose))" strokeWidth="1.2" fill="none" />
    <polygon points="0,6 5,10 0,14" fill="hsl(var(--solea-rose))" />
  </svg>
);

const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
        <button onClick={onClose} style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%", background: "#8B1A2F", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>✕</button>
        <img src={src} alt="Full size" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain", display: "block" }} />
      </div>
    </div>
  );
};

// ── Spotted Section — full width, larger cards ────────────────────────────
const SpottedSection = () => {
  const { data: dbImages = [] } = useSpottedImages();
  const images = dbImages.length > 0 ? dbImages.map((img: any) => img.image) : fallbackSpotted;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const update = () => setCols(window.innerWidth < 768 ? 2 : 3);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const prev = () => setStartIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setStartIndex((i) => (i + 1) % images.length);
  const visibleImages = Array.from({ length: cols }, (_, i) => {
    const idx = (startIndex + i) % images.length;
    return { src: images[idx], key: `${idx}-${i}` };
  });

  return (
    <section className="py-20 bg-background">
      <div className="px-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <DecorativeLine side="left" />
          <h2 className="text-foreground font-serif text-4xl font-black whitespace-nowrap">Spotted in soléa</h2>
          <DecorativeLine side="right" />
        </div>
        <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">our community wearing their favorites</p>
      </div>
      <div className="relative w-full" style={{ paddingLeft: "56px", paddingRight: "56px" }}>
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors" style={{ top: "45%", transform: "translateY(-50%)" }}>
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "16px" }}>
          {visibleImages.map(({ src, key }) => (
            <div key={key} onClick={() => setLightboxSrc(src)} style={{ cursor: "pointer", borderRadius: "16px", overflow: "hidden", aspectRatio: "3/4" }}>
              <img src={src} alt="spotted" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s ease" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              />
            </div>
          ))}
        </div>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors" style={{ top: "45%", transform: "translateY(-50%)" }}>
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </section>
  );
};

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, salePrice }: { product: any; salePrice?: number }) => {
  const href = product.category === "Accessories" || product.category === "Bagcharms"
    ? `/accessories/${product.id}` : `/product/${product.id}`;
  return (
    <Link to={href} className="no-underline" style={{ display: "block", width: "100%" }}>
      <div className="bg-solea-warm rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 border border-border shadow-sm" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", flexShrink: 0, position: "relative" }}>
          {(product.image || product.images?.[0]) ? (
            <img src={product.image || product.images?.[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 25px, hsl(var(--solea-beige)) 25px, hsl(var(--solea-beige)) 50px)" }}>
              <span className="text-3xl">🪡</span>
            </div>
          )}
          {salePrice !== undefined && (
            <span style={{ position: "absolute", top: 10, left: 10, background: "#dc2626", color: "white", fontFamily: "serif", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
              -{calcDiscount(product.price, salePrice)}%
            </span>
          )}
        </div>
        <div className="p-4" style={{ flexGrow: 1 }}>
          <p className="text-foreground font-serif font-bold text-sm">{product.name}</p>
          {salePrice !== undefined ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <p className="font-serif text-xs" style={{ textDecoration: "line-through", opacity: 0.5 }}>PKR {product.price?.toLocaleString()}</p>
              <p className="font-serif text-sm font-bold" style={{ color: "#dc2626" }}>PKR {Number(salePrice).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-foreground font-serif text-sm opacity-70 mt-1">PKR {product.price?.toLocaleString() || "—"}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

// ── Horizontal Product Carousel with responsive columns ───────────────────────
const ProductCarousel = ({ items, renderCard }: { items: any[]; renderCard: (item: any, i: number) => React.ReactNode }) => {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const update = () => setPerPage(window.innerWidth < 768 ? 2 : 3);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset page when perPage changes
  useEffect(() => { setPage(0); }, [perPage]);

  const totalPages = Math.ceil(items.length / perPage);
  const visibleItems = items.slice(page * perPage, page * perPage + perPage);

  if (items.length === 0) return null;

  return (
    <div style={{ position: "relative", paddingLeft: "40px", paddingRight: "40px" }}>
      {/* Prev */}
      <button
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
        className="absolute left-0 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ top: "40%", transform: "translateY(-50%)" }}
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${perPage}, 1fr)`, gap: "20px" }}>
        {visibleItems.map((item, i) => renderCard(item, i))}
        {Array.from({ length: perPage - visibleItems.length }).map((_, i) => <div key={`e-${i}`} />)}
      </div>

      {/* Next */}
      <button
        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
        className="absolute right-0 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ top: "40%", transform: "translateY(-50%)" }}
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>

      {/* Dots */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ width: i === page ? 24 : 8, height: 8, borderRadius: 4, border: "none", background: i === page ? "#8B1A2F" : "#d1a0a8", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Reviews Section — carousel on mobile, grid on desktop ────────────────────
const ReviewsSection = ({ reviews }: { reviews: any[] }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-advance on mobile
  useEffect(() => {
    if (!isMobile || reviews.length === 0) return;
    const timer = setInterval(() => {
      setReviewPage((p) => (p + 1) % reviews.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isMobile, reviews.length]);

  const ReviewCard = ({ customer }: { customer: any }) => (
    <div className="review-card p-8" style={{ position: "relative", overflow: "hidden" }}>
      <span style={{ position: "absolute", top: 4, left: 12, fontFamily: "serif", fontSize: 72, lineHeight: 1, color: "hsl(var(--solea-rose) / 0.2)", userSelect: "none", pointerEvents: "none" }}>"</span>
      <span style={{ position: "absolute", bottom: 0, right: 12, fontFamily: "serif", fontSize: 72, lineHeight: 1, color: "hsl(var(--solea-rose) / 0.2)", userSelect: "none", pointerEvents: "none" }}>"</span>
      <p className="text-foreground font-serif text-sm leading-relaxed italic" style={{ opacity: 0.85, position: "relative", zIndex: 1 }}>{customer.review_text}</p>
    </div>
  );

  return (
    <section className="py-20 px-8 bg-background">
      <Reveal>
        <div className="text-center mb-12">
          <h2 className="text-center text-foreground font-serif text-4xl font-black mb-2">Happy Customers 🤍</h2>
          <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-1">reviews from our DMs</p>
        </div>
      </Reveal>

      {isMobile ? (
        /* Mobile: single card carousel with arrows + auto-advance */
        <div style={{ position: "relative", maxWidth: 400, margin: "0 auto" }}>
          <button
            onClick={() => setReviewPage((p) => (p - 1 + reviews.length) % reviews.length)}
            className="absolute left-0 z-10 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors"
            style={{ top: "50%", transform: "translate(-50%, -50%)" }}
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>

          <div style={{ overflow: "hidden", borderRadius: 20 }}>
            {reviews.length > 0 && (
              <div style={{ transition: "opacity 0.4s ease", opacity: 1 }}>
                <ReviewCard customer={reviews[reviewPage]} />
              </div>
            )}
          </div>

          <button
            onClick={() => setReviewPage((p) => (p + 1) % reviews.length)}
            className="absolute right-0 z-10 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-secondary transition-colors"
            style={{ top: "50%", transform: "translate(50%, -50%)" }}
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>

          {/* Dots */}
          {reviews.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
              {reviews.map((_: any, i: number) => (
                <button key={i} onClick={() => setReviewPage(i)} style={{ width: i === reviewPage ? 20 : 7, height: 7, borderRadius: 4, border: "none", background: i === reviewPage ? "#8B1A2F" : "#d1a0a8", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Desktop: wrap grid */
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {reviews.map((customer: any, i: number) => (
            <Reveal key={customer.id} delay={i * 60} direction="up">
              <div style={{ minWidth: "240px", maxWidth: "410px", flex: "1 1 250px" }}>
                <ReviewCard customer={customer} />
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
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
    const doneTimer = setTimeout(() => { setSplashDone(true); setTimeout(() => setVisible(true), 50); }, TOTAL_MS);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, []);

  const exploreImages = banners.map((b: any) => b.image);
  const staticNewArrivals = newArrivals.filter((a: any) => a.products).map((a: any) => a.products);
  const validBestSellers = bestSellers.filter((bs: any) => bs.products);
  const validSaleItems = saleItems.filter((s: any) => s.products);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600&display=swap');
        @keyframes heartFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sparkleGlisten { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes drawLine { from { stroke-dashoffset: 300; opacity: 0; } to { stroke-dashoffset: 0; opacity: 1; } }
        .review-card { border-radius: 20px !important; border: 1.5px dashed #c97a8a !important; background: linear-gradient(135deg, #fff8f8, #fef0f0) !important; box-shadow: 0 4px 18px rgba(180, 80, 100, 0.10) !important; transition: all 0.3s ease !important; position: relative; overflow: hidden; }
        .review-card:hover { transform: translateY(-4px) !important; box-shadow: 0 10px 30px rgba(180, 80, 100, 0.22) !important; }
        .about-us-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; align-items: start; position: relative; max-width: 1000px; margin: 0 auto; }
        @media (max-width: 768px) {
          .about-us-grid { grid-template-columns: 1fr; }
          .about-us-text { padding-right: 0 !important; padding-bottom: 32px; }
          .about-us-heading { font-size: 72px !important; }
        }
      `}</style>

      {!splashDone && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 40px, hsl(var(--solea-beige)) 40px, hsl(var(--solea-beige)) 80px)", opacity: splashFading ? 0 : 1, transition: "opacity 0.8s ease" }}>
          <p className="text-foreground font-serif font-black text-6xl">soléa</p>
        </div>
      )}

      <main className="min-h-screen bg-background" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
        <Navbar />

        <div style={{ paddingTop: "20px" }}>
          <SaleBanner saleItems={saleItems} />
        </div>

        {/* Explore Now */}
        <section className="bg-background pt-20 pb-20">
          <Reveal>
            <h2 className="text-center text-foreground font-serif text-5xl font-black mb-1">Explore Now</h2>
            <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">handmade with love <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>🌶️</span>🌶️</p>
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
                  <div className="rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105" style={{ background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 30px, hsl(var(--solea-beige)) 30px, hsl(var(--solea-beige)) 60px)" }}>
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

        {/* ── Best Sellers Carousel ── */}
        <section className="py-20 px-8 bg-background">
          <Reveal>
            <h2 className="text-center text-foreground font-serif text-4xl font-black mb-2">Best Sellers</h2>
            <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-12">⁺₊⋆ our most loved pieces ⋆⁺₊</p>
          </Reveal>
          <div className="max-w-[1100px] mx-auto">
            {validBestSellers.length > 0 ? (
              <ProductCarousel
                items={validBestSellers}
                renderCard={(bs, i) => <ProductCard key={bs.id} product={bs.products} />}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", padding: "0 40px" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-solea-warm rounded-2xl overflow-hidden border border-border shadow-sm">
                    <div style={{ width: "100%", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 25px, hsl(var(--solea-beige)) 25px, hsl(var(--solea-beige)) 50px)" }}>
                      <span className="text-3xl">🪡</span>
                    </div>
                    <div className="p-5"><p className="text-foreground font-serif font-bold text-base">Coming Soon</p><p className="text-foreground font-serif text-sm opacity-70 mt-1">PKR —</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="bg-background py-16 px-8">
          <Reveal direction="up">
            <div className="max-w-[1100px] mx-auto rounded-3xl overflow-hidden" style={{ background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 70px, hsl(var(--solea-beige)) 70px, hsl(var(--solea-beige)) 140px)" }}>
              <div style={{ padding: "44px 40px 48px" }}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span aria-hidden="true" style={{ display: "inline-block", color: "#8B1A2F", fontSize: "1em", animation: "sparkleGlisten 1.8s ease-in-out infinite" }}>✦</span>
                  <h2 className="text-center text-foreground font-serif text-4xl font-black">New Arrivals</h2>
                  <span aria-hidden="true" style={{ display: "inline-block", color: "#8B1A2F", fontSize: "1em", animation: "sparkleGlisten 1.8s ease-in-out infinite", animationDelay: "0.6s" }}>✦</span>
                </div>
                <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mb-10">fresh pieces, just dropped</p>
                {staticNewArrivals.length > 0 ? (
                  <Link to="/shop" className="no-underline block max-w-[500px] mx-auto">
                    <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl" style={{ height: "320px" }}>
                      <img src={staticNewArrivals[0].image} alt="New arrival" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <p className="font-serif text-sm tracking-[0.25em] uppercase mt-3 opacity-90">Shop Now →</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex justify-center"><p className="text-center text-foreground font-serif text-base opacity-50 tracking-wide">fresh pieces dropping soon — stay tuned!</p></div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── On Sale Carousel ── */}
        {validSaleItems.length > 0 && (
          <section className="py-20 px-8 bg-background">
            <Reveal>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span style={{ color: "#dc2626", fontSize: "1.2em" }}>🏷️</span>
                <h2 className="text-center text-foreground font-serif text-4xl font-black">On Sale</h2>
                <span style={{ color: "#dc2626", fontSize: "1.2em" }}>🏷️</span>
              </div>
              <p className="text-center text-foreground font-serif text-sm opacity-70 tracking-[0.15em] mt-4 mb-8">limited time deals — grab them while you can</p>
              {/* View All */}
              <div className="flex justify-center mb-10">
                <Link to="/sale" className="no-underline" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 28px", border: "1.5px solid #dc2626", borderRadius: 999, color: "#dc2626", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", transition: "all 0.2s ease", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#dc2626"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}>
                  View All Sale <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
            <div className="max-w-[1100px] mx-auto">
              <ProductCarousel
                items={validSaleItems}
                renderCard={(s, i) => <ProductCard key={s.id} product={s.products} salePrice={s.sale_price} />}
              />
            </div>
          </section>
        )}

        {/* Spotted in soléa */}
        <Reveal direction="up">
          <SpottedSection />
        </Reveal>

        {/* Happy Customers */}
        <ReviewsSection reviews={reviews} />

        {/* About Us */}
        <section className="bg-background py-16 px-8">
          <Reveal direction="up">
            <div className="max-w-[1100px] mx-auto rounded-3xl overflow-hidden" style={{ background: "repeating-linear-gradient(to right, hsl(var(--solea-pink) / 0.45), hsl(var(--solea-pink) / 0.45) 70px, hsl(var(--solea-beige) / 0.55) 70px, hsl(var(--solea-beige) / 0.55) 140px)" }}>
              <div style={{ padding: "56px 48px 56px" }}>
                <div className="about-us-grid">
                  <div className="about-us-text" style={{ paddingTop: "16px", paddingRight: "48px", position: "relative", zIndex: 2 }}>
                    <h2 className="about-us-heading font-serif" style={{ fontSize: "clamp(52px, 5vw, 90px)", fontWeight: 900, color: "#8B1A2F", lineHeight: 0.92, margin: "0 0 32px 0", letterSpacing: "-0.02em" }}>About<br />Us</h2>
                    <div style={{ width: "48px", height: "2px", background: "#8B1A2F", opacity: 0.35, borderRadius: "2px", marginBottom: "28px" }} />
                    <p className="font-serif" style={{ fontSize: "17px", color: "#8B1A2F", lineHeight: 1.9, margin: "0 0 32px 0", maxWidth: "360px" }}>
                      Soléa is a bead embroidery brand specializing in hand-embroidered designs that bring personality and charm to everyday clothing. Drawing inspiration from nostalgia and playful motifs, each Soléa piece is carefully crafted to feel timeless. Our work celebrates slow fashion and individuality.
                    </p>
                    <p style={{ fontFamily: "'Dancing Script', 'Brush Script MT'", fontSize: "30px", color: "#8B1A2F", margin: "0 0 32px 0", lineHeight: 2, fontWeight: 700, opacity: 0.9 }}>
                      delicate details that turn everyday clothing into something truly your own
                    </p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", opacity: 0.45 }}>
                      <span style={{ color: "#8B1A2F", fontSize: "10px" }}>✦</span>
                      <span style={{ color: "#8B1A2F", fontSize: "7px" }}>✦</span>
                      <span style={{ color: "#8B1A2F", fontSize: "10px" }}>✦</span>
                    </div>
                  </div>
                  <div className="about-us-image" style={{ marginTop: "-20px", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, border: "1.5px dashed #8B1A2F", borderRadius: "24px", opacity: 0.25, transform: "translate(10px, 10px)", pointerEvents: "none" }} />
                    <img src="/about-us.jpg" alt="Soléa — art you can wear"
                      onError={(e) => { const t = e.currentTarget; if (!t.src.endsWith(".png")) t.src = "/images/about/about-us.png"; }}
                      style={{ width: "100%", height: "480px", objectFit: "cover", borderRadius: "20px", display: "block", position: "relative", zIndex: 1 }}
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