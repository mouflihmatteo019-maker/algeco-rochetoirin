import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppSettings {
  resend_api_key: string | null;
  admin_emails: string | null;
  from_email: string | null;
}

async function getSettings(supabase: ReturnType<typeof createClient>): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("resend_api_key, admin_emails, from_email")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { resend_api_key: null, admin_emails: null, from_email: null };
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const settings = await getSettings(supabase);

    if (!settings.resend_api_key) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmails = (settings.admin_emails || "").split(",").map((e) => e.trim()).filter(Boolean);
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ error: "ADMIN_EMAILS not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromEmail = settings.from_email || "onboarding@resend.dev";

    const { data: booking, error } = await supabase
      .from("booking_requests")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const needTypeLabels: Record<string, string> = {
      reunion: "Réunion",
      association: "Association",
      evenement: "Événement local",
      professionnel: "Besoin professionnel",
      autre: "Autre",
    };

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px;">Nouvelle demande de réservation</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Un visiteur vient de soumettre une demande de réservation pour l'Algéco fixe à Rochetoirin.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px; width: 160px;">Nom</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${booking.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Dates souhaitées</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.requested_dates}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Type de besoin</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${needTypeLabels[booking.need_type] || booking.need_type}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Nb de personnes</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.people_count}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.email}</td></tr>
          ${booking.message ? `<tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.message.replace(/\n/g, "<br>")}</td></tr>` : ""}
        </table>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Connectez-vous à l'espace administrateur pour traiter cette demande.</p>
      </div>
    `;

    const sendPromises = adminEmails.map((to: string) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.resend_api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject: `Nouvelle demande de réservation — ${booking.name}`,
          html,
        }),
      })
    );

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
// config updated
