import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "What is your delivery time?",
    answer:
      "All our pieces are handmade to order, so delivery can take approximately 3–4 weeks depending on order volume and customization details. We'll keep you updated throughout the process ♡",
  },
  {
    id: 2,
    question: "What payment methods do you offer?",
    answer:
      "We only accept bank payments. We do not offer Cash on Delivery (COD).\n\nYour order will only be confirmed once payment has been received.",
  },
  {
    id: 3,
    question: "Do you ship worldwide?",
    answer:
      "We currently only ship within Pakistan and the United Kingdom.\n\nPlease note that UK orders may take longer to arrive and can take a few months depending on processing and shipping times. Once your order is placed, we'll notify you with an estimated delivery timeframe.",
  },
  {
    id: 4,
    question: "Care Instructions",
    answer:
      "All our pieces are handmade with delicate bead embroidery, so please handle them with care ♡\n\n• Hand wash only in cold water\n• Do not wring the shirt\n• Hang to dry (no tumble drying)\n• Do not iron directly on the beads\n• Store your beaded items folded carefully to help maintain their shape and quality\n\nWith proper care, your piece will stay beautiful for a long time ✨",
  },
  {
    id: 5,
    question: "Do you take custom orders?",
    answer:
      "Yes, we do offer custom orders ♡\n\nTo request a custom piece, please DM us on Instagram at @solea.khi or email us at shopsoleakhi@gmail.com with the design or idea you would like created.\n\nCustom orders are accepted on a slot basis, so we can only take requests when slots are available. We take a limited number of custom orders each month to ensure every piece receives the time and detail it deserves ✨",
  },
  {
    id: 6,
    question: "What is your exchange & return policy?",
    answer:
      "We do not offer exchanges or returns.\n\nIf you receive a damaged or defective item, please contact us within 24 hours of receiving your order and include clear photos of the issue. Claims reported after 24 hours of delivery will not be eligible for exchange or store credit.\n\nAll sales are final once an order has been placed and confirmed.",
  },
  {
    id: 7,
    question: "Can I cancel or modify my order?",
    answer:
      "Once production has started, orders cannot be cancelled or modified.\n\nPlease make sure all order details are correct before placing your order.",
  },
  {
    id: 8,
    question: "Will my item look exactly like the photo?",
    answer:
      "Due to the handmade nature of our products, slight variations may occur, making each piece unique ♡",
  },
];

const NeedleDoodle = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ opacity: 0.75 }}>
    <line x1="10" y1="42" x2="42" y2="10" stroke="hsl(var(--solea-rose))" strokeWidth="2.2" strokeLinecap="round" />
    <ellipse cx="43" cy="9" rx="4" ry="2.5" transform="rotate(-45 43 9)" stroke="hsl(var(--solea-rose))" strokeWidth="1.8" fill="none" />
    <circle cx="43" cy="9" r="1.2" fill="hsl(var(--solea-rose))" />
    <path d="M10 42 Q8 46 12 46" stroke="hsl(var(--solea-rose))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M14 38 Q20 30 18 22 Q16 14 24 12" stroke="hsl(var(--solea-pink))" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="2 3" />
  </svg>
);

const SewingMachineDoodle = () => (
  <svg width="64" height="56" viewBox="0 0 64 56" fill="none" style={{ opacity: 0.75 }}>
    <rect x="14" y="18" width="36" height="24" rx="6" stroke="hsl(var(--solea-rose))" strokeWidth="2" fill="none" />
    <path d="M28 18 L28 8 Q28 4 32 4 L44 4 Q48 4 48 8 L48 18" stroke="hsl(var(--solea-rose))" strokeWidth="2" fill="none" strokeLinecap="round" />
    <line x1="32" y1="4" x2="32" y2="44" stroke="hsl(var(--solea-pink))" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="32" cy="44" rx="2.5" ry="1.5" fill="hsl(var(--solea-rose))" />
    <circle cx="46" cy="28" r="7" stroke="hsl(var(--solea-rose))" strokeWidth="1.5" fill="none" />
    <circle cx="46" cy="28" r="2" fill="hsl(var(--solea-rose))" />
    <rect x="10" y="42" width="44" height="6" rx="3" stroke="hsl(var(--solea-rose))" strokeWidth="1.5" fill="none" />
    <rect x="18" y="26" width="8" height="8" rx="2" stroke="hsl(var(--solea-rose))" strokeWidth="1.2" fill="none" />
    <line x1="22" y1="26" x2="22" y2="34" stroke="hsl(var(--solea-pink))" strokeWidth="1" />
  </svg>
);

