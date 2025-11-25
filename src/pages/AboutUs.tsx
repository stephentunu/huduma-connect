import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Target, Eye, Users, Award, Heart, ArrowLeft } from "lucide-react";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg border-b-4 border-accent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-accent text-accent-foreground rounded-full p-2">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Huduma Centre</h1>
              <p className="text-xs text-primary-foreground/80">
                National ID Notification System
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">About Us</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Transforming public service delivery through technology and innovation for all Kenyan citizens
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-l-4 border-l-primary shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary text-2xl">
                  <Target className="h-8 w-8" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To revolutionize government service delivery by providing efficient, accessible, 
                  and inclusive digital solutions that empower every Kenyan citizen. We are committed 
                  to reducing bureaucracy, eliminating unnecessary delays, and ensuring that critical 
                  documents reach their rightful owners in a timely and dignified manner.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary text-2xl">
                  <Eye className="h-8 w-8" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To be the leading example of digital transformation in public service across Africa, 
                  where every citizen, regardless of location, ability, or socioeconomic status, has 
                  seamless access to government services. We envision a future where technology bridges 
                  gaps and creates opportunities for all.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* About the System */}
          <Card className="mb-12 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary text-2xl">About the Notification System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The National ID Notification System represents a significant milestone in Kenya's digital 
                transformation journey. Developed in partnership with the Huduma Centre, this platform 
                addresses a critical challenge faced by millions of Kenyan citizens: the uncertainty and 
                inconvenience of not knowing when their government documents are ready for collection.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Through automated SMS and email notifications, we ensure that every applicant is promptly 
                informed when their National ID, passport, visa, or other government documents are available. 
                This simple yet powerful innovation reduces waiting times, eliminates unnecessary trips to 
                Huduma Centres, and respects the valuable time of our citizens.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The system is designed with inclusivity at its core, supporting multiple document types, 
                various communication channels, and real-time tracking capabilities. Our platform serves 
                Huduma Centres across all 47 counties, ensuring equitable service delivery to urban and 
                rural communities alike.
              </p>
            </CardContent>
          </Card>

          {/* Core Values */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-primary text-center mb-8">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-3 text-primary">
                    <div className="bg-primary/10 rounded-full p-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    Inclusivity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    We serve all Kenyans equally, regardless of background, location, ability, or 
                    socioeconomic status. Our services are accessible and designed for everyone.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-accent">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-3 text-primary">
                    <div className="bg-accent/10 rounded-full p-4">
                      <Award className="h-8 w-8 text-accent" />
                    </div>
                    Excellence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    We maintain the highest standards in service delivery, continuously improving 
                    our systems and processes to exceed citizen expectations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-status-ready">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center gap-3 text-primary">
                    <div className="bg-status-ready/10 rounded-full p-4">
                      <Heart className="h-8 w-8 text-status-ready" />
                    </div>
                    Integrity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    We operate with transparency, accountability, and respect for data privacy, 
                    ensuring secure handling of all citizen information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Impact Statistics */}
          <Card className="bg-primary/5 border-primary/20 mb-12">
            <CardContent className="pt-8">
              <h3 className="text-2xl font-bold text-primary text-center mb-8">Our Impact</h3>
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">47</div>
                  <div className="text-muted-foreground">Counties Served</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">100+</div>
                  <div className="text-muted-foreground">Huduma Centres</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-muted-foreground">System Availability</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">8+</div>
                  <div className="text-muted-foreground">Document Types</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commitment Statement */}
          <Card className="shadow-lg">
            <CardContent className="pt-8">
              <h3 className="text-2xl font-bold text-primary text-center mb-4">
                Our Commitment to Accessibility
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed max-w-3xl mx-auto">
                We are dedicated to ensuring that our services are accessible to all citizens, including 
                persons with disabilities, elderly citizens, and those in remote areas. Our staff are 
                trained in inclusive service delivery, and we continuously work to remove barriers and 
                improve accessibility. We believe that every Kenyan deserves dignified, efficient, and 
                respectful service.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Republic of Kenya - Huduma Centre. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
