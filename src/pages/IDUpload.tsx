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
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch applicants with status 'registered'
  const { data: applicants, isLoading } = useQuery({
    queryKey: ['registered-applicants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('id, application_id, full_name, status')
        .eq('status', 'registered')
        .order('registration_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedApplicantId || !nationalIdNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('send-id-notification', {
        body: {
          applicant_id: selectedApplicantId,
          national_id_number: nationalIdNumber,
        },
        headers: {
          'x-user-id': user?.id,
        },
      });

      if (error) throw error;

      // Get applicant details for success page
      const applicant = applicants?.find(a => a.id === selectedApplicantId);

      toast.success("ID uploaded and notification sent successfully!");
      
      // Navigate to success page with details
      navigate('/id-upload-success', {
        state: {
          applicantName: applicant?.full_name,
          applicationId: applicant?.application_id,
          nationalIdNumber: nationalIdNumber,
          email: data?.email || 'N/A',
        }
      });
      
      setSelectedApplicantId("");
      setNationalIdNumber("");
    } catch (error: any) {
      console.error('Error uploading ID:', error);
      toast.error(error.message || "Failed to upload ID and send notification");
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
            <h1 className="text-3xl font-bold text-foreground">Upload National ID</h1>
            <p className="text-muted-foreground">Upload ID number and notify applicant</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ID Upload Form</CardTitle>
            <CardDescription>
              Select an applicant and enter their National ID number. The system will automatically 
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
                      {applicant.application_id} - {applicant.full_name}
                    </option>
                  ))}
                </select>
                {!isLoading && applicants?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No registered applicants found. All applicants already have IDs ready.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="national_id">National ID Number *</Label>
                <Input
                  id="national_id"
                  type="text"
                  placeholder="Enter National ID number"
                  value={nationalIdNumber}
                  onChange={(e) => setNationalIdNumber(e.target.value)}
                  required
                  maxLength={20}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the complete National ID number
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedApplicantId || !nationalIdNumber}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Upload ID & Notify"}
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
