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
    const { resumeText, currentPosition, performanceData } = await req.json();
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
            content: 'You are a career development expert analyzing employee career paths.'
          },
          {
            role: 'user',
            content: `Analyze career development for employee:
Current Position: ${currentPosition}
Resume: ${resumeText}
Performance: ${JSON.stringify(performanceData)}

Provide JSON response:
{
  "skillGaps": ["skill1", "skill2"],
  "careerPath": {
    "current": "Current Role",
    "next": ["Option 1", "Option 2"],
    "timeline": "1-2 years"
  },
  "learningRoadmap": [
    {"skill": "Skill", "resources": ["Course 1"], "priority": "high"}
  ],
  "promotionProbability": 75,
  "attritionRisk": "low"
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing career:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