const FigureDoodle = () => (
  <svg width="44" height="60" viewBox="0 0 44 60" fill="none" style={{ opacity: 0.75 }}>
    <circle cx="22" cy="10" r="7" stroke="hsl(var(--solea-rose))" strokeWidth="2" fill="none" />
    <line x1="22" y1="17" x2="22" y2="38" stroke="hsl(var(--solea-rose))" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 24 L10 32" stroke="hsl(var(--solea-rose))" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 24 L34 20" stroke="hsl(var(--solea-rose))" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 38 L14 52" stroke="hsl(var(--solea-rose))" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 38 L30 52" stroke="hsl(var(--solea-rose))" strokeWidth="2" strokeLinecap="round" />
    <line x1="34" y1="20" x2="42" y2="12" stroke="hsl(var(--solea-pink))" strokeWidth="1.5" strokeLinecap="round" />
    <text x="6" y="35" fontSize="10" fill="hsl(var(--solea-rose))">✦</text>
  </svg>
);

function renderAnswer(answer: string) {
  const lines = answer.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key} style={{ listStyle: "none", margin: "10px 0", padding: 0 }}>
        {bulletBuffer.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ color: "hsl(var(--solea-rose))", flexShrink: 0, marginTop: 1 }}>✦</span>
            <span>{b.replace(/^[•\-]\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushBullets(`flush-${i}`); return; }
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      bulletBuffer.push(trimmed);
    } else {
      flushBullets(`flush-${i}`);
      elements.push(
        <p key={i} style={{ margin: "0 0 8px", lineHeight: 1.65 }}>{trimmed}</p>
      );
    }
  });
  flushBullets("final");

  return (
    <div style={{ fontSize: 14, color: "hsl(var(--foreground))" }}>
      {elements}
    </div>
  );
}

const FAQ = () => {
  const [openId, setOpenId] = useState<number | null>(null);
  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--background))", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <Navbar />

      {/* Page header */}
      <div style={{ textAlign: "center", padding: "48px 24px 32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 12 }}>
          <NeedleDoodle />
          <div>
            <h1 style={{
              fontWeight: 900,
              fontSize: "clamp(24px, 5vw, 44px)",
              color: "hsl(var(--foreground))",
              margin: 0,
              letterSpacing: "0.04em",
            }}>
              Frequently Asked Questions
            </h1>
            <p style={{
              fontSize: 15,
              color: "hsl(var(--solea-rose))",
              letterSpacing: "0.15em",
              margin: "8px 0 0",
            }}>
              everything you need to know
            </p>
          </div>
          <SewingMachineDoodle />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <FigureDoodle />
        </div>
      </div>

      {/* FAQ accordion */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 80px" }}>
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              style={{
                marginBottom: 12,
                border: isOpen
                  ? "2px solid hsl(var(--primary))"
                  : "1.5px solid hsl(var(--border))",
                borderRadius: 16,
                overflow: "hidden",
                background: isOpen ? "hsl(var(--card))" : "hsl(var(--background))",
                boxShadow: isOpen ? "0 4px 20px hsl(var(--primary) / 0.12)" : "none",
                transition: "border-color 0.25s, box-shadow 0.25s, background 0.25s",
              }}
            >
              <button
                onClick={() => toggle(faq.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 22px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 16,
                }}
              >
                <span style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 15,
                  fontWeight: isOpen ? 700 : 400,
                  color: "hsl(var(--foreground))",
                  lineHeight: 1.4,
                  flex: 1,
                }}>
                  {faq.question}
                </span>
                <span style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1.5px solid hsl(var(--primary))",
                  background: isOpen ? "hsl(var(--primary))" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s, transform 0.3s",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  color: isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))",
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              <div style={{
                maxHeight: isOpen ? 600 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}>
                <div style={{
                  padding: "0 22px 20px",
                  borderTop: "1px solid hsl(var(--border))",
                  paddingTop: 16,
                }}>
                  {renderAnswer(faq.answer)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;