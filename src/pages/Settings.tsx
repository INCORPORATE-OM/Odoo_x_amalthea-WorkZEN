import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const user = getCurrentUser();

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input id="profile-name" defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" defaultValue={user?.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" type="tel" defaultValue={user?.phone} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-dept">Department</Label>
                <Input id="profile-dept" defaultValue={user?.department} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-designation">Designation</Label>
                <Input id="profile-designation" defaultValue={user?.designation} disabled />
              </div>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button onClick={handleSave}>Update Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Preferences</CardTitle>
            <CardDescription>Configure organization settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="UTC+5:30 (India Standard Time)" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-days">Work Days</Label>
              <Input id="work-days" defaultValue="Monday - Friday" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-hours">Work Hours</Label>
              <Input id="work-hours" defaultValue="9:00 AM - 6:00 PM" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Balance</CardTitle>
            <CardDescription>Your available leave days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sick Leave</span>
                <span className="font-semibold">8 days</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vacation Leave</span>
                <span className="font-semibold">15 days</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Personal Leave</span>
                <span className="font-semibold">5 days</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">Total Available</span>
                <span className="text-xl font-bold text-primary">28 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
