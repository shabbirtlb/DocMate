import { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowRight,
  X,
  Bell,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSubscriptions, saveSubscription, deleteSubscription } from '@/utils/localdb';
import { generateUUID } from '@/utils/uuid';
import { getSubscriptionStatus, getStatusBadgeVariant, getStatusText } from '@/utils/status-helpers';
import { getExpiryThresholds } from '@/utils/settings';
import { toast } from 'sonner';
import { format, addMonths, addYears, addWeeks, differenceInDays, subDays } from 'date-fns';
import type { Subscription } from '@/utils/localdb';

const billingCycles = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'weekly', label: 'Weekly' }
] as const;

const popularServices = [
  'Netflix',
  'Amazon Prime',
  'Spotify',
  'Apple Music',
  'Disney+',
  'Hulu',
  'YouTube Premium',
  'Adobe Creative Cloud',
  'Microsoft 365',
  'Google Workspace',
  'Dropbox',
  'Zoom',
  'Figma',
  'GitHub',
  'Notion',
  'Other'
];

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' }
];

export function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [notificationInfo, setNotificationInfo] = useState<{
    notificationStartDate: Date;
    urgentStartDate: Date;
    notificationDays: number;
    urgentDays: number;
  } | null>(null);
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    planName: '',
    billingCycle: 'monthly' as const,
    renewalDate: '',
    autoRenewal: true,
    managementUrl: '',
    cost: '',
    currency: 'USD',
    customNotificationDays: '',
    enableCustomNotification: false
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, selectedCycle, selectedStatus]);

  useEffect(() => {
    const updateNotificationInfo = async () => {
      if (!newSubscription.renewalDate) {
        setNotificationInfo(null);
        return;
      }

      try {
        const thresholds = await getExpiryThresholds();
        const renewalDate = new Date(newSubscription.renewalDate);
        const notificationDays = newSubscription.enableCustomNotification 
          ? parseInt(newSubscription.customNotificationDays) || thresholds.subscriptions.expiringSoonDays
          : thresholds.subscriptions.expiringSoonDays;
        
        const notificationStartDate = subDays(renewalDate, notificationDays);
        const urgentStartDate = subDays(renewalDate, thresholds.subscriptions.urgentDays);
        
        setNotificationInfo({
          notificationStartDate,
          urgentStartDate,
          notificationDays,
          urgentDays: thresholds.subscriptions.urgentDays
        });
      } catch (error) {
        console.error('Error getting notification info:', error);
        setNotificationInfo(null);
      }
    };

    updateNotificationInfo();
  }, [newSubscription.renewalDate, newSubscription.enableCustomNotification, newSubscription.customNotificationDays]);

  const loadSubscriptions = async () => {
    try {
      const subsData = await getSubscriptions();
      setSubscriptions(subsData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const categorizeSubscriptions = () => {
    const subscriptionsWithStatus = subscriptions.map(sub => ({
      ...sub,
      status: getSubscriptionStatus(sub.renewalDate)
    }));

    return {
      active: subscriptionsWithStatus.filter(sub => sub.status === 'active'),
      expiring: subscriptionsWithStatus.filter(sub => sub.status === 'expiring'),
      urgent: subscriptionsWithStatus.filter(sub => sub.status === 'urgent'),
      expired: subscriptionsWithStatus.filter(sub => sub.status === 'expired')
    };
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCycle !== 'all') {
      filtered = filtered.filter(sub => sub.billingCycle === selectedCycle);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(sub => {
        const status = getSubscriptionStatus(sub.renewalDate);
        return status === selectedStatus || (selectedStatus === 'expiring' && status === 'urgent');
      });
    }

    setFilteredSubscriptions(filtered);
  };

  const calculateNextRenewalDate = (billingCycle: string, currentDate: string = new Date().toISOString()) => {
    const date = new Date(currentDate);
    switch (billingCycle) {
      case 'weekly':
        return addWeeks(date, 1).toISOString().split('T')[0];
      case 'monthly':
        return addMonths(date, 1).toISOString().split('T')[0];
      case 'yearly':
        return addYears(date, 1).toISOString().split('T')[0];
      default:
        return addMonths(date, 1).toISOString().split('T')[0];
    }
  };

  const handleAddSubscription = async () => {
    if (!newSubscription.name || !newSubscription.planName || !newSubscription.renewalDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const subscription: Subscription = {
      id: generateUUID(),
      name: newSubscription.name,
      planName: newSubscription.planName,
      billingCycle: newSubscription.billingCycle,
      renewalDate: newSubscription.renewalDate,
      autoRenewal: newSubscription.autoRenewal,
      managementUrl: newSubscription.managementUrl || undefined,
      cost: newSubscription.cost ? parseFloat(newSubscription.cost) : undefined,
      currency: newSubscription.currency,
      createdAt: new Date().toISOString()
    };

    try {
      await saveSubscription(subscription);
      setSubscriptions(prev => [subscription, ...prev]);
      setNewSubscription({
        name: '',
        planName: '',
        billingCycle: 'monthly',
        renewalDate: '',
        autoRenewal: true,
        managementUrl: '',
        cost: '',
        currency: 'USD',
        customNotificationDays: '',
        enableCustomNotification: false
      });
      setIsAddDialogOpen(false);
      toast.success('Subscription added successfully');
    } catch (error) {
      console.error('Error adding subscription:', error);
      toast.error('Failed to add subscription');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await deleteSubscription(id);
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      toast.success('Subscription deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const getTotalMonthlyCost = () => {
    return subscriptions.reduce((total, sub) => {
      if (!sub.cost) return total;
      
      let monthlyCost = sub.cost;
      if (sub.billingCycle === 'yearly') {
        monthlyCost = sub.cost / 12;
      } else if (sub.billingCycle === 'weekly') {
        monthlyCost = sub.cost * 4.33; // Average weeks per month
      }
      
      return total + monthlyCost;
    }, 0);
  };

  const renderStatusModal = () => {
    const categorized = categorizeSubscriptions();

    return (
      <div className="space-y-4">
        <Tabs defaultValue="urgent" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="urgent" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Urgent ({categorized.urgent.length})
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Expiring ({categorized.expiring.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Expired ({categorized.expired.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active ({categorized.active.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urgent" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.urgent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No urgent subscriptions
              </p>
            ) : (
              categorized.urgent.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    <p className="text-xs text-muted-foreground">{sub.planName} • {sub.billingCycle}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {differenceInDays(new Date(sub.renewalDate), new Date())} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expiring" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subscriptions expiring soon
              </p>
            ) : (
              categorized.expiring.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    <p className="text-xs text-muted-foreground">{sub.planName} • {sub.billingCycle}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {differenceInDays(new Date(sub.renewalDate), new Date())} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expired.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expired subscriptions
              </p>
            ) : (
              categorized.expired.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    <p className="text-xs text-muted-foreground">{sub.planName} • {sub.billingCycle}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Expired
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.active.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active subscriptions
              </p>
            ) : (
              categorized.active.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    <p className="text-xs text-muted-foreground">{sub.planName} • {sub.billingCycle}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const categorized = categorizeSubscriptions();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Track your recurring subscriptions and renewals
          </p>
          {subscriptions.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Estimated monthly cost: ${getTotalMonthlyCost().toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Status Overview
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="serviceName">Service Name *</Label>
                  <Select
                    value={newSubscription.name}
                    onValueChange={(value) => setNewSubscription(prev => ({ ...prev, name: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularServices.map(service => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newSubscription.name === 'Other' && (
                    <Input
                      className="mt-2"
                      placeholder="Enter service name"
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="planName">Plan Name *</Label>
                  <Input
                    id="planName"
                    value={newSubscription.planName}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, planName: e.target.value }))}
                    placeholder="e.g., Premium, Pro, Family"
                  />
                </div>
                <div>
                  <Label htmlFor="billingCycle">Billing Cycle *</Label>
                  <Select
                    value={newSubscription.billingCycle}
                    onValueChange={(value) => setNewSubscription(prev => ({ ...prev, billingCycle: value as typeof prev.billingCycle }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {billingCycles.map(cycle => (
                        <SelectItem key={cycle.value} value={cycle.value}>
                          {cycle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="renewalDate">Next Renewal Date *</Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={newSubscription.renewalDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, renewalDate: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs"
                    onClick={() => {
                      const nextDate = calculateNextRenewalDate(newSubscription.billingCycle);
                      setNewSubscription(prev => ({ ...prev, renewalDate: nextDate }));
                    }}
                  >
                    Set to next {newSubscription.billingCycle} renewal
                  </Button>
                </div>

                {/* Notification Settings */}
                {newSubscription.renewalDate && (
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950 rounded-md">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Notification Settings
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="customNotification"
                        checked={newSubscription.enableCustomNotification}
                        onCheckedChange={(checked) => 
                          setNewSubscription(prev => ({ ...prev, enableCustomNotification: checked }))
                        }
                      />
                      <Label htmlFor="customNotification" className="text-sm">
                        Custom notification timing
                      </Label>
                    </div>

                    {newSubscription.enableCustomNotification && (
                      <div>
                        <Label htmlFor="notificationDays" className="text-sm">
                          Notify me (days before renewal)
                        </Label>
                        <Input
                          id="notificationDays"
                          type="number"
                          min="1"
                          max="30"
                          value={newSubscription.customNotificationDays}
                          onChange={(e) => setNewSubscription(prev => ({ 
                            ...prev, 
                            customNotificationDays: e.target.value 
                          }))}
                          placeholder="7"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {notificationInfo && (
                      <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Notifications start: {format(notificationInfo.notificationStartDate, 'MMM d, yyyy')} 
                            ({notificationInfo.notificationDays} days before)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          <span>
                            Urgent alerts start: {format(notificationInfo.urgentStartDate, 'MMM d, yyyy')} 
                            ({notificationInfo.urgentDays} days before)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cost">Cost (optional)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={newSubscription.cost}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="9.99"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newSubscription.currency}
                      onValueChange={(value) => setNewSubscription(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="managementUrl">Management URL (optional)</Label>
                  <Input
                    id="managementUrl"
                    value={newSubscription.managementUrl}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, managementUrl: e.target.value }))}
                    placeholder="https://service.com/manage"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoRenewal"
                    checked={newSubscription.autoRenewal}
                    onCheckedChange={(checked) => setNewSubscription(prev => ({ ...prev, autoRenewal: checked }))}
                  />
                  <Label htmlFor="autoRenewal">Auto-renewal enabled</Label>
                </div>
                <Button onClick={handleAddSubscription} className="w-full">
                  Add Subscription
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Smart Suggestions - Compact and Clickable */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-purple-500" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {subscriptions.length === 0 ? (
              <>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Track All Services</p>
                      <p className="text-xs text-muted-foreground">Avoid unexpected charges</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Monitor Costs</p>
                      <p className="text-xs text-muted-foreground">Track monthly spending</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Quick Management</p>
                      <p className="text-xs text-muted-foreground">Easy cancel/modify</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Plus className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Add First Service</p>
                      <p className="text-xs text-muted-foreground">Start tracking</p>
                    </div>
                  </div>
                </Button>
              </>
            ) : (
              <>
                {(categorized.expiring.length > 0 || categorized.urgent.length > 0) && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3 text-left border-red-200 dark:border-red-800"
                    onClick={() => setSelectedStatus('expiring')}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-red-800 dark:text-red-200">Renewals Due</p>
                        <p className="text-xs text-red-700 dark:text-red-300">{categorized.expiring.length + categorized.urgent.length} renewing soon</p>
                      </div>
                    </div>
                  </Button>
                )}
                {categorized.expired.length > 0 && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3 text-left border-orange-200 dark:border-orange-800"
                    onClick={() => setSelectedStatus('expired')}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-orange-800 dark:text-orange-200">Expired Services</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">{categorized.expired.length} need attention</p>
                      </div>
                    </div>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Add More Services</p>
                      <p className="text-xs text-muted-foreground">Track all subscriptions</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">View Status</p>
                      <p className="text-xs text-muted-foreground">Check all services</p>
                    </div>
                  </div>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('active')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.active.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('expiring')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewing Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.expiring.length}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('urgent')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.urgent.length}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('expired')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.expired.length}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCycle} onValueChange={setSelectedCycle}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cycles</SelectItem>
            {billingCycles.map(cycle => (
              <SelectItem key={cycle.value} value={cycle.value}>
                {cycle.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No subscriptions found</p>
            <p className="text-muted-foreground mb-4">
              {subscriptions.length === 0
                ? "Start by adding your first subscription"
                : "Try adjusting your search or filters"}
            </p>
            {subscriptions.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubscriptions.map((subscription) => {
            const status = getSubscriptionStatus(subscription.renewalDate);
            return (
              <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subscription.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{subscription.planName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {status === 'urgent' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {status === 'expiring' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                      {status === 'expired' && <XCircle className="h-5 w-5 text-red-500" />}
                      {status === 'active' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {subscription.autoRenewal ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {subscription.billingCycle.charAt(0).toUpperCase() + subscription.billingCycle.slice(1)}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {getStatusText(status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={status === 'expired' || status === 'urgent' || status === 'expiring' ? 'text-red-600 font-medium' : ''}>
                        Renews: {format(new Date(subscription.renewalDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {subscription.cost && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {currencies.find(c => c.code === subscription.currency)?.symbol || '$'}
                          {subscription.cost.toFixed(2)} / {subscription.billingCycle.slice(0, -2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Auto-renewal: {subscription.autoRenewal ? 'Enabled' : 'Disabled'}
                    </div>
                    
                    {subscription.managementUrl && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(subscription.managementUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Manage Subscription
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Added {format(new Date(subscription.createdAt), 'MMM d, yyyy')}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{subscription.name} - {subscription.planName}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSubscription(subscription.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Subscriptions Status Overview
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStatusModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {renderStatusModal()}
        </DialogContent>
      </Dialog>
    </div>
  );
}