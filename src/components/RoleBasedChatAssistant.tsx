import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Loader2, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const getChatbotConfig = (role: string | null) => {
  switch (role) {
    case "admin":
      return {
        title: "Admin Assistant AI",
        greeting:
          "Hello! I'm your Admin Assistant. I can help you with analytics, system management, and administrative tasks.",
      };
    case "hr":
      return {
        title: "Recruitment AI Assistant",
        greeting:
          "Hello! I'm your Recruitment AI Assistant. I can help with resume analysis, candidate evaluation, and hiring insights.",
      };
    case "employee":
      return {
        title: "Career Coach AI",
        greeting:
          "Hello! I'm your Career Coach. I can help with career development, skill growth, and performance improvement advice.",
      };
    default:
      return {
        title: "AI Assistant",
        greeting: "Hello! How can I assist you today?",
      };
  }
};

export function RoleBasedChatAssistant() {
  const { userRole } = useAuth();
  const config = getChatbotConfig(userRole);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: config.greeting,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "chat-assistant",
        {
          body: {
            messages: [...messages, userMessage],
            role: userRole,
          },
        }
      );

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="shadow-lg h-[350px] md:h-[400px] flex flex-col">
      <CardHeader className="border-b pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm md:text-base">
          <Bot className="w-4 h-4 text-accent" />
          <span>{config.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-2 md:p-4" ref={scrollRef}>
          <div className="space-y-3 min-h-0">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 md:space-x-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2 md:p-3 break-words ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-xs md:text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {message.content}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-gradient-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-2 md:p-3">
          <div className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 text-xs md:text-sm h-8"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-accent shadow-accent-glow h-8 w-8"
              size="icon"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 hidden md:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
