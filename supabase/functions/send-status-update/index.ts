import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppSettings {
  resend_api_key: string | null;
  from_email: string | null;
}

async function getSettings(supabase: ReturnType<typeof createClient>): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("resend_api_key, from_email")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { resend_api_key: null, from_email: null };
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookingId, status } = await req.json();
    if (!bookingId || !status) {
      return new Response(JSON.stringify({ error: "bookingId and status are required" }), {
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

    const statusConfig: Record<string, { subject: string; title: string; message: string }> = {
      accepted: {
        subject: "Votre demande de réservation est acceptée",
        title: "Bonne nouvelle ! Votre demande est acceptée",
        message: "Nous avons le plaisir de vous informer que votre demande de réservation pour l'Algéco fixe à Rochetoirin a été <strong style=\"color: #059669;\">acceptée</strong>. Nous vous contacterons prochainement pour finaliser les détails.",
      },
      refused: {
        subject: "Réponse à votre demande de réservation",
        title: "Réponse à votre demande de réservation",
        message: "Nous vous remercions pour votre demande de réservation. Malheureusement, les dates souhaitées ne sont pas disponibles. N'hésitez pas à soumettre une nouvelle demande pour d'autres dates.",
      },
      pending: {
        subject: "Votre demande de réservation est en cours de traitement",
        title: "Votre demande est en cours d'étude",
        message: "Votre demande de réservation est à nouveau <strong style=\"color: #d97706;\">en attente</strong>. Nous l'étudierons et vous tiendrons informé(e).",
      },
    };

    const config = statusConfig[status];
    if (!config) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
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
        <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px;">${config.title}</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Bonjour ${booking.name},</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">${config.message}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px; width: 160px;">Dates souhaitées</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.requested_dates}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Type de besoin</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${needTypeLabels[booking.need_type] || booking.need_type}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Nb de personnes</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${booking.people_count}</td></tr>
        </table>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Cordialement,<br>ETS Laurent Mathieu</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.resend_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: booking.email,
        subject: config.subject,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return new Response(JSON.stringify({ error: `Resend API error: ${errBody}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
