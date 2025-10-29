import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Add print-specific styles
const printStyles = `
  @media print {
    .navigation-container, .candidate-info, .download-button, .sessions-table {
      display: none !important;
    }
    .interview-results-container {
      margin-top: 0 !important;
    }
    @page {
      size: auto;
      margin: 10mm;
    }
  }
`;

export default function InterviewReport() {
  const params = useParams();
  const candidateId = params.candidateId as string;
  const [candidate, setCandidate] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: cand } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", candidateId)
        .maybeSingle();
      setCandidate(cand || null);
      const { data: sess } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false })
        .order("start_time", { ascending: false });

      // If no sessions, create demo data for demo candidates
      if ((!sess || sess.length === 0) && candidateId.startsWith("demo-")) {
        const demoData = getDemoSessionData(candidateId);
        setSessions([demoData]);
      } else {
        setSessions(sess || []);
      }
    };
    if (candidateId) load();
  }, [candidateId]);

  // Generate demo interview results for demo candidates
  const getDemoSessionData = (demoId: string) => {
    const responses = [
      {
        question: "Tell me about your experience with React and TypeScript.",
        answer:
          "I have been working with React for over 2 years and TypeScript for about 1 year. I love the type safety that TypeScript provides and how it helps catch errors early. I've built several production applications including a dashboard for tracking user analytics and an e-commerce platform.",
        evaluation: {
          communication: 8,
          confidence: 9,
          relevance: 9,
          overall_fit: 87,
          skills: ["React", "TypeScript", "Frontend Development"],
          summary:
            "Strong technical foundation with excellent communication. Shows clear understanding of the technologies.",
        },
      },
      {
        question:
          "Describe a challenging bug you fixed and how you approached it.",
        answer:
          "There was a memory leak in a React component that was causing the application to crash after extended use. I used Chrome DevTools to identify the issue, traced it to an event listener not being cleaned up. I implemented proper useEffect cleanup hooks and fixed the issue.",
        evaluation: {
          communication: 7,
          confidence: 8,
          relevance: 8,
          overall_fit: 77,
          skills: ["Debugging", "React Hooks", "Performance Optimization"],
          summary:
            "Good problem-solving approach. Shows understanding of React lifecycle and debugging techniques.",
        },
      },
      {
        question: "How do you ensure code quality in your projects?",
        answer:
          "I follow several practices: writing unit tests with Jest, conducting code reviews with my team, using ESLint for code standards, and maintaining consistent coding conventions. I also refactor code regularly to improve maintainability.",
        evaluation: {
          communication: 8,
          confidence: 8,
          relevance: 9,
          overall_fit: 83,
          skills: ["Testing", "Code Quality", "Best Practices"],
          summary:
            "Demonstrates understanding of software engineering best practices and collaboration.",
        },
      },
      {
        question: "Explain your preferred state management approach.",
        answer:
          "I prefer using React hooks with Context API for smaller applications, and Redux for larger complex applications. For server state, I use React Query. Each has its place depending on the project's complexity and requirements.",
        evaluation: {
          communication: 7,
          confidence: 8,
          relevance: 8,
          overall_fit: 77,
          skills: ["State Management", "Redux", "React Hooks"],
          summary:
            "Shows good understanding of different state management solutions and when to use them.",
        },
      },
      {
        question: "Describe a system you designed from start to finish.",
        answer:
          "I designed a real-time notification system using WebSockets. I started by analyzing requirements, designed the database schema, created the backend API with Node.js, implemented the frontend with React, and deployed it using Docker. The system handles millions of notifications daily.",
        evaluation: {
          communication: 9,
          confidence: 9,
          relevance: 9,
          overall_fit: 90,
          skills: ["System Design", "WebSockets", "Full-stack Development"],
          summary:
            "Excellent end-to-end thinking. Shows strong architectural and technical skills.",
        },
      },
    ];

    return {
      id: "demo-session-1",
      candidate_id: demoId,
      mode: "chat",
      start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      transcript: responses.map((r, i) => ({
        role: "user",
        content: r.answer,
        ts: Date.now() - (responses.length - i) * 300000,
      })),
      analysis_json: {
        summary:
          "Strong candidate with solid technical skills and good communication. Demonstrates practical experience and problem-solving abilities.",
        responses,
      },
    };
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Add style tag for print styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
      <div className="navigation-container">
        <Navigation />
      </div>
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Interview Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {candidate && (
              <div className="candidate-info grid gap-4 md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground text-sm">Name</span>
                  <div className="font-semibold">{candidate.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Role</span>
                  <div className="font-semibold">{candidate.job_role}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Email</span>
                  <div className="font-semibold">{candidate.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Status</span>
                  <div className="font-semibold capitalize">
                    {candidate.status}
                  </div>
                </div>
              </div>
            )}

            <div className="download-button flex justify-end">
              <Button onClick={() => window.print()}>Download / Print</Button>
            </div>

            <div className="sessions-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.id.slice(0, 8)}…</TableCell>
                      <TableCell className="capitalize">{s.mode}</TableCell>
                      <TableCell>
                        {new Date(s.start_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {s.end_time ? new Date(s.end_time).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>{s.analysis_json?.summary ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {sessions[0]?.analysis_json?.responses && (
              <div className="interview-results-container">
                <h3 className="font-semibold mb-2">
                  Per-question Results (latest session)
                </h3>
                <div className="space-y-4">
                  {(sessions[0].analysis_json.responses as any[]).map(
                    (r, i) => (
                      <Card key={i} className="border">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Question {i + 1} Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="font-semibold">Question: </span>
                            <span>{r.question}</span>
                          </div>
                          <div>
                            <span className="font-semibold">Answer: </span>
                            <span>{r.answer}</span>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              Communication:{" "}
                              {r.evaluation?.communication ?? "-"} /10
                            </div>
                            <div>
                              Confidence: {r.evaluation?.confidence ?? "-"} /10
                            </div>
                            <div>
                              Relevance: {r.evaluation?.relevance ?? "-"} /10
                            </div>
                            <div>
                              Overall Fit: {r.evaluation?.overall_fit ?? "-"} %
                            </div>
                          </div>
                          {Array.isArray(r.evaluation?.skills) &&
                            r.evaluation.skills.length > 0 && (
                              <div>
                                <span className="font-semibold">Skills: </span>
                                <span>{r.evaluation.skills.join(", ")}</span>
                              </div>
                            )}
                          {r.evaluation?.summary && (
                            <div>
                              <span className="font-semibold">Summary: </span>
                              <span>{r.evaluation.summary}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
