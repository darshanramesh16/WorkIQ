import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, TrendingUp } from 'lucide-react';

export default function InternalJobs() {
  const { data: recommendations } = useQuery({
    queryKey: ['internal-job-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return [];

      const { data } = await supabase
        .from('internal_job_recommendations')
        .select(`
          *,
          job_posting:job_postings(*)
        `)
        .eq('employee_id', employee.id)
        .order('ai_match_score', { ascending: false });

      return data || [];
    },
  });

  const { data: allJobs } = useQuery({
    queryKey: ['open-job-postings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Internal Opportunities</h1>
          <p className="text-sm md:text-base text-muted-foreground">AI-matched job recommendations based on your profile</p>
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">AI-Recommended for You</h2>
            <div className="grid gap-4 md:gap-6">
              {recommendations.map((rec: any) => (
                <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg md:text-xl">{rec.job_posting?.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{rec.job_posting?.department}</span>
                          <MapPin className="w-4 h-4 ml-2" />
                          <span>{rec.job_posting?.location || 'Not specified'}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {rec.ai_match_score}% Match
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{rec.ai_reasoning}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button className="flex-1 sm:flex-none">Apply Now</Button>
                      <Button variant="outline" className="flex-1 sm:flex-none">Learn More</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-4">All Open Positions</h2>
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {allJobs?.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">{job.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.department}</span>
                    <MapPin className="w-4 h-4 ml-2" />
                    <span>{job.location || 'Not specified'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{job.description}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="flex-1 sm:flex-none">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
