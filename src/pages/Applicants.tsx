import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, CheckCircle } from "lucide-react";
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
import DashboardLayout from "@/components/DashboardLayout";

interface Applicant {
  id: string;
  application_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  status: string;
  registration_date: string;
  document_type: string;
}

const Applicants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchApplicants();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchApplicants = async () => {
    try {
      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .order("registration_date", { ascending: false });

      if (error) throw error;
      setApplicants(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applicants",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCollected = async (applicantId: string, applicantName: string) => {
    try {
      const { error } = await supabase
        .from("applicants")
        .update({ status: "collected" })
        .eq("id", applicantId);

      if (error) throw error;

      toast({
        title: "Document marked as collected",
        description: `${applicantName}'s document has been marked as collected.`,
      });

      fetchApplicants();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      registered: { label: "Registered", className: "bg-status-registered text-white" },
      processing: { label: "Processing", className: "bg-status-processing text-primary" },
      ready: { label: "Ready", className: "bg-status-ready text-white" },
      collected: { label: "Collected", className: "bg-status-collected text-white" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-muted",
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-primary">All Applicants</h1>
            <p className="text-muted-foreground mt-1">
              View and manage document applicants
            </p>
          </div>
          <Button
            onClick={() => navigate("/register")}
            className="bg-primary hover:bg-primary/90"
          >
            Register New Applicant
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : applicants.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No applicants registered yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applicants.map((applicant) => (
              <Card key={applicant.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-primary">
                        {applicant.full_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Application ID: {applicant.application_id}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {applicant.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    {getStatusBadge(applicant.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{applicant.phone}</span>
                    </div>
                    {applicant.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{applicant.email}</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Registered on:{" "}
                      {new Date(applicant.registration_date).toLocaleDateString(
                        "en-KE",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                    {applicant.status === "ready" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="mt-4 w-full" variant="default">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Collected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Collection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure {applicant.full_name} has collected their {applicant.document_type.replace(/_/g, ' ')}? This action will mark the document as collected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => markAsCollected(applicant.id, applicant.full_name)}
                            >
                              Confirm Collection
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Applicants;
