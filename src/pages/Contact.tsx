import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.message) return;
    const subject = encodeURIComponent(`Message from ${form.name} — solea.khi`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:shopsoleakhi@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "14px",
    color: "hsl(var(--foreground))",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "Georgia, serif",
    fontSize: "13px",
    fontWeight: 700,
    color: "hsl(var(--foreground))",
    marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--background))", fontFamily: "Georgia, serif" }}>
      <Navbar />

      {/* Page Header */}
      <div style={{ textAlign: "center", padding: "52px 24px 36px" }}>
        <h1 style={{ fontWeight: 900, fontSize: "clamp(28px, 5vw, 48px)", color: "hsl(var(--foreground))", margin: "0 0 10px", letterSpacing: "0.02em" }}>
          Contact Us
        </h1>
        <p style={{ fontSize: "14px", color: "hsl(var(--solea-rose))", letterSpacing: "0.15em", margin: 0 }}>
          We'd love to hear from you
        </p>
      </div>

      {/* Main layout */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "40px",
          alignItems: "start",
        }}
        className="contact-grid"
      >
        <style>{`
          @media (max-width: 768px) {
            .contact-grid { grid-template-columns: 1fr !important; }
            .contact-info-panel { order: 2; }
            .contact-form-panel { order: 1; }
          }
          .contact-input:focus {
            border-color: hsl(var(--primary)) !important;
            box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
          }
          .contact-input::placeholder {
            color: hsl(var(--foreground) / 0.35);
          }
        `}</style>

        {/* Left — Info Panel */}
        <div className="contact-info-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))", borderRadius: "20px", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ fontWeight: 900, fontSize: "16px", color: "hsl(var(--foreground))", margin: "0 0 4px", letterSpacing: "0.05em" }}>
              Get in touch
            </p>

            <a
              href="mailto:shopsoleakhi@gmail.com"
              style={{ display: "flex", alignItems: "flex-start", gap: "12px", textDecoration: "none", color: "inherit" }}
            >
              <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>✉️</span>
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.15em", opacity: 0.5, margin: "0 0 3px", textTransform: "uppercase" }}>Email</p>
                <p style={{ fontSize: "13px", color: "hsl(var(--foreground))", margin: 0, wordBreak: "break-all" }}>shopsoleakhi@gmail.com</p>
              </div>
            </a>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>📍</span>
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.15em", opacity: 0.5, margin: "0 0 3px", textTransform: "uppercase" }}>Location</p>
                <p style={{ fontSize: "13px", color: "hsl(var(--foreground))", margin: 0 }}>Karachi, Pakistan</p>
              </div>
            </div>

            <a
              href="https://www.instagram.com/solea.khi"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: "12px", textDecoration: "none", color: "inherit" }}
            >
              <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>📷</span>
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.15em", opacity: 0.5, margin: "0 0 3px", textTransform: "uppercase" }}>Instagram</p>
                <p style={{ fontSize: "13px", color: "hsl(var(--foreground))", margin: 0 }}>@solea.khi</p>
              </div>
            </a>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>🕐</span>
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.15em", opacity: 0.5, margin: "0 0 3px", textTransform: "uppercase" }}>Response Time</p>
                <p style={{ fontSize: "13px", color: "hsl(var(--foreground))", margin: 0 }}>Usually within 24 hours</p>
              </div>
            </div>
          </div>

          {/* Instagram CTA */}
          <a
            href="https://www.instagram.com/solea.khi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px",
              borderRadius: "16px",
              background: "repeating-linear-gradient(to right, hsl(var(--solea-pink)), hsl(var(--solea-pink)) 30px, hsl(var(--solea-beige)) 30px, hsl(var(--solea-beige)) 60px)",
              textDecoration: "none",
              color: "hsl(var(--foreground))",
              fontFamily: "Georgia, serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <InstagramIcon />
            Follow us on Instagram
          </a>
        </div>

        {/* Right — Form */}
        <div
          className="contact-form-panel"
          style={{
            background: "hsl(var(--card))",
            border: "1.5px solid hsl(var(--border))",
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 4px 24px hsl(var(--primary) / 0.06)",
          }}
        >
          <p style={{ fontWeight: 900, fontSize: "20px", color: "hsl(var(--foreground))", margin: "0 0 28px", letterSpacing: "0.02em" }}>
            Send us a Message
          </p>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "32px", margin: "0 0 12px" }}>✉️</p>
              <p style={{ fontWeight: 700, fontSize: "16px", color: "hsl(var(--foreground))", margin: "0 0 8px" }}>Message sent!</p>
              <p style={{ fontSize: "13px", opacity: 0.65, margin: "0 0 24px" }}>We'll get back to you within 24 hours.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", message: "" }); }}
                style={{ background: "transparent", border: "1.5px solid hsl(var(--primary))", borderRadius: "999px", color: "hsl(var(--primary))", fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 700, padding: "10px 28px", cursor: "pointer", letterSpacing: "0.1em" }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: "hsl(var(--primary))" }}>*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  className="contact-input"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Phone Number <span style={{ color: "hsl(var(--primary))" }}>*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="03XX XXXXXXX"
                  value={form.phone}
                  onChange={handleChange}
                  className="contact-input"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Email <span style={{ color: "hsl(var(--primary))" }}>*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="contact-input"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Message <span style={{ color: "hsl(var(--primary))" }}>*</span>
                </label>
                <textarea
                  name="message"
                  placeholder="Write your message here…"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="contact-input"
                  style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.phone || !form.email || !form.message}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "999px",
                  border: "none",
                  background: (!form.name || !form.phone || !form.email || !form.message)
                    ? "hsl(var(--solea-pink) / 0.5)"
                    : "hsl(var(--solea-pink))",
                  color: "hsl(var(--foreground))",
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: (!form.name || !form.phone || !form.email || !form.message) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.2s, background 0.2s",
                  marginTop: "4px",
                }}
                onMouseEnter={(e) => { if (form.name && form.phone && form.email && form.message) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <SendIcon />
                Send Message
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
