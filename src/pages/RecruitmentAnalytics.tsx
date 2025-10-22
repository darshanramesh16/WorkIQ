import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export default function RecruitmentAnalytics() {
  const { data: analytics } = useQuery({
    queryKey: ['recruitment-analytics'],
    queryFn: async () => {
      const [candidates, metrics] = await Promise.all([
        supabase.from('candidate_resumes').select('*'),
        supabase.from('recruitment_metrics').select('*').order('week_start', { ascending: false }).limit(1),
      ]);

      const avgScore = candidates.data 
        ? Math.round(candidates.data.reduce((acc, c) => acc + (c.ai_overall_score || 0), 0) / candidates.data.length)
        : 0;

      return {
        totalCandidates: candidates.data?.length || 0,
        avgScore,
        metrics: metrics.data?.[0],
      };
    },
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Recruitment Analytics</h1>
          <p className="text-sm md:text-base text-muted-foreground">AI-powered hiring insights and metrics</p>
        </div>

        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalCandidates || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Candidates analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.avgScore || 0}/100</div>
              <p className="text-xs text-muted-foreground mt-1">Candidate quality</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Screened</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.metrics?.screened || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
              <Clock className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.metrics?.ai_predicted_time_to_hire || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">Predicted days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Latest recruitment intelligence</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {analytics?.metrics?.ai_insights || 'Upload more candidate resumes to generate AI insights about your recruitment funnel, candidate quality trends, and hiring predictions.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
