import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LeaveManagement = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchEmployeeId();
    fetchLeaveRequests();
  }, [user, userRole]);

  const fetchEmployeeId = async () => {
    if (userRole === "employee") {
      console.log("Fetching employee ID for user:", user?.id);
      const { data, error } = await supabase
        .from("employees")
        .select("id, employee_id, full_name")
        .eq("user_id", user?.id)
        .single();

      console.log("Employee query result:", { data, error });

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching employee data:", error);
        toast({
          title: "Error",
          description: `Failed to fetch employee data: ${error.message}`,
          variant: "destructive",
        });
      } else if (data) {
        console.log("Employee found:", data);
        setEmployeeId(data.id);
      } else {
        console.log("No employee record found, creating one...");
        await createEmployeeProfile();
      }
    }
  };

  const createEmployeeProfile = async () => {
    if (!user?.id || !user?.email) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const generatedEmployeeId = `EMP${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      const today = new Date().toISOString().slice(0, 10);

      console.log("Creating employee profile for user:", user.id);
      console.log("Generated employee ID:", generatedEmployeeId);

      const { data: employeeData, error: employeeInsertError } = await supabase
        .from("employees")
        .insert({
          user_id: user.id,
          employee_id: generatedEmployeeId,
          full_name: user.user_metadata?.full_name || "New Employee",
          email: user.email,
          department: "General",
          position: "Employee",
          join_date: today,
          status: "active",
        })
        .select();

      if (employeeInsertError) {
        console.error(
          "Failed to create employee profile:",
          employeeInsertError
        );
        toast({
          title: "Error",
          description: `Failed to create employee profile: ${employeeInsertError.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Employee profile created successfully:", employeeData);
        if (employeeData && employeeData[0]) {
          setEmployeeId(employeeData[0].id);
          toast({
            title: "Success",
            description: "Employee profile created successfully!",
          });
        }
      }
    } catch (e) {
      console.error("Unexpected error creating employee profile:", e);
      toast({
        title: "Error",
        description:
          "Failed to create employee profile. Please contact your administrator.",
        variant: "destructive",
      });
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("leave_requests")
      .select("*, employees(full_name, employee_id, department)");

    if (userRole === "employee") {
      query = query.eq("employees.user_id", user?.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setLeaveRequests(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast({
        title: "Error",
        description: "Employee ID not found",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("leave_requests")
      .insert([{ ...formData, employee_id: employeeId }]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Leave request submitted!" });
      setIsDialogOpen(false);
      setFormData({
        leave_type: "sick",
        start_date: "",
        end_date: "",
        reason: "",
      });
      fetchLeaveRequests();
    }
  };

  const handleApproval = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status, approved_by: user?.id })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: `Leave request ${status}!` });
      fetchLeaveRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Leave Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage leave requests and approvals
            </p>
          </div>
          {userRole === "employee" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Leave Request</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your leave request
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select
                      value={formData.leave_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, leave_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Request
                  </Button>
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
            {leaveRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {request.employees?.full_name}
                        {getStatusBadge(request.status)}
                      </CardTitle>
                      <CardDescription>
                        {request.employees?.employee_id} •{" "}
                        {request.employees?.department}
                      </CardDescription>
                    </div>
                    {(userRole === "manager" || userRole === "admin") &&
                      request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproval(request.id, "approved")
                            }
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleApproval(request.id, "rejected")
                            }
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Leave Type
                      </p>
                      <p className="font-medium capitalize">
                        {request.leave_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {new Date(request.start_date).toLocaleDateString()} -{" "}
                        {new Date(request.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    {request.reason && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Reason</p>
                        <p className="font-medium">{request.reason}</p>
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

export default LeaveManagement;
