import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";
import { products } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/hooks/useAdminData";

const policies = [
  { key: "refund", label: "Refunds & Exchange Policy", image: "/refund.jpg" },
  { key: "custom", label: "Custom Order Policy", image: "/custom.jpg" },
  { key: "care", label: "Care Instructions", image: "/care_instruction.jpg" },
];

const AnnouncementBar = () => {
  const { data: settings = [] } = useSiteSettings();
  const text = settings.find((s: any) => s.key === "announcement_text")?.value || "ORDERS MAY TAKE UP TO 2 WEEKS FOR SHIPPING";
  return (
    <div className="w-full bg-primary text-primary-foreground py-2 overflow-hidden whitespace-nowrap z-[200] relative">
      <div className="animate-marquee inline-block font-serif text-[10px] tracking-[0.15em] uppercase max-w-none">
        {Array(4).fill(`${text}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0✦\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`).join("")}
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().startsWith(searchQuery.toLowerCase()))
    : [];

  return (
    <>
      <AnnouncementBar />

      {/* Policy Image Popup */}
      {activePolicy && createPortal(
        <div
          onClick={() => setActivePolicy(null)}
          className="fixed inset-0 z-[2000] flex items-start justify-center pt-[10vh]"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[300px] w-[70vw] mx-auto bg-card rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <button
              onClick={() => setActivePolicy(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center font-black text-sm cursor-pointer border-none"
            >
              ✕
            </button>
            {policies.filter((p) => p.key === activePolicy).map((p) => (
              <div key={p.key}>
                <img src={p.image} alt={p.label} className="w-full h-auto block" />
                <div className="p-4 text-center">
                  <p className="text-foreground font-serif font-bold text-sm">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Burger Menu Overlay */}
      {menuOpen && createPortal(
        <div
          className="fixed inset-0 z-[600] bg-black/50"
          onClick={() => { setMenuOpen(false); setAboutOpen(false); }}
        >
          <div
            className="absolute top-0 left-0 h-full w-[240px] shadow-xl"
            style={{ backgroundColor: "hsl(var(--solea-pink))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-foreground/20">
              <p className="font-serif font-black text-2xl text-foreground">soléa</p>
              <button
                onClick={() => { setMenuOpen(false); setAboutOpen(false); }}
                className="bg-transparent border-none cursor-pointer text-foreground"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              <Link
                to="/"
                className="font-serif text-sm text-foreground no-underline py-3 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-between"
                onClick={() => setMenuOpen(false)}
              >
                Home <ChevronRight size={16} />
              </Link>
              <Link
                to="/sale"
                className="font-serif text-sm no-underline py-3 px-4 rounded-lg hover:bg-red-100/40 transition-colors flex items-center justify-between"
                style={{ color: "#dc2626", fontWeight: 900 }}
                onClick={() => setMenuOpen(false)}
              >
                SALE 🏷️ <ChevronRight size={16} />
              </Link>
              <Link
                to="/shop"
                className="font-serif text-sm text-foreground no-underline py-3 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-between"
                onClick={() => setMenuOpen(false)}
              >
                Tanks & Tees <ChevronRight size={16} />
              </Link>
              <Link
                to="/accessories"
                className="font-serif text-sm text-foreground no-underline py-3 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-between"
                onClick={() => setMenuOpen(false)}
              >
                Accessories <ChevronRight size={16} />
              </Link>
              <Link
                to="/limited-edition"
                className="font-serif text-sm text-foreground no-underline py-3 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-between"
                onClick={() => setMenuOpen(false)}
              >
                Limited Edition <ChevronRight size={16} />
              </Link>
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                className="font-serif text-sm text-foreground bg-transparent border-none cursor-pointer py-3 px-4 rounded-lg hover:bg-white/20 transition-colors text-left flex items-center justify-between w-full"
              >
                Policies & Instructions <ChevronRight size={16} className={`transition-transform ${aboutOpen ? "rotate-90" : ""}`} />
              </button>
              {aboutOpen && (
                <div className="flex flex-col gap-1 ml-2">
                  {policies.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        setActivePolicy(p.key);
                        setMenuOpen(false);
                        setAboutOpen(false);
                      }}
                      className="font-serif text-xs text-foreground bg-white/30 border-none cursor-pointer py-2.5 px-4 rounded-lg hover:bg-white/50 transition-colors text-left w-full"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>,
        document.body
      )}

      {/* Main Navbar */}
      <nav
        className="sticky top-0 z-[500] flex justify-between items-center px-6 pt-3 pb-3 border-b-2 border-solea-rose/30"
        style={{
          background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 40px, hsl(var(--solea-beige)) 40px, hsl(var(--solea-beige)) 80px)",
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => setMenuOpen(true)}
            className="bg-white/40 backdrop-blur-sm border-none cursor-pointer p-2 text-foreground rounded-lg hover:bg-white/60 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2 no-underline text-center">
          <p className="text-foreground font-serif font-black text-4xl m-0 mt-2 cursor-pointer leading-none">
            soléa
          </p>
          <p className="text-foreground font-serif text-[10px] tracking-[0.3em] m-0 mt-1.5">
            Art &nbsp;You &nbsp;Can &nbsp;Wear
          </p>
        </Link>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => setSearchOpen((prev) => !prev)}
            className="bg-transparent border-none cursor-pointer p-1 text-foreground"
          >
            <Search size={22} />
          </button>
          <Link to="/cart" className="relative p-1 text-foreground">
            <ShoppingBag size={22} />
            <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center font-serif">
              {totalItems}
            </span>
          </Link>
        </div>
      </nav>

      {/* Search Panel */}
      {searchOpen && createPortal(
        <div
          className="fixed inset-0 z-[600] bg-black/50"
          onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
        >
          <div
            className="absolute top-0 right-0 h-full w-[280px] shadow-xl p-5"
            style={{ backgroundColor: "hsl(var(--solea-pink))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="font-serif font-black text-lg text-foreground">Search</p>
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="bg-transparent border-none cursor-pointer text-foreground"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-foreground/20 pb-2 mb-4">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent border-none outline-none font-serif text-sm text-foreground placeholder:text-foreground/50"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (filteredProducts.length === 1) {
                    navigate(`/product/${filteredProducts[0].id}`);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
                className="bg-transparent border-none cursor-pointer p-1 text-foreground"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            {searchQuery.trim() && (
              <div className="flex flex-col gap-1">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="font-serif text-sm text-foreground no-underline py-2 px-3 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-3"
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="flex-1">{product.name}</span>
                      <span className="text-xs opacity-60">Rs. {product.price.toLocaleString()}</span>
                    </Link>
                  ))
                ) : (
                  <p className="font-serif text-sm text-destructive py-2 px-3">No results found</p>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Navbar;