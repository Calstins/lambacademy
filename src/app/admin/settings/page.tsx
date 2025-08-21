// app/admin/settings/page.tsx
import { AdminLayout } from '@/components/admin/admin-layout';
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
  Settings,
  CreditCard,
  Mail,
  Globe,
  Shield,
  Database,
  Save,
} from 'lucide-react';
import { getSystemSettings } from '@/lib/actions/settings';
import { SettingsForm } from '@/components/admin/settings-form';

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">System Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure platform settings, payment integration, and system
            preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-medium">Payment Settings</span>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span>Email Configuration</span>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <Globe className="w-4 h-4 text-gray-600" />
                  <span>Platform Settings</span>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span>Security</span>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <Database className="w-4 h-4 text-gray-600" />
                  <span>Database</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            <SettingsForm initialSettings={settings} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
