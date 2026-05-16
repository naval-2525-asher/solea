import { useState } from "react";
import { useRegion, REGIONS, Region } from "@/context/RegionContext";

const RegionGate = () => {
  const { regionSelected, setRegion } = useRegion();
  const [selected, setSelected] = useState<Region | "">("");
  const [error, setError] = useState(false);

  if (regionSelected) return null;

  const handleConfirm = () => {
    if (!selected) { setError(true); return; }
    setRegion(selected as Region);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      background: "rgba(255,255,255,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "hsl(var(--card))",
        borderRadius: 24,
        padding: "40px 32px",
        maxWidth: 380,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: "1px solid hsl(var(--border))",
      }}>
        {/* Logo */}
        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "2.2rem", fontWeight: 900, color: "hsl(var(--foreground))", margin: "0 0 4px" }}>
          soléa
        </p>
        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.72rem", letterSpacing: "0.3em", color: "hsl(var(--muted-foreground))", margin: "0 0 28px" }}>
          ART YOU CAN WEAR
        </p>

        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1rem", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 6 }}>
          Where are you shopping from?
        </p>
        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginBottom: 24 }}>
          Select your region for the right currency and shipping.
        </p>

        {/* Region options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {(Object.values(REGIONS) as typeof REGIONS[Region][]).map((r) => (
            <button
              key={r.code}
              onClick={() => { setSelected(r.code); setError(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 12,
                border: selected === r.code ? "2px solid hsl(var(--primary))" : "2px solid hsl(var(--border))",
                background: selected === r.code ? "hsl(var(--primary)/0.08)" : "hsl(var(--background))",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              <span style={{ fontSize: "1.6rem" }}>{r.flag}</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "hsl(var(--foreground))" }}>{r.label}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>{r.currency}</p>
              </div>
              {selected === r.code && (
                <span style={{ marginLeft: "auto", color: "hsl(var(--primary))", fontWeight: 900, fontSize: "1.1rem" }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: "Georgia, serif", fontSize: "0.75rem", color: "#dc2626", marginBottom: 12 }}>
            Please select a region to continue.
          </p>
        )}

        <button
          onClick={handleConfirm}
          style={{
            width: "100%", padding: "14px", borderRadius: "999px",
            background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
            border: "none", cursor: "pointer",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "0.85rem", fontWeight: 900,
            letterSpacing: "0.15em", textTransform: "uppercase",
            transition: "opacity 0.2s",
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default RegionGate;