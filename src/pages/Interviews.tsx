import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Interviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    job_posting_id: '',
    interview_date: '',
    interview_type: 'phone',
    notes: ''
  });

  useEffect(() => {
    fetchInterviews();
    fetchJobPostings();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('interviews')
      .select('*, job_postings(title)')
      .order('interview_date', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setInterviews(data || []);
    }
    setLoading(false);
  };

  const fetchJobPostings = async () => {
    const { data } = await supabase
      .from('job_postings')
      .select('id, title')
      .eq('status', 'open');
    
    if (data) setJobPostings(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('interviews').insert([
      { ...formData, interviewer_id: user?.id }
    ]);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Interview scheduled!' });
      setIsDialogOpen(false);
      setFormData({
        candidate_name: '',
        candidate_email: '',
        job_posting_id: '',
        interview_date: '',
        interview_type: 'phone',
        notes: ''
      });
      fetchInterviews();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Interview ${status}!` });
      fetchInterviews();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      scheduled: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    };
    return colors[status] || 'secondary';
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Interview Scheduler
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">Schedule and manage candidate interviews</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Schedule Interview</span>
                <span className="sm:hidden">Schedule</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Interview</DialogTitle>
                <DialogDescription>Enter candidate and interview details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Candidate Name</Label>
                  <Input value={formData.candidate_name} onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Candidate Email</Label>
                  <Input type="email" value={formData.candidate_email} onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Job Position</Label>
                  <Select value={formData.job_posting_id} onValueChange={(value) => setFormData({ ...formData, job_posting_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPostings.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interview Date & Time</Label>
                  <Input type="datetime-local" value={formData.interview_date} onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Interview Type</Label>
                  <Select value={formData.interview_type} onValueChange={(value) => setFormData({ ...formData, interview_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                </div>
                <Button type="submit" className="w-full">Schedule Interview</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {interviews.map((interview) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {interview.candidate_name}
                        <Badge variant={getStatusColor(interview.status)}>
                          {interview.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{interview.candidate_email}</CardDescription>
                    </div>
                    <Select value={interview.status} onValueChange={(value) => handleStatusChange(interview.id, value)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Position</p>
                      <p className="font-medium">{interview.job_postings?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Interview Type</p>
                      <p className="font-medium capitalize">{interview.interview_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Scheduled Time</p>
                      <p className="font-medium">
                        {new Date(interview.interview_date).toLocaleString()}
                      </p>
                    </div>
                    {interview.notes && (
                      <div className="md:col-span-3">
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="font-medium">{interview.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Interviews;
