import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { CartProvider } from "@/context/CartContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Bagcharms from "./pages/Bagcharms";
import LimitedEdition from "./pages/LimitedEdition";
import Accessories from "./pages/Accessories";
import AccessoryDetail from "./pages/AccessoryDetail";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import Sale from "./pages/Sale";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSpotted from "./pages/admin/AdminSpotted";
import AdminStorefront from "./pages/admin/AdminStorefront";

// Shop-like pages where we want scroll position restored on back-navigation
const SCROLL_RESTORE_PATHS = ["/shop", "/accessories", "/limited-edition", "/sale", "/bagcharms"];

const ScrollManager = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    const key = `scrollPos:${pathname}`;

    // Detect whether this is a back/forward navigation
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isBackForward = navEntry?.type === "back_forward"
      // fallback: if previous page was a product/detail and current is a shop page
      || (
        prevPathname.current !== null &&
        (prevPathname.current.startsWith("/product/") || prevPathname.current.startsWith("/accessories/")) &&
        SCROLL_RESTORE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
      );

    if (isBackForward) {
      // Restore saved scroll position
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const y = parseInt(saved, 10);
        // Defer until after paint so the page has rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: "instant" });
          });
        });
      }
    } else {
      // Fresh navigation — scroll to top and clear any stale saved position
      window.scrollTo(0, 0);
    }

    prevPathname.current = pathname;
  }, [pathname]);

  // Save scroll position for shop pages whenever user scrolls
  useEffect(() => {
    if (!SCROLL_RESTORE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;

    const key = `scrollPos:${pathname}`;
    const handler = () => sessionStorage.setItem(key, String(window.scrollY));

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [pathname]);

  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/bagcharms" element={<Bagcharms />} />
            <Route path="/limited-edition" element={<LimitedEdition />} />
            <Route path="/accessories" element={<Accessories />} />
            <Route path="/accessories/:id" element={<AccessoryDetail />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/sale" element={<Sale />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="spotted" element={<AdminSpotted />} />
              <Route path="storefront" element={<AdminStorefront />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
