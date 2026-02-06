import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id, x-region',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicant_id, document_number, document_type } = await req.json();

    if (!applicant_id || !document_number) {
      throw new Error('Missing required fields: applicant_id and document_number');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get applicant details
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('full_name, email, phone, application_id, document_type')
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

    // Insert document record
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        applicant_id,
        document_number,
        document_type: document_type || applicant.document_type,
        uploaded_by: req.headers.get('x-user-id'),
      });

    if (docError) {
      throw new Error(`Failed to insert document: ${docError.message}`);
    }

    // Format document type for display
    const documentTypeDisplay = (document_type || applicant.document_type)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    // Send email notification using Gmail SMTP with denomailer
    const notificationMessage = `Your ${documentTypeDisplay} (${document_number}) is ready for collection. Please visit the Huduma Centre with your application receipt.`;
    
    let emailStatus = 'sent';
    let errorMessage = null;
    
    try {
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

      await client.send({
        from: gmailUser,
        to: applicant.email,
        subject: `Your ${documentTypeDisplay} is Ready for Collection`,
        html: `
          <h2>${documentTypeDisplay} Ready</h2>
          <p>Dear ${applicant.full_name},</p>
          <p>${notificationMessage}</p>
          <p><strong>Document Type:</strong> ${documentTypeDisplay}</p>
          <p><strong>Document Number:</strong> ${document_number}</p>
          <p><strong>Application ID:</strong> ${applicant.application_id}</p>
          <br>
          <p>Best regards,<br>Huduma Centre Team</p>
        `,
      });

      await client.close();
      
      console.log('Email sent successfully to:', applicant.email);
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

    console.log(`Document uploaded successfully for applicant ${applicant.full_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document uploaded and notification created successfully',
        email: applicant.email,
        applicant_name: applicant.full_name,
        document_number,
        document_type: documentTypeDisplay,
        email_status: emailStatus,
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
