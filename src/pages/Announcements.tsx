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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Announcements = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_roles: ['employee', 'hr', 'manager', 'admin']
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('announcements').insert([
      { ...formData, created_by: user?.id }
    ]);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Announcement posted!' });
      setIsDialogOpen(false);
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        target_roles: ['employee', 'hr', 'manager', 'admin']
      });
      fetchAnnouncements();
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData({
      ...formData,
      target_roles: formData.target_roles.includes(role)
        ? formData.target_roles.filter(r => r !== role)
        : [...formData.target_roles, role]
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'low':
        return <Info className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Megaphone className="w-5 h-5 text-primary" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: any = {
      high: 'destructive',
      normal: 'default',
      low: 'secondary'
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Announcements
            </h1>
            <p className="text-muted-foreground mt-2">Company-wide notifications and updates</p>
          </div>
          {userRole === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Megaphone className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>Post a new announcement for the team</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={5} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Roles</Label>
                    <div className="space-y-2">
                      {['employee', 'hr', 'manager', 'admin'].map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox 
                            checked={formData.target_roles.includes(role)}
                            onCheckedChange={() => handleRoleToggle(role)}
                          />
                          <label className="text-sm capitalize">{role}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Post Announcement</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className={announcement.priority === 'high' ? 'border-destructive' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(announcement.priority)}
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {announcement.title}
                          {getPriorityBadge(announcement.priority)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(announcement.created_at).toLocaleDateString()} • 
                          Target: {announcement.target_roles.join(', ')}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements;
