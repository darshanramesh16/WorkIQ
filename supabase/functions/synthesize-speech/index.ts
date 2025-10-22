import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();
    const ELEVEN_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVEN_API_KEY) {
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not set' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'Rachel'}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: String(text || ''),
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.3, similarity_boost: 0.8 }
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: err }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const audio = await resp.arrayBuffer();
    return new Response(audio, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg'
      }
    });
  } catch (error) {
    console.error('Error in synthesize-speech:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
