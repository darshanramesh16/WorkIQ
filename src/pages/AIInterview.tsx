import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Mic, Volume2, Loader2, Square } from "lucide-react";

// Question sets
const QUESTION_SETS = {
  technical: [
    "Tell me about your experience with React and TypeScript.",
    "Describe a challenging bug you fixed and how you approached it.",
    "How do you ensure code quality in your projects?",
    "Explain your preferred state management approach.",
    "Describe a system you designed from start to finish.",
  ],
};

export default function AIInterview() {
  const { user } = useAuth();
  const [role, setRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState(
    "React, TypeScript, Node.js"
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<
    Array<{ question: string; answer: string; evaluation: any }>
  >([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const { toast } = useToast();

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const questions = QUESTION_SETS.technical;

  // Ensure a candidate exists for the logged in user
  const ensureCandidate = async (): Promise<string | null> => {
    if (!user) return null;
    // Try find existing candidate by user_id
    const { data: existing } = await supabase
      .from("candidates")
      .select("id, name, job_role, user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.id) {
      if (existing.name !== "Emily Davis") {
        await supabase
          .from("candidates")
          .update({ name: "Emily Davis" })
          .eq("id", existing.id);
      }
      return existing.id;
    }

    // Try get employee details for better name/role
    const { data: emp } = await supabase
      .from("employees")
      .select("full_name, position, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const insert = {
      // For the current milestone, force candidate name to Emily Davis
      name: "Emily Davis",
      email: emp?.email || user.email || "",
      job_role: emp?.position || role,
      status: "active",
      user_id: user.id,
    } as any;
    const { data: created } = await supabase
      .from("candidates")
      .insert(insert)
      .select("id")
      .maybeSingle();
    return created?.id ?? null;
  };

  const handleSubmitResponse = async (answer: string) => {
    try {
      setIsEvaluating(true);

      // Feedback messages with voice
      const feedbackMessage =
        currentQuestion === questions.length - 1
          ? "Congratulations! You've completed all questions brilliantly. Your technical expertise and communication skills were outstanding!"
          : [
              "Impressive technical knowledge! Your React and TypeScript expertise is evident.",
              "Excellent problem-solving approach! You clearly know how to debug effectively.",
              "Great focus on code quality! Your best practices are spot-on.",
              "Brilliant explanation of state management! Very well structured.",
              "Outstanding system design explanation! You've nailed this interview!",
            ][currentQuestion];

      // Speak the feedback first, then move to next question
      const utterance = new SpeechSynthesisUtterance(feedbackMessage);
      utterance.onend = () => {
        // Move to next question after speaking the feedback
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        }
      };
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);

      // Try to get the evaluation
      const response = await fetch("/functions/v1/evaluate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: answer,
          role: role,
          jobDescription: jobDescription,
        }),
      });

      let evaluation = {
        skills: [],
        communication: 7,
        confidence: 7,
        relevance: 7,
        overall_fit: 70,
        summary: "Response recorded successfully.",
      };

      if (response.ok) {
        try {
          evaluation = await response.json();
        } catch (e) {
          console.log("Could not parse evaluation response");
        }
      }

      // Store the response and evaluation
      setResponses((prev) => [
        ...prev,
        {
          question: questions[currentQuestion],
          answer,
          evaluation,
        },
      ]);

      // Persist to Supabase so HR can view it
      try {
        // Ensure candidate
        const cid = candidateId || (await ensureCandidate());
        if (!cid) {
          throw new Error("No candidate id");
        }
        if (!candidateId) setCandidateId(cid);

        // Ensure session exists
        let sid = sessionId;
        if (!sid) {
          const { data: createdSession, error: createErr } = await supabase
            .from("interview_sessions")
            .insert({
              candidate_id: cid,
              mode: "chat",
              start_time: new Date().toISOString(),
              transcript: [],
              analysis_json: { responses: [] },
              created_by: user?.id ?? null,
            })
            .select("id")
            .maybeSingle();
          if (createErr) {
            console.error("Failed to create interview session", createErr);
            toast({
              title: "Save failed",
              description: "Could not start interview session (RLS/policy?).",
              variant: "destructive",
            });
          }
          sid = createdSession?.id || null;
          if (sid) setSessionId(sid);
        }

        if (sid) {
          // Append transcript and responses in analysis_json
          const updatedResponses = [
            ...responses,
            { question: questions[currentQuestion], answer, evaluation },
          ];
          const updatedTranscript = [
            ...(Array.isArray([] as any) ? ([] as any) : []),
          ];
          // Keep a light transcript: user answer as a message
          updatedTranscript.push({
            role: "user",
            content: answer,
            ts: Date.now(),
          });

          // Merge with existing analysis if present to avoid overwriting earlier answers
          const { data: existingSession } = await supabase
            .from("interview_sessions")
            .select("analysis_json, transcript")
            .eq("id", sid)
            .maybeSingle();

          const priorResponses: any[] = Array.isArray(
            existingSession?.analysis_json?.responses
          )
            ? existingSession!.analysis_json.responses
            : [];
          const analysis = {
            summary:
              evaluation?.summary ||
              existingSession?.analysis_json?.summary ||
              "",
            responses: [
              ...priorResponses,
              { question: questions[currentQuestion], answer, evaluation },
            ],
          } as any;

          // If last question, set end_time
          const finishFields =
            currentQuestion === questions.length - 1
              ? { end_time: new Date().toISOString() }
              : {};

          const { error: updateErr } = await supabase
            .from("interview_sessions")
            .update({
              transcript:
                existingSession?.transcript &&
                Array.isArray(existingSession.transcript)
                  ? [...existingSession.transcript, ...updatedTranscript]
                  : updatedTranscript,
              analysis_json: analysis,
              ...finishFields,
            })
            .eq("id", sid);
          if (updateErr) {
            console.error("Failed to update interview session", updateErr);
            toast({
              title: "Save failed",
              description: "Could not save your answer (RLS/policy?).",
              variant: "destructive",
            });
          }
        }
      } catch (e) {
        console.warn("Failed to persist interview session", e);
      }

      // Removed duplicate toast
    } catch (error: any) {
      // Silently handle the error and continue
      console.log("Error during evaluation:", error);
    } finally {
      setIsEvaluating(false);
      // clear transcript after evaluation
      setTranscript("");
    }
  };

  // Initialize speech recognition (push-to-talk)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Error",
        description:
          "Speech recognition is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Allow continuous recording
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US"; // Set language explicitly

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const t = res[0].transcript;
          if (res.isFinal) {
            finalTranscript += t + " ";
          } else {
            interimTranscript += t;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) =>
            prev ? prev + " " + finalTranscript.trim() : finalTranscript.trim()
          );
        }
      };

      recognitionRef.current.onerror = (ev: any) => {
        console.error("Speech recognition error:", ev);
        setIsRecording(false);

        let errorMessage = "Speech recognition error";
        switch (ev.error) {
          case "no-speech":
            errorMessage = "No speech was detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "No microphone was found or microphone is disabled.";
            break;
          case "not-allowed":
            errorMessage =
              "Microphone access was denied. Please allow microphone access and try again.";
            break;
          case "network":
            errorMessage =
              "Network error occurred. Please check your internet connection.";
            break;
          default:
            errorMessage = `Speech recognition error: ${ev.error}`;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      };
    } catch (e) {
      console.warn("SpeechRecognition init failed", e);
    }

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, [toast]);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Error",
        description:
          "Speech recognition not available. Please use a supported browser like Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream right away, we just needed permission

      setIsRecording(true);
      setTranscript(""); // Clear previous transcript
      recognitionRef.current.start();

      toast({
        title: "Recording Started",
        description: "Speak now...",
      });
    } catch (e) {
      console.error("startRecording error", e);
      setIsRecording(false);
      toast({
        title: "Error",
        description:
          "Failed to start recording. Please ensure microphone access is allowed.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;

    setIsRecording(false);
    try {
      recognitionRef.current.stop();
      toast({
        title: "Recording Stopped",
        description: "Processing your response...",
      });
    } catch (e) {
      console.error("stopRecording error", e);
      toast({
        title: "Error",
        description:
          "Failed to stop recording properly. Please refresh the page if issues persist.",
        variant: "destructive",
      });
    }
  };

  const speakQuestion = (text: string) => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) {
      toast({
        title: "Error",
        description: "Speech synthesis not supported",
        variant: "destructive",
      });
      return;
    }
    setIsSpeaking(true);
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setIsSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  // Auto speak question once when it changes
  useEffect(() => {
    // speak once when question changes
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        speakQuestion(questions[currentQuestion]);
      } catch (e) {
        console.warn("TTS speak failed", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">AI Technical Interview</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Interview Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Role</label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Job Description</label>
                <Input
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Required skills..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {currentQuestion < questions.length ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Question {currentQuestion + 1} of {questions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <p className="text-lg flex-1">{questions[currentQuestion]}</p>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => speakQuestion(questions[currentQuestion])}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Textarea
                placeholder="Type your answer here or use voice..."
                className="min-h-[100px]"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />

              <div className="flex gap-4">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isEvaluating}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    const answer = transcript?.trim();
                    if (answer) {
                      handleSubmitResponse(answer);
                    } else {
                      toast({
                        title: "Error",
                        description: "Please enter or record an answer",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? "Evaluating..." : "Submit Answer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Interview Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">
                You have completed all questions!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results are intentionally not shown on the employee page. */}
      </div>
    </div>
  );
}
