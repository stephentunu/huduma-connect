import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface LocationState {
  applicantName: string;
  applicationId: string;
  documentNumber?: string;
  nationalIdNumber?: string;
  documentType?: string;
  email: string;
}

const IDUploadSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    // If no state data, redirect to upload page
    if (!state?.applicantName) {
      navigate('/id-upload');
    }
  }, [state, navigate]);

  if (!state) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Document Upload Successful!</CardTitle>
            <CardDescription>
              The document has been uploaded and notification sent successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Applicant Name</p>
                  <p className="font-semibold">{state.applicantName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application ID</p>
                  <p className="font-semibold">{state.applicationId}</p>
                </div>
                {state.documentType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Document Type</p>
                    <p className="font-semibold">{state.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Document Number</p>
                  <p className="font-semibold text-lg">{state.documentNumber || state.nationalIdNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Sent To</p>
                  <p className="font-semibold">{state.email}</p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Status Updated:</strong> The applicant's status has been changed to "Ready for Collection"
                </p>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Email Notification:</strong> An email has been sent to {state.email} with collection instructions
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => navigate('/id-upload')}
                className="flex-1"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Another Document
              </Button>
              <Button
                onClick={() => navigate('/applicants')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                View All Applicants
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IDUploadSuccess;
