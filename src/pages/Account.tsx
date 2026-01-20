/**
 * Account page - user profile and settings management
 */

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { User, Shield, LogOut, Settings } from 'lucide-react';

export default function Account() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and account preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your basic account information and role details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-primary p-6 rounded-full">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-medium text-foreground">Name</span>
                <span className="text-muted-foreground">{user?.name}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-medium text-foreground">Mobile Number</span>
                <span className="text-muted-foreground">{user?.mobile_number}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-medium text-foreground">Role</span>
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Password Security</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your password is currently managed through the Firebase Authentication system.
                For security reasons, password changes must be handled by your system administrator.
              </p>
              <Button variant="outline" disabled>
                <Settings className="w-4 h-4 mr-2" />
                Change Password (Contact Admin)
              </Button>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Session Management</h4>
              <p className="text-sm text-muted-foreground mb-3">
                You can sign out from your current session at any time. This will require you to
                sign in again to access the admin panel.
              </p>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
            <CardDescription>
              Details about the Samvedana Foundation SMM Admin Panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="font-medium text-foreground">Version</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="font-medium text-foreground">Last Updated</span>
              <span className="text-muted-foreground">December 2024</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-foreground">Environment</span>
              <Badge variant="outline">Production</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}