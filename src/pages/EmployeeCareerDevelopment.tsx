import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Upload, Loader2, TrendingUp, BookOpen, Target, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

export default function EmployeeCareerDevelopment() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);

  const { data: employeeData } = useQuery({
    queryKey: ['employee-career-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!employee) return null;

      const [resumeData, recommendations, sentimentData] = await Promise.all([
        supabase
          .from('employee_resumes')
          .select('*')
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('learning_recommendations')
          .select('*')
          .eq('employee_id', employee.id)
          .order('priority', { ascending: false }),
        supabase
          .from('sentiment_tracking')
          .select('*')
          .eq('employee_id', employee.id)
          .order('date', { ascending: false })
          .limit(7),
      ]);

      return {
        employee,
        resume: resumeData.data,
        recommendations: recommendations.data || [],
        sentimentData: sentimentData.data || [],
      };
    },
  });

  const uploadResumeMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id, position')
        .eq('user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee profile not found');

      // Upload file
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Read and analyze
      const text = await file.text();
      const { data: analysis, error: aiError } = await supabase.functions.invoke('analyze-employee-career', {
        body: {
          resumeText: text,
          currentPosition: employee.position,
          performanceData: {},
        }
      });

      if (aiError) throw new Error(`AI analysis failed: ${aiError.message}`);
      if (!analysis) throw new Error('AI analysis returned no data');

      // Save analysis
      const { error: dbError } = await supabase
        .from('employee_resumes')
        .insert({
          employee_id: employee.id,
          resume_url: publicUrl,
          resume_text: text,
          ai_skill_gaps: analysis.skillGaps || [],
          ai_career_path: analysis.careerPath || {},
          ai_learning_roadmap: analysis.learningRoadmap || [],
          ai_promotion_probability: analysis.promotionProbability || 0,
          ai_attrition_risk: analysis.attritionRisk || 'medium',
        });

      if (dbError) throw dbError;

      // Create learning recommendations
      if (analysis.learningRoadmap && Array.isArray(analysis.learningRoadmap)) {
        for (const item of analysis.learningRoadmap) {
          await supabase.from('learning_recommendations').insert({
            employee_id: employee.id,
            skill: item.skill || 'General',
            course_name: item.resources?.[0] || 'TBD',
            platform: 'Online',
            priority: item.priority || 'medium',
            ai_reasoning: `Recommended to close skill gap`,
          });
        }
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Resume analyzed and career insights generated',
      });
      setFile(null);
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await supabase.functions.invoke('career-coach-chat', {
        body: {
          messages: [
            ...chatHistory,
            { role: 'user', content: message }
          ]
        }
      });
      return data.response;
    },
    onSuccess: (response) => {
      setChatHistory([
        ...chatHistory,
        { role: 'user', content: chatMessage },
        { role: 'assistant', content: response }
      ]);
      setChatMessage('');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Career Development</h1>
          <p className="text-muted-foreground">AI-powered career insights and personalized learning paths</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Resume</CardTitle>
              <CardDescription>Get AI-powered career insights and personalized recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resume-upload">Resume (PDF)</Label>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button
                  onClick={() => uploadResumeMutation.mutate()}
                  disabled={!file || uploadResumeMutation.isPending}
                >
                  {uploadResumeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Career Coach
              </CardTitle>
              <CardDescription>Ask about promotions, skills, and career growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-48 overflow-y-auto border rounded p-2 space-y-2">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                        {msg.content}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask your career coach..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button
                    onClick={() => sendChatMutation.mutate(chatMessage)}
                    disabled={!chatMessage || sendChatMutation.isPending}
                  >
                    {sendChatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {employeeData?.resume && (
          <>
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Promotion Probability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{employeeData.resume.ai_promotion_probability}%</div>
                    <Progress value={employeeData.resume.ai_promotion_probability} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attrition Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={
                      employeeData.resume.ai_attrition_risk === 'low'
                        ? 'default'
                        : employeeData.resume.ai_attrition_risk === 'medium'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="text-lg"
                  >
                    {employeeData.resume.ai_attrition_risk?.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Gaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employeeData.resume.ai_skill_gaps?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Skills to develop</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Career Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Role</p>
                      <p className="font-semibold">
                        {typeof employeeData.resume.ai_career_path === 'object' && employeeData.resume.ai_career_path !== null
                          ? (employeeData.resume.ai_career_path as any).current
                          : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Steps</p>
                      <ul className="list-disc list-inside">
                        {typeof employeeData.resume.ai_career_path === 'object' && employeeData.resume.ai_career_path !== null
                          ? ((employeeData.resume.ai_career_path as any).next || []).map((role: string, idx: number) => (
                              <li key={idx}>{role}</li>
                            ))
                          : null}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Timeline</p>
                      <p>
                        {typeof employeeData.resume.ai_career_path === 'object' && employeeData.resume.ai_career_path !== null
                          ? (employeeData.resume.ai_career_path as any).timeline
                          : 'Not available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Learning Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employeeData.recommendations.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="border-l-4 border-primary pl-3">
                        <p className="font-semibold">{rec.skill}</p>
                        <p className="text-sm text-muted-foreground">{rec.course_name}</p>
                        <Badge variant="outline" className="mt-1">{rec.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
