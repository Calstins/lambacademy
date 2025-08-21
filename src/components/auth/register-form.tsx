// components/auth/register-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { AuthLayout } from './auth-layout';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { countries } from '@/lib/countries';
import { registerUser } from '@/lib/actions/auth';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE';
  department?: string;
  course?: string;
  address?: string;
  state?: string;
  country?: string;
}

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const watchPassword = watch('password');
  const watchedGender = watch('gender');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('password', data.password);
      formData.append('gender', data.gender);

      if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
      if (data.department) formData.append('department', data.department);
      if (data.course) formData.append('course', data.course);
      if (data.address) formData.append('address', data.address);
      if (data.state) formData.append('state', data.state);
      if (data.country) formData.append('country', data.country);

      const result = await registerUser(formData);

      if (result.ok) {
        toast.success('Registration successful! Please sign in.');
        router.push('/login');
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    });
  };

  return (
    <AuthLayout
      title="Join LambAcademy"
      subtitle="Create your student account to start learning with us"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name (Surname first) */}
        <div className="space-y-1">
          <Label htmlFor="name" className="text-primary font-medium">
            Full Name (Surname first) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder='e.g. "Okafor Caleb" (Surname first, then other names)'
            className="border-gray-300 focus:border-primary focus:ring-primary"
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
          <p className="text-xs text-gray-500">
            Please type your <span className="font-medium">surname first</span>,
            then your other name(s). Example: <code>Okafor Caleb</code>
          </p>
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-primary font-medium">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="border-gray-300 focus:border-primary focus:ring-primary"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-primary font-medium">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="border-gray-300 focus:border-primary focus:ring-primary"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[+]?[0-9\s\-\(\)]{10,}$/,
                  message: 'Please enter a valid phone number',
                },
              })}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-primary font-medium">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="border-gray-300 focus:border-primary focus:ring-primary pr-12"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label
              htmlFor="confirmPassword"
              className="text-primary font-medium"
            >
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="border-gray-300 focus:border-primary focus:ring-primary pr-12"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === watchPassword || 'Passwords do not match',
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date of Birth */}
          <div className="space-y-1">
            <Label htmlFor="dateOfBirth" className="text-primary font-medium">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              className="border-gray-300 focus:border-primary focus:ring-primary"
              {...register('dateOfBirth')}
            />
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <Label className="text-primary font-medium">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedGender || ''}
              onValueChange={(value) =>
                setValue('gender', value as 'MALE' | 'FEMALE')
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-red-500 text-xs">Gender is required</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department */}
          <div className="space-y-1">
            <Label htmlFor="department" className="text-primary font-medium">
              Department
            </Label>
            <Input
              id="department"
              type="text"
              placeholder="Enter your department"
              className="border-gray-300 focus:border-primary focus:ring-primary"
              {...register('department')}
            />
          </div>

          {/* Course */}
          <div className="space-y-1">
            <Label htmlFor="course" className="text-primary font-medium">
              Course
            </Label>
            <Input
              id="course"
              type="text"
              placeholder="Enter your course"
              className="border-gray-300 focus:border-primary focus:ring-primary"
              {...register('course')}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Label htmlFor="address" className="text-primary font-medium">
            Address
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="Enter your address"
            className="border-gray-300 focus:border-primary focus:ring-primary"
            {...register('address')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* State */}
          <div className="space-y-1">
            <Label htmlFor="state" className="text-primary font-medium">
              State
            </Label>
            <Input
              id="state"
              type="text"
              placeholder="Enter your state"
              className="border-gray-300 focus:border-primary focus:ring-primary"
              {...register('state')}
            />
          </div>

          {/* Country */}
          <div className="space-y-1">
            <Label className="text-primary font-medium">Country</Label>
            <Select onValueChange={(value) => setValue('country', value)}>
              <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary-800 text-white py-3 rounded-lg font-medium transition-colors mt-6"
        >
          {isPending ? 'Creating Account...' : 'Create Account'}
        </Button>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-accent font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
