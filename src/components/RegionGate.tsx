import { useRegion, REGIONS, Region } from "@/context/RegionContext";

const RegionGate = ({ show }: { show: boolean }) => {
  const { regionSelected, setRegion } = useRegion();

  if (!show || regionSelected) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(255,255,255,0.6)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      animation: "fadeIn 0.4s ease",
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{
        background: "hsl(var(--card))",
        borderRadius: 20,
        padding: "36px 28px",
        maxWidth: 340,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        border: "1px solid hsl(var(--border))",
      }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: 900, color: "hsl(var(--foreground))", margin: "0 0 2px" }}>soléa</p>
        <p style={{ fontFamily: "Georgia, serif", fontSize: "0.65rem", letterSpacing: "0.3em", color: "hsl(var(--muted-foreground))", margin: "0 0 24px" }}>ART YOU CAN WEAR</p>

        <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 20 }}>
          Select your region
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, textAlign: "left" }}>
          {(["PK", "UK"] as Region[]).map((code) => {
            const r = REGIONS[code];
            return (
              <label
                key={code}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, border: "1.5px solid hsl(var(--border))", cursor: "pointer", background: "hsl(var(--background))" }}
              >
                <input
                  type="radio"
                  name="region"
                  value={code}
                  onChange={() => setRegion(code)}
                  style={{ accentColor: "hsl(var(--primary))", width: 16, height: 16 }}
                />
                <span style={{ fontSize: "1.3rem" }}>{r.flag}</span>
                <div>
                  <p style={{ margin: 0, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "0.85rem", color: "hsl(var(--foreground))" }}>{r.label}</p>
                  <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>{r.currency}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RegionGate;