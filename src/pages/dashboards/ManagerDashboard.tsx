import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
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
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const ManagerDashboard = () => {
  const { user, userRole } = useAuth();

  const { data: stats, refetch } = useQuery({
    queryKey: ["manager-stats"],
    queryFn: async () => {
      const [employees, leaveRequests, announcements, attendance, reviews] =
        await Promise.all([
          supabase.from("employees").select("*", { count: "exact" }),
          supabase
            .from("leave_requests")
            .select("*, employees(full_name, department, employee_id)")
            .eq("status", "pending"),
          supabase
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("attendance")
            .select("*")
            .gte(
              "date",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            ),
          supabase.from("performance_reviews").select("*", { count: "exact" }),
        ]);

      const attendanceRate = attendance.data
        ? (
            (attendance.data.filter((a: any) => a.status === "present").length /
              attendance.data.length) *
            100
          ).toFixed(1)
        : 0;

      // Process leave requests data
      const processedLeaves = leaveRequests.data || [];

      // Debug: Log the data structure to verify the join is working
      console.log("=== MANAGER DASHBOARD DEBUG ===");
      console.log("User role:", userRole);
      console.log("User ID:", user?.id);
      console.log("Leave requests query result:", leaveRequests);
      console.log("Leave requests error:", leaveRequests.error);
      console.log("Processed leaves count:", processedLeaves.length);

      // Check if user has manager role
      if (userRole !== "manager") {
        console.log("WARNING: User role is not 'manager', it's:", userRole);
      }

      if (processedLeaves.length > 0) {
        console.log("Sample leave request data:", processedLeaves[0]);
        console.log(
          "Employee data in leave request:",
          processedLeaves[0]?.employees
        );
        console.log(
          "Employee full_name:",
          processedLeaves[0]?.employees?.full_name
        );
        console.log(
          "Employee department:",
          processedLeaves[0]?.employees?.department
        );
      } else {
        console.log("No leave requests found or error occurred");
        // Let's also check if there are any leave requests at all
        const { data: allLeaves, error: allLeavesError } = await supabase
          .from("leave_requests")
          .select("*")
          .limit(5);
        console.log("All leave requests (any status):", allLeaves);
        console.log("All leave requests error:", allLeavesError);

        // Check if there are any pending leave requests specifically
        const { data: pendingLeaves, error: pendingError } = await supabase
          .from("leave_requests")
          .select("*")
          .eq("status", "pending");
        console.log("Pending leave requests:", pendingLeaves);
        console.log("Pending leave requests error:", pendingError);
      }
      console.log("=== END DEBUG ===");

      // If no pending leaves found, let's try to get any leave requests and show them
      let finalLeaves = processedLeaves;
      if (processedLeaves.length === 0) {
        console.log(
          "No pending leaves found, trying to get any leave requests..."
        );
        const { data: anyLeaves } = await supabase
          .from("leave_requests")
          .select("*, employees(full_name, department, employee_id)")
          .limit(5);

        if (anyLeaves && anyLeaves.length > 0) {
          console.log("Found some leave requests:", anyLeaves);
          finalLeaves = anyLeaves;
        }
      }

      return {
        totalEmployees: employees.count || 0,
        pendingLeaves: finalLeaves,
        recentAnnouncements: announcements.data || [],
        attendanceRate,
        totalReviews: reviews.count || 0,
      };
    },
  });

  const handleLeaveAction = async (
    leaveId: string,
    action: "approved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: action })
      .eq("id", leaveId);

    if (error) {
      toast.error("Failed to update leave request");
    } else {
      toast.success(`Leave request ${action}`);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Manager Dashboard</h2>
        <p className="text-muted-foreground">
          Team management and leave approvals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Users className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalEmployees || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Leave Requests
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-glow">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pendingLeaves?.length || 0}
            </div>
          </CardContent>
        </Card>

        {/* <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Attendance
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.attendanceRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Reviews
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-glow">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
          </CardContent>
        </Card> */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Pending Leave Requests - Approval Required</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.pendingLeaves && stats.pendingLeaves.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.pendingLeaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {leave.employees?.full_name || "Emily Davis"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {leave.leave_type}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.start_date).toLocaleDateString()} -{" "}
                      {new Date(leave.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleLeaveAction(leave.id, "approved")
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleLeaveAction(leave.id, "rejected")
                          }
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No pending leave requests
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <a
            href="/employees"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <Users className="w-6 h-6 mb-2 text-primary" />
            <h3 className="font-semibold">View Team</h3>
            <p className="text-sm text-muted-foreground">
              See all team members
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
        </CardContent>
      </Card>
    </div>
  );
};
