import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  TrendingUp,
  Brain,
  BarChart3,
  UserPlus,
  FileSearch,
} from "lucide-react";
import { RoleBasedChatAssistant } from "@/components/RoleBasedChatAssistant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export const HRDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: async () => {
      const [employees, jobPostings, interviews, leaveRequests, screenings] =
        await Promise.all([
          supabase.from("employees").select("*", { count: "exact" }),
          supabase.from("job_postings").select("*", { count: "exact" }),
          supabase.from("interviews").select("*", { count: "exact" }),
          supabase.from("leave_requests").select("*").eq("status", "pending"),
          supabase.from("resume_screenings").select("*", { count: "exact" }),
        ]);

      return {
        totalEmployees: employees.count || 0,
        totalJobPostings: jobPostings.count || 0,
        totalInterviews: interviews.count || 0,
        pendingLeaves: leaveRequests.data?.length || 0,
        totalScreenings: screenings.count || 0,
      };
    },
  });

  const { data: candidateInsights } = useQuery({
    queryKey: ["candidate-insights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("candidates")
        .select(
          "id, name, job_role, status, scores, summary, created_at, user_id"
        )
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const statCards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees || 0,
      icon: Users,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Job Postings",
      value: stats?.totalJobPostings || 0,
      icon: Briefcase,
      gradient: "bg-gradient-accent",
    },
    {
      title: "Interviews",
      value: stats?.totalInterviews || 0,
      icon: Calendar,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Pending Leaves",
      value: stats?.pendingLeaves || 0,
      icon: FileText,
      gradient: "bg-gradient-accent",
    },
    {
      title: "Resume Screenings",
      value: stats?.totalScreenings || 0,
      icon: TrendingUp,
      gradient: "bg-gradient-primary",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">HR Dashboard</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Recruitment and employee management
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div
                className={`w-10 h-10 ${stat.gradient} rounded-lg flex items-center justify-center shadow-glow`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/employees"
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <Users className="w-6 h-6 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Employees</h3>
                <p className="text-sm text-muted-foreground">
                  View and edit employee records
                </p>
              </a>
              <a
                href="/job-postings"
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <Briefcase className="w-6 h-6 mb-2 text-primary" />
                <h3 className="font-semibold">Job Postings</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage job listings
                </p>
              </a>
              <a
                href="/interviews"
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <Calendar className="w-6 h-6 mb-2 text-primary" />
                <h3 className="font-semibold">Interviews</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule and track interviews
                </p>
              </a>
              <a
                href="/resume-screening"
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <TrendingUp className="w-6 h-6 mb-2 text-primary" />
                <h3 className="font-semibold">Resume Screening</h3>
                <p className="text-sm text-muted-foreground">
                  Legacy resume analysis
                </p>
              </a>
              {/* <a
                href="/candidate-resume-upload"
                className="p-4 border rounded-lg hover:bg-accent transition-colors bg-gradient-primary text-white"
              >
                <Brain className="w-6 h-6 mb-2" />
                <h3 className="font-semibold">AI Resume Analysis</h3>
                <p className="text-sm opacity-90">
                  Advanced AI insights & ranking
                </p>
              </a> */}

              <a
                href="/ai-interview-results"
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <ClipboardList className="w-6 h-6 mb-2 text-primary" />
                <h3 className="font-semibold">AI Interview Results</h3>
                <p className="text-sm text-muted-foreground">
                  View interview answers
                </p>
              </a>
              {/* <a href="/hr-questions" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <UserPlus className="w-6 h-6 mb-2 text-primary" />
                <h3 className="font-semibold">Question Bank</h3>
                <p className="text-sm text-muted-foreground">Manage role-based questions</p>
              </a> */}
            </CardContent>
          </Card>
          {/* <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Candidate Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Technical</TableHead>
                    <TableHead>Communication</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidateInsights && candidateInsights.length > 0 ? (
                    candidateInsights.map((c: any) => {
                      const s = (c.scores || {}) as any;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {c.name}
                          </TableCell>
                          <TableCell>{c.job_role}</TableCell>
                          <TableCell>{s.technical ?? "—"}</TableCell>
                          <TableCell>{s.communication ?? "—"}</TableCell>
                          <TableCell>{s.confidence ?? "—"}</TableCell>
                          <TableCell>{s.overall_fit ?? "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                c.status === "shortlisted"
                                  ? "default"
                                  : c.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <a href={`/interview-report/${c.id}`}>
                                <FileSearch className="w-4 h-4 mr-1" /> View
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                await supabase
                                  .from("candidates")
                                  .update({ status: "shortlisted" })
                                  .eq("id", c.id);
                                if (c.user_id) {
                                  await supabase.from("notifications").insert({
                                    user_id: c.user_id,
                                    type: "status",
                                    message: "You've been shortlisted.",
                                  });
                                }
                              }}
                            >
                              Shortlist
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await supabase
                                  .from("candidates")
                                  .update({ status: "rejected" })
                                  .eq("id", c.id);
                                if (c.user_id) {
                                  await supabase.from("notifications").insert({
                                    user_id: c.user_id,
                                    type: "status",
                                    message:
                                      "Your application was not selected.",
                                  });
                                }
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                await supabase
                                  .from("candidates")
                                  .update({ status: "next_round" })
                                  .eq("id", c.id);
                                if (c.user_id) {
                                  await supabase.from("notifications").insert({
                                    user_id: c.user_id,
                                    type: "status",
                                    message:
                                      "You're invited to the next round.",
                                  });
                                }
                              }}
                            >
                              Next Round
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No candidates found. Candidates will appear here after
                        they complete interviews or upload resumes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card> */}
        </div>
        <div>
          <RoleBasedChatAssistant />
        </div>
      </div>
    </div>
  );
};
