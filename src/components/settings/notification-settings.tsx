import { useState } from 'react';
import { Bell, Clock, Calendar, AlertTriangle, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getNotificationSettings, saveNotificationSettings, getExpiryThresholds, saveExpiryThresholds, resetToDefaults, type NotificationSettings, type ExpiryThresholds } from '@/utils/settings';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  thresholds: ExpiryThresholds;
  onSettingsChange: (settings: NotificationSettings) => void;
  onThresholdsChange: (thresholds: ExpiryThresholds) => void;
}

export function NotificationSettingsComponent({
  settings,
  thresholds,
  onSettingsChange,
  onThresholdsChange
}: NotificationSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localThresholds, setLocalThresholds] = useState(thresholds);

  const handleSave = () => {
    saveNotificationSettings(localSettings);
    saveExpiryThresholds(localThresholds);
    onSettingsChange(localSettings);
    onThresholdsChange(localThresholds);
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    resetToDefaults();
    const defaultSettings = getNotificationSettings();
    const defaultThresholds = getExpiryThresholds();
    setLocalSettings(defaultSettings);
    setLocalThresholds(defaultThresholds);
    onSettingsChange(defaultSettings);
    onThresholdsChange(defaultThresholds);
    toast.success('Settings reset to defaults');
  };

  const addNotificationTime = () => {
    const newTime = "09:00";
    setLocalSettings(prev => ({
      ...prev,
      notificationTimes: [...prev.notificationTimes, newTime]
    }));
  };

  const removeNotificationTime = (index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      notificationTimes: prev.notificationTimes.filter((_, i) => i !== index)
    }));
  };

  const updateNotificationTime = (index: number, time: string) => {
    setLocalSettings(prev => ({
      ...prev,
      notificationTimes: prev.notificationTimes.map((t, i) => i === index ? time : t)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about expiring documents, cards, and subscriptions
              </p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {localSettings.enabled && (
            <>
              <Separator />
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Notification Frequency</Label>
                  <Select
                    value={localSettings.frequency}
                    onValueChange={(value) => 
                      setLocalSettings(prev => ({ ...prev, frequency: value as typeof prev.frequency }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={localSettings.urgentOnly}
                    onCheckedChange={(checked) => 
                      setLocalSettings(prev => ({ ...prev, urgentOnly: checked }))
                    }
                  />
                  <div>
                    <Label>Urgent Only</Label>
                    <p className="text-xs text-muted-foreground">
                      Only notify for urgent items
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Notification Times</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Set specific times to receive notifications
                </p>
                <div className="space-y-2">
                  {localSettings.notificationTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updateNotificationTime(index, e.target.value)}
                        className="w-32"
                      />
                      {localSettings.notificationTimes.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeNotificationTime(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addNotificationTime}
                    className="mt-2"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Add Time
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expiry Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Expiry Thresholds
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize when items are considered "expiring soon" or "urgent"
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Documents */}
          <div>
            <Label className="text-base font-medium">Documents</Label>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div>
                <Label htmlFor="doc-expiring">Expiring Soon (days)</Label>
                <Input
                  id="doc-expiring"
                  type="number"
                  min="1"
                  max="365"
                  value={localThresholds.documents.expiringSoonDays}
                  onChange={(e) => 
                    setLocalThresholds(prev => ({
                      ...prev,
                      documents: {
                        ...prev.documents,
                        expiringSoonDays: parseInt(e.target.value) || 30
                      }
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Show as "expiring" when within this many days
                </p>
              </div>
              <div>
                <Label htmlFor="doc-urgent">Urgent (days)</Label>
                <Input
                  id="doc-urgent"
                  type="number"
                  min="1"
                  max="30"
                  value={localThresholds.documents.urgentDays}
                  onChange={(e) => 
                    setLocalThresholds(prev => ({
                      ...prev,
                      documents: {
                        ...prev.documents,
                        urgentDays: parseInt(e.target.value) || 7
                      }
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Show as "urgent" when within this many days
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cards */}
          <div>
            <Label className="text-base font-medium">Cards</Label>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div>
                <Label htmlFor="card-expiring">Expiring Soon (days)</Label>
                <Input
                  id="card-expiring"
                  type="number"
                  min="1"
                  max="365"
                  value={localThresholds.cards.expiringSoonDays}
                  onChange={(e) => 
                    setLocalThresholds(prev => ({
                      ...prev,
                      cards: {
                        ...prev.cards,
                        expiringSoonDays: parseInt(e.target.value) || 90
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="card-urgent">Urgent (days)</Label>
                <Input
                  id="card-urgent"
                  type="number"
                  min="1"
                  max="90"
                  value={localThresholds.cards.urgentDays}
                  onChange={(e) => 
                    setLocalThresholds(prev => ({
                      ...prev,
                      cards: {
                        ...prev.cards,
                        urgentDays: parseInt(e.target.value) || 30
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Subscriptions */}
          <div>
            <Label className="text-base font-medium">Subscriptions</Label>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div>
                <Label htmlFor="sub-expiring">Expiring Soon (days)</Label>
                <Input
                  id="sub-expiring"
                  type="number"
                  min="1"
                  max="30"
                  value={localThresholds.subscriptions.expiringSoonDays}
                  onChange={(e) => 
                    setLocalThresholds(prev => ({
                      ...prev,
                      subscriptions: {
                        ...prev.subscriptions,
                        expiringSoonDays: parseInt(e.target.value) || 7
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="sub-urgent">Urgent (days)</Label>
                <Input
                  id="sub-urgent"
                  type="number"
                  min="1"
                  max="7"
                  value={localThresholds.subscriptions.urgentDays}
                  onChange={(e) => 
                    setLocalThresholds(prev => ({
                      ...prev,
                      subscriptions: {
                        ...prev.subscriptions,
                        urgentDays: parseInt(e.target.value) || 3
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Status Examples
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Active</Badge>
                <span className="text-blue-700 dark:text-blue-300">
                  More than {localThresholds.documents.expiringSoonDays} days remaining
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Expiring</Badge>
                <span className="text-blue-700 dark:text-blue-300">
                  {localThresholds.documents.urgentDays + 1}-{localThresholds.documents.expiringSoonDays} days remaining
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Urgent</Badge>
                <span className="text-blue-700 dark:text-blue-300">
                  1-{localThresholds.documents.urgentDays} days remaining
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Expired</Badge>
                <span className="text-blue-700 dark:text-blue-300">
                  Past expiry date
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1">
          <Settings2 className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}