// @ts-nocheck
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AIRequest = {
  response: string;
  context: {
    question: string;
    role: string;
    jobDescription: string;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { response, context } = await req.json() as AIRequest
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    // Call OpenAI API for evaluation
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer evaluating a candidate for the role of ${context.role}. 
                     Required skills: ${context.jobDescription}
                     Evaluate the candidate's response to the following question and provide a score out of 100 along with detailed feedback.
                     Format your response as: score|feedback`
          },
          {
            role: "user",
            content: `Question: ${context.question}\nCandidate's Response: ${response}`
          }
        ],
        temperature: 0.7
      })
    })

    const aiResponse = await openAIResponse.json()
    
    if (!aiResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI')
    }

    // Parse the AI response to extract score and feedback
    const [score, ...feedbackParts] = aiResponse.choices[0].message.content.split('|')
    const feedback = feedbackParts.join('|').trim()

    const evaluation = {
      score: parseInt(score) || 0,
      feedback: feedback || 'No feedback provided'
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})