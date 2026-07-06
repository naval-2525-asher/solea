// supabase/functions/send-order-emails/index.ts
// Sends order notification emails using Resend (https://resend.com)
//
// Required Supabase secret:
//   RESEND_API_KEY  — your Resend API key
//
// Deploy with:
//   supabase functions deploy send-order-emails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ADMIN_EMAIL = "shopsoleakhi@gmail.com";
const FROM_EMAIL = "Soléa Orders <orders@soleakhi.com>";
const RESEND_API = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not set in Supabase secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const { type, order, email, code } = body;

  let emailPayload: any = null;

  // ── Helper: format items list (HTML) ──
  const extraCustomisationDetails = (item: any): string[] => {
    const custom = item.customisation && typeof item.customisation === "object" ? item.customisation : {};
    return Object.entries(custom)
      .filter(([key, val]) => val && !(key === "Colour" && val === item.color))
      .map(([key, val]) => `${key}: ${val}`);
  };

  const itemsHtml = (items: any[], region: string) =>
    (items || [])
      .map((item: any) => {
        const typeLabel = item.style === "accessory" ? null : item.style === "tee" ? "Tee" : item.style === "tank" ? "Tank" : null;
        const details = [typeLabel, item.color, item.size, ...extraCustomisationDetails(item)].filter(Boolean).join(", ") || "—";
        return `<tr>
            <td style="padding:6px 8px;font-family:Georgia,serif;font-size:14px;color:#333;">${item.name} (${details})</td>
            <td style="padding:6px 8px;font-family:Georgia,serif;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
            <td style="padding:6px 8px;font-family:Georgia,serif;font-size:14px;color:#333;text-align:right;">${
              region === "UK"
                ? `£${(item.price * item.quantity).toLocaleString("en-GB")}`
                : `PKR ${(item.price * item.quantity).toLocaleString()}`
            }</td>
          </tr>`;
      })
      .join("");

  const formatTotal = (total: number, region: string) =>
    region === "UK"
      ? `£${Number(total).toLocaleString("en-GB")}`
      : `PKR ${Number(total).toLocaleString()}`;

  // ── TYPE 1: Admin notification on new order ──
  if (type === "admin_new_order") {
    const screenshotBlock = order.transaction_screenshot
      ? `<p style="margin:12px 0 6px;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#333;">Transaction Screenshot</p>
         <a href="${order.transaction_screenshot}" target="_blank"
            style="display:inline-block;padding:10px 22px;background:#8B1A1A;color:#fff;font-family:Georgia,serif;font-size:13px;text-decoration:none;border-radius:24px;font-weight:bold;">
           📷 View Screenshot
         </a>
         <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:11px;color:#888;">(Opens the full image in your browser)</p>`
      : `<p style="font-family:Georgia,serif;font-size:13px;color:#888;">No screenshot uploaded.</p>`;

    emailPayload = {
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🛍 New Soléa Order — ${order.first_name} ${order.last_name}`,
      html: `
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8ddd4;border-radius:12px;overflow:hidden;">
          <div style="background:#8B1A1A;padding:24px 32px;">
            <h1 style="font-family:Georgia,serif;color:#fff;margin:0;font-size:22px;letter-spacing:1px;">soléa</h1>
            <p style="font-family:Georgia,serif;color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">New Order Received</p>
          </div>
          <div style="padding:28px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:18px;color:#1a1a1a;margin:0 0 20px;">Order Details</h2>

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;width:40%;">Customer</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;font-weight:bold;">${order.first_name} ${order.last_name}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Email</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${order.email}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Phone</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${order.phone}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Address</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${order.address}, ${order.city}${order.province ? `, ${order.province}` : ""}${order.postcode ? ` ${order.postcode}` : ""}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Transaction ID</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;font-weight:bold;">${order.transaction_id || "—"}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Region</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${order.region || "PK"}</td></tr>
            </table>

            <p style="margin:16px 0 8px;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#333;">Items Ordered</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e8ddd4;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f9f4f0;">
                  <th style="padding:8px;font-family:Georgia,serif;font-size:12px;text-align:left;color:#888;">Item</th>
                  <th style="padding:8px;font-family:Georgia,serif;font-size:12px;text-align:center;color:#888;">Qty</th>
                  <th style="padding:8px;font-family:Georgia,serif;font-size:12px;text-align:right;color:#888;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsHtml(order.items, order.region)}</tbody>
              <tfoot>
                <tr style="background:#f9f4f0;border-top:2px solid #e8ddd4;">
                  <td colspan="2" style="padding:10px 8px;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#333;">Total</td>
                  <td style="padding:10px 8px;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#8B1A1A;text-align:right;">${formatTotal(order.total, order.region)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="margin-top:24px;padding:16px;background:#fff8f5;border:1px solid #e8ddd4;border-radius:8px;">
              ${screenshotBlock}
            </div>
          </div>
          <div style="padding:16px 32px;background:#f9f4f0;border-top:1px solid #e8ddd4;">
            <p style="font-family:Georgia,serif;font-size:11px;color:#aaa;margin:0;">Soléa Admin Panel — automated notification</p>
          </div>
        </div>
      `,
    };
  }

  // ── TYPE 2: Customer thank-you email ──
  else if (type === "customer_confirmation") {
    emailPayload = {
      from: FROM_EMAIL,
      to: [order.email],
      subject: `Thank you for your Soléa order, ${order.first_name}! 🌸`,
      html: `
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8ddd4;border-radius:12px;overflow:hidden;">
          <div style="background:#8B1A1A;padding:24px 32px;">
            <h1 style="font-family:Georgia,serif;color:#fff;margin:0;font-size:22px;letter-spacing:1px;">soléa</h1>
            <p style="font-family:Georgia,serif;color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Order Confirmation</p>
          </div>
          <div style="padding:28px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:20px;color:#1a1a1a;margin:0 0 8px;">Thank you, ${order.first_name}! 🌸</h2>
            <p style="font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
              We've received your order and your transaction screenshot is currently being reviewed and verified by our team.
              You will receive all updates and confirmations via email — please keep an eye on your inbox!
            </p>

            <div style="background:#f9f4f0;border:1px solid #e8ddd4;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
              <p style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#8B1A1A;margin:0 0 12px;letter-spacing:0.5px;text-transform:uppercase;">Your Order Summary</p>
              <table style="width:100%;border-collapse:collapse;">
                ${(order.items || []).map((item: any) => {
                  const typeLabel = item.style === "accessory" ? null : item.style === "tee" ? "Tee" : item.style === "tank" ? "Tank" : null;
                  const details = [typeLabel, item.color, item.size, ...extraCustomisationDetails(item)].filter(Boolean).join(", ") || "—";
                  return `<tr>
                    <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${item.name} (${details}) × ${item.quantity}</td>
                    <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;text-align:right;font-weight:bold;">${
                      order.region === "UK"
                        ? `£${(item.price * item.quantity).toLocaleString("en-GB")}`
                        : `PKR ${(item.price * item.quantity).toLocaleString()}`
                    }</td>
                  </tr>`;
                }).join("")}
                <tr style="border-top:1px solid #e8ddd4;">
                  <td style="padding:10px 0 0;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#333;">Total</td>
                  <td style="padding:10px 0 0;font-family:Georgia,serif;font-size:14px;font-weight:bold;color:#8B1A1A;text-align:right;">${formatTotal(order.total, order.region)}</td>
                </tr>
              </table>
            </div>

            <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="font-family:Georgia,serif;font-size:13px;color:#3730a3;margin:0;line-height:1.6;">
                📧 <strong>Watch your inbox!</strong> Once your payment is verified, we'll send you a confirmation email to <strong>${order.email}</strong>.
              </p>
            </div>

            <p style="font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;">
              Since each piece is hand-beaded to order, please allow up to <strong>two weeks for production</strong> before shipping. We appreciate your patience and can't wait for you to receive your Soléa! 💕
            </p>
          </div>
          <div style="padding:16px 32px;background:#f9f4f0;border-top:1px solid #e8ddd4;">
            <p style="font-family:Georgia,serif;font-size:11px;color:#aaa;margin:0;">© Soléa — hand-beaded to order with love</p>
          </div>
        </div>
      `,
    };
  }

  // ── TYPE 3: Admin notification when order is confirmed ──
  else if (type === "admin_order_confirmed") {
    const ref = (order.id || "").slice(0, 8).toUpperCase();
    emailPayload = {
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `✅ Order Confirmed — ${order.first_name} ${order.last_name} (#${ref})`,
      html: `
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8ddd4;border-radius:12px;overflow:hidden;">
          <div style="background:#8B1A1A;padding:24px 32px;">
            <h1 style="font-family:Georgia,serif;color:#fff;margin:0;font-size:22px;letter-spacing:1px;">soléa</h1>
            <p style="font-family:Georgia,serif;color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Order Verified & Confirmed</p>
          </div>
          <div style="padding:28px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:18px;color:#1a1a1a;margin:0 0 8px;">Order #${ref} has been confirmed</h2>
            <p style="font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
              You marked this order as <strong>Verified / Confirmed</strong>. A confirmation email should now be sent to the customer via the Orders panel.
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
              <p style="font-family:Georgia,serif;font-size:13px;color:#166534;margin:0 0 4px;font-weight:bold;">✅ Next Step</p>
              <p style="font-family:Georgia,serif;font-size:14px;color:#166534;margin:0;line-height:1.6;">
                Go to the <strong>Orders panel</strong> and use the <strong>Email Customer</strong> button to send the customer their order confirmation email.
              </p>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;width:40%;">Customer</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;font-weight:bold;">${order.first_name} ${order.last_name}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Email</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${order.email}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Phone</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;">${order.phone}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Total</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#8B1A1A;font-weight:bold;">${formatTotal(order.total, order.region)}</td></tr>
              <tr><td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#888;">Order Ref</td>
                  <td style="padding:5px 0;font-family:Georgia,serif;font-size:13px;color:#333;font-weight:bold;">#${ref}</td></tr>
            </table>
          </div>
          <div style="padding:16px 32px;background:#f9f4f0;border-top:1px solid #e8ddd4;">
            <p style="font-family:Georgia,serif;font-size:11px;color:#aaa;margin:0;">Soléa Admin Panel — automated notification</p>
          </div>
        </div>
      `,
    };
  }

  // ── TYPE 4: Admin password/username-change verification code ──
  // Both credential-change flows share this template; only the wording
  // (and subject) differ between "Password" and "Username".
  else if (type === "admin_password_verification" || type === "admin_username_verification") {
    const recipient = email || ADMIN_EMAIL;
    const fieldLabel = type === "admin_username_verification" ? "Username" : "Password";
    const fieldLower = fieldLabel.toLowerCase();
    emailPayload = {
      from: FROM_EMAIL,
      to: [recipient],
      subject: `🔐 Your Soléa Admin verification code: ${code}`,
      html: `
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8ddd4;border-radius:12px;overflow:hidden;">
          <div style="background:#8B1A1A;padding:24px 32px;">
            <h1 style="font-family:Georgia,serif;color:#fff;margin:0;font-size:22px;letter-spacing:1px;">soléa</h1>
            <p style="font-family:Georgia,serif;color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Admin ${fieldLabel} Change Request</p>
          </div>
          <div style="padding:28px 32px;">
            <h2 style="font-family:Georgia,serif;font-size:18px;color:#1a1a1a;margin:0 0 12px;">Verify your ${fieldLower} change</h2>
            <p style="font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
              Someone requested to change the ${fieldLower} for the Soléa Admin Panel. Enter the code below in the admin
              Settings page to confirm this change. This code expires in 10 minutes.
            </p>

            <div style="text-align:center;background:#f9f4f0;border:1px solid #e8ddd4;border-radius:10px;padding:24px;margin-bottom:24px;">
              <p style="font-family:Georgia,serif;font-size:13px;color:#888;margin:0 0 8px;letter-spacing:0.5px;text-transform:uppercase;">Verification Code</p>
              <p style="font-family:Georgia,serif;font-size:32px;font-weight:bold;color:#8B1A1A;margin:0;letter-spacing:8px;">${code}</p>
            </div>

            <div style="background:#fff8f5;border:1px solid #e8ddd4;border-radius:8px;padding:14px 16px;">
              <p style="font-family:Georgia,serif;font-size:12px;color:#888;margin:0;line-height:1.6;">
                If you didn't request this, you can safely ignore this email — your ${fieldLower} will not be changed without this code.
              </p>
            </div>
          </div>
          <div style="padding:16px 32px;background:#f9f4f0;border-top:1px solid #e8ddd4;">
            <p style="font-family:Georgia,serif;font-size:11px;color:#aaa;margin:0;">Soléa Admin Panel — automated notification</p>
          </div>
        </div>
      `,
    };
  }

  if (!emailPayload) {
    return new Response(JSON.stringify({ error: "Unknown email type." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send via Resend
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("Resend error:", result);
    return new Response(JSON.stringify({ error: result }), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, id: result.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
