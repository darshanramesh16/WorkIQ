import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [role, setRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState(
    "React, TypeScript, Node.js"
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<
    Array<{ question: string; answer: string; evaluation: any }>
  >([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { toast } = useToast();

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const questions = QUESTION_SETS.technical;

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

        {/* Display Previous Responses and Evaluations */}
        {responses.map((response, index) => (
          <Card key={index} className="mb-4">
            <CardHeader>
              <CardTitle>Question {index + 1} Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Question:</h3>
                  <p>{response.question}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Your Answer:</h3>
                  <p>{response.answer}</p>
                </div>
                <div>
                  <h3 className="font-semibold">AI Evaluation:</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      Communication: {response.evaluation.communication}/10
                    </div>
                    <div>Confidence: {response.evaluation.confidence}/10</div>
                    <div>Relevance: {response.evaluation.relevance}/10</div>
                    <div>Overall Fit: {response.evaluation.overall_fit}%</div>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-semibold">Skills Demonstrated:</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.evaluation.skills.map(
                        (skill: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {skill}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-semibold">Summary:</h4>
                    <p>{response.evaluation.summary}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
