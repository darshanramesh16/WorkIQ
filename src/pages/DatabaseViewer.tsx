import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Search, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Define all available tables from your Supabase schema
const AVAILABLE_TABLES = [
  "candidates",
  "interview_sessions",
  "hr_questions",
  "notifications",
  "announcements",
  "attendance",
  "candidate_resumes",
  "employee_resumes",
  "employees",
  "hr_collaboration_notes",
  "internal_job_recommendations",
  "interview_questions",
  "interviews",
  "job_postings",
  "learning_recommendations",
  "leave_requests",
  "performance_reviews",
  "profiles",
  "recruitment_metrics",
  "resume_screenings",
  "sentiment_tracking",
  "user_roles",
];

export default function DatabaseViewer() {
  const [selectedTable, setSelectedTable] = useState<string>("employees");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch table data
  const {
    data: tableData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["table-data", selectedTable, currentPage, itemsPerPage],
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from(selectedTable)
        .select("*", { count: "exact" })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      if (error) {
        toast.error(`Error fetching data: ${error.message}`);
        return { data: [], count: 0 };
      }

      return { data: data || [], count: count || 0 };
    },
    enabled: !!selectedTable,
  });

  // Get table schema information
  const { data: tableInfo } = useQuery({
    queryKey: ["table-info", selectedTable],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable, column_default")
        .eq("table_name", selectedTable)
        .eq("table_schema", "public");

      if (error) {
        console.error("Error fetching table info:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!selectedTable,
  });

  // Filter data based on search term
  const filteredData =
    tableData?.data?.filter((row: any) => {
      if (!searchTerm) return true;

      return Object.values(row).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  const totalPages = Math.ceil((tableData?.count || 0) / itemsPerPage);

  // Handle sensitive data filtering
  const getDisplayValue = (key: string, value: any) => {
    const sensitiveFields = ["password", "token", "secret", "key", "auth"];
    const isSensitive = sensitiveFields.some((field) =>
      key.toLowerCase().includes(field)
    );

    if (isSensitive && !showSensitiveData) {
      return "••••••••";
    }

    if (value === null) return "null";
    if (typeof value === "object") return JSON.stringify(value);
    return value?.toString() || "";
  };

  const getColumnHeaders = () => {
    if (!tableData?.data?.length) return [];
    return Object.keys(tableData.data[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Database Viewer
              </h1>
              <p className="text-gray-600">
                Browse and explore your Supabase tables
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
            >
              {showSensitiveData ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showSensitiveData ? "Hide Sensitive" : "Show Sensitive"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Table
                </label>
                <Select
                  value={selectedTable}
                  onValueChange={(value) => {
                    setSelectedTable(value);
                    setCurrentPage(1);
                    setSearchTerm("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TABLES.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Data
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search in table data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Table Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Table Name:</span>
                  <Badge variant="secondary">{selectedTable}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Records:</span>
                  <span className="text-sm font-medium">
                    {tableData?.count || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Columns:</span>
                  <span className="text-sm font-medium">
                    {tableInfo?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Filtered Records:
                  </span>
                  <span className="text-sm font-medium">
                    {filteredData.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Column Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tableInfo?.map((column: any) => (
                  <div key={column.column_name} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{column.column_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {column.data_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {column.is_nullable === "YES" ? "Nullable" : "Not Null"}
                      {column.column_default &&
                        ` • Default: ${column.column_default}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Page:</span>
                  <span className="text-sm font-medium">
                    {currentPage} of {totalPages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items per Page:</span>
                  <span className="text-sm font-medium">{itemsPerPage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Showing:</span>
                  <span className="text-sm font-medium">
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      tableData?.count || 0
                    )}{" "}
                    -
                    {Math.min(
                      currentPage * itemsPerPage,
                      tableData?.count || 0
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Table Data: {selectedTable}</span>
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading data...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? "No data matches your search criteria"
                  : "No data available in this table"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getColumnHeaders().map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row: any, index: number) => (
                      <TableRow key={index}>
                        {getColumnHeaders().map((header) => (
                          <TableCell key={header} className="max-w-xs truncate">
                            <div
                              className="truncate"
                              title={getDisplayValue(header, row[header])}
                            >
                              {getDisplayValue(header, row[header])}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
