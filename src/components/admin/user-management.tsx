// components/admin/user-management.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  UserPlus,
  Crown,
  GraduationCap,
} from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserDetails,
} from '@/lib/actions/admin';

interface User {
  id: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'STUDENT';
  gender: 'MALE' | 'FEMALE';
  name?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  course?: string;
  country?: string;
  createdAt: string;
  _count?: {
    enrollments: number;
  };
  enrollments?: {
    course: { title: string };
    progressPercent: number;
    completedAt?: string;
  }[];
}

interface UserFormData {
  // Better Auth compatible fields
  name: string; // Full name (Surname first)
  firstName?: string;
  lastName?: string;

  email: string;
  phone: string;
  password: string; // required on create; optional on edit
  role: 'ADMIN' | 'STUDENT';
  gender: 'MALE' | 'FEMALE';

  department?: string;
  course?: string;
  country?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, touchedFields },
  } = useForm<UserFormData>();

  const watchedRole = watch('role');
  const watchedGender = watch('gender');
  const nameValue = watch('name');
  const firstNameValue = watch('firstName');
  const lastNameValue = watch('lastName');

  // ---------- Normalizers (avoid null/undefined type issues) ----------
  function toUser(u: any): User {
    return {
      id: u.id,
      email: u.email,
      phone: u.phone ?? '',
      role: u.role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      gender: u.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
      name: u.name ?? undefined,
      firstName: u.firstName ?? undefined,
      lastName: u.lastName ?? undefined,
      department: u.department ?? undefined,
      course: u.course ?? undefined,
      country: u.country ?? undefined,
      createdAt: (u.createdAt instanceof Date
        ? u.createdAt
        : new Date(u.createdAt)
      ).toISOString(),
      _count: { enrollments: u._count?.enrollments ?? 0 },
    };
  }

  function toDetailedUser(u: any): User {
    const base = toUser(u);
    return {
      ...base,
      enrollments: Array.isArray(u.enrollments)
        ? u.enrollments.map((e: any) => ({
            course: { title: e?.course?.title ?? 'Untitled Course' },
            progressPercent:
              typeof e?.progressPercent === 'number' ? e.progressPercent : 0,
            completedAt: e?.completedAt
              ? (e.completedAt instanceof Date
                  ? e.completedAt
                  : new Date(e.completedAt)
                ).toISOString()
              : undefined,
          }))
        : undefined,
    };
  }

  useEffect(() => {
    const raw = (nameValue || '').trim();
    if (!raw) return;

    const parts = raw.split(/\s+/);
    if (parts.length < 2) return;

    const newLast = parts[0]; // Surname first
    const newFirst = parts.slice(1).join(' '); // Other names

    // Only fill if empty or not manually touched yet
    if (
      (!firstNameValue || firstNameValue.trim() === '') &&
      !touchedFields.firstName
    ) {
      setValue('firstName', newFirst, { shouldDirty: true });
    }
    if (
      (!lastNameValue || lastNameValue.trim() === '') &&
      !touchedFields.lastName
    ) {
      setValue('lastName', newLast, { shouldDirty: true });
    }
  }, [nameValue, firstNameValue, lastNameValue, touchedFields, setValue]);

  // ---------- Data ----------
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      const normalized: User[] = (data as any[]).map(toUser);
      setUsers(normalized);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.name ?? '').toLowerCase().includes(term) ||
          (user.email ?? '').toLowerCase().includes(term) ||
          (user.phone ?? '').includes(searchTerm) ||
          (user.department ?? '').toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  };

  // ---------- Create / Update ----------
  const onSubmit = async (data: UserFormData) => {
    startTransition(async () => {
      const formData = new FormData();

      // Better Auth core fields
      formData.append('name', data.name);
      if (data.firstName) formData.append('firstName', data.firstName);
      if (data.lastName) formData.append('lastName', data.lastName);

      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('role', data.role);
      formData.append('gender', data.gender);

      // Only send password when creating OR if user typed a new one on edit
      if (!editingUser || (data.password && data.password.trim().length > 0)) {
        formData.append('password', data.password);
      }

      if (data.department) formData.append('department', data.department);
      if (data.course) formData.append('course', data.course);
      if (data.country) formData.append('country', data.country);

      const result = editingUser
        ? await updateUser(editingUser.id, formData)
        : await createUser(formData);

      if (result.success) {
        toast.success(editingUser ? 'User updated!' : 'User created!');
        await fetchUsers();
        setDialogOpen(false);
        setEditingUser(null);
        reset();
      } else {
        toast.error(result.error || 'Failed to save user');
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success('User deleted!');
        await fetchUsers();
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    });
  };

  const viewUserDetails = async (userId: string) => {
    try {
      const raw = await getUserDetails(userId);
      if (raw) {
        const normalized = toDetailedUser(raw);
        setViewingUser(normalized);
        setViewDialogOpen(true);
      }
    } catch {
      toast.error('Failed to fetch user details');
    }
  };

  // When editing, prefill all Better Auth name fields.
  const openEditDialog = (user: User) => {
    // Try to derive first/last if they’re missing
    const inferredFirst = user.firstName;
    const inferredLast = user.lastName;
    let name = user.name || '';
    let firstName = inferredFirst || '';
    let lastName = inferredLast || '';

    if (!user.name && (user.firstName || user.lastName)) {
      name = [user.lastName, user.firstName].filter(Boolean).join(' ');
    }
    if (!firstName || !lastName) {
      const parts = (user.name ?? '').trim().split(/\s+/);
      // Registration requires “Surname first”; try to infer conservatively
      if (!lastName && parts.length) lastName = parts[0];
      if (!firstName && parts.length > 1) firstName = parts.slice(1).join(' ');
    }

    setEditingUser(user);
    reset({
      name,
      firstName,
      lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      department: user.department || '',
      course: user.course || '',
      country: user.country || '',
      password: '', // don’t prefill
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    reset({
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'STUDENT',
      gender: 'MALE',
      department: '',
      course: '',
      country: '',
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  // Helper for avatar initials
  const initials = (u: User) => {
    const n = (u.name ?? '').trim();
    if (n) {
      const parts = n.split(/\s+/);
      const i = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
      return i.toUpperCase() || (u.email?.[0]?.toUpperCase() ?? 'U');
    }
    return u.email?.[0]?.toUpperCase() ?? 'U';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">User Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="bg-primary hover:bg-primary-800"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Create New User'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name (Surname first) */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (Surname first) *</Label>
                <Input
                  id="name"
                  placeholder='e.g. "Okafor Caleb"'
                  {...register('name', {
                    required: 'Full name is required',
                    validate: (value) => {
                      const parts = (value || '').trim().split(/\s+/);
                      return (
                        parts.length >= 2 ||
                        'Enter surname, then at least one other name'
                      );
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              {/* First / Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Caleb"
                    {...register('firstName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name (Surname)</Label>
                  <Input
                    id="lastName"
                    placeholder="Okafor"
                    {...register('lastName')}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...register('phone', { required: 'Phone is required' })}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  {...register('password', {
                    required: !editingUser ? 'Password is required' : false,
                    minLength: editingUser
                      ? undefined
                      : { value: 6, message: 'Min 6 characters' },
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={watchedRole || ''}
                  onValueChange={(value) =>
                    setValue('role', value as 'ADMIN' | 'STUDENT')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-sm">Role is required</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select
                  value={watchedGender || ''}
                  onValueChange={(value) =>
                    setValue('gender', value as 'MALE' | 'FEMALE')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-sm">Gender is required</p>
                )}
              </div>

              {/* Department / Course / Country */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  {...register('department')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  placeholder="Enter course"
                  {...register('course')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Enter country"
                  {...register('country')}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-800"
                >
                  {isPending ? 'Saving...' : editingUser ? 'Update' : 'Create'}{' '}
                  User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, phone, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="STUDENT">Students</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No users found matching your criteria.
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        {initials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          {user.name ||
                            `${user.firstName ?? ''} ${
                              user.lastName ?? ''
                            }`.trim() ||
                            user.email}
                        </h3>
                        <Badge
                          variant={
                            user.role === 'ADMIN' ? 'default' : 'secondary'
                          }
                        >
                          {user.role === 'ADMIN' ? (
                            <Crown className="w-3 h-3 mr-1" />
                          ) : (
                            <GraduationCap className="w-3 h-3 mr-1" />
                          )}
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Email: {user.email}</p>
                        <p>Phone: {user.phone}</p>
                        {user.department && (
                          <p>Department: {user.department}</p>
                        )}
                        {user.role === 'STUDENT' && (
                          <p>
                            Enrolled Courses: {user._count?.enrollments || 0}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewUserDetails(user.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      disabled={isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* User Details Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {initials(viewingUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingUser.name ||
                      `${viewingUser.firstName ?? ''} ${
                        viewingUser.lastName ?? ''
                      }`.trim() ||
                      viewingUser.email}
                  </h3>
                  <Badge
                    variant={
                      viewingUser.role === 'ADMIN' ? 'default' : 'secondary'
                    }
                  >
                    {viewingUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Email
                  </Label>
                  <p>{viewingUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Phone
                  </Label>
                  <p>{viewingUser.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Gender
                  </Label>
                  <p>{viewingUser.gender}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Country
                  </Label>
                  <p>{viewingUser.country || 'Not specified'}</p>
                </div>
                {(viewingUser.firstName || viewingUser.lastName) && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        First Name
                      </Label>
                      <p>{viewingUser.firstName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Last Name
                      </Label>
                      <p>{viewingUser.lastName || '-'}</p>
                    </div>
                  </>
                )}
                {viewingUser.department && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Department
                    </Label>
                    <p>{viewingUser.department}</p>
                  </div>
                )}
                {viewingUser.course && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Course
                    </Label>
                    <p>{viewingUser.course}</p>
                  </div>
                )}
              </div>

              {viewingUser.role === 'STUDENT' && viewingUser.enrollments && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-3 block">
                    Course Progress
                  </Label>
                  <div className="space-y-3">
                    {viewingUser.enrollments.map((enrollment, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">
                              {enrollment.course.title}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {enrollment.progressPercent}%
                            </span>
                          </div>
                          <Progress
                            value={enrollment.progressPercent}
                            className="mb-2"
                          />
                          {enrollment.completedAt && (
                            <p className="text-sm text-green-600">
                              ✓ Completed on{' '}
                              {new Date(
                                enrollment.completedAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
