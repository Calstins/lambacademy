// components/student/certificate-grid.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  issuedAt: string;
  imageUrl: string;
  course: {
    title: string;
    description: string;
  };
}

interface CertificateGridProps {
  certificates: Certificate[];
}

export function CertificateGrid({ certificates }: CertificateGridProps) {
  const downloadCertificate = (certificate: Certificate) => {
    // Create a temporary link to download the certificate
    const link = document.createElement('a');
    link.href = certificate.imageUrl;
    link.download = `${certificate.course.title}_certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareCertificate = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${certificate.course.title} Certificate`,
          text: `I've completed the ${certificate.course.title} course!`,
          url: certificate.imageUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(certificate.imageUrl);
        toast.success('Certificate link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-500 mb-4">
            <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">No certificates earned yet</h3>
            <p className="text-sm">
              Complete courses to earn certificates and showcase your
              achievements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((certificate) => (
          <Card key={certificate.id} className="overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-br from-primary via-primary-800 to-primary-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <Award className="w-16 h-16 mx-auto mb-4 text-accent" />
                  <h3 className="text-xl font-bold mb-2">
                    Certificate of Completion
                  </h3>
                  <div className="w-16 h-px bg-accent mx-auto mb-2" />
                  <p className="text-sm opacity-90">
                    {certificate.course.title}
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-accent" />
              <div className="absolute top-4 right-4 w-8 h-8 border-2 border-accent" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-accent" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-accent" />
            </div>

            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">
                {certificate.course.title}
              </CardTitle>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                Issued {new Date(certificate.issuedAt).toLocaleDateString()}
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex space-x-2">
                <Button
                  onClick={() => downloadCertificate(certificate)}
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary-800"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={() => shareCertificate(certificate)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2 text-accent" />
            Achievement Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">
                {certificates.length}
              </div>
              <div className="text-sm text-gray-600">Certificates Earned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">
                {certificates.length}
              </div>
              <div className="text-sm text-gray-600">Courses Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">
                {new Date().getFullYear()}
              </div>
              <div className="text-sm text-gray-600">Year Started</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
