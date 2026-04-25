import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useAdminData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductCard = ({ product }: { product: any }) => (
  <Link to={`/accessories/${product.id}`} className="no-underline">
    <div className="bg-card rounded-lg overflow-hidden cursor-pointer border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="h-[290px] bg-solea-warm flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const p = (e.currentTarget as HTMLImageElement).parentElement;
            if (p) p.innerHTML = '<span style="font-size:2rem">🌶️</span>';
          }}
        />
      </div>
      <div className="p-3">
        <p className="text-foreground font-serif font-bold text-sm mb-0.5">{product.name}</p>
        <p className="text-foreground font-serif font-bold text-xs">PKR {product.price?.toLocaleString()}</p>
      </div>
    </div>
  </Link>
);

const Bagcharms = () => {
  const { data: dbProducts = [], isLoading } = useProducts();
  const bagcharms = dbProducts.filter((p: any) => p.category === "Bagcharms");

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="py-8 px-8 text-center">
        <h1 className="text-foreground font-serif text-2xl font-black max-w-[200px] mx-auto">Bagcharms</h1>
        {!isLoading && bagcharms.length === 0 && (
          <p className="text-foreground font-serif text-sm opacity-60 mt-2">Coming soon — beaded charms, necklaces & more ✦</p>
        )}
      </div>
      <div className="px-6 pb-16 max-w-[1100px] mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden border border-border animate-pulse">
                <div className="h-[290px] bg-secondary/50" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-secondary/50 rounded w-3/4" />
                  <div className="h-3 bg-secondary/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : bagcharms.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {bagcharms.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="min-h-[40vh] flex items-center justify-center">
            <p className="text-foreground font-serif text-base opacity-50">No products yet — stay tuned!</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
};

export default Bagcharms;