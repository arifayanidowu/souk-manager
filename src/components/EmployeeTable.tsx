"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBreakpoints } from "@/hooks/useMediaQuery";
import { getEmploymentStatusColor } from "@/lib/utils";
import { Employee } from "@/types/employee";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

interface PaginationData {
  employees: Employee[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export default function EmployeeTable() {
  const { isMobile } = useBreakpoints();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // In production, connect to the same domain as the app
    const socketUrl =
      process.env.NODE_ENV === "production"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    console.log("Connecting to WebSocket at:", socketUrl);
    console.log("Current window.location.origin:", window.location.origin);
    console.log("NODE_ENV:", process.env.NODE_ENV);

    const newSocket = io(socketUrl);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    newSocket.on("employeeData", (data: PaginationData) => {
      setEmployees(data.employees);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalEmployees(data.total);
    });

    newSocket.on("pageData", (data: PaginationData) => {
      setEmployees(data.employees);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalEmployees(data.total);
      setIsLoading(false);
    });

    newSocket.on(
      "newEmployee",
      (data: { employee: Employee; total: number; totalPages: number }) => {
        if (currentPage === 1) {
          setEmployees((prev) => [data.employee, ...prev.slice(0, -1)]);
        }
        setTotalEmployees(data.total);
        setTotalPages(data.totalPages);
      }
    );

    newSocket.on(
      "employeesAdded",
      (data: {
        added: number;
        total: number;
        totalPages: number;
        message: string;
      }) => {
        console.log("Employees added event received:", data);

        // Always update the total count, regardless of whether employees were added
        setTotalEmployees(data.total);
        setTotalPages(data.totalPages);

        if (data.added > 0) {
          // Always refresh the current page to show new data
          newSocket.emit("requestPage", currentPage);
        } else {
          // If no employees were added (e.g., max limit reached),
          // still refresh to ensure we have the latest data
          newSocket.emit("requestPage", currentPage);
        }
      }
    );

    // Listen for sync event to ensure correct count
    newSocket.on(
      "syncEmployeeCount",
      (data: { total: number; totalPages: number }) => {
        console.log("Sync employee count received:", data);
        setTotalEmployees(data.total);
        setTotalPages(data.totalPages);
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleDeleteEmployee = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      setTotalEmployees((prev) => prev - 1);
    }
  };

  const handleAddEmployees = (count: number = 5) => {
    console.log("handleAddEmployees called with count:", count);
    if (socket) {
      console.log("Emitting addEmployees event");
      socket.emit("addEmployees", count);
    } else {
      console.log("Socket is null, cannot emit event");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && socket) {
      setIsLoading(true);
      socket.emit("requestPage", newPage);
    }
  };

  if (!isClient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={isMobile ? "text-[12px]" : "text-sm"}>
              Employee Directory
              <Badge variant="secondary">{totalEmployees} employees</Badge>
            </CardTitle>
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("Add 5 More button clicked");
                      handleAddEmployees(5);
                    }}
                    disabled={!isConnected || totalEmployees >= 20}
                  >
                    Add 5 More
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("Add 10 More button clicked");
                      handleAddEmployees(10);
                    }}
                    disabled={!isConnected || totalEmployees >= 20}
                  >
                    Add 10 More
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConnected ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm">
                        {isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("Add 5 More button clicked");
                      handleAddEmployees(5);
                    }}
                    disabled={!isConnected || totalEmployees >= 20}
                  >
                    Add 5 More
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("Add 10 More button clicked");
                      handleAddEmployees(10);
                    }}
                    disabled={!isConnected || totalEmployees >= 20}
                  >
                    Add 10 More
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-[12px] text-muted-foreground">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading page {currentPage}...
                    </TableCell>
                  </TableRow>
                ) : employees?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {isConnected
                        ? "No employees found"
                        : "Connecting to server..."}
                    </TableCell>
                  </TableRow>
                ) : (
                  (employees || []).map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee.birthday}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Team {employee.team}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {employee.email}
                      </TableCell>
                      <TableCell>{employee.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge
                          className={getEmploymentStatusColor(
                            employee.employmentStatus
                          )}
                        >
                          {employee.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {employee.notes}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Employee
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {employee.name}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteEmployee(employee.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
