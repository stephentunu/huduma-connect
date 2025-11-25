import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Bell, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full p-6 mb-4">
            <Shield className="h-16 w-16" />
          </div>
          <h1 className="text-5xl font-bold text-primary">
            Huduma Centre
          </h1>
          <h2 className="text-3xl font-semibold text-foreground">
            National ID Notification System
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamlining National ID collection through automated SMS and email
            notifications to Kenyan citizens
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-lg px-8"
            >
              Staff Login
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg shadow-lg border-l-4 border-l-primary">
            <div className="bg-primary/10 rounded-full p-3 w-fit mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Easy Registration
            </h3>
            <p className="text-muted-foreground">
              Huduma staff can quickly register applicants with their contact
              details during ID application
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-lg border-l-4 border-l-accent">
            <div className="bg-accent/10 rounded-full p-3 w-fit mb-4">
              <Bell className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Automatic Notifications
            </h3>
            <p className="text-muted-foreground">
              Citizens receive instant SMS or email alerts when their IDs are
              ready for collection
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-lg border-l-4 border-l-status-ready">
            <div className="bg-status-ready/10 rounded-full p-3 w-fit mb-4">
              <CheckCircle2 className="h-8 w-8 text-status-ready" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Real-time Tracking
            </h3>
            <p className="text-muted-foreground">
              Monitor application status, notification delivery, and collection
              statistics in real-time
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-3xl mx-auto bg-primary/5 p-8 rounded-lg border border-primary/20">
          <h3 className="text-2xl font-semibold text-primary mb-4 text-center">
            About the System
          </h3>
          <p className="text-muted-foreground text-center leading-relaxed">
            The National ID Notification System is designed to improve service
            delivery at Huduma Centres across Kenya. By automating
            notifications, we reduce waiting times, improve communication, and
            ensure citizens are promptly informed when their National IDs are
            ready for collection.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} Republic of Kenya - Huduma Centre. All
              rights reserved.
            </p>
            <div className="flex gap-6">
              <Button
                variant="link"
                onClick={() => navigate("/about")}
                className="text-primary-foreground hover:text-accent"
              >
                About Us
              </Button>
              <Button
                variant="link"
                onClick={() => navigate("/contact")}
                className="text-primary-foreground hover:text-accent"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
