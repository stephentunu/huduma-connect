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
import { Shield, UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StaffMember {
  id: string;
  name: string;
  center_name: string;
  email?: string;
  roles: string[];
}

const Admin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
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
        center_name
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

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage staff access and permissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New Staff Member
            </CardTitle>
            <CardDescription>
              Add authorized personnel to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Staff Member"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              Manage existing staff accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffMembers.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {staff.center_name}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {staff.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={role === "admin" ? "default" : "secondary"}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {staff.name} from the system.
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
