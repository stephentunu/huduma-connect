import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";

const IDUpload = () => {
  const navigate = useNavigate();
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch applicants with status 'registered'
  const { data: applicants, isLoading } = useQuery({
    queryKey: ['registered-applicants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('id, application_id, full_name, status, document_type')
        .eq('status', 'registered')
        .order('registration_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedApplicantId || !documentNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get applicant details
      const applicant = applicants?.find(a => a.id === selectedApplicantId);
      
      const { data, error } = await supabase.functions.invoke('send-id-notification', {
        body: {
          applicant_id: selectedApplicantId,
          document_number: documentNumber,
          document_type: applicant?.document_type,
        },
        headers: {
          'x-user-id': user?.id,
        },
      });

      if (error) throw error;

      toast.success("Document uploaded and notification sent successfully!");
      
      // Navigate to success page with details
      navigate('/id-upload-success', {
        state: {
          applicantName: applicant?.full_name,
          applicationId: applicant?.application_id,
          documentNumber: documentNumber,
          documentType: applicant?.document_type,
          email: data?.email || 'N/A',
        }
      });
      
      setSelectedApplicantId("");
      setDocumentNumber("");
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || "Failed to upload document and send notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/applicants')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upload Document</h1>
            <p className="text-muted-foreground">Upload document number and notify applicant</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Upload Form</CardTitle>
            <CardDescription>
              Select an applicant and enter their document number. The system will automatically 
              update their status and send an email notification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="applicant">Select Applicant *</Label>
                <select
                  id="applicant"
                  value={selectedApplicantId}
                  onChange={(e) => setSelectedApplicantId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isLoading}
                >
                  <option value="">
                    {isLoading ? "Loading applicants..." : "Select an applicant"}
                  </option>
                  {applicants?.map((applicant) => (
                    <option key={applicant.id} value={applicant.id}>
                      {applicant.application_id} - {applicant.full_name} ({applicant.document_type.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
                {!isLoading && applicants?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No registered applicants found. All applicants already have documents ready.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document_number">
                  Document Number *
                  {selectedApplicantId && applicants && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({applicants.find(a => a.id === selectedApplicantId)?.document_type.replace(/_/g, ' ')})
                    </span>
                  )}
                </Label>
                <Input
                  id="document_number"
                  type="text"
                  placeholder="Enter document number"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  required
                  maxLength={30}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the complete document number
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedApplicantId || !documentNumber}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Upload Document & Notify"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/applicants')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IDUpload;
