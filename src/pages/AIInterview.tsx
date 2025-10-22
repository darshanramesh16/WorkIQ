/**
 * AI Voice Interview Component
 *
 * SETUP INSTRUCTIONS:
 * 1. Install required dependencies: npm install gtts
 * 2. Ensure microphone permissions are granted in browser
 * 3. Configure Supabase Edge Functions for:
 *    - transcribe-audio (Whisper STT)
 *    - chat-assistant (LLM responses)
 *    - synthesize-speech (TTS)
 *
 * FEATURES:
 * - Two-way voice conversation with AI interviewer
 * - Real-time speech-to-text using Whisper API
 * - Text-to-speech using browser SpeechSynthesis API
 * - Natural conversation flow with follow-up questions
 * - Multiple question sets (Technical, Behavioral, HR)
 * - Error handling for microphone access and speech processing
 * - Conversation history display
 *
 * USAGE:
 * 1. Select question set (Technical/Behavioral/HR)
 * 2. Click "Start Voice Interview"
 * 3. AI will greet you and ask first question
 * 4. Click "Start Recording" to respond
 * 5. AI will process your response and continue conversation
 * 6. Interview continues until all questions are answered
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mic,
  Square,
  Volume2,
  Send,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Headphones,
  Bot,
  User,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import gtts from "gtts";

interface Message {
  role: "system" | "assistant" | "user";
  content: string;
  ts?: string;
}

// Voice Interview Configuration
interface VoiceConfig {
  language: string;
  voice: string;
  speed: number;
  volume: number;
  autoPlay: boolean;
  continuousMode: boolean;
}

// Interview Question Sets
const QUESTION_SETS = {
  technical: [
    "Tell me about your experience with React and TypeScript.",
    "Describe a challenging bug you fixed and how you approached it.",
    "How do you ensure code quality in your projects?",
    "Explain your preferred state management approach.",
    "Describe a system you designed from start to finish.",
  ],
  behavioral: [
    "Tell me about a time you had to work with a difficult team member.",
    "Describe a situation where you had to learn something new quickly.",
    "Give me an example of a project where you had to meet a tight deadline.",
    "Tell me about a time you failed and what you learned from it.",
    "Describe a situation where you had to make a difficult decision.",
  ],
  hr: [
    "Why are you interested in this position?",
    "Where do you see yourself in 5 years?",
    "What are your greatest strengths and weaknesses?",
    "Why should we hire you?",
    "Do you have any questions for us?",
  ],
};

// NEW WORKING Microphone System
const useWorkingMicrophone = () => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      console.log("🎤 Starting NEW microphone system...");
      setError(null);
      setAudioChunks([]);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      console.log("✅ Microphone access granted!");

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("📊 Audio chunk received:", event.data.size, "bytes");
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      console.log("🔴 Recording started successfully!");
    } catch (err: any) {
      console.error("❌ Microphone error:", err);
      setError(`Microphone error: ${err.message}`);
      throw err;
    }
  };

  const stopRecording = async (): Promise<Blob> => {
    try {
      console.log("🛑 Stopping recording...");

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setRecording(false);

      // Wait for final chunks
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create final blob
      const finalBlob = new Blob(audioChunks, { type: "audio/webm" });
      console.log("🎵 Final audio blob size:", finalBlob.size, "bytes");

      return finalBlob;
    } catch (err: any) {
      console.error("❌ Stop recording error:", err);
      return new Blob();
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setRecording(false);
    setAudioChunks([]);
  };

  return {
    start: startRecording,
    stop: stopRecording,
    recording,
    error,
    cleanup,
  };
};

// Enhanced Voice Interview Hook with Two-Way Conversation
const useVoiceInterview = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: "en-US",
    voice: "default",
    speed: 1.0,
    volume: 0.8,
    autoPlay: true,
    continuousMode: false,
  });
  const [interviewActive, setInterviewActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionSet, setQuestionSet] =
    useState<keyof typeof QUESTION_SETS>("technical");
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Voice diagnostics - check if TTS is available
  useEffect(() => {
    const handleVoicesChanged = () => {
      const voices = speechSynthesis.getVoices();
      console.log("🔊 Available SpeechSynthesis voices:", voices);
      if (voices.length === 0) {
        console.warn(
          "⚠️ No speech synthesis voices found. TTS might not work."
        );
      } else {
        console.log("✅ SpeechSynthesis voices loaded successfully.");
        console.log(
          "🎤 Available voices:",
          voices.map((v) => `${v.name} (${v.lang})`)
        );
      }
    };

    // Add event listener for when voices are loaded/changed
    speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    // Call immediately in case voices are already loaded
    handleVoicesChanged();

    // Auto-test TTS after a short delay
    setTimeout(() => {
      console.log("🔊 Auto-testing TTS...");
      const testUtterance = new SpeechSynthesisUtterance("TTS test");
      testUtterance.volume = 0.1; // Very quiet test
      testUtterance.onend = () => console.log("✅ TTS auto-test completed");
      testUtterance.onerror = (e) =>
        console.warn("⚠️ TTS auto-test failed:", e.error);
      speechSynthesis.speak(testUtterance);
    }, 2000);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  // Enhanced Text-to-Speech with multiple options
  const speakText = useCallback(
    async (text: string) => {
      console.log("📢 AI Speaking:", text);

      return new Promise<void>((resolve) => {
        try {
          setIsSpeaking(true);

          // Cancel any existing speech
          speechSynthesis.cancel();

          // Wait a moment for cancellation to complete
          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = voiceConfig.speed;
            utterance.volume = voiceConfig.volume;
            utterance.lang = voiceConfig.language;

            // Try to select a good voice
            const voices = speechSynthesis.getVoices();
            const preferredVoice =
              voices.find(
                (voice) =>
                  voice.lang.startsWith(voiceConfig.language.split("-")[0]) &&
                  voice.name.includes("Female")
              ) ||
              voices.find((voice) =>
                voice.lang.startsWith(voiceConfig.language.split("-")[0])
              ) ||
              voices[0];

            if (preferredVoice) {
              utterance.voice = preferredVoice;
              console.log("🎤 Using voice:", preferredVoice.name);
            }

            utterance.onstart = () => {
              console.log("🔊 Speech started");
            };

            utterance.onend = () => {
              console.log("✅ Speech completed");
              setIsSpeaking(false);
              resolve();
            };

            utterance.onerror = (event) => {
              console.error("❌ Speech error:", event.error);
              setIsSpeaking(false);
              resolve();
            };

            console.log("🎵 Speaking with settings:", {
              text: text.substring(0, 50) + "...",
              rate: utterance.rate,
              volume: utterance.volume,
              lang: utterance.lang,
              voice: utterance.voice?.name,
            });

            speechSynthesis.speak(utterance);
          }, 100);
        } catch (error) {
          console.error("❌ TTS error:", error);
          setIsSpeaking(false);
          resolve();
        }
      });
    },
    [voiceConfig]
  );

  // Enhanced Speech-to-Text with better error handling
  const startListening = useCallback(async (): Promise<void> => {
    try {
      console.log("🎤 Starting voice recording...");
      setIsListening(true);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("🛑 Recording stopped");
        setIsListening(false);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      console.log("🔴 Recording started");
    } catch (error: any) {
      console.error("❌ Microphone error:", error);
      setIsListening(false);
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }, []);

  const stopListening = useCallback(async (): Promise<Blob> => {
    try {
      console.log("🛑 Stopping recording...");

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setIsListening(false);

      // Wait for final chunks
      await new Promise((resolve) => setTimeout(resolve, 500));

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      console.log("🎵 Audio blob size:", audioBlob.size, "bytes");

      return audioBlob;
    } catch (error: any) {
      console.error("❌ Stop recording error:", error);
      setIsListening(false);
      return new Blob();
    }
  }, []);

  // Speech-to-Text function using Whisper API with fallback
  const listenAndTranscribe = useCallback(
    async (audioBlob: Blob): Promise<string> => {
      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${
                import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
              }`,
              apikey: `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.text || "";
      } catch (error) {
        console.error("Transcription error:", error);
        // Fallback: return a placeholder message
        return "I couldn't transcribe your speech. Please try speaking more clearly or use the text input instead.";
      }
    },
    []
  );

  // Enhanced AI response generation with conversation context
  const generateAIResponse = useCallback(
    async (userInput: string, context: string): Promise<string> => {
      try {
        setIsProcessing(true);

        // Build conversation context
        const conversationContext = conversationHistory
          .slice(-5) // Last 5 messages for context
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
              }`,
              apikey: `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              message: userInput,
              context: `${context}\n\nConversation History:\n${conversationContext}`,
              role: "interviewer",
              interviewMode: true,
              questionSet: questionSet,
              currentQuestion: currentQuestionIndex,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`AI response failed: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.response || "I understand. Please continue.";

        // Add to conversation history
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: userInput, ts: new Date().toISOString() },
          {
            role: "assistant",
            content: aiResponse,
            ts: new Date().toISOString(),
          },
        ]);

        return aiResponse;
      } catch (error) {
        console.error("AI response error:", error);
        // Fallback response
        const fallbackResponse =
          "Thank you for your response. Let's continue with the next question.";

        // Add to conversation history
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: userInput, ts: new Date().toISOString() },
          {
            role: "assistant",
            content: fallbackResponse,
            ts: new Date().toISOString(),
          },
        ]);

        return fallbackResponse;
      } finally {
        setIsProcessing(false);
      }
    },
    [conversationHistory, questionSet, currentQuestionIndex]
  );

  // Enhanced voice interview with two-way conversation
  const startVoiceInterview = useCallback(async () => {
    try {
      setInterviewActive(true);
      setCurrentQuestionIndex(0);
      setConversationHistory([]);

      console.log("🚀 Starting enhanced voice interview...");

      const greeting =
        "Hello! Welcome to your AI voice interview. I'll be asking you questions and we'll have a natural conversation. Please speak clearly and feel free to ask me anything. Let's begin!";

      // Add greeting to conversation
      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", content: greeting, ts: new Date().toISOString() },
      ]);

      // SPEAK the greeting - FORCE SPEECH
      console.log("🔊 FORCING AI TO SPEAK GREETING");
      await speakText(greeting);
      console.log("✅ Greeting speech completed");

      // Ask first question with context
      const questions = QUESTION_SETS[questionSet];
      if (questions.length > 0) {
        const firstQuestion = `Let's start with question 1 of ${questions.length}: ${questions[0]}`;

        // Add first question to conversation
        setConversationHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: firstQuestion,
            ts: new Date().toISOString(),
          },
        ]);

        // SPEAK the first question - FORCE SPEECH
        console.log("🔊 FORCING AI TO SPEAK FIRST QUESTION");
        await speakText(firstQuestion);
        console.log("✅ First question speech completed");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      setInterviewActive(false);
    }
  }, [questionSet, speakText]);

  // Enhanced voice conversation loop
  const runVoiceConversation = useCallback(
    async (userInput: string) => {
      try {
        console.log("🤖 Processing voice conversation...");

        // Generate AI response with full context
        const context = `You are conducting a ${questionSet} interview. Current question ${
          currentQuestionIndex + 1
        } of ${
          QUESTION_SETS[questionSet].length
        }. Be conversational, ask follow-up questions, and provide feedback.`;

        const aiResponse = await generateAIResponse(userInput, context);

        // Speak the AI response
        await speakText(aiResponse);

        // Check if we should move to next question
        const questions = QUESTION_SETS[questionSet];
        const shouldMoveNext =
          aiResponse.toLowerCase().includes("next question") ||
          aiResponse.toLowerCase().includes("let's move on") ||
          currentQuestionIndex >= questions.length - 1;

        if (shouldMoveNext && currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          const nextQuestion = `Question ${nextIndex + 1} of ${
            questions.length
          }: ${questions[nextIndex]}`;

          setConversationHistory((prev) => [
            ...prev,
            {
              role: "assistant",
              content: nextQuestion,
              ts: new Date().toISOString(),
            },
          ]);

          await speakText(nextQuestion);
          setCurrentQuestionIndex(nextIndex);
        } else if (currentQuestionIndex >= questions.length - 1) {
          const closing =
            "Thank you for completing the interview! Your responses have been recorded and will be analyzed. Have a great day!";

          setConversationHistory((prev) => [
            ...prev,
            {
              role: "assistant",
              content: closing,
              ts: new Date().toISOString(),
            },
          ]);

          await speakText(closing);
          setInterviewActive(false);
        }
      } catch (error) {
        console.error("Error in voice conversation:", error);
      }
    },
    [questionSet, currentQuestionIndex, generateAIResponse, speakText]
  );

  // Stop voice interview
  const stopVoiceInterview = useCallback(() => {
    setInterviewActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    speechSynthesis.cancel();
  }, []);

  // Process user response - SPEAKS NEXT QUESTIONS
  const processUserResponse = useCallback(
    async (userInput: string) => {
      try {
        const questions = QUESTION_SETS[questionSet];
        const nextIndex = currentQuestionIndex + 1;

        console.log(
          `📝 Processing answer for question ${currentQuestionIndex + 1}`
        );

        if (nextIndex < questions.length) {
          // Ask next question
          const nextQuestion = `Question ${nextIndex + 1} of ${
            questions.length
          }: ${questions[nextIndex]}`;
          console.log("📢 AI Speaking:", nextQuestion);

          // Add next question to messages
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: nextQuestion,
              ts: new Date().toISOString(),
            },
          ]);

          // SPEAK the next question
          await speakText(nextQuestion);
          setCurrentQuestionIndex(nextIndex);
        } else {
          // Interview complete
          const closing =
            "Thank you for completing the interview! Your responses have been recorded and will be analyzed. Have a great day!";
          console.log("📢 AI Speaking:", closing);

          // Add closing message
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: closing,
              ts: new Date().toISOString(),
            },
          ]);

          // SPEAK the closing message
          await speakText(closing);
          setInterviewActive(false);
        }
      } catch (error) {
        console.error("Error processing response:", error);
      }
    },
    [questionSet, currentQuestionIndex, speakText]
  );

  return {
    isListening,
    isSpeaking,
    voiceConfig,
    setVoiceConfig,
    interviewActive,
    currentQuestionIndex,
    questionSet,
    setQuestionSet,
    conversationHistory,
    isProcessing,
    speakText,
    startListening,
    stopListening,
    listenAndTranscribe,
    generateAIResponse,
    startVoiceInterview,
    stopVoiceInterview,
    runVoiceConversation,
    processUserResponse,
  };
};

function LegacyAIInterview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [role, setRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState(
    "React, TypeScript, Node.js"
  );
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const {
    start,
    stop,
    recording,
    error: recorderError,
    cleanup,
  } = useWorkingMicrophone();
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const candidateIdRef = useRef<string | null>(null);

  // Enhanced voice interview functionality
  const {
    isListening,
    isSpeaking: voiceSpeaking,
    voiceConfig,
    setVoiceConfig,
    interviewActive,
    currentQuestionIndex,
    questionSet,
    setQuestionSet,
    conversationHistory,
    isProcessing,
    speakText,
    startListening,
    stopListening,
    listenAndTranscribe,
    generateAIResponse,
    startVoiceInterview,
    stopVoiceInterview,
    runVoiceConversation,
    processUserResponse,
  } = useVoiceInterview();

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((currentIndex / questions.length) * 100);
  }, [currentIndex, questions.length]);

  useEffect(() => {
    const load = async () => {
      // Ensure candidate exists for this user (optional - handle gracefully if table doesn't exist)
      if (!user) return;

      try {
        const { data: existing } = await supabase
          .from("candidates")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing?.id) {
          candidateIdRef.current = existing.id;
        } else {
          const { data: created, error } = await supabase
            .from("candidates")
            .insert({
              name: user.user_metadata?.full_name || "Candidate",
              email: user.email!,
              job_role: role,
              status: "interview_scheduled",
              user_id: user.id,
            })
            .select("id")
            .single();
          if (!error) candidateIdRef.current = created.id;
        }
      } catch (error) {
        console.log("Candidates table not available, continuing without it");
        candidateIdRef.current = null;
      }

      // Load questions based on current question set
      const questionsToLoad = QUESTION_SETS[questionSet];
      setQuestions(questionsToLoad);

      // Create interview session (optional)
      try {
        if (candidateIdRef.current) {
          const { data: session } = await supabase
            .from("interview_sessions")
            .insert({
              candidate_id: candidateIdRef.current,
              mode,
              transcript: [],
            })
            .select("id")
            .single();
          sessionIdRef.current = session?.id ?? null;
        }
      } catch (error) {
        console.log(
          "Interview sessions table not available, continuing without it"
        );
        sessionIdRef.current = null;
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, questionSet]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      speechSynthesis.cancel();
    };
  }, [cleanup]);

  const askNext = async (assistantText: string) => {
    const ts = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: assistantText, ts },
    ]);

    // Use voice interview TTS if in voice mode
    if (mode === "voice" && voiceConfig.autoPlay) {
      try {
        await speakText(assistantText);
      } catch (error) {
        console.error("TTS error:", error);
        toast({
          title: "Speech error",
          description: "Failed to speak the question",
          variant: "destructive",
        });
      }
    } else {
      // Fallback to browser TTS
      try {
        setSpeaking(true);
        await speakText(assistantText);
      } catch (error) {
        console.error("Browser TTS error:", error);
      } finally {
        setSpeaking(false);
      }
    }

    await persistMessage("assistant", assistantText);
  };

  useEffect(() => {
    if (
      questions.length > 0 &&
      currentIndex < questions.length &&
      messages.length === 0
    ) {
      askNext(`Question 1 of ${questions.length}: ${questions[0]}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const persistMessage = async (
    role: "assistant" | "user",
    content: string
  ) => {
    if (!sessionIdRef.current) return;

    try {
      // Fetch current transcript and append
      const { data: session } = await supabase
        .from("interview_sessions")
        .select("transcript")
        .eq("id", sessionIdRef.current)
        .single();
      const updated = [
        ...(session?.transcript || []),
        { role, content, ts: new Date().toISOString() },
      ];
      await supabase
        .from("interview_sessions")
        .update({ transcript: updated })
        .eq("id", sessionIdRef.current);
    } catch (error) {
      console.log("Failed to persist message, continuing without it");
    }
  };

  const handleUserSubmit = async (text: string) => {
    if (!text.trim()) return;
    const nextIdx = Math.min(currentIndex + 1, questions.length);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, ts: new Date().toISOString() },
    ]);
    setInput("");
    setCurrentIndex(nextIdx);
    await persistMessage("user", text);

    // Get assistant follow-up or proceed
    if (nextIdx < questions.length) {
      await askNext(
        `Question ${nextIdx + 1} of ${questions.length}: ${questions[nextIdx]}`
      );
      await persistMessage(
        "assistant",
        `Question ${nextIdx + 1} of ${questions.length}: ${questions[nextIdx]}`
      );
    } else {
      // Evaluate transcript (optional)
      setLoading(true);
      try {
        if (sessionIdRef.current) {
          const { data: session } = await supabase
            .from("interview_sessions")
            .select("transcript")
            .eq("id", sessionIdRef.current)
            .single();

          const { data: analysis, error: evalError } =
            await supabase.functions.invoke("evaluate-response", {
              body: {
                transcript: session?.transcript || [],
                role,
                jobDescription,
              },
            });
          if (evalError) throw evalError;
          await supabase
            .from("interview_sessions")
            .update({
              analysis_json: analysis,
              end_time: new Date().toISOString(),
            })
            .eq("id", sessionIdRef.current!);
          if (candidateIdRef.current) {
            // store summary/scores on candidate
            const scores = {
              technical: analysis.relevance ?? 0,
              communication: analysis.communication ?? 0,
              confidence: analysis.confidence ?? 0,
              overall_fit: analysis.overall_fit ?? 0,
            };
            await supabase
              .from("candidates")
              .update({
                scores,
                summary: analysis.summary ?? "",
                status: "interview_completed",
              })
              .eq("id", candidateIdRef.current);
          }
          toast({
            title: "Interview Complete",
            description: "AI analysis generated.",
          });
        } else {
          toast({
            title: "Interview Complete",
            description: "Interview finished successfully!",
          });
        }
      } catch (e: any) {
        console.log("Analysis not available, continuing without it");
        toast({
          title: "Interview Complete",
          description: "Interview finished successfully!",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Enhanced Voice Recording Handler with Two-Way Conversation
  const handleVoiceRecord = async () => {
    console.log("🎤 ENHANCED VOICE RECORDING BUTTON CLICKED!");

    if (!isListening) {
      // START RECORDING
      try {
        console.log("🚀 Starting enhanced voice recording...");
        await startListening();
        toast({
          title: "🎤 Recording Started",
          description: "Speak your answer clearly!",
        });
        console.log("✅ Enhanced recording active - speak now!");
      } catch (e: any) {
        console.error("❌ Microphone error:", e);
        toast({
          title: "❌ Microphone Error",
          description: `Cannot access microphone: ${e.message}`,
          variant: "destructive",
        });
      }
    } else {
      // STOP RECORDING
      try {
        console.log("🛑 Stopping enhanced recording...");
        const audioBlob = await stopListening();
        console.log("📊 Audio recorded:", audioBlob.size, "bytes");

        if (audioBlob.size === 0) {
          toast({
            title: "❌ No Audio",
            description: "No sound recorded. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setLoading(true);
        toast({
          title: "🔄 Processing...",
          description:
            "Converting speech to text and generating AI response...",
        });

        // Transcribe the audio
        const transcribedText = await listenAndTranscribe(audioBlob);
        console.log("📝 Transcribed:", transcribedText);

        if (transcribedText.trim()) {
          // Add user message to both message systems
          const userMessage = {
            role: "user" as const,
            content: transcribedText,
            ts: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMessage]);
          await persistMessage("user", transcribedText);

          // Process response with enhanced conversation
          if (mode === "voice" && interviewActive) {
            console.log("🤖 Processing enhanced voice interview response...");
            await runVoiceConversation(transcribedText);
          } else {
            console.log("💬 Processing chat response...");
            await handleUserSubmit(transcribedText);
          }
        } else {
          toast({
            title: "❌ No Speech Detected",
            description: "Please speak louder and try again.",
            variant: "destructive",
          });
        }
      } catch (e: any) {
        console.error("❌ Recording/transcription error:", e);
        toast({
          title: "❌ Processing Error",
          description: `Failed to process audio: ${e.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Start/Stop voice interview
  const handleVoiceInterviewToggle = async () => {
    if (interviewActive) {
      stopVoiceInterview();
      toast({
        title: "Interview stopped",
        description: "Voice interview has been stopped",
      });
    } else {
      try {
        await startVoiceInterview();
        toast({
          title: "Interview started",
          description: "Voice interview is now active",
        });
      } catch (error: any) {
        toast({
          title: "Interview started",
          description:
            "Voice interview is active - you can now record your answers",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold">AI Interview</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Answer questions in chat or voice. Fully mobile-friendly.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center justify-between">
              <span>Interview Setup</span>
              <Badge variant="secondary">
                {currentIndex < questions.length
                  ? `Question ${Math.min(
                      currentIndex + 1,
                      questions.length
                    )} of ${questions.length}`
                  : "Completed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
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
                  placeholder="Key skills..."
                />
              </div>
            </div>

            <Tabs
              defaultValue={mode}
              onValueChange={async (v) => {
                setMode(v as any);
                try {
                  if (sessionIdRef.current) {
                    await supabase
                      .from("interview_sessions")
                      .update({ mode: v })
                      .eq("id", sessionIdRef.current);
                  }
                } catch {}
              }}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
              </TabsList>

              <TabsContent value="chat">
                <div className="space-y-3">
                  <div className="h-64 md:h-80 border rounded p-3 overflow-y-auto bg-background/30">
                    <div className="space-y-2">
                      {messages.map((m, i) => (
                        <div
                          key={i}
                          className={`mb-2 ${
                            m.role === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          <Badge
                            variant={
                              m.role === "user" ? "default" : "secondary"
                            }
                            className="break-words max-w-full"
                          >
                            <span className="break-words overflow-wrap-anywhere">
                              {m.content}
                            </span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Processing...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your answer..."
                      className="min-h-[48px]"
                    />
                    <Button
                      onClick={() => handleUserSubmit(input)}
                      disabled={loading || !input.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="voice">
                <div className="space-y-4">
                  {/* Voice Interview Controls */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">
                        Question Set
                      </label>
                      <select
                        value={questionSet}
                        onChange={(e) =>
                          setQuestionSet(
                            e.target.value as keyof typeof QUESTION_SETS
                          )
                        }
                        className="w-full p-2 border rounded-md bg-background"
                        disabled={interviewActive}
                      >
                        <option value="technical">Technical Questions</option>
                        <option value="behavioral">Behavioral Questions</option>
                        <option value="hr">HR Questions</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleVoiceInterviewToggle}
                        variant={interviewActive ? "destructive" : "default"}
                        className="w-full"
                        disabled={loading}
                      >
                        {interviewActive ? (
                          <>
                            <Square className="h-4 w-4 mr-2" /> Stop Interview
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" /> Start Voice
                            Interview
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <select
                        value={voiceConfig.language}
                        onChange={(e) =>
                          setVoiceConfig((prev) => ({
                            ...prev,
                            language: e.target.value,
                          }))
                        }
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Speech Speed
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceConfig.speed}
                        onChange={(e) =>
                          setVoiceConfig((prev) => ({
                            ...prev,
                            speed: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {voiceConfig.speed}x
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Volume</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceConfig.volume}
                        onChange={(e) =>
                          setVoiceConfig((prev) => ({
                            ...prev,
                            volume: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {Math.round(voiceConfig.volume * 100)}%
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await speakText(
                              "Hello, this is a test of the voice settings."
                            );
                            toast({
                              title: "Voice test successful",
                              description: "TTS is working correctly",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Voice test failed",
                              description: "Please check browser settings",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={voiceSpeaking}
                        className="w-full"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Test Voice
                      </Button>
                    </div>
                  </div>

                  {/* Error Display */}
                  {recorderError && (
                    <Alert variant="destructive">
                      <AlertDescription>{recorderError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Interview Status */}
                  {interviewActive && (
                    <Alert>
                      <Headphones className="h-4 w-4" />
                      <AlertDescription>
                        Voice interview is active. Question{" "}
                        {currentQuestionIndex + 1} of{" "}
                        {QUESTION_SETS[questionSet].length}
                        <br />
                        <small className="text-muted-foreground">
                          The AI should be speaking the questions. If you don't
                          hear anything, try the "Test Voice" button first.
                        </small>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Manual Question Trigger */}
                  {interviewActive && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const questions = QUESTION_SETS[questionSet];
                            const currentQuestion =
                              questions[currentQuestionIndex];
                            const questionText = `Question ${
                              currentQuestionIndex + 1
                            } of ${questions.length}: ${currentQuestion}`;
                            console.log(
                              "🔊 FORCING AI TO SPEAK CURRENT QUESTION:",
                              questionText
                            );
                            await speakText(questionText);
                            console.log("✅ Current question speech completed");
                          } catch (error: any) {
                            console.error(
                              "❌ Failed to speak question:",
                              error
                            );
                            toast({
                              title: "Failed to speak question",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={voiceSpeaking}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        🔊 Force AI to Speak Question
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          speechSynthesis.cancel();
                          setIsSpeaking(false);
                        }}
                        disabled={!voiceSpeaking}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Speech
                      </Button>
                    </div>
                  )}

                  {/* Enhanced Chat Display with Conversation History */}
                  <div className="h-64 md:h-80 border rounded p-3 overflow-y-auto bg-background/30">
                    {/* Show conversation history from voice interview */}
                    {interviewActive && conversationHistory.length > 0
                      ? conversationHistory.map((m, i) => (
                          <div
                            key={i}
                            className={`mb-3 flex ${
                              m.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                m.role === "user"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {m.role === "user" ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {m.role === "user" ? "You" : "AI Interviewer"}
                                </span>
                              </div>
                              <p className="text-sm">{m.content}</p>
                            </div>
                          </div>
                        ))
                      : // Fallback to regular messages
                        messages.map((m, i) => (
                          <div
                            key={i}
                            className={`mb-2 ${
                              m.role === "user" ? "text-right" : "text-left"
                            }`}
                          >
                            <Badge
                              variant={
                                m.role === "user" ? "default" : "secondary"
                              }
                              className="break-words max-w-full"
                            >
                              <span className="break-words overflow-wrap-anywhere">
                                {m.content}
                              </span>
                            </Badge>
                          </div>
                        ))}

                    {/* Status indicators */}
                    {isListening && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        🎤 Listening… Speak now!
                      </div>
                    )}
                    {voiceSpeaking && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        🔊 AI Speaking… Wait for it to finish
                      </div>
                    )}
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        🤖 AI is thinking and generating response...
                      </div>
                    )}
                    {loading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        🔄 Processing your response...
                      </div>
                    )}
                  </div>

                  {/* WORKING VOICE INTERVIEW SYSTEM */}
                  <div className="space-y-4">
                    {/* Interview Controls */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={startVoiceInterview}
                        disabled={interviewActive}
                        className="flex-1"
                      >
                        🚀 Start Voice Interview
                      </Button>
                      <Button
                        onClick={stopVoiceInterview}
                        disabled={!interviewActive}
                        variant="outline"
                        className="flex-1"
                      >
                        🛑 Stop Interview
                      </Button>
                    </div>

                    {/* Enhanced Voice Recording */}
                    {interviewActive && (
                      <div className="text-center space-y-2">
                        <Button
                          onClick={handleVoiceRecord}
                          disabled={voiceSpeaking || isProcessing}
                          size="lg"
                          className={`w-full max-w-md ${
                            isListening
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {isListening
                            ? "🛑 Stop Recording"
                            : "🎤 Start Recording"}
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          {isListening && "🎤 Listening... Speak now!"}
                          {voiceSpeaking &&
                            "🔊 AI is speaking... Wait for it to finish"}
                          {isProcessing && "🤖 AI is thinking... Please wait"}
                          {!isListening &&
                            !voiceSpeaking &&
                            !isProcessing &&
                            "Click to record your response"}
                        </div>
                      </div>
                    )}

                    {/* Test Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          console.log("🔊 Testing speech...");
                          try {
                            await speakText(
                              "Hello, this is a test. Can you hear me? If you can hear this, the AI voice interview will work perfectly!"
                            );
                            toast({
                              title: "🔊 Speech Test",
                              description:
                                "If you heard the AI speak, voice interview is working!",
                            });
                          } catch (error) {
                            console.error("Speech test failed:", error);
                            toast({
                              title: "❌ Speech Test Failed",
                              description: "Check browser console for details",
                              variant: "destructive",
                            });
                          }
                        }}
                        size="sm"
                        variant="outline"
                        disabled={voiceSpeaking}
                      >
                        🔊 Test Speech
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            console.log("🎤 Testing microphone...");
                            const stream =
                              await navigator.mediaDevices.getUserMedia({
                                audio: true,
                              });
                            console.log("✅ Microphone works!");
                            toast({
                              title: "✅ Microphone Test",
                              description: "Microphone is working!",
                            });
                            stream.getTracks().forEach((track) => track.stop());
                          } catch (error: any) {
                            console.error("❌ Microphone test failed:", error);
                            toast({
                              title: "❌ Microphone Error",
                              description: `Please allow microphone access: ${error.message}`,
                              variant: "destructive",
                            });
                          }
                        }}
                        size="sm"
                        variant="outline"
                      >
                        🎤 Test Mic
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <label className="text-sm font-medium">Progress</label>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>

        {currentIndex >= questions.length && (
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsPanel sessionId={sessionIdRef.current} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Minimal fresh voice-only interviewer
export default function AIInterview() {
  const { toast } = useToast();
  const { speakText, listenAndTranscribe, generateAIResponse } =
    useVoiceInterview();

  const [active, setActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [role, setRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState(
    "React, TypeScript, Node.js"
  );
  const [questionSet, setQuestionSet] = useState<
    "technical" | "behavioral" | "hr"
  >("technical");
  const QUESTIONS = [
    "Tell me about your experience with React and TypeScript.",
    "Describe a challenging bug you solved and how you approached it.",
    "How do you ensure performance and accessibility in React apps?",
    "What is your approach to testing (unit/integration/e2e)?",
    "Share a recent project you are proud of and why.",
  ];
  const [qIndex, setQIndex] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    setActive(true);
    setQIndex(0);
    await speakText("Hello! Welcome to your AI interview. Let's begin.");
    await speakText(`Question 1 of ${QUESTIONS.length}: ${QUESTIONS[0]}`);
  }, [speakText]);

  const stop = useCallback(() => {
    setActive(false);
    speechSynthesis.cancel();
  }, []);

  const toggleRecord = useCallback(async () => {
    if (!active) return;
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        chunksRef.current = [];
        const mr = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) =>
          e.data.size > 0 && chunksRef.current.push(e.data);
        mr.start();
        setRecording(true);
        toast({ title: "Recording", description: "Speak your answer" });
      } catch (e: any) {
        toast({
          title: "Microphone error",
          description: e.message,
          variant: "destructive",
        });
      }
    } else {
      setRecording(false);
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      await new Promise((r) => setTimeout(r, 250));
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size === 0) {
        toast({
          title: "No audio",
          description: "Please try again",
          variant: "destructive",
        });
        return;
      }
      const text = await listenAndTranscribe(blob);
      if (!text) {
        toast({
          title: "Couldn't transcribe",
          description: "Please try again",
          variant: "destructive",
        });
        return;
      }
      if (
        ["thank you", "end interview", "stop interview"].some((k) =>
          text.toLowerCase().includes(k)
        )
      ) {
        await speakText("Thank you. Ending the interview now.");
        setActive(false);
        return;
      }
      const reply = await generateAIResponse(
        text,
        "Interview follow-up for candidate answer. Keep it short and conversational."
      );
      await speakText(reply);

      if (qIndex < QUESTIONS.length - 1) {
        const next = qIndex + 1;
        setQIndex(next);
        await speakText(
          `Question ${next + 1} of ${QUESTIONS.length}: ${QUESTIONS[next]}`
        );
      } else {
        await speakText(
          "Thank you for completing the interview. We will be in touch soon."
        );
        setActive(false);
      }
    }
  }, [
    active,
    recording,
    qIndex,
    speakText,
    listenAndTranscribe,
    generateAIResponse,
    toast,
  ]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold">AI Interview</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Fresh minimal voice-only interviewer
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Voice Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Setup: Role, Description, Question Set */}
            <div className="grid gap-3 sm:grid-cols-2">
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
                  placeholder="Key skills (comma separated)"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Question Set</label>
                <select
                  value={questionSet}
                  onChange={(e) =>
                    setQuestionSet(
                      e.target.value as "technical" | "behavioral" | "hr"
                    )
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="technical">Technical Questions</option>
                  <option value="behavioral">Behavioral Questions</option>
                  <option value="hr">HR Questions</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={start} disabled={active}>
                Start
              </Button>
              <Button onClick={stop} variant="outline" disabled={!active}>
                Stop
              </Button>
              <Button onClick={toggleRecord} disabled={!active}>
                {recording ? "Stop Recording" : "Record Answer"}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {active
                ? `Question ${qIndex + 1} of ${QUESTIONS.length}`
                : "Click Start to begin the interview"}
            </div>
            <div className="h-2 w-full bg-muted rounded">
              <div
                className="h-2 bg-primary rounded"
                style={{
                  width: `${(qIndex / Math.max(1, QUESTIONS.length)) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultsPanel({ sessionId }: { sessionId: string | null }) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!sessionId) return;
      const { data } = await supabase
        .from("interview_sessions")
        .select("analysis_json")
        .eq("id", sessionId)
        .maybeSingle();
      setData(data?.analysis_json || null);
    };
    load();
  }, [sessionId]);

  if (!data)
    return <p className="text-muted-foreground text-sm">Awaiting analysis…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Technical Fit" value={data.relevance} max={10} />
          <Metric label="Communication" value={data.communication} max={10} />
          <Metric label="Confidence" value={data.confidence} max={10} />
          <Metric label="Overall Fit" value={data.overall_fit} max={100} />
        </div>
        <div>
          <h3 className="font-semibold mb-1">AI Summary</h3>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </div>
      </div>
      <div>
        <Button onClick={() => window.print()} className="w-full">
          Download / Print Report
        </Button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.round((Number(value || 0) / max) * 100);
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-xl font-bold">
          {Number(value || 0)}
          {max === 100 ? "%" : ""}
        </div>
        <Progress value={pct} />
      </CardContent>
    </Card>
  );
}
