import { useState, useMemo } from "react";
import type { SortOption, FilterState } from "../components/FilterSortBar";

export function useFilterSort(products: any[], showSizeFilter = true) {
  const maxPrice = useMemo(() => {
    if (!products.length) return 20000;
    return Math.max(...products.map((p: any) => p.price || 0));
  }, [products]);

  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [filters, setFilters] = useState<FilterState>({
    availability: "all",
    priceMin: 0,
    priceMax: maxPrice,
    sizes: [],
  });

  const hasFiltersApplied =
    filters.availability !== "all" ||
    filters.priceMin > 0 ||
    filters.priceMax < maxPrice ||
    filters.sizes.length > 0;

  const isOOS = (p: any) =>
    p.stock_status === "out_of_stock" || p.stock_status === "Out of Stock";
  const isLowStock = (p: any) => p.stock_status === "low_stock";

  const filtered = useMemo(() => {
    return products.filter((p: any) => {
      if (filters.availability === "in_stock" && (isOOS(p) || isLowStock(p))) return false;
      if (filters.availability === "low_stock" && !isLowStock(p)) return false;
      if (filters.availability === "out_of_stock" && !isOOS(p)) return false;
      const price = p.price || 0;
      if (price < filters.priceMin || price > filters.priceMax) return false;
      if (showSizeFilter && filters.sizes.length > 0) {
        const productSizes: string[] = p.sizes || [];
        if (!filters.sizes.some((s) => productSizes.includes(s))) return false;
      }
      return true;
    });
  }, [products, filters, showSizeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "alpha_asc":   return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "alpha_desc":  return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "price_asc":   return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price_desc":  return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "date_asc":    return arr.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case "date_desc":   return arr.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      default:            return arr.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    }
  }, [filtered, sortBy]);

  return { sortBy, filters, filtered, sorted, maxPrice, hasFiltersApplied, setSortBy, setFilters };
}
