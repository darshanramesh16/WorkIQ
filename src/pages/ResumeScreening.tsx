// import { useState } from 'react';
// import { Navigation } from '@/components/Navigation';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client';
// import { BrainCircuit, Upload, Loader2 } from 'lucide-react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';

// const ResumeScreening = () => {
//   const [resumeText, setResumeText] = useState('');
//   const [candidateName, setCandidateName] = useState('');
//   const [candidateEmail, setCandidateEmail] = useState('');
//   const [candidatePhone, setCandidatePhone] = useState('');
//   const [position, setPosition] = useState('');
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const { data: screenings, isLoading } = useQuery({
//     queryKey: ['resume-screenings'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('resume_screenings')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       return data;
//     },
//   });

//   const analyzeResumeMutation = useMutation({
//     mutationFn: async () => {
//       const { data, error } = await supabase.functions.invoke('analyze-resume', {
//         body: {
//           resumeText,
//           position,
//           candidateName,
//           candidateEmail,
//           candidatePhone,
//         },
//       });

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['resume-screenings'] });
//       toast({
//         title: 'Resume analyzed!',
//         description: 'AI analysis completed successfully',
//       });
//       setResumeText('');
//       setCandidateName('');
//       setCandidateEmail('');
//       setCandidatePhone('');
//       setPosition('');
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Error',
//         description: error.message,
//         variant: 'destructive',
//       });
//     },
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsAnalyzing(true);
//     await analyzeResumeMutation.mutateAsync();
//     setIsAnalyzing(false);
//   };

//   const getScoreBadge = (score: number) => {
//     if (score >= 80) return <Badge className="bg-success">Excellent</Badge>;
//     if (score >= 60) return <Badge className="bg-primary">Good</Badge>;
//     if (score >= 40) return <Badge className="bg-warning">Average</Badge>;
//     return <Badge variant="destructive">Below Average</Badge>;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-subtle">
//       <Navigation />

//       <div className="container mx-auto px-4 py-8">
//         <div className="mb-8">
//           <div className="flex items-center space-x-3 mb-2">
//             <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center shadow-accent-glow">
//               <BrainCircuit className="w-6 h-6 text-white" />
//             </div>
//             <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
//               AI Resume Screening
//             </h1>
//           </div>
//           <p className="text-muted-foreground">Let AI analyze candidate resumes instantly</p>
//         </div>

//         <div className="grid gap-6 md:grid-cols-2 mb-8">
//           <Card className="shadow-lg">
//             <CardHeader>
//               <CardTitle>Upload Resume</CardTitle>
//               <CardDescription>Paste resume text or upload a file</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="candidate-name">Candidate Name *</Label>
//                   <Input
//                     id="candidate-name"
//                     value={candidateName}
//                     onChange={(e) => setCandidateName(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="candidate-email">Email *</Label>
//                   <Input
//                     id="candidate-email"
//                     type="email"
//                     value={candidateEmail}
//                     onChange={(e) => setCandidateEmail(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="candidate-phone">Phone</Label>
//                   <Input
//                     id="candidate-phone"
//                     value={candidatePhone}
//                     onChange={(e) => setCandidatePhone(e.target.value)}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="position">Position Applied *</Label>
//                   <Input
//                     id="position"
//                     value={position}
//                     onChange={(e) => setPosition(e.target.value)}
//                     placeholder="e.g., Senior Software Engineer"
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="resume-text">Resume Text *</Label>
//                   <Textarea
//                     id="resume-text"
//                     value={resumeText}
//                     onChange={(e) => setResumeText(e.target.value)}
//                     placeholder="Paste the resume text here..."
//                     className="min-h-[200px]"
//                     required
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full bg-gradient-accent shadow-accent-glow"
//                   disabled={isAnalyzing}
//                 >
//                   {isAnalyzing ? (
//                     <>
//                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                       Analyzing with AI...
//                     </>
//                   ) : (
//                     <>
//                       <BrainCircuit className="w-4 h-4 mr-2" />
//                       Analyze with AI
//                     </>
//                   )}
//                 </Button>
//               </form>
//             </CardContent>
//           </Card>

