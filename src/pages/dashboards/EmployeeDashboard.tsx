import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  FileText,
  MessageSquare,
  Award,
  TrendingUp,
  BookOpen,
  Target,
} from "lucide-react";
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
import { RoleBasedChatAssistant } from "@/components/RoleBasedChatAssistant";
import NotificationsList from "./NotificationsList";

export const EmployeeDashboard = () => {
  const { user } = useAuth();

  const { data: employeeData } = useQuery({
    queryKey: ["employee-data", user?.id],
    queryFn: async () => {
      const { data: employee } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (!employee) return null;

      const [leaveRequests, announcements, reviews] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("*")
          .eq("employee_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("performance_reviews")
          .select("*")
          .eq("employee_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      return {
        employee,
        leaveRequests: leaveRequests.data || [],
        announcements: announcements.data || [],
        latestReview: reviews.data?.[0] || null,
      };
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Employee Dashboard
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome back, {employeeData?.employee?.full_name || "Employee"}!
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Leave Requests
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeData?.leaveRequests?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-glow">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeData?.announcements?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Award className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeData?.latestReview?.rating || "N/A"}/5
            </div>
          </CardContent>
        </Card>

        {/* <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HR Assistant</CardTitle>
            <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-glow">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <Button size="sm" asChild className="w-full">
              <a href="/chat-assistant">Ask AI</a>
            </Button>
          </CardContent>
        </Card> */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeData?.leaveRequests &&
          employeeData.leaveRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeData.leaveRequests.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="capitalize">
                      {leave.leave_type}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.start_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          leave.status === "approved"
                            ? "default"
                            : leave.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {leave.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No leave requests yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationsList />
        </CardContent>
      </Card> */}

      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/leave-management"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-semibold">Request Leave</h3>
              <p className="text-sm text-muted-foreground">
                Submit a new leave request
              </p>
            </a>
            <a
              href="/ai-interview"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <MessageSquare className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-semibold">AI Interview</h3>
              <p className="text-sm text-muted-foreground">
                Practice interview (chat or voice)
              </p>
            </a>
            <a
              href="/internal-jobs"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Target className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-semibold">Internal Opportunities</h3>
              <p className="text-sm text-muted-foreground">
                AI-matched job recommendations
              </p>
            </a>
          </CardContent>
        </Card>

        <div className="max-w-2xl">
          <RoleBasedChatAssistant />
        </div>
      </div>
    </div>
  );
};
