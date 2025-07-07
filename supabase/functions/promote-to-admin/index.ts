import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Extract the token from the request URL
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  // 1. Basic validation: A token must be provided.
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Create a Supabase admin client.
    // This client uses the service_role key to bypass RLS.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Find the invite token in the database.
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('admin_invites')
      .select('user_id_to_promote, used_at, expires_at')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. More validation: Check if token was used or has expired.
    if (invite.used_at) {
      return new Response(JSON.stringify({ error: 'This token has already been used.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This token has expired.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Promote the user by updating their metadata.
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      invite.user_id_to_promote,
      { app_metadata: { role: 'admin' } }
    );

    if (updateUserError) throw updateUserError;

    // 6. Mark the token as used to prevent reuse.
    await supabaseAdmin
      .from('admin_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // 7. Success! Return a friendly message.
    return new Response('<h1>Success!</h1><p>You have been promoted to an admin.</p>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    // Catch any unexpected errors.
    console.error(error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});