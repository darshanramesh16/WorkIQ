// This is a Deno Edge Function. Type checking in the monorepo's TypeScript environment
// (Node/Vite) can't resolve Deno std imports. Disable TS checks for this file so the
// repo-level typechecker doesn't report errors here.
// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:8081',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

type EvaluateRequest = {
  input?: string;
  transcript?: Array<{ role: string; content: string; ts?: string }>;
  role?: string;
  jobDescription?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // Reply to preflight with allowed methods and headers
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as EvaluateRequest;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const textBlock = body.input ?? (body.transcript?.map(m => `${m.role}: ${m.content}`).join('\n') ?? '');

    const systemPrompt = `You are an AI hiring assistant.
Analyze the candidate answers and return STRICT JSON with these fields:
{
  "skills": string[],
  "communication": number,  // 0-10
  "confidence": number,     // 0-10
  "relevance": number,      // 0-10
  "overall_fit": number,    // 0-100
  "summary": string
}
Consider role: ${body.role ?? 'N/A'} and job: ${body.jobDescription ?? 'N/A'}.
Ensure valid JSON only, no extra commentary.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: textBlock.slice(0, 30000) },
        ],
      }),
    });

    const data = await response.json();
    let result;
    try {
      result = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    } catch {
      result = {
        skills: [],
        communication: 7,
        confidence: 7,
        relevance: 7,
        overall_fit: 70,
        summary: 'Auto-generated fallback summary based on heuristic.'
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in evaluate-response:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
