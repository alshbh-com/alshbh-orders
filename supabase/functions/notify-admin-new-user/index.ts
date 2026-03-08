import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();
    if (!record) {
      return new Response(JSON.stringify({ error: 'No record' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all admin user IDs
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: 'No admins found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminIds = admins.map(a => a.user_id);
    const userName = record.full_name || record.email || 'مستخدم جديد';

    const ONESIGNAL_APP_ID = 'e1ee5f4c-8496-422e-8bd7-f3aeac59ca2e';
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

    // Send push notification to all admins via OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: adminIds },
        target_channel: 'push',
        headings: { ar: '👤 مستخدم جديد!', en: 'New User!' },
        contents: {
          ar: `سجل مستخدم جديد: ${userName}`,
          en: `New user registered: ${userName}`,
        },
        url: `https://alshbh.store/admin`,
      }),
    });

    const result = await response.json();
    console.log('OneSignal admin notify response:', JSON.stringify(result));

    // Also create in-app notifications for admins
    await Promise.all(adminIds.map(adminId =>
      supabase.from('notifications').insert({
        user_id: adminId,
        title: '👤 مستخدم جديد!',
        message: `سجل مستخدم جديد: ${userName}`,
      })
    ));

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
