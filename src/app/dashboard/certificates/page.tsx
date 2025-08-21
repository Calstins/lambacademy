// app/dashboard/certificates/page.tsx
import { StudentLayout } from '@/components/student/student-layout';
import { CertificateGrid } from '@/components/student/certificate-grid';
import { getStudentCertificates } from '@/lib/actions/student';

export default async function StudentCertificatesPage() {
  const certificatesRaw = await getStudentCertificates();
  const certificates = certificatesRaw.map((cert) => ({
    ...cert,
    issuedAt:
      cert.issuedAt instanceof Date
        ? cert.issuedAt.toISOString()
        : cert.issuedAt,
  }));

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Certificates</h1>
          <p className="text-gray-600 mt-2">
            Your earned certificates from completed courses.
          </p>
        </div>

        <CertificateGrid certificates={certificates} />
      </div>
    </StudentLayout>
  );
}
