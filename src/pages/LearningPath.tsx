import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Award, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function LearningPath() {
  const { data: learningData } = useQuery({
    queryKey: ['learning-path'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: employee } = await supabase
        .from('employees')
        .select('id, position')
        .eq('user_id', user.id)
        .single();

      if (!employee) return null;

      const { data: recommendations } = await supabase
        .from('learning_recommendations')
        .select('*')
        .eq('employee_id', employee.id)
        .order('priority', { ascending: false });

      return {
        employee,
        recommendations: recommendations || [],
      };
    },
  });

  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  };

  const statusColors = {
    recommended: 'secondary',
    in_progress: 'default',
    completed: 'outline',
  };

  const completedCount = learningData?.recommendations.filter((r: any) => r.status === 'completed').length || 0;
  const totalCount = learningData?.recommendations.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Learning Path</h1>
          <p className="text-sm md:text-base text-muted-foreground">Personalized skill development recommendations</p>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Recommended for you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Courses finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Award className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressPercent}%</div>
              <Progress value={progressPercent} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          {learningData?.recommendations.map((rec: any) => (
            <Card key={rec.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg md:text-xl">{rec.course_name}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{rec.platform}</span>
                      {rec.estimated_hours && (
                        <>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{rec.estimated_hours}h</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={priorityColors[rec.priority as keyof typeof priorityColors] as any}>
                      {rec.priority} priority
                    </Badge>
                    <Badge variant={statusColors[rec.status as keyof typeof statusColors] as any}>
                      {rec.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Target Skill:</p>
                    <Badge variant="outline">{rec.skill}</Badge>
                  </div>
                  {rec.ai_reasoning && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Why this course?</p>
                      <p className="text-sm text-muted-foreground">{rec.ai_reasoning}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {rec.course_url ? (
                      <Button asChild className="flex-1 sm:flex-none">
                        <a href={rec.course_url} target="_blank" rel="noopener noreferrer">
                          Start Learning
                        </a>
                      </Button>
                    ) : (
                      <Button className="flex-1 sm:flex-none">View Details</Button>
                    )}
                    {rec.status !== 'completed' && (
                      <Button variant="outline" className="flex-1 sm:flex-none">
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!learningData?.recommendations || learningData.recommendations.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No learning recommendations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your resume in Career Development to get personalized course recommendations
                </p>
                <Button asChild>
                  <a href="/employee-career-development">Upload Resume</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
