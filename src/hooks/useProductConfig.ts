import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductColor {
  name: string;
  hex: string;
}

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof ALL_SIZES)[number];

export interface ProductConfig {
  label: string;
  badge: string | null;
  description: string | null;
  price_pkr: number;
  price_gbp: number;
  in_stock: boolean;
  colors: ProductColor[];
  sizes: Size[];
}

export interface ProductConfigRow {
  id: string;
  section: "shop" | "limited";
  product_type: string;
  config: ProductConfig;
  sort_order: number;
  created_at: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const PRODUCT_CONFIG_KEY = ["product_config"] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProductConfig() {
  return useQuery({
    queryKey: PRODUCT_CONFIG_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_config")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as ProductConfigRow[];
    },
  });
}

export function useShopProductConfig() {
  return useQuery({
    queryKey: [...PRODUCT_CONFIG_KEY, "shop"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_config")
        .select("*")
        .eq("section", "shop")
        .order("sort_order");
      if (error) throw error;
      return data as ProductConfigRow[];
    },
  });
}

export function useLimitedProductConfig() {
  return useQuery({
    queryKey: [...PRODUCT_CONFIG_KEY, "limited"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_config")
        .select("*")
        .eq("section", "limited")
        .order("sort_order");
      if (error) throw error;
      return data as ProductConfigRow[];
    },
  });
}

export function useUpsertProductConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<ProductConfigRow, "created_at">) => {
      const { data, error } = await (supabase as any)
        .from("product_config")
        .upsert(row)
        .select()
        .single();
      if (error) throw error;
      return data as ProductConfigRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_CONFIG_KEY });
      toast.success("Saved!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save");
    },
  });
}

export function useDeleteProductConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("product_config")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCT_CONFIG_KEY });
      toast.success("Deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete");
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function limitedId(): string {
  return `limited_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultConfig(label: string): ProductConfig {
  return {
    label,
    badge: null,
    description: null,
    price_pkr: 0,
    price_gbp: 0,
    in_stock: true,
    colors: [],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  };
}
