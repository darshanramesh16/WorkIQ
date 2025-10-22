import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const AdminDashboard = () => {
  const [selectedModal, setSelectedModal] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        employees,
        jobPostings,
        interviews,
        announcements,
        leaveRequests,
        screenings,
        attendance,
        reviews,
      ] = await Promise.all([
        supabase.from("employees").select("*", { count: "exact" }),
        supabase.from("job_postings").select("*", { count: "exact" }),
        supabase.from("interviews").select("*", { count: "exact" }),
        supabase.from("announcements").select("*", { count: "exact" }),
        supabase.from("leave_requests").select("*").eq("status", "pending"),
        supabase.from("resume_screenings").select("*", { count: "exact" }),
        supabase
          .from("attendance")
          .select("*")
          .gte(
            "date",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          ),
        supabase.from("performance_reviews").select("*"),
      ]);

      // Calculate payroll summary (total salaries)
      const totalPayroll =
        employees.data?.reduce(
          (sum: number, emp: any) => sum + (emp.salary || 0),
          0
        ) || 0;

      // Calculate attendance rate
      const attendanceRate = attendance.data
        ? (
            (attendance.data.filter((a: any) => a.status === "present").length /
              attendance.data.length) *
            100
          ).toFixed(1)
        : 0;

      // Calculate average performance rating
      const avgRating =
        reviews.data && reviews.data.length > 0
          ? (
              reviews.data.reduce((sum: number, r: any) => sum + r.rating, 0) /
              reviews.data.length
            ).toFixed(1)
          : 0;

      return {
        totalEmployees: employees.count || 0,
        totalJobPostings: jobPostings.count || 0,
        totalInterviews: interviews.count || 0,
        totalAnnouncements: announcements.count || 0,
        pendingLeaves: leaveRequests.data?.length || 0,
        totalScreenings: screenings.count || 0,
        totalPayroll: `$${(totalPayroll / 1000).toFixed(0)}K`,
        attendanceRate: `${attendanceRate}%`,
        avgPerformance: avgRating,
      };
    },
  });

  const statCards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees || 0,
      icon: Users,
      gradient: "bg-gradient-primary",
      description: "Active workforce",
    },
    {
      title: "Job Postings",
      value: stats?.totalJobPostings || 0,
      icon: Briefcase,
      gradient: "bg-gradient-accent",
      description: "Open positions",
    },
    {
      title: "Interviews",
      value: stats?.totalInterviews || 0,
      icon: Calendar,
      gradient: "bg-gradient-primary",
      description: "Scheduled",
    },
    {
      title: "Pending Leaves",
      value: stats?.pendingLeaves || 0,
      icon: FileText,
      gradient: "bg-gradient-accent",
      description: "Awaiting approval",
    },
    {
      title: "Resume Screenings",
      value: stats?.totalScreenings || 0,
      icon: TrendingUp,
      gradient: "bg-gradient-primary",
      description: "AI analyzed",
    },
    {
      title: "Monthly Payroll",
      value: stats?.totalPayroll || "$0",
      icon: TrendingUp,
      gradient: "bg-gradient-accent",
      description: "Total compensation",
    },
    {
      title: "Attendance Rate",
      value: stats?.attendanceRate || "0%",
      icon: UserCheck,
      gradient: "bg-gradient-primary",
      description: "Last 30 days",
    },
    {
      title: "Avg Performance",
      value: `${stats?.avgPerformance || 0}/5`,
      icon: Users,
      gradient: "bg-gradient-accent",
      description: "Team rating",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Complete system overview and management
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setSelectedModal(stat.title)}
          >
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
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <StatDetailsModal
        title={selectedModal}
        onClose={() => setSelectedModal(null)}
      />

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
            href="/announcements"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <FileText className="w-6 h-6 mb-2 text-primary" />
            <h3 className="font-semibold">Announcements</h3>
            <p className="text-sm text-muted-foreground">
              Post company-wide updates
            </p>
          </a>
          <a
            href="/leave-management"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <Calendar className="w-6 h-6 mb-2 text-primary" />
            <h3 className="font-semibold">Leave Management</h3>
            <p className="text-sm text-muted-foreground">
              Approve or reject leave requests
            </p>
          </a>
          <a
            href="/interviews"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <UserCheck className="w-6 h-6 mb-2 text-primary" />
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
              AI-powered candidate analysis
            </p>
          </a>
          {/* <a href="/candidate-resume-upload" className="p-4 border rounded-lg hover:bg-accent transition-colors">
            <FileText className="w-6 h-6 mb-2 text-primary" />
            <h3 className="font-semibold">AI Resume Analysis</h3>
            <p className="text-sm text-muted-foreground">Upload and analyze resumes</p>
          </a> */}
        </CardContent>
      </Card>
    </div>
  );
};

function StatDetailsModal({
  title,
  onClose,
}: {
  title: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["stat-details", title],
    queryFn: async () => {
      if (!title) return null;

      switch (title) {
        case "Total Employees":
          const { data: employees } = await supabase
            .from("employees")
            .select("*");
          return { type: "employees", data: employees };
        case "Job Postings":
          const { data: jobs } = await supabase
            .from("job_postings")
            .select("*");
          return { type: "jobs", data: jobs };
        case "Interviews":
          const { data: interviews } = await supabase
            .from("interviews")
            .select("*");
          return { type: "interviews", data: interviews };
        case "Pending Leaves":
          const { data: leaves } = await supabase
            .from("leave_requests")
            .select("*, employees(full_name)")
            .eq("status", "pending");
          return { type: "leaves", data: leaves };
        case "Resume Screenings":
          const { data: screenings } = await supabase
            .from("resume_screenings")
            .select("*");
          return { type: "screenings", data: screenings };
        default:
          return null;
      }
    },
    enabled: !!title,
  });

  if (!title) return null;

  return (
    <Dialog open={!!title} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            {data?.type === "employees" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data?.map((emp: any) => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.full_name}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>
                        <Badge>{emp.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {data?.type === "jobs" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data?.map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{job.job_type}</TableCell>
                      <TableCell>
                        <Badge>{job.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {data?.type === "interviews" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data?.map((interview: any) => (
                    <TableRow key={interview.id}>
                      <TableCell>{interview.candidate_name}</TableCell>
                      <TableCell>{interview.interview_type}</TableCell>
                      <TableCell>
                        {new Date(
                          interview.interview_date
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge>{interview.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {data?.type === "leaves" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data?.map((leave: any) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.employees?.full_name}</TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell>
                        {new Date(leave.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(leave.end_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {data?.type === "screenings" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data?.map((screening: any) => (
                    <TableRow key={screening.id}>
                      <TableCell>{screening.candidate_name}</TableCell>
                      <TableCell>{screening.position_applied}</TableCell>
                      <TableCell>{screening.ai_score}/100</TableCell>
                      <TableCell>
                        <Badge>{screening.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
