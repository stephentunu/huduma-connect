import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@4.0.0';

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

    // Send email notification using Resend
    const notificationMessage = `Your National ID (${national_id_number}) is ready for collection. Please visit the Huduma Centre with your application receipt.`;
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    let emailStatus = 'sent';
    let errorMessage = null;
    
    try {
      const emailResponse = await resend.emails.send({
        from: 'Huduma Centre <onboarding@resend.dev>',
        to: [applicant.email],
        subject: 'Your National ID is Ready for Collection',
        html: `
          <h2>National ID Ready</h2>
          <p>Dear ${applicant.full_name},</p>
          <p>${notificationMessage}</p>
          <p><strong>National ID Number:</strong> ${national_id_number}</p>
          <p><strong>Application ID:</strong> ${applicant.application_id}</p>
          <br>
          <p>Best regards,<br>Huduma Centre Team</p>
        `,
      });
      
      console.log('Email sent successfully:', emailResponse);
    } catch (error: any) {
      console.error('Failed to send email:', error);
      emailStatus = 'failed';
      errorMessage = error.message;
    }

    // Create notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        applicant_id,
        channel: 'email',
        message: notificationMessage,
        status: emailStatus,
        error_message: errorMessage,
        sent_at: emailStatus === 'sent' ? new Date().toISOString() : null,
      });

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    console.log(`ID uploaded successfully for applicant ${applicant.full_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ID uploaded and notification created successfully',
        email: applicant.email,
        applicant_name: applicant.full_name,
        national_id_number,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
