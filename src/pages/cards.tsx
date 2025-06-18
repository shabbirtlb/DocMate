import { useState, useEffect } from 'react';
import {
  Plus,
  CreditCard,
  Calendar,
  Building,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  ExternalLink,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { getCards, saveCard, deleteCard } from '@/utils/localdb';
import { generateUUID } from '@/utils/uuid';
import { getCardStatus, getStatusBadgeVariant, getStatusText } from '@/utils/status-helpers';
import { getExpiryThresholds } from '@/utils/settings';
import { toast } from 'sonner';
import { format, differenceInDays, subDays } from 'date-fns';
import type { Card as CardType } from '@/utils/localdb';

const cardTypes = ['debit', 'credit'] as const;

const popularBanks = [
  'American Express',
  'Bank of America',
  'Chase',
  'Citibank',
  'Capital One',
  'Wells Fargo',
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Other'
];

export function Cards() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [notificationInfo, setNotificationInfo] = useState<{
    notificationStartDate: Date;
    urgentStartDate: Date;
    notificationDays: number;
    urgentDays: number;
  } | null>(null);
  const [newCard, setNewCard] = useState({
    name: '',
    lastFourDigits: '',
    bank: '',
    expiryDate: '',
    type: 'debit' as const,
    supportContact: '',
    customNotificationDays: '',
    enableCustomNotification: false
  });

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    filterCards();
  }, [cards, searchQuery, selectedType, selectedStatus]);

  useEffect(() => {
    const updateNotificationInfo = async () => {
      if (!newCard.expiryDate) {
        setNotificationInfo(null);
        return;
      }

      try {
        const thresholds = await getExpiryThresholds();
        const expiryDate = new Date(newCard.expiryDate);
        const notificationDays = newCard.enableCustomNotification 
          ? parseInt(newCard.customNotificationDays) || thresholds.cards.expiringSoonDays
          : thresholds.cards.expiringSoonDays;
        
        const notificationStartDate = subDays(expiryDate, notificationDays);
        const urgentStartDate = subDays(expiryDate, thresholds.cards.urgentDays);
        
        setNotificationInfo({
          notificationStartDate,
          urgentStartDate,
          notificationDays,
          urgentDays: thresholds.cards.urgentDays
        });
      } catch (error) {
        console.error('Error getting notification info:', error);
        setNotificationInfo(null);
      }
    };

    updateNotificationInfo();
  }, [newCard.expiryDate, newCard.enableCustomNotification, newCard.customNotificationDays]);

  const loadCards = async () => {
    try {
      const cardsData = await getCards();
      setCards(cardsData);
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const categorizeCards = () => {
    const cardsWithStatus = cards.map(card => ({
      ...card,
      status: getCardStatus(card.expiryDate)
    }));

    return {
      active: cardsWithStatus.filter(card => card.status === 'active'),
      expiring: cardsWithStatus.filter(card => card.status === 'expiring'),
      urgent: cardsWithStatus.filter(card => card.status === 'urgent'),
      expired: cardsWithStatus.filter(card => card.status === 'expired')
    };
  };

  const filterCards = () => {
    let filtered = [...cards];

    if (searchQuery) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.lastFourDigits.includes(searchQuery)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(card => card.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(card => {
        const status = getCardStatus(card.expiryDate);
        return status === selectedStatus || (selectedStatus === 'expiring' && status === 'urgent');
      });
    }

    setFilteredCards(filtered);
  };

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.lastFourDigits || !newCard.bank || !newCard.expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^\d{4}$/.test(newCard.lastFourDigits)) {
      toast.error('Last four digits must be exactly 4 numbers');
      return;
    }

    const card: CardType = {
      id: generateUUID(),
      name: newCard.name,
      lastFourDigits: newCard.lastFourDigits,
      bank: newCard.bank,
      expiryDate: newCard.expiryDate,
      type: newCard.type,
      supportContact: newCard.supportContact || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await saveCard(card);
      setCards(prev => [card, ...prev]);
      setNewCard({
        name: '',
        lastFourDigits: '',
        bank: '',
        expiryDate: '',
        type: 'debit',
        supportContact: '',
        customNotificationDays: '',
        enableCustomNotification: false
      });
      setIsAddDialogOpen(false);
      toast.success('Card added successfully');
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card');
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await deleteCard(id);
      setCards(prev => prev.filter(card => card.id !== id));
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  const getMinExpiryDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const renderStatusModal = () => {
    const categorized = categorizeCards();

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
                No urgent cards
              </p>
            ) : (
              categorized.urgent.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{card.name}</span>
                    <p className="text-xs text-muted-foreground">****{card.lastFourDigits} • {card.bank}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {differenceInDays(new Date(card.expiryDate), new Date())} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expiring" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No cards expiring soon
              </p>
            ) : (
              categorized.expiring.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{card.name}</span>
                    <p className="text-xs text-muted-foreground">****{card.lastFourDigits} • {card.bank}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {differenceInDays(new Date(card.expiryDate), new Date())} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expired.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expired cards
              </p>
            ) : (
              categorized.expired.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{card.name}</span>
                    <p className="text-xs text-muted-foreground">****{card.lastFourDigits} • {card.bank}</p>
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
                No active cards
              </p>
            ) : (
              categorized.active.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{card.name}</span>
                    <p className="text-xs text-muted-foreground">****{card.lastFourDigits} • {card.bank}</p>
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

  const categorized = categorizeCards();

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
          <h1 className="text-3xl font-bold tracking-tight">Cards</h1>
          <p className="text-muted-foreground">
            Manage your debit and credit cards
          </p>
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
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Card Name *</Label>
                  <Input
                    id="cardName"
                    value={newCard.name}
                    onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Primary Credit Card, Savings Debit"
                  />
                </div>
                <div>
                  <Label htmlFor="cardType">Card Type *</Label>
                  <Select
                    value={newCard.type}
                    onValueChange={(value) => setNewCard(prev => ({ ...prev, type: value as typeof newCard.type }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit Card</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lastFour">Last Four Digits *</Label>
                  <Input
                    id="lastFour"
                    value={newCard.lastFourDigits}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewCard(prev => ({ ...prev, lastFourDigits: value }));
                    }}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="bank">Bank *</Label>
                  <Select
                    value={newCard.bank}
                    onValueChange={(value) => setNewCard(prev => ({ ...prev, bank: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularBanks.map(bank => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newCard.bank === 'Other' && (
                    <Input
                      className="mt-2"
                      placeholder="Enter bank name"
                      onChange={(e) => setNewCard(prev => ({ ...prev, bank: e.target.value }))}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date *</Label>
                  <Input
                    id="expiry"
                    type="month"
                    value={newCard.expiryDate}
                    min={getMinExpiryDate().slice(0, 7)}
                    onChange={(e) => setNewCard(prev => ({ ...prev, expiryDate: e.target.value + '-01' }))}
                  />
                </div>

                {/* Notification Settings */}
                {newCard.expiryDate && (
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-md">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                        Notification Settings
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="customNotification"
                        checked={newCard.enableCustomNotification}
                        onCheckedChange={(checked) => 
                          setNewCard(prev => ({ ...prev, enableCustomNotification: checked }))
                        }
                      />
                      <Label htmlFor="customNotification" className="text-sm">
                        Custom notification timing
                      </Label>
                    </div>

                    {newCard.enableCustomNotification && (
                      <div>
                        <Label htmlFor="notificationDays" className="text-sm">
                          Notify me (days before expiry)
                        </Label>
                        <Input
                          id="notificationDays"
                          type="number"
                          min="1"
                          max="365"
                          value={newCard.customNotificationDays}
                          onChange={(e) => setNewCard(prev => ({ 
                            ...prev, 
                            customNotificationDays: e.target.value 
                          }))}
                          placeholder="90"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {notificationInfo && (
                      <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
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

                <div>
                  <Label htmlFor="support">Support Contact (optional)</Label>
                  <Input
                    id="support"
                    value={newCard.supportContact}
                    onChange={(e) => setNewCard(prev => ({ ...prev, supportContact: e.target.value }))}
                    placeholder="https://bank.com/support or phone number"
                  />
                </div>
                <Button onClick={handleAddCard} className="w-full">
                  Add Card
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Smart Suggestions - Compact and Clickable */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-green-500" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {cards.length === 0 ? (
              <>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Track All Cards</p>
                      <p className="text-xs text-muted-foreground">Never miss expiry dates</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Add Support Info</p>
                      <p className="text-xs text-muted-foreground">Quick access when needed</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Set Reminders</p>
                      <p className="text-xs text-muted-foreground">3 months before expiry</p>
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
                      <p className="font-medium text-sm">Add First Card</p>
                      <p className="text-xs text-muted-foreground">Start organizing</p>
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
                        <p className="font-medium text-sm text-red-800 dark:text-red-200">Cards Expiring</p>
                        <p className="text-xs text-red-700 dark:text-red-300">{categorized.expiring.length + categorized.urgent.length} need renewal</p>
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
                        <p className="font-medium text-sm text-orange-800 dark:text-orange-200">Expired Cards</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">{categorized.expired.length} need replacement</p>
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
                    <Plus className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Add More Cards</p>
                      <p className="text-xs text-muted-foreground">Track all payment cards</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">View Status</p>
                      <p className="text-xs text-muted-foreground">Check all cards</p>
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
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.active.length}</div>
            <p className="text-xs text-muted-foreground">Valid and usable</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('expiring')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
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
            <p className="text-xs text-muted-foreground">Needs replacement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="debit">Debit Cards</SelectItem>
            <SelectItem value="credit">Credit Cards</SelectItem>
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

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No cards found</p>
            <p className="text-muted-foreground mb-4">
              {cards.length === 0
                ? "Start by adding your first card"
                : "Try adjusting your search or filters"}
            </p>
            {cards.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Card
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => {
            const status = getCardStatus(card.expiryDate);
            return (
              <Card key={card.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className={`h-5 w-5 ${card.type === 'credit' ? 'text-purple-500' : 'text-green-500'}`} />
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {status === 'urgent' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {status === 'expiring' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                      {status === 'expired' && <XCircle className="h-5 w-5 text-red-500" />}
                      {status === 'active' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={card.type === 'credit' ? 'default' : 'secondary'}>
                      {card.type.charAt(0).toUpperCase() + card.type.slice(1)}
                    </Badge>
                    <Badge variant="outline">****{card.lastFourDigits}</Badge>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {getStatusText(status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{card.bank}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={status === 'expired' || status === 'urgent' || status === 'expiring' ? 'text-red-600 font-medium' : ''}>
                        Expires: {format(new Date(card.expiryDate), 'MMM yyyy')}
                      </span>
                    </div>
                    
                    {card.supportContact && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (card.supportContact?.startsWith('http')) {
                              window.open(card.supportContact, '_blank');
                            } else {
                              window.open(`tel:${card.supportContact}`, '_self');
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Contact Support
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Added {format(new Date(card.createdAt), 'MMM d, yyyy')}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Card</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{card.name}" ending in {card.lastFourDigits}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCard(card.id)}>
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
              Cards Status Overview
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