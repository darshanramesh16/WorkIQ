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
    const WHISPER_API_KEY = Deno.env.get('WHISPER_API_KEY');
    if (!WHISPER_API_KEY) {
      return new Response(JSON.stringify({ error: 'WHISPER_API_KEY not set' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Proxy audio to Whisper or other STT provider
    // Expect multipart/form-data with file
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    if (!isMultipart) {
      return new Response(JSON.stringify({ error: 'multipart/form-data required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing audio file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Example using OpenAI Whisper API v1 (pseudo endpoint via Lovable is not available; use provider URL directly if configured)
    // This is a placeholder structure; users should set their own STT endpoint
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHISPER_API_KEY}`
      },
      body: (() => {
        const fd = new FormData();
        fd.append('model', 'whisper-1');
        fd.append('file', file, 'audio.webm');
        return fd;
      })()
    });

    const data = await resp.json();
    return new Response(JSON.stringify({ text: data.text ?? '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
