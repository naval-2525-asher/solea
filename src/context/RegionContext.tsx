import React, { createContext, useContext, useState, ReactNode } from "react";

export type Region = "PK" | "UK";

export interface RegionConfig {
  code: Region;
  label: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  locale: string;
}

export const REGIONS: Record<Region, RegionConfig> = {
  PK: {
    code: "PK",
    label: "Pakistan",
    flag: "🇵🇰",
    currency: "PKR",
    currencySymbol: "Rs.",
    locale: "en-PK",
  },
  UK: {
    code: "UK",
    label: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    locale: "en-GB",
  },
};

interface RegionContextType {
  region: Region;
  regionConfig: RegionConfig;
  setRegion: (r: Region) => void;
  formatPrice: (pkrPrice: number, gbpPrice?: number) => string;
  getPrice: (pkrPrice: number, gbpPrice?: number) => number;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider = ({ children }: { children: ReactNode }) => {
  const [region, setRegionState] = useState<Region>("PK");

  const regionConfig = REGIONS[region];

  const getPrice = (pkrPrice: number, gbpPrice?: number): number => {
    if (region === "UK") return gbpPrice ?? 0;
    return pkrPrice;
  };

  const formatPrice = (pkrPrice: number, gbpPrice?: number): string => {
    const price = getPrice(pkrPrice, gbpPrice);
    if (region === "UK") {
      return `£${price.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `Rs. ${price.toLocaleString("en-PK")}`;
  };

  const setRegion = (r: Region) => {
    setRegionState(r);
  };

  return (
    <RegionContext.Provider value={{ region, regionConfig, setRegion, formatPrice, getPrice }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
};
