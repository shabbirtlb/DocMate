import { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Globe,
  Bell,
  Moon,
  Sun,
  Monitor,
  Shield,
  Trash2,
  User,
  AlertTriangle,
  Settings2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { exportAllData, importAllData } from '@/utils/localdb';
import { countries } from '@/utils/countries';
import { requestNotificationPermission } from '@/utils/notifications';
import { 
  getNotificationSettings, 
  getExpiryThresholds,
  getSelectedCountry,
  setSelectedCountry,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_EXPIRY_THRESHOLDS,
  type NotificationSettings, 
  type ExpiryThresholds 
} from '@/utils/settings';
import { NotificationSettingsComponent } from '@/components/settings/notification-settings';
import { toast } from 'sonner';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, deleteAccount } = useAuth();
  const [selectedCountry, setSelectedCountryState] = useState('IN');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [expiryThresholds, setExpiryThresholds] = useState<ExpiryThresholds>(DEFAULT_EXPIRY_THRESHOLDS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    setNotificationPermission(Notification.permission);
    
    // Load settings asynchronously
    const loadSettings = async () => {
      try {
        const [notificationSettingsData, expiryThresholdsData, countryData] = await Promise.all([
          getNotificationSettings(),
          getExpiryThresholds(),
          getSelectedCountry()
        ]);
        setNotificationSettings(notificationSettingsData);
        setExpiryThresholds(expiryThresholdsData);
        setSelectedCountryState(countryData);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load some settings');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleCountryChange = async (countryCode: string) => {
    try {
      await setSelectedCountry(countryCode);
      setSelectedCountryState(countryCode);
      toast.success('Country updated successfully');
    } catch (error) {
      console.error('Error updating country:', error);
      toast.error('Failed to update country');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documate-backup-${user?.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      // Basic validation
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid file format');
      }

      await importAllData(data);
      setImportFile(null);
      toast.success('Data imported successfully. Refresh the page to see changes.');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data. Please check the file format.');
    }
  };

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      toast.success('Notifications enabled successfully');
    } else if (permission === 'denied') {
      toast.error('Notifications were denied. You can enable them in your browser settings.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const success = await deleteAccount();
      if (!success) {
        toast.error('Failed to delete account');
        setIsDeletingAccount(false);
      }
      // If successful, the page will reload automatically
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and account
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium mt-1">{user?.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium mt-1">{user?.email}</p>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <p className="text-sm font-medium mt-1">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Country Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            {country.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This affects document suggestions and localized features
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Browser Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permission Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Browser permission for notifications
                    </p>
                  </div>
                  <div>
                    {notificationPermission === 'granted' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Enabled</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRequestNotifications}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  For detailed notification settings, use the Notifications tab above.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          {isLoadingSettings ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading settings...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <NotificationSettingsComponent
              settings={notificationSettings}
              thresholds={expiryThresholds}
              onSettingsChange={setNotificationSettings}
              onThresholdsChange={setExpiryThresholds}
            />
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Export Data</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Download all your data as a JSON file
                  </p>
                  <Button variant="outline" onClick={handleExportData} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>
                
                <div>
                  <Label>Import Data</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Restore data from a previously exported file
                  </p>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <Button
                      variant="outline"
                      onClick={handleImportData}
                      disabled={!importFile}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Local Storage Only
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All your data is stored locally on your device. Nothing is sent to external servers.
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Complete Privacy
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your documents, cards, and subscription data never leave your device.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will permanently delete your account and all associated data including documents, cards, and subscriptions. 
                    This action cannot be undone. Make sure to export your data first if you want to keep it.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeletingAccount}>
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting Account...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          Delete Account
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account and all associated data including documents, cards, and subscriptions. 
                          This action cannot be undone. Make sure to export your data first if you want to keep it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount} 
                          className="bg-destructive text-destructive-foreground"
                          disabled={isDeletingAccount}
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Account'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}