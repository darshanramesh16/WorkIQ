import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import type { Database } from "@/types/database.types";

interface InterviewScores {
  communication: number;
  confidence: number;
  relevance: number;
  overall_fit: number;
  details: Array<{
    question: string;
    answer: string;
    evaluation: {
      skills: string[];
      communication: number;
      confidence: number;
      relevance: number;
      overall_fit: number;
      summary: string;
    };
  }>;
  skills: string[];
}

type InterviewResult =
  Database["public"]["Tables"]["interview_results"]["Row"] & {
    scores: InterviewScores;
  };

export default function InterviewResults() {
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInterviewResults();
  }, []);

  const fetchInterviewResults = async () => {
    try {
      const { data, error } = await supabase
        .from("interview_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedResults = (data || []).map((result) => ({
        ...result,
        responses: result.responses as InterviewResponse[],
      }));

      setResults(parsedResults);
    } catch (error) {
      console.error("Error fetching interview results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScores = (result: InterviewResult) => {
    const { communication, confidence, relevance, overall_fit } = result.scores;
    return { communication, confidence, relevance, overall_fit };
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">AI Interview Results</h1>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-6">
              <p>Loading interview results...</p>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-6">
              <p>No interview results found.</p>
            </CardContent>
          </Card>
        ) : (
          results.map((result) => (
            <Card key={result.id} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{result.name}</span>
                  <Badge variant="secondary">{result.job_role}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Interviewed on{" "}
                  {new Date(result.created_at).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Scores */}
                  <div>
                    <h3 className="font-semibold mb-2">Overall Performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(getScores(result)).map(([key, value]) => (
                        <div key={key} className="bg-muted p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground capitalize">
                            {key.replace("_", " ")}
                          </div>
                          <div className="text-lg font-semibold">
                            {key === "overall_fit" ? `${value}%` : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="font-semibold mb-2">Demonstrated Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.scores.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Responses */}
                  <div>
                    <h3 className="font-semibold mb-2">Interview Responses</h3>
                    <div className="space-y-4">
                      {result.scores.details.map((response, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <p className="font-medium mb-2">
                            Q{index + 1}: {response.question}
                          </p>
                          <p className="text-muted-foreground mb-2">
                            {response.answer}
                          </p>
                          <p className="text-sm font-medium mt-2">
                            {response.evaluation.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
