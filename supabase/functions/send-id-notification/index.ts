import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicant_id, national_id_number } = await req.json();

    if (!applicant_id || !national_id_number) {
      throw new Error('Missing required fields: applicant_id and national_id_number');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get applicant details
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('full_name, email, phone, application_id')
      .eq('id', applicant_id)
      .single();

    if (applicantError || !applicant) {
      throw new Error(`Applicant not found: ${applicantError?.message}`);
    }

    if (!applicant.email) {
      throw new Error('Applicant does not have an email address');
    }

    // Update applicant status to 'ready'
    const { error: updateError } = await supabase
      .from('applicants')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', applicant_id);

    if (updateError) {
      throw new Error(`Failed to update applicant status: ${updateError.message}`);
    }

    // Insert national ID record
    const { error: idError } = await supabase
      .from('national_ids')
      .insert({
        applicant_id,
        national_id_number,
        uploaded_by: req.headers.get('x-user-id'),
      });

    if (idError) {
      throw new Error(`Failed to insert national ID: ${idError.message}`);
    }

    // Prepare email content
    const emailSubject = 'Your National ID is Ready for Collection';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006400;">National ID Ready for Collection</h2>
        <p>Dear ${applicant.full_name},</p>
        <p>We are pleased to inform you that your National ID is now ready for collection at the Huduma Centre.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Application ID:</strong> ${applicant.application_id}</p>
          <p><strong>National ID Number:</strong> ${national_id_number}</p>
        </div>
        <p><strong>What to bring when collecting your ID:</strong></p>
        <ul>
          <li>This notification (printed or on your phone)</li>
          <li>Your application receipt</li>
          <li>Any government-issued identification for verification</li>
        </ul>
        <p>Please visit your nearest Huduma Centre during working hours (Monday to Friday, 8:00 AM - 5:00 PM).</p>
        <p>Thank you for your patience.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from the Huduma Centre National ID Registration System.
        </p>
      </div>
    `;

    // Configure Gmail SMTP client
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      throw new Error('Gmail credentials not configured');
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    // Create notification record
    const notificationMessage = `Your National ID (${national_id_number}) is ready for collection.`;
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        applicant_id,
        channel: 'email',
        message: notificationMessage,
        status: 'pending',
      })
      .select()
      .single();

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    try {
      // Send email
      await client.send({
        from: gmailUser,
        to: applicant.email,
        subject: emailSubject,
        content: emailBody,
        html: emailBody,
      });

      await client.close();

      // Update notification status to sent
      await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          attempts: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      console.log(`Email sent successfully to ${applicant.email}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'ID uploaded and notification sent successfully',
          email: applicant.email,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (emailError: any) {
      // Update notification status to failed
      await supabase
        .from('notifications')
        .update({
          status: 'failed',
          error_message: emailError.message,
          attempts: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      throw new Error(`Failed to send email: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error('Error in send-id-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
