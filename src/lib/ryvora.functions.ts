import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SHOPIFY_ADMIN_API_VERSION = "2025-07";
const SHOP_DOMAIN = "store-launchpad-8eiyj-6duiwzes.myshopify.com";

async function addShopifyCustomer(email: string) {
  const token = process.env["SHOPIFY_ACCESS_TOKEN"];
  if (!token) return { id: null as string | null, error: "missing_admin_token" };

  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/customers.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        customer: {
          email,
          tags: "ryvora-coming-soon",
          accepts_marketing: true,
          email_marketing_consent: {
            state: "subscribed",
            opt_in_level: "single_opt_in",
            consent_updated_at: new Date().toISOString(),
          },
        },
      }),
    },
  );

  const text = await res.text();
  if (!res.ok) {
    console.error(`Shopify customer create failed [${res.status}]: ${text}`);
    return { id: null as string | null, error: `${res.status}: ${text.slice(0, 500)}` };
  }

  try {
    const json = JSON.parse(text) as { customer?: { id?: number } };
    return { id: json.customer?.id ? String(json.customer.id) : null, error: null as string | null };
  } catch {
    return { id: null as string | null, error: null as string | null };
  }
}

export const subscribe = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(254) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("subscribers")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (existing) return { ok: true, alreadySubscribed: true };

    const shopify = await addShopifyCustomer(data.email);

    const { error } = await supabaseAdmin.from("subscribers").insert({
      email: data.email,
      shopify_customer_id: shopify.id,
      shopify_error: shopify.error,
    });

    if (error && !error.message.includes("duplicate")) {
      console.error("Subscriber insert failed:", error.message);
      throw new Error("Could not save your email. Please try again.");
    }

    return { ok: true, alreadySubscribed: false };
  });

export const heartbeat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ visitorId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("site_presence")
      .upsert({ visitor_id: data.visitorId, last_seen: now }, { onConflict: "visitor_id" });
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ passcode: z.string().max(200) }).parse(data))
  .handler(async ({ data }) => {
    const expected = process.env["RYVORA_ADMIN_PASSCODE"];
    if (!expected || data.passcode !== expected) {
      throw new Error("Wrong passcode.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("site_presence").delete().lt("last_seen", staleCutoff);

    const [{ count: liveNow }, { count: total }, { data: recent }] = await Promise.all([
      supabaseAdmin
        .from("site_presence")
        .select("visitor_id", { count: "exact", head: true })
        .gte("last_seen", cutoff),
      supabaseAdmin.from("subscribers").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscribers")
        .select("email, created_at, shopify_customer_id")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    return {
      liveVisitors: liveNow ?? 0,
      totalSubscribers: total ?? 0,
      subscribers: recent ?? [],
    };
  });
