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
import { Shield, UserPlus, Trash2, Users, Search, Mail, UserCog, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface StaffMember {
  id: string;
  name: string;
  center_name: string;
  email: string;
  roles: string[];
  created_at?: string;
  created_by?: string | null;
  creator_name?: string | null;
}

const Admin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"role" | "centre" | null>(null);
  const [bulkRole, setBulkRole] = useState<"staff" | "admin">("staff");
  const [bulkCentre, setBulkCentre] = useState("");
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
        created_at,
        created_by,
        creator:created_by(name)
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
          creator_name: profile.creator?.name || null,
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

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredStaff.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredStaff.map((s) => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      const deletePromises = Array.from(selectedUsers).map((userId) =>
        supabase.functions.invoke("delete-staff-user", {
          body: { userId },
        })
      );

      await Promise.all(deletePromises);

      toast({
        title: "Users removed",
        description: `${selectedUsers.size} staff member(s) have been removed.`,
      });

      setSelectedUsers(new Set());
      fetchStaffMembers();
    } catch (error: any) {
      toast({
        title: "Failed to remove users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRoleUpdate = async () => {
    setIsLoading(true);
    try {
      const updatePromises = Array.from(selectedUsers).map(async (userId) => {
        // Delete existing roles
        await supabase.from("user_roles").delete().eq("user_id", userId);
        // Insert new role
        return supabase.from("user_roles").insert({
          user_id: userId,
          role: bulkRole,
        });
      });

      await Promise.all(updatePromises);

      toast({
        title: "Roles updated",
        description: `${selectedUsers.size} user(s) updated to ${bulkRole} role.`,
      });

      setSelectedUsers(new Set());
      setIsBulkDialogOpen(false);
      fetchStaffMembers();
    } catch (error: any) {
      toast({
        title: "Failed to update roles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCentreUpdate = async () => {
    setIsLoading(true);
    try {
      const updatePromises = Array.from(selectedUsers).map((userId) =>
        supabase.from("profiles").update({ center_name: bulkCentre }).eq("id", userId)
      );

      await Promise.all(updatePromises);

      toast({
        title: "Centres updated",
        description: `${selectedUsers.size} user(s) reassigned to ${bulkCentre}.`,
      });

      setSelectedUsers(new Set());
      setIsBulkDialogOpen(false);
      setBulkCentre("");
      fetchStaffMembers();
    } catch (error: any) {
      toast({
        title: "Failed to update centres",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openBulkActionDialog = (action: "role" | "centre") => {
    setBulkAction(action);
    setIsBulkDialogOpen(true);
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

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <Card className="border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedUsers.size} selected</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUsers(new Set())}
                  >
                    Clear selection
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBulkActionDialog("role")}
                    className="gap-2"
                  >
                    <UserCog className="h-4 w-4" />
                    Assign Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBulkActionDialog("centre")}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Reassign Centre
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedUsers.size} users?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the selected staff members from the system.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === filteredStaff.length && filteredStaff.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchQuery ? "No users found matching your search" : "No staff members yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(staff.id)}
                          onCheckedChange={() => toggleUserSelection(staff.id)}
                        />
                      </TableCell>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {staff.creator_name || "System"}
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

        {/* Bulk Action Dialog */}
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkAction === "role" ? "Assign Role" : "Reassign Centre"}
              </DialogTitle>
              <DialogDescription>
                {bulkAction === "role"
                  ? `Update role for ${selectedUsers.size} selected user(s)`
                  : `Reassign ${selectedUsers.size} selected user(s) to a new centre`}
              </DialogDescription>
            </DialogHeader>
            {bulkAction === "role" ? (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-role">New Role</Label>
                  <Select
                    value={bulkRole}
                    onValueChange={(value: "staff" | "admin") => setBulkRole(value)}
                  >
                    <SelectTrigger id="bulk-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleBulkRoleUpdate}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Updating..." : "Update Roles"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-centre">New Centre</Label>
                  <Input
                    id="bulk-centre"
                    type="text"
                    placeholder="Nairobi Huduma Centre"
                    value={bulkCentre}
                    onChange={(e) => setBulkCentre(e.target.value)}
                    required
                  />
                </div>
                <Button
                  onClick={handleBulkCentreUpdate}
                  disabled={isLoading || !bulkCentre}
                  className="w-full"
                >
                  {isLoading ? "Updating..." : "Update Centres"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
