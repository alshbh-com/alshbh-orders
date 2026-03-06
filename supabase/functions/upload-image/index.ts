import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const IMGBB_API_KEY = Deno.env.get('IMGBB_API_KEY');
    if (!IMGBB_API_KEY) {
      throw new Error('IMGBB_API_KEY is not configured');
    }

    const { image } = await req.json();
    if (!image) {
      throw new Error('No image data provided');
    }

    // image should be base64 string (without data:image prefix)
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(`imgbb upload failed: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ url: data.data.display_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