//           <Card className="shadow-lg">
//             <CardHeader>
//               <CardTitle>How It Works</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-start space-x-3">
//                 <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
//                   <span className="text-sm font-bold text-primary">1</span>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold mb-1">Enter Candidate Details</h3>
//                   <p className="text-sm text-muted-foreground">
//                     Fill in the candidate's information and the position they're applying for
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-start space-x-3">
//                 <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
//                   <span className="text-sm font-bold text-primary">2</span>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold mb-1">Paste Resume Text</h3>
//                   <p className="text-sm text-muted-foreground">
//                     Copy and paste the resume content into the text area
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-start space-x-3">
//                 <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
//                   <span className="text-sm font-bold text-accent">3</span>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold mb-1">AI Analysis</h3>
//                   <p className="text-sm text-muted-foreground">
//                     Our AI will analyze skills, experience, and fit for the position
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-start space-x-3">
//                 <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
//                   <span className="text-sm font-bold text-accent">4</span>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold mb-1">Get Results</h3>
//                   <p className="text-sm text-muted-foreground">
//                     Receive a detailed analysis with a match score and recommendations
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="shadow-lg">
//           <CardHeader>
//             <CardTitle>Recent Screenings</CardTitle>
//             <CardDescription>View AI-analyzed candidate profiles</CardDescription>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div className="flex items-center justify-center py-8">
//                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
//               </div>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Candidate</TableHead>
//                     <TableHead>Position</TableHead>
//                     <TableHead>AI Score</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Date</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {screenings?.map((screening) => (
//                     <TableRow key={screening.id}>
//                       <TableCell>
//                         <div>
//                           <p className="font-medium">{screening.candidate_name}</p>
//                           <p className="text-sm text-muted-foreground">{screening.email}</p>
//                         </div>
//                       </TableCell>
//                       <TableCell>{screening.position_applied}</TableCell>
//                       <TableCell>
//                         <div className="flex items-center space-x-2">
//                           <span className="text-2xl font-bold">{screening.ai_score}</span>
//                           {screening.ai_score && getScoreBadge(screening.ai_score)}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <Badge variant={screening.status === 'approved' ? 'default' : 'secondary'}>
//                           {screening.status}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {new Date(screening.created_at).toLocaleDateString()}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default ResumeScreening;

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BrainCircuit, Upload, Loader2, FileText, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ResumeScreening = () => {
  const [resumeText, setResumeText] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [position, setPosition] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedName, setExtractedName] = useState("");

  // Manual form fields
  const [experience, setExperience] = useState("");
  const [projects, setProjects] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [currentTab, setCurrentTab] = useState("upload");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: screenings, isLoading } = useQuery({
    queryKey: ["resume-screenings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_screenings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const analyzeResumeMutation = useMutation({
    mutationFn: async () => {
      let resumeContent = resumeText;
      let candidateNameToUse = candidateName;
      let candidateEmailToUse = candidateEmail;
      let candidatePhoneToUse = candidatePhone;
      let positionToUse = position;

      // If file is uploaded, read its content
      if (uploadedFile && currentTab === "upload") {
        resumeContent = await readFileContent(uploadedFile);
        // Use extracted name from resume
        candidateNameToUse = extractedName || "Extracted from Resume";
        candidateEmailToUse = "Extracted from Resume";
        candidatePhoneToUse = "Extracted from Resume";
        positionToUse = "To be determined by AI";
      }

      // If manual form is used, construct resume content
      if (currentTab === "manual") {
        resumeContent = constructResumeFromForm();
      }

      const { data, error } = await supabase.functions.invoke(
        "analyze-resume",
        {
          body: {
            resumeText: resumeContent,
            position: positionToUse,
            candidateName: candidateNameToUse,
            candidateEmail: candidateEmailToUse,
            candidatePhone: candidatePhoneToUse,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-screenings"] });
      toast({
        title: "Resume analyzed!",
        description: "AI analysis completed successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        // For PDF files, try to extract readable text
        let processedContent = content;
        if (
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
        ) {
          processedContent = extractTextFromPDF(content);
        }

        // Extract name from resume content
        const extractedName = extractNameFromResume(processedContent);
        setExtractedName(extractedName);
        resolve(processedContent);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const extractTextFromPDF = (pdfContent: string): string => {
    // Basic PDF text extraction - look for text between BT and ET markers
    const textMatches = pdfContent.match(/BT[\s\S]*?ET/g);
    if (textMatches) {
      let extractedText = "";
      textMatches.forEach((match) => {
        // Extract text content from PDF text objects
        const textContent = match
          .replace(/BT|ET/g, "")
          .replace(/Tj|TJ/g, "")
          .replace(/\[|\]/g, "")
          .replace(/\(|\)/g, "")
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\s+/g, " ")
          .trim();

        if (textContent && textContent.length > 2) {
          extractedText += textContent + "\n";
        }
      });

      if (extractedText.trim().length > 0) {
        return extractedText;
      }
    }

    // Fallback: try to extract text from stream objects
    const streamMatches = pdfContent.match(/stream[\s\S]*?endstream/g);
    if (streamMatches) {
      let extractedText = "";
      streamMatches.forEach((match) => {
        const streamContent = match
          .replace(/stream|endstream/g, "")
          .replace(/[^\x20-\x7E\n\r]/g, " ") // Keep only printable ASCII
          .replace(/\s+/g, " ")
          .trim();

        if (streamContent && streamContent.length > 10) {
          extractedText += streamContent + "\n";
        }
      });

      if (extractedText.trim().length > 0) {
        return extractedText;
      }
    }

    // If all else fails, return original content
    return pdfContent;
  };

  const extractNameFromResume = (content: string): string => {
    // Check if this is PDF content (starts with %PDF)
    if (content.startsWith("%PDF")) {
      // For PDF content, try to extract text after PDF headers
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Skip PDF headers and look for actual content
      let contentStartIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for lines that might contain actual resume content
        if (
          line.length > 3 &&
          !line.startsWith("%") &&
          !line.startsWith("<<") &&
          !line.startsWith("/") &&
          !line.match(/^\d+\s+\d+\s+obj$/)
        ) {
          contentStartIndex = i;
          break;
        }
      }

      // Look for name patterns in the content lines
      for (
        let i = contentStartIndex;
        i < Math.min(contentStartIndex + 10, lines.length);
        i++
      ) {
        const line = lines[i];
        if (isValidName(line)) {
          return line;
        }
      }
    } else {
      // For non-PDF content, use original logic
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Look for name patterns in the first few lines
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        if (isValidName(line)) {
          return line;
        }
      }
    }

    // Fallback: generate a meaningful name based on file or timestamp
    if (uploadedFile) {
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      if (fileName && fileName.length > 2 && fileName.length < 50) {
        return fileName;
      }
    }

    // Final fallback: use timestamp-based name
    const now = new Date();
    const timestamp = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Candidate ${timestamp}`;
  };

  const isValidName = (line: string): boolean => {
    // Check if line looks like a name (2-4 words, proper case, no special characters)
    if (
      line.match(/^[A-Za-z\s\.]{2,50}$/) &&
      line.split(" ").length >= 2 &&
      line.split(" ").length <= 4 &&
      line !== line.toUpperCase() && // Not all caps
      line !== line.toLowerCase() // Not all lowercase
    ) {
      // Skip common non-name words
      const skipWords = [
        "resume",
        "cv",
        "curriculum",
        "vitae",
        "profile",
        "summary",
        "objective",
        "contact",
        "information",
        "personal",
        "details",
        "about",
        "me",
        "page",
        "document",
        "file",
        "pdf",
        "version",
      ];
      const lowerLine = line.toLowerCase();
      return !skipWords.some((word) => lowerLine.includes(word));
    }
    return false;
  };

  const constructResumeFromForm = (): string => {
    return `
Name: ${candidateName}
Email: ${candidateEmail}
Phone: ${candidatePhone}
Position Applied: ${position}

EXPERIENCE:
${experience}

PROJECTS:
${projects}

SKILLS:
${skills}

EDUCATION:
${education}
    `.trim();
  };

  const resetForm = () => {
    setResumeText("");
    setCandidateName("");
    setCandidateEmail("");
    setCandidatePhone("");
    setPosition("");
    setUploadedFile(null);
    setExtractedName("");
    setExperience("");
    setProjects("");
    setSkills("");
    setEducation("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Read file content to extract name
      readFileContent(file).then(() => {
        toast({
          title: "File uploaded!",
          description: `${file.name} is ready for analysis`,
        });
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    await analyzeResumeMutation.mutateAsync();
    setIsAnalyzing(false);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-success">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-primary">Good</Badge>;
    if (score >= 40) return <Badge className="bg-warning">Average</Badge>;
    return <Badge variant="destructive">Below Average</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center shadow-accent-glow">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              AI Resume Screening
            </h1>
          </div>
          <p className="text-muted-foreground">
            Let AI analyze candidate resumes instantly
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Resume Input</CardTitle>
              <CardDescription>
                Upload a file or fill in details manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={currentTab}
                onValueChange={setCurrentTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="upload"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Upload File</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Manual Entry</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Upload Resume File *</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="flex-1"
                          required
                        />
                        <Upload className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {uploadedFile && (
                        <div className="space-y-1">
                          <p className="text-sm text-green-600">
                            ✓ {uploadedFile.name} uploaded
                          </p>
                          {extractedName && (
                            <p className="text-sm text-blue-600 font-medium">
                              👤 Candidate: {extractedName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-accent shadow-accent-glow"
                      disabled={isAnalyzing || !uploadedFile}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-4 h-4 mr-2" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual-name">Candidate Name *</Label>
                        <Input
                          id="manual-name"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-email">Email *</Label>
                        <Input
                          id="manual-email"
                          type="email"
                          value={candidateEmail}
                          onChange={(e) => setCandidateEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual-phone">Phone</Label>
                        <Input
                          id="manual-phone"
                          value={candidatePhone}
                          onChange={(e) => setCandidatePhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-position">
                          Position Applied *
                        </Label>
                        <Input
                          id="manual-position"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="e.g., Senior Software Engineer"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Work Experience *</Label>
                      <Textarea
                        id="experience"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="Describe your work experience, roles, and responsibilities..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projects">Projects *</Label>
                      <Textarea
                        id="projects"
                        value={projects}
                        onChange={(e) => setProjects(e.target.value)}
                        placeholder="List your key projects, technologies used, and achievements..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills *</Label>
                      <Textarea
                        id="skills"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="List your technical skills, programming languages, tools..."
                        className="min-h-[80px]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Textarea
                        id="education"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        placeholder="Your educational background, degrees, certifications..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-accent shadow-accent-glow"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-4 h-4 mr-2" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choose Input Method</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a resume file or manually fill in candidate details
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Provide Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter candidate details, position, and resume content or
                    structured data
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-accent">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes skills, experience, projects, and fit for
                    the position
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-accent">4</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a detailed analysis with a match score and
                    recommendations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Screenings</CardTitle>
            <CardDescription>
              View AI-analyzed candidate profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {screenings?.map((screening) => (
                    <TableRow key={screening.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {screening.candidate_name &&
                            !screening.candidate_name.startsWith("%PDF") &&
                            !screening.candidate_name.includes("PDF-")
                              ? screening.candidate_name
                              : `Resume ${screening.id.slice(-6)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {screening.email &&
                            screening.email !== "Extracted from Resume"
                              ? screening.email
                              : "Email not available"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {screening.position_applied &&
                        screening.position_applied !== "To be determined by AI"
                          ? screening.position_applied
                          : "Position TBD"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold">
                            {screening.ai_score}
                          </span>
                          {screening.ai_score &&
                            getScoreBadge(screening.ai_score)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            screening.status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {screening.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(screening.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeScreening;
