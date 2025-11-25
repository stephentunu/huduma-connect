import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { email, password, name, centerName, role } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        center_name: centerName,
      },
    });

    if (authError) throw authError;

    // The profile and default role are created by the handle_new_user trigger
    // Now we need to add the admin role if specified
    if (role === "admin") {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "admin",
        });

      if (roleError) throw roleError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: authData.user.id,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
