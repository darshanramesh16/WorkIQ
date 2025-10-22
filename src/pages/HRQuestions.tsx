import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function HRQuestions() {
  const qc = useQueryClient();
  const [role, setRole] = useState('Software Engineer');
  const [question, setQuestion] = useState('');

  const { data: questions } = useQuery({
    queryKey: ['hr-questions', role],
    queryFn: async () => {
      const { data } = await supabase
        .from('hr_questions')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_questions').insert({ role, question_text: question });
      if (error) throw error;
    },
    onSuccess: () => {
      setQuestion('');
      qc.invalidateQueries({ queryKey: ['hr-questions', role] });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Question Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <Label>Role</Label>
                <Input value={role} onChange={(e)=>setRole(e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <div className="flex-1">
                  <Label>Question</Label>
                  <Input value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Enter a question" />
                </div>
                <Button onClick={()=>addMutation.mutate()} disabled={!question.trim() || addMutation.isPending} className="self-end">Add</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(questions || []).map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell>{q.question_text}</TableCell>
                    <TableCell>{new Date(q.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
