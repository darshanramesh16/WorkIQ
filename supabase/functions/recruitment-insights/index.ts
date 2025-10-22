import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recruitment data for analysis
    const { data: candidates } = await supabase
      .from('candidate_resumes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

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
            content: 'You are a recruitment analytics expert providing insights.'
          },
          {
            role: 'user',
            content: `Analyze recruitment data and provide insights:
Candidates: ${candidates?.length || 0}
Recent data: ${JSON.stringify(candidates?.slice(0, 10))}

Provide JSON:
{
  "predictedTimeToHire": 14,
  "candidateQualityAvg": 3.8,
  "insights": "Key insights about hiring trends",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const insights = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
