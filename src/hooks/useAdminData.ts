import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Products ───
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: any) => {
      const { data, error } = await supabase
        .from("products")
        .upsert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Reviews ───
export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: any) => {
      const { data, error } = await supabase
        .from("reviews")
        .upsert(review)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

// ─── New Arrivals ───
export function useNewArrivals() {
  return useQuery({
    queryKey: ["new_arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_arrivals")
        .select("*, products(*)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertNewArrival() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("new_arrivals")
        .upsert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["new_arrivals"] });
    },
  });
}

export function useDeleteNewArrival() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("new_arrivals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["new_arrivals"] });
    },
  });
}

// ─── Best Sellers ───
export function useBestSellers() {
  return useQuery({
    queryKey: ["best_sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("best_sellers")
        .select("*, products(*)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertBestSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("best_sellers")
        .upsert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["best_sellers"] });
    },
  });
}

export function useDeleteBestSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("best_sellers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["best_sellers"] });
    },
  });
}

// ─── Hero Banners ───
export function useHeroBanners() {
  return useQuery({
    queryKey: ["hero_banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertHeroBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("hero_banners")
        .upsert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero_banners"] });
    },
  });
}

export function useDeleteHeroBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero_banners"] });
    },
  });
}

// ─── Site Settings ───
export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from("site_settings")
        .upsert({ key, value }, { onConflict: "key" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
  });
}

// ─── Spotted Images ───
export function useSpottedImages() {
  return useQuery({
    queryKey: ["spotted_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spotted_images" as any)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertSpottedImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("spotted_images" as any)
        .upsert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spotted_images"] });
    },
  });
}

export function useDeleteSpottedImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spotted_images" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spotted_images"] });
    },
  });
}

// ─── Sale Products ───
export function useSaleProducts() {
  return useQuery({
    queryKey: ["sale_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_products" as any)
        .select("*, products(*)")
        .order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertSaleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("sale_products" as any)
        .upsert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sale_products"] });
    },
  });
}

export function useDeleteSaleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sale_products" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sale_products"] });
    },
  });
}

// ─── File upload helper ───
export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("admin-uploads")
    .upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from("admin-uploads").getPublicUrl(fileName);
  return data.publicUrl;
}