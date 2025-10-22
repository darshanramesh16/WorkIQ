// import { useState } from 'react';
// import { Navigation } from '@/components/Navigation';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { useToast } from '@/components/ui/use-toast';
// import { supabase } from '@/integrations/supabase/client';
// import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
// import { Upload, Loader2, FileText, TrendingUp, Users } from 'lucide-react';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';

// export default function CandidateResumeUpload() {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const [candidateName, setCandidateName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [position, setPosition] = useState('');
//   const [file, setFile] = useState<File | null>(null);

//   const { data: candidates } = useQuery({
//     queryKey: ['candidate-resumes'],
//     queryFn: async () => {
//       const { data } = await supabase
//         .from('candidate_resumes')
//         .select('*')
//         .order('created_at', { ascending: false });
//       return data || [];
//     },
//   });

//   const uploadMutation = useMutation({
//     mutationFn: async () => {
//       if (!file) throw new Error('No file selected');

//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not authenticated');

//       // Upload file to storage
//       const filePath = `${user.id}/${Date.now()}_${file.name}`;
//       const { error: uploadError } = await supabase.storage
//         .from('resumes')
//         .upload(filePath, file);

//       if (uploadError) throw uploadError;

//       // Get public URL
//       const { data: { publicUrl } } = supabase.storage
//         .from('resumes')
//         .getPublicUrl(filePath);

//       // Read file content
//       const text = await file.text();

//       // Call AI analysis
//       const { data: analysis, error: aiError } = await supabase.functions.invoke('analyze-candidate-resume', {
//         body: { resumeText: text, position }
//       });

//       if (aiError) throw new Error(`AI analysis failed: ${aiError.message}`);
//       if (!analysis) throw new Error('AI analysis returned no data');

//       // Save to database
//       const { error: dbError } = await supabase
//         .from('candidate_resumes')
//         .insert({
//           candidate_name: candidateName,
//           email,
//           phone,
//           position_applied: position,
//           resume_url: publicUrl,
//           resume_text: text,
//           ai_summary: analysis.summary || 'No summary available',
//           ai_skill_match: analysis.skillMatch || {},
//           ai_strengths: analysis.strengths || [],
//           ai_weaknesses: analysis.weaknesses || [],
//           ai_cultural_fit_score: analysis.culturalFitScore || 0,
//           ai_red_flags: analysis.redFlags || [],
//           ai_overall_score: analysis.overallScore || 0,
//           uploaded_by: user.id,
//         });

//       if (dbError) throw dbError;
//     },
//     onSuccess: () => {
//       toast({
//         title: 'Success',
//         description: 'Resume uploaded and analyzed successfully',
//       });
//       queryClient.invalidateQueries({ queryKey: ['candidate-resumes'] });
//       setCandidateName('');
//       setEmail('');
//       setPhone('');
//       setPosition('');
//       setFile(null);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: 'Error',
//         description: error.message,
//         variant: 'destructive',
//       });
//     },
//   });

//   return (
//     <div className="min-h-screen bg-gradient-subtle">
//       <Navigation />
//       <div className="container mx-auto px-4 py-4 md:py-8">
//         <div className="mb-6 md:mb-8">
//           <h1 className="text-2xl md:text-4xl font-bold mb-2">AI Resume Analysis</h1>
//           <p className="text-sm md:text-base text-muted-foreground">Upload candidate resumes for comprehensive AI-powered analysis</p>
//         </div>

//         <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
//               <Users className="w-4 h-4 text-primary" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{candidates?.length || 0}</div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
//               <TrendingUp className="w-4 h-4 text-primary" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">
//                 {candidates && candidates.length > 0
//                   ? Math.round(candidates.reduce((acc, c) => acc + (c.ai_overall_score || 0), 0) / candidates.length)
//                   : 0}
//               </div>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
//               <FileText className="w-4 h-4 text-primary" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">
//                 {candidates?.filter(c => c.status === 'pending').length || 0}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="mb-6 md:mb-8">
//           <CardHeader>
//             <CardTitle className="text-lg md:text-xl">Upload New Resume</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={(e) => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="name">Candidate Name</Label>
//                   <Input
//                     id="name"
//                     value={candidateName}
//                     onChange={(e) => setCandidateName(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="email">Email</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="phone">Phone</Label>
//                   <Input
//                     id="phone"
//                     value={phone}
//                     onChange={(e) => setPhone(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="position">Position Applied</Label>
//                   <Input
//                     id="position"
//                     value={position}
//                     onChange={(e) => setPosition(e.target.value)}
//                     required
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label htmlFor="resume">Resume (PDF)</Label>
//                 <Input
//                   id="resume"
//                   type="file"
//                   accept=".pdf"
//                   onChange={(e) => setFile(e.target.files?.[0] || null)}
//                   required
//                 />
//               </div>
//               <Button type="submit" disabled={uploadMutation.isPending}>
//                 {uploadMutation.isPending ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Analyzing...
//                   </>
//                 ) : (
//                   <>
//                     <Upload className="mr-2 h-4 w-4" />
//                     Upload & Analyze
//                   </>
//                 )}
//               </Button>
//             </form>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg md:text-xl">Recent Candidates</CardTitle>
//           </CardHeader>
//           <CardContent className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Position</TableHead>
//                   <TableHead>AI Score</TableHead>
//                   <TableHead>Cultural Fit</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Date</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {candidates?.map((candidate) => (
//                   <TableRow key={candidate.id}>
//                     <TableCell className="font-medium">{candidate.candidate_name}</TableCell>
//                     <TableCell>{candidate.position_applied}</TableCell>
//                     <TableCell>
//                       <Badge variant={candidate.ai_overall_score >= 70 ? 'default' : 'secondary'}>
//                         {candidate.ai_overall_score}/100
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant={candidate.ai_cultural_fit_score >= 70 ? 'default' : 'secondary'}>
//                         {candidate.ai_cultural_fit_score}/100
//                       </Badge>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant={candidate.status === 'approved' ? 'default' : 'secondary'}>
//                         {candidate.status}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>{new Date(candidate.created_at).toLocaleDateString()}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
