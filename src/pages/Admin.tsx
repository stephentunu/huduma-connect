import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Trash2, Users, Search, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StaffMember {
  id: string;
  name: string;
  center_name: string;
  email: string;
  roles: string[];
  created_at?: string;
}

const Admin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    name: "",
    centerName: "",
    role: "staff" as "staff" | "admin",
  });

  useEffect(() => {
    checkAdminAccess();
    fetchStaffMembers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some((r) => r.role === "admin");
    
    if (!hasAdminRole) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
  };

  const fetchStaffMembers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        center_name,
        email,
        created_at
      `);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff members.",
        variant: "destructive",
      });
      return;
    }

    // Fetch roles for each user
    const staffWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id);

        return {
          ...profile,
          email: profile.email || "N/A",
          roles: roles?.map((r) => r.role) || [],
        };
      })
    );

    setStaffMembers(staffWithRoles);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call edge function to create user (requires admin service role)
      const { data, error } = await supabase.functions.invoke("create-staff-user", {
        body: {
          email: newStaff.email,
          password: newStaff.password,
          name: newStaff.name,
          centerName: newStaff.centerName,
          role: newStaff.role,
        },
      });

      if (error) throw error;

      toast({
        title: "Staff member created!",
        description: `${newStaff.name} has been added to the system.`,
      });

      setNewStaff({
        email: "",
        password: "",
        name: "",
        centerName: "",
        role: "staff",
      });

      setIsCreateDialogOpen(false);
      fetchStaffMembers();
    } catch (error: any) {
      toast({
        title: "Failed to create staff member",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("delete-staff-user", {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: "Staff member removed",
        description: "The staff member has been removed from the system.",
      });

      fetchStaffMembers();
    } catch (error: any) {
      toast({
        title: "Failed to remove staff member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.center_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStaff = staffMembers.length;
  const totalAdmins = staffMembers.filter((s) => s.roles.includes("admin")).length;
  const totalRegularStaff = totalStaff - totalAdmins;

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage staff access and permissions
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Staff Member</DialogTitle>
                <DialogDescription>
                  Add authorized personnel to access the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStaff} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-name">Full Name</Label>
                  <Input
                    id="staff-name"
                    type="text"
                    placeholder="John Kamau"
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-center">Huduma Centre</Label>
                  <Input
                    id="staff-center"
                    type="text"
                    placeholder="Nairobi Huduma Centre"
                    value={newStaff.centerName}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, centerName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@huduma.go.ke"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-role">Role</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(value: "staff" | "admin") =>
                      setNewStaff({ ...newStaff, role: value })
                    }
                  >
                    <SelectTrigger id="staff-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Staff Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {totalStaff}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                {totalAdmins}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Regular Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground" />
                {totalRegularStaff}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Members Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>
                  View and manage all staff accounts
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {searchQuery ? "No users found matching your search" : "No staff members yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {staff.email}
                        </div>
                      </TableCell>
                      <TableCell>{staff.center_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {staff.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "default" : "secondary"}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {staff.name} ({staff.email}) from the system.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
