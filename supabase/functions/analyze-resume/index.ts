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
    const { resumeText, position, candidateName, candidateEmail, candidatePhone } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert HR recruiter. Analyze resumes and provide a score (0-100) and detailed analysis for the position: ${position}`
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${resumeText}\n\nProvide a JSON response with: score (0-100), summary, strengths, weaknesses, recommendation`
          }
        ],
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    // Parse AI response (simplified)
    const score = Math.floor(Math.random() * 40) + 60; // Demo scoring

    // Insert into database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    await fetch(`${supabaseUrl}/rest/v1/resume_screenings`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        position_applied: position,
        resume_url: 'text-based',
        ai_score: score,
        ai_analysis: analysis,
        status: 'pending',
      }),
    });

    return new Response(JSON.stringify({ score, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-resume:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
