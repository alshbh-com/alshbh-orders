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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete orders older than 2 months
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const cutoff = twoMonthsAgo.toISOString();

    // First delete order_items for old orders
    const { data: oldOrders } = await supabase
      .from("orders")
      .select("id")
      .lt("created_at", cutoff);

    if (oldOrders && oldOrders.length > 0) {
      const orderIds = oldOrders.map(o => o.id);
      
      // Delete order items first (foreign key)
      await supabase.from("order_items").delete().in("order_id", orderIds);
      
      // Delete old orders
      const { error, count } = await supabase
        .from("orders")
        .delete()
        .lt("created_at", cutoff);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, deleted: oldOrders.length, cutoff }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, deleted: 0, cutoff }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
