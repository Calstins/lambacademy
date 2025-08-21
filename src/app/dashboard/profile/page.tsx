// app/dashboard/profile/page.tsx
import { StudentLayout } from '@/components/student/student-layout';
import { ProfileForm } from '@/components/student/profile-form';
import { getUserProfile } from '@/lib/actions/student';

export default async function StudentProfilePage() {
  const userProfile = await getUserProfile();

  const normalizedUser = {
    ...userProfile,
    // -> "2025-08-20" style or undefined
    dateOfBirth:
      userProfile.dateOfBirth instanceof Date
        ? userProfile.dateOfBirth.toISOString().slice(0, 10)
        : undefined,
    department: userProfile.department ?? undefined,
    course: userProfile.course ?? undefined,
    address: userProfile.address ?? undefined,
    state: userProfile.state ?? undefined,
    country: userProfile.country ?? undefined,
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and account preferences.
          </p>
        </div>

        <ProfileForm user={normalizedUser} />
      </div>
    </StudentLayout>
  );
}
