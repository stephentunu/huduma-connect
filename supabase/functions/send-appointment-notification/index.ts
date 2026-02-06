import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Gmail SMTP transporter will be created when sending emails

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  appointmentId: string;
  action: "approved" | "rescheduled";
  newDate?: string;
  newTime?: string;
  staffNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointmentId, action, newDate, newTime, staffNotes }: NotificationRequest = await req.json();

    console.log("Processing notification for appointment:", appointmentId, "action:", action);

    // Fetch appointment with centre details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        huduma_centres (name, location)
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Error fetching appointment:", appointmentError);
      throw new Error("Appointment not found");
    }

    // Fetch citizen email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      appointment.citizen_id
    );

    if (userError || !userData.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Citizen email not found");
    }

    const citizenEmail = userData.user.email;
    const citizenName = userData.user.user_metadata?.full_name || "Citizen";
    const centreName = appointment.huduma_centres?.name || "Huduma Centre";
    const centreLocation = appointment.huduma_centres?.location || "";

    // Format dates
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString("en-KE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const appointmentTime = appointment.appointment_time.slice(0, 5);

    let subject: string;
    let htmlContent: string;

    if (action === "approved") {
      subject = "Your Huduma Centre Appointment is Confirmed!";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #006400; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Huduma Centre</h1>
            <p style="margin: 5px 0 0 0;">Appointment Confirmation</p>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #006400;">Hello ${citizenName},</h2>
            <p>Great news! Your appointment has been <strong style="color: green;">APPROVED</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #006400; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #006400;">Appointment Details</h3>
              <p><strong>Centre:</strong> ${centreName}</p>
              <p><strong>Location:</strong> ${centreLocation}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              ${appointment.queue_number ? `<p><strong>Queue Number:</strong> #${appointment.queue_number}</p>` : ""}
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">Important Reminders:</h4>
              <ul style="margin-bottom: 0;">
                <li>Please arrive 15 minutes before your appointment time</li>
                <li>Bring your original documents and ID</li>
                <li>Keep this email for reference</li>
              </ul>
            </div>

            ${staffNotes ? `<p><strong>Notes from staff:</strong> ${staffNotes}</p>` : ""}
            
            <p style="color: #666;">If you cannot make it, please cancel your appointment through the Citizen Portal.</p>
          </div>
          <div style="background-color: #006400; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Republic of Kenya - Huduma Centre</p>
          </div>
        </div>
      `;
    } else {
      // Rescheduled
      const newDateFormatted = newDate
        ? new Date(newDate).toLocaleDateString("en-KE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : appointmentDate;
      const newTimeFormatted = newTime?.slice(0, 5) || appointmentTime;

      subject = "Your Huduma Centre Appointment has been Rescheduled";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #006400; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Huduma Centre</h1>
            <p style="margin: 5px 0 0 0;">Appointment Update</p>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #006400;">Hello ${citizenName},</h2>
            <p>Your appointment has been <strong style="color: #FFA500;">RESCHEDULED</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #FFA500; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #006400;">New Appointment Details</h3>
              <p><strong>Centre:</strong> ${centreName}</p>
              <p><strong>Location:</strong> ${centreLocation}</p>
              <p><strong>New Date:</strong> ${newDateFormatted}</p>
              <p><strong>New Time:</strong> ${newTimeFormatted}</p>
            </div>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #666;">Original Appointment:</h4>
              <p style="margin-bottom: 0; color: #999; text-decoration: line-through;">
                ${appointmentDate} at ${appointmentTime}
              </p>
            </div>

            ${staffNotes ? `<p><strong>Reason for rescheduling:</strong> ${staffNotes}</p>` : ""}
            
            <p style="color: #666;">If this new time doesn't work for you, please contact us or book a new appointment.</p>
          </div>
          <div style="background-color: #006400; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Republic of Kenya - Huduma Centre</p>
          </div>
        </div>
      `;
    }

    // Send email via Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: Deno.env.get("GMAIL_USER"),
        pass: Deno.env.get("GMAIL_APP_PASSWORD"),
      },
    });

    const emailResponse = await transporter.sendMail({
      from: `Huduma Centre <${Deno.env.get("GMAIL_USER")}>`,
      to: citizenEmail,
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);