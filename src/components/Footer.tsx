import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground font-serif" style={{ paddingTop: "56px", paddingBottom: "0" }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px" }}>

      {/* Column 1 — Brand */}
      <div>
        <p style={{ fontWeight: 900, fontSize: "32px", margin: "0 0 4px", lineHeight: 1 }}>soléa</p>
        <p style={{ fontSize: "10px", letterSpacing: "0.3em", opacity: 0.65, margin: "0 0 16px" }}>Art &nbsp;You &nbsp;Can &nbsp;Wear</p>
        <p style={{ fontSize: "13px", opacity: 0.75, lineHeight: 1.75, maxWidth: "220px", margin: 0 }}>
          Handmade bead embroidery pieces crafted with love in Karachi. Every stitch tells a story.
        </p>
      </div>

      {/* Column 2 — Quick Links */}
      <div>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", opacity: 0.55, margin: "0 0 16px", textTransform: "uppercase" }}>Quick Links</p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { label: "Home",            to: "/"               },
            { label: "Tanks & Tees",    to: "/shop"           },
            { label: "Accessories",     to: "/accessories"    },
            { label: "Limited Edition", to: "/limited-edition"},
            { label: "Sale",            to: "/sale"           },
            { label: "FAQ",             to: "/faq"            },
            { label: "Contact Us",      to: "/contact"        },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{ color: "inherit", textDecoration: "none", fontSize: "13px", opacity: 0.78, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.78")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Column 3 — Contact */}
      <div>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", opacity: 0.55, margin: "0 0 16px", textTransform: "uppercase" }}>Contact & Follow</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          <a
            href="mailto:shopsoleakhi@gmail.com"
            style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", opacity: 0.85, transition: "opacity 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
          >
            <Mail size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            shopsoleakhi@gmail.com
          </a>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", opacity: 0.75 }}>
            <MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            Karachi, Pakistan
          </div>

          <a
            href="https://www.instagram.com/solea.khi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "8px",
              fontSize: "13px", opacity: 0.85,
              background: "rgba(255,255,255,0.13)",
              padding: "9px 16px", borderRadius: "999px",
              transition: "background 0.2s, opacity 0.2s",
              width: "fit-content", marginTop: "4px",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.22)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.13)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          >
            <Instagram size={15} />
            @solea.khi
          </a>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", textAlign: "center", padding: "14px 24px", fontSize: "11px", opacity: 0.5, letterSpacing: "0.1em" }}>
      © 2025 Soléa. All rights reserved.
    </div>
  </footer>
);

export default Footer;
