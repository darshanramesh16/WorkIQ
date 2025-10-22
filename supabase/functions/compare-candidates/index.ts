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
    const { candidates, position } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const candidatesSummary = candidates.map((c: any) => ({
      name: c.candidate_name,
      score: c.ai_overall_score,
      summary: c.ai_summary,
      strengths: c.ai_strengths
    }));

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
            content: 'You are an expert recruiter comparing candidates.'
          },
          {
            role: 'user',
            content: `Compare these candidates for ${position}:
${JSON.stringify(candidatesSummary, null, 2)}

Provide JSON response:
{
  "ranking": [
    {"name": "Name", "rank": 1, "reasoning": "Why ranked here"}
  ],
  "topPick": {
    "name": "Name",
    "reasoning": "Why best fit"
  },
  "summary": "Overall comparison summary"
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const comparison = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(comparison), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error comparing candidates:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
