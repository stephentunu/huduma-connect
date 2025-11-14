import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: "",
    fullName: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("applicants").insert({
        application_id: formData.applicationId,
        full_name: formData.fullName,
        email: formData.email || null,
        phone: formData.phone,
        status: "registered",
        registered_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Applicant registered successfully!",
        description: `${formData.fullName} has been added to the system.`,
      });

      setFormData({
        applicationId: "",
        fullName: "",
        email: "",
        phone: "",
      });

      navigate("/applicants");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground rounded-full p-3">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary">
                  Register New Applicant
                </CardTitle>
                <CardDescription className="mt-1">
                  Enter applicant details for National ID registration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="applicationId" className="text-base">
                  Application ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicationId"
                  type="text"
                  placeholder="e.g., APP-2025-001234"
                  value={formData.applicationId}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationId: e.target.value })
                  }
                  required
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Unique application reference number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-base">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g., Jane Wanjiru Mwangi"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +254712345678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +254)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  Email Address (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., jane.mwangi@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="text-base"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? "Registering..." : "Register Applicant"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Register;
