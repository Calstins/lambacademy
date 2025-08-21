// components/admin/settings-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Mail,
  Globe,
  Shield,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { updateSystemSettings } from '@/lib/actions/settings';

interface SystemSettings {
  // Payment Settings
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  paystackTestMode?: boolean;

  // Email Settings
  emailProvider?: string;
  emailApiKey?: string;
  emailFromAddress?: string;
  emailFromName?: string;

  // Platform Settings
  platformName?: string;
  platformDescription?: string;
  platformUrl?: string;
  supportEmail?: string;
  supportPhone?: string;

  // Security Settings
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  passwordMinLength?: number;
  requireEmailVerification?: boolean;

  // Certificate Settings
  certificateTemplate?: string;
  certificateSignature?: string;
  certificateRequireCompletion?: boolean;
  certificateRequireMinScore?: boolean;
  certificateMinScore?: number;
}

interface SettingsFormProps {
  initialSettings: SystemSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showSecretKeys, setShowSecretKeys] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SystemSettings>({
    defaultValues: initialSettings,
  });

  const onSubmit = async (data: SystemSettings) => {
    startTransition(async () => {
      const result = await updateSystemSettings(data);
      if (result.success) {
        toast.success('Settings updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    });
  };

  const requireMinScore = watch('certificateRequireMinScore');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paystackPublicKey">Paystack Public Key</Label>
              <Input
                id="paystackPublicKey"
                placeholder="pk_live_..."
                {...register('paystackPublicKey')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paystackSecretKey">Paystack Secret Key</Label>
              <div className="relative">
                <Input
                  id="paystackSecretKey"
                  type={showSecretKeys ? 'text' : 'password'}
                  placeholder="sk_live_..."
                  {...register('paystackSecretKey')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecretKeys(!showSecretKeys)}
                >
                  {showSecretKeys ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="paystackTestMode" {...register('paystackTestMode')} />
            <Label htmlFor="paystackTestMode">
              Enable Test Mode (Use test keys for development)
            </Label>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Ensure you&apos;re using the correct keys
              for your environment. Test keys should only be used in
              development.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Certificate Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificateTemplate">
              Certificate Template URL
            </Label>
            <Input
              id="certificateTemplate"
              placeholder="https://cloudinary.com/your-certificate-template"
              {...register('certificateTemplate')}
            />
            <p className="text-sm text-gray-500">
              Upload your certificate template to Uploadthing and paste the URL
              here
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificateSignature">Certificate Signature</Label>
            <Input
              id="certificateSignature"
              placeholder="Dr. John Doe, Director"
              {...register('certificateSignature')}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Certificate Requirements</h4>

            <div className="flex items-center space-x-2">
              <Switch
                id="certificateRequireCompletion"
                {...register('certificateRequireCompletion')}
              />
              <Label htmlFor="certificateRequireCompletion">
                Require 100% course completion for certificate
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="certificateRequireMinScore"
                {...register('certificateRequireMinScore')}
              />
              <Label htmlFor="certificateRequireMinScore">
                Require minimum score from assignments/quizzes
              </Label>
            </div>

            {requireMinScore && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="certificateMinScore">Minimum Score (%)</Label>
                <Input
                  id="certificateMinScore"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="70"
                  {...register('certificateMinScore', {
                    min: { value: 0, message: 'Score cannot be negative' },
                    max: { value: 100, message: 'Score cannot exceed 100%' },
                  })}
                />
                {errors.certificateMinScore && (
                  <p className="text-red-500 text-sm">
                    {errors.certificateMinScore.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailProvider">Email Provider</Label>
              <Select defaultValue="resend">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailApiKey">API Key</Label>
              <Input
                id="emailApiKey"
                type={showSecretKeys ? 'text' : 'password'}
                placeholder="re_..."
                {...register('emailApiKey')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailFromAddress">From Email Address</Label>
              <Input
                id="emailFromAddress"
                type="email"
                placeholder="noreply@lambacademy.ng"
                {...register('emailFromAddress')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailFromName">From Name</Label>
              <Input
                id="emailFromName"
                placeholder="LambAcademy"
                {...register('emailFromName')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                placeholder="LambAcademy Learning Portal"
                {...register('platformName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformUrl">Platform URL</Label>
              <Input
                id="platformUrl"
                placeholder="https://app.lambacademy.ng"
                {...register('platformUrl')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platformDescription">Platform Description</Label>
            <Textarea
              id="platformDescription"
              placeholder="Transform your future through quality online education..."
              {...register('platformDescription')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                placeholder="support@lambacademy.ng"
                {...register('supportEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                placeholder="+234 XXX XXX XXXX"
                {...register('supportPhone')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="1"
                max="168"
                placeholder="168"
                {...register('sessionTimeout')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="3"
                max="10"
                placeholder="5"
                {...register('maxLoginAttempts')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Min Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                min="6"
                max="20"
                placeholder="8"
                {...register('passwordMinLength')}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="requireEmailVerification"
              {...register('requireEmailVerification')}
            />
            <Label htmlFor="requireEmailVerification">
              Require email verification for new accounts
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary-800"
        >
          <Save className="w-4 h-4 mr-2" />
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}
