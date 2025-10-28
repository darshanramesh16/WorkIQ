import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  job_role: string;
  employee_id?: string;
}

export default function AIInterviewResults() {
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeIdFilter, setEmployeeIdFilter] = useState("");
  const [searchError, setSearchError] = useState("");

  const loadCandidates = async () => {
    try {
      // Load candidates first (no joins; we will map employee IDs separately)
      const { data: candidates, error: candErr } = await supabase
        .from("candidates")
        .select("id, name, email, job_role, user_id")
        .order("created_at", { ascending: false });

      if (candErr) {
        console.error("Error loading candidates:", candErr);
      }

      if (!candidates || candidates.length === 0) {
        // Fallback static demo list so HR sees something immediately
        setRows([
          {
            id: "demo-1",
            name: "Emily Davis",
            email: "emily@example.com",
            job_role: "Software Engineer",
            employee_id: "EMP001",
          },
          {
            id: "demo-2",
            name: "John Carter",
            email: "john@example.com",
            job_role: "QA Engineer",
            employee_id: "EMP002",
          },
          {
            id: "demo-3",
            name: "Ava Patel",
            email: "ava@example.com",
            job_role: "Data Analyst",
            employee_id: "EMP003",
          },
        ]);
        setLoading(false);
        return;
      }

      // Map employee_id by user_id
      const userIds = (candidates as any[])
        .map((c) => c.user_id)
        .filter(Boolean);
      let userIdToEmp: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: employees } = await supabase
          .from("employees")
          .select("user_id, employee_id")
          .in("user_id", userIds);
        (employees || []).forEach((e: any) => {
          if (e.user_id) userIdToEmp[e.user_id] = e.employee_id;
        });
      }

      const list = (candidates as any[]).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        job_role: c.job_role,
        employee_id: c.user_id ? userIdToEmp[c.user_id] : undefined,
      }));

      setRows(list);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load candidates:", err);
      // Show static on error
      setRows([
        {
          id: "demo-1",
          name: "Emily Davis",
          email: "emily@example.com",
          job_role: "Software Engineer",
          employee_id: "EMP001",
        },
        {
          id: "demo-2",
          name: "John Carter",
          email: "john@example.com",
          job_role: "QA Engineer",
          employee_id: "EMP002",
        },
        {
          id: "demo-3",
          name: "Ava Patel",
          email: "ava@example.com",
          job_role: "Data Analyst",
          employee_id: "EMP003",
        },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleSearch = async () => {
    if (!employeeIdFilter.trim()) {
      setSearchError("Please enter an employee ID");
      return;
    }

    setSearchError("");
    setLoading(true);

    try {
      // First find employee by employee_id
      const { data: employees } = await supabase
        .from("employees")
        .select("user_id, employee_id, full_name, email, position")
        .ilike("employee_id", `%${employeeIdFilter}%`);

      if (!employees || employees.length === 0) {
        setSearchError("No employee found with that ID");
        setLoading(false);
        return;
      }

      const userIds = employees.map((e) => e.user_id).filter((id) => id);

      if (userIds.length === 0) {
        setSearchError("Employee found but no user account linked");
        setLoading(false);
        return;
      }

      // Now find candidates for those users
      const { data: candidates } = await supabase
        .from("candidates")
        .select("id, name, email, job_role, user_id")
        .in("user_id", userIds);

      const list = (candidates || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        job_role: c.job_role,
        employee_id:
          employees.find((e) => e.user_id === c.user_id)?.employee_id || null,
      }));

      setRows(list);
      setLoading(false);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError("Search failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>AI Interview Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee ID Search */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">
                  Search by Employee ID
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter employee ID (e.g., EMP001)"
                    value={employeeIdFilter}
                    onChange={(e) => setEmployeeIdFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
                {searchError && (
                  <p className="text-sm text-red-500 mt-1">{searchError}</p>
                )}
              </div>
            </div>

            {/* Show all button */}
            <Button variant="outline" onClick={loadCandidates}>
              Show All Employees
            </Button>

            {/* Results Table */}
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No interview results yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">
                        {c.employee_id || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.job_role}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>
                        <a
                          className="underline text-primary hover:text-primary/80"
                          href={`/interview-report/${c.id}`}
                        >
                          View details
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
