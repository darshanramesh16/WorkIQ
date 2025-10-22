import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function InterviewReport() {
  const params = useParams();
  const candidateId = params.candidateId as string;
  const [candidate, setCandidate] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: cand } = await supabase.from('candidates').select('*').eq('id', candidateId).maybeSingle();
      setCandidate(cand || null);
      const { data: sess } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('start_time', { ascending: false });
      setSessions(sess || []);
    };
    if (candidateId) load();
  }, [candidateId]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Interview Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {candidate && (
              <div className="grid gap-4 md:grid-cols-4">
                <div><span className="text-muted-foreground text-sm">Name</span><div className="font-semibold">{candidate.name}</div></div>
                <div><span className="text-muted-foreground text-sm">Role</span><div className="font-semibold">{candidate.job_role}</div></div>
                <div><span className="text-muted-foreground text-sm">Email</span><div className="font-semibold">{candidate.email}</div></div>
                <div><span className="text-muted-foreground text-sm">Status</span><div className="font-semibold capitalize">{candidate.status}</div></div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => window.print()}>Download / Print</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id.slice(0,8)}…</TableCell>
                    <TableCell className="capitalize">{s.mode}</TableCell>
                    <TableCell>{new Date(s.start_time).toLocaleString()}</TableCell>
                    <TableCell>{s.end_time ? new Date(s.end_time).toLocaleString() : '-'}</TableCell>
                    <TableCell>{s.analysis_json?.summary ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {sessions[0]?.transcript && (
              <div>
                <h3 className="font-semibold mb-2">Transcript (latest session)</h3>
                <div className="border rounded p-3 space-y-2 max-h-96 overflow-auto bg-background/30">
                  {(sessions[0].transcript as any[]).map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <span className="text-xs font-mono text-muted-foreground">{m.ts ? new Date(m.ts).toLocaleTimeString() : ''}</span>
                      <div className={`mt-1 inline-block px-2 py-1 rounded ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
