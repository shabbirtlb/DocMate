import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  Calendar,
  AlertCircle,
  Plus,
  TrendingUp,
  Clock,
  ExternalLink,
  X,
  Building,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Zap,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDocuments, getCards, getSubscriptions } from '@/utils/localdb';
import type { Document, Card as CardType, Subscription } from '@/utils/localdb';
import { getDocumentStatus, getCardStatus, getSubscriptionStatus, getStatusBadgeVariant, getStatusText } from '@/utils/status-helpers';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';

type ExpiringItem = {
  id: string;
  name: string;
  type: 'document' | 'card' | 'subscription';
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'active' | 'expiring' | 'urgent' | 'expired';
  // Document specific
  category?: string;
  tags?: string[];
  // Card specific
  lastFourDigits?: string;
  bank?: string;
  cardType?: 'debit' | 'credit';
  supportContact?: string;
  // Subscription specific
  planName?: string;
  billingCycle?: string;
  autoRenewal?: boolean;
  managementUrl?: string;
  cost?: number;
  currency?: string;
};

export function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ExpiringItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'documents' | 'cards' | 'subscriptions'>('documents');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsData, cardsData, subsData] = await Promise.all([
        getDocuments(),
        getCards(),
        getSubscriptions()
      ]);
      setDocuments(docsData);
      setCards(cardsData);
      setSubscriptions(subsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeItems = (type: 'documents' | 'cards' | 'subscriptions') => {
    let items: any[] = [];
    
    if (type === 'documents') {
      items = documents.filter(doc => doc.expiryDate).map(doc => ({
        ...doc,
        expiryDate: doc.expiryDate!,
        status: getDocumentStatus(doc.expiryDate!)
      }));
    } else if (type === 'cards') {
      items = cards.map(card => ({
        ...card,
        status: getCardStatus(card.expiryDate)
      }));
    } else {
      items = subscriptions.map(sub => ({
        ...sub,
        expiryDate: sub.renewalDate,
        status: getSubscriptionStatus(sub.renewalDate)
      }));
    }

    return {
      active: items.filter(item => item.status === 'active'),
      expiring: items.filter(item => item.status === 'expiring'),
      urgent: items.filter(item => item.status === 'urgent'),
      expired: items.filter(item => item.status === 'expired')
    };
  };

  const getExpiringItems = (): ExpiringItem[] => {
    const now = new Date();
    
    const expiringDocs = documents
      .filter(doc => doc.expiryDate)
      .map(doc => {
        const status = getDocumentStatus(doc.expiryDate!);
        return {
          id: doc.id,
          name: doc.name,
          type: 'document' as const,
          expiryDate: doc.expiryDate!,
          daysUntilExpiry: differenceInDays(new Date(doc.expiryDate!), now),
          status,
          category: doc.category,
          tags: doc.tags
        };
      })
      .filter(item => 
        item.status === 'expiring' || item.status === 'urgent'
      );
    
    const expiringCards = cards
      .map(card => {
        const status = getCardStatus(card.expiryDate);
        return {
          id: card.id,
          name: card.name,
          type: 'card' as const,
          expiryDate: card.expiryDate,
          daysUntilExpiry: differenceInDays(new Date(card.expiryDate), now),
          status,
          lastFourDigits: card.lastFourDigits,
          bank: card.bank,
          cardType: card.type,
          supportContact: card.supportContact
        };
      })
      .filter(item => 
        item.status === 'expiring' || item.status === 'urgent'
      );
    
    const expiringSubs = subscriptions
      .map(sub => {
        const status = getSubscriptionStatus(sub.renewalDate);
        return {
          id: sub.id,
          name: sub.name,
          type: 'subscription' as const,
          expiryDate: sub.renewalDate,
          daysUntilExpiry: differenceInDays(new Date(sub.renewalDate), now),
          status,
          planName: sub.planName,
          billingCycle: sub.billingCycle,
          autoRenewal: sub.autoRenewal,
          managementUrl: sub.managementUrl,
          cost: sub.cost,
          currency: sub.currency
        };
      })
      .filter(item => 
        item.status === 'expiring' || item.status === 'urgent'
      );

    return [...expiringDocs, ...expiringCards, ...expiringSubs]
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  const expiringItems = getExpiringItems();

  const getRecentItems = () => {
    const allItems = [
      ...documents.map(doc => ({ ...doc, type: 'document' as const })),
      ...cards.map(card => ({ ...card, type: 'card' as const })),
      ...subscriptions.map(sub => ({ ...sub, type: 'subscription' as const }))
    ];

    return allItems
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const recentItems = getRecentItems();

  const stats = [
    {
      title: 'Documents',
      value: documents.length,
      icon: FileText,
      href: '/documents',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      statusCounts: categorizeItems('documents')
    },
    {
      title: 'Cards',
      value: cards.length,
      icon: CreditCard,
      href: '/cards',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      statusCounts: categorizeItems('cards')
    },
    {
      title: 'Subscriptions',
      value: subscriptions.length,
      icon: Calendar,
      href: '/subscriptions',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      statusCounts: categorizeItems('subscriptions')
    },
    {
      title: 'Expiring Soon',
      value: expiringItems.length,
      icon: AlertCircle,
      href: '#expiring',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950'
    }
  ];

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'subscription':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getItemBadgeText = (item: any) => {
    switch (item.type) {
      case 'document':
        return item.category;
      case 'card':
        return item.type;
      case 'subscription':
        return item.billingCycle;
      default:
        return 'Unknown';
    }
  };

  const handleItemClick = (item: ExpiringItem) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleNavigateToSection = (type: string) => {
    const path = type === 'document' ? '/documents' : 
                type === 'card' ? '/cards' : '/subscriptions';
    setIsDetailsOpen(false);
    navigate(path);
  };

  const handleStatusModalOpen = (type: 'documents' | 'cards' | 'subscriptions') => {
    setStatusModalType(type);
    setIsStatusModalOpen(true);
  };

  const renderStatusModal = () => {
    const categorized = categorizeItems(statusModalType);
    const typeLabel = statusModalType.charAt(0).toUpperCase() + statusModalType.slice(1);

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
                No urgent {statusModalType}
              </p>
            ) : (
              categorized.urgent.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge variant="destructive" className="text-xs">
                    {differenceInDays(new Date(item.expiryDate), new Date())} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expiring" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No {statusModalType} expiring soon
              </p>
            ) : (
              categorized.expiring.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {differenceInDays(new Date(item.expiryDate), new Date())} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expired.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expired {statusModalType}
              </p>
            ) : (
              categorized.expired.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <span className="text-sm font-medium">{item.name}</span>
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
                No active {statusModalType}
              </p>
            ) : (
              categorized.active.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-md">
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <Button
            className="w-full"
            onClick={() => {
              setIsStatusModalOpen(false);
              navigate(`/${statusModalType}`);
            }}
          >
            Manage All {typeLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;

    const isUrgent = selectedItem.status === 'urgent';
    const isExpired = selectedItem.status === 'expired';

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {getItemIcon(selectedItem.type)}
          <div>
            <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{selectedItem.type}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={getStatusBadgeVariant(selectedItem.status)} className="text-xs">
              {getStatusText(selectedItem.status)}
              {!isExpired && ` (${selectedItem.daysUntilExpiry} days)`}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="text-sm font-medium">
              {selectedItem.type === 'subscription' ? 'Renewal Date' : 'Expiry Date'}
            </span>
            <span className="text-sm">{format(new Date(selectedItem.expiryDate), 'MMM d, yyyy')}</span>
          </div>

          {/* Document specific details */}
          {selectedItem.type === 'document' && (
            <>
              {selectedItem.category && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">Category</span>
                  <Badge variant="outline">{selectedItem.category}</Badge>
                </div>
              )}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium mb-2 block">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Card specific details */}
          {selectedItem.type === 'card' && (
            <>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Card Number</span>
                <span className="text-sm font-mono">****{selectedItem.lastFourDigits}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Bank</span>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedItem.bank}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Type</span>
                <Badge variant={selectedItem.cardType === 'credit' ? 'default' : 'secondary'}>
                  {selectedItem.cardType?.charAt(0).toUpperCase() + selectedItem.cardType?.slice(1)}
                </Badge>
              </div>
            </>
          )}

          {/* Subscription specific details */}
          {selectedItem.type === 'subscription' && (
            <>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Plan</span>
                <span className="text-sm">{selectedItem.planName}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Billing Cycle</span>
                <Badge variant="outline">{selectedItem.billingCycle}</Badge>
              </div>
              {selectedItem.cost && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">Cost</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedItem.cost.toFixed(2)} {selectedItem.currency}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">Auto-renewal</span>
                <div className="flex items-center gap-2">
                  {selectedItem.autoRenewal ? (
                    <ToggleRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm">{selectedItem.autoRenewal ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          {selectedItem.type === 'card' && selectedItem.supportContact && (
            <Button
              className="flex-1"
              onClick={() => {
                if (selectedItem.supportContact?.startsWith('http')) {
                  window.open(selectedItem.supportContact, '_blank');
                } else {
                  window.open(`tel:${selectedItem.supportContact}`, '_self');
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          )}
          
          {selectedItem.type === 'subscription' && selectedItem.managementUrl && (
            <Button
              className="flex-1"
              onClick={() => window.open(selectedItem.managementUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => handleNavigateToSection(selectedItem.type)}
          >
            View All {selectedItem.type === 'document' ? 'Documents' : 
                     selectedItem.type === 'card' ? 'Cards' : 'Subscriptions'}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyData = documents.length > 0 || cards.length > 0 || subscriptions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between w-100%">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your document overview.
          </p>
        </div>
      </div>

      {/* Smart Suggestions - Always show */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!hasAnyData ? (
              <>
                <Button variant="outline" className="justify-start h-3.75 p-4" asChild>
                  <Link to="/documents">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Add Your First Document</p>
                        <p className="text-xs text-muted-foreground">Start with passport or ID</p>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-3.75 p-4" asChild>
                  <Link to="/cards">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded-md">
                        <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Track Your Cards</p>
                        <p className="text-xs text-muted-foreground">Never miss expiry dates</p>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-3 p-4" asChild>
                  <Link to="/subscriptions">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-md">
                        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Manage Subscriptions</p>
                        <p className="text-xs text-muted-foreground">Control your recurring costs</p>
                      </div>
                    </div>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                {expiringItems.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-3 w-4 text-red-600 dark:text-red-400" />
                      <p className="font-medium text-red-800 dark:text-red-200">Action Required</p>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {expiringItems.length} item(s) expiring soon. Review and renew them.
                    </p>
                  </div>
                )}
                <Button variant="outline" className="justify-start h-3 p-4" asChild>
                  <Link to="/documents">
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4" />
                      <div className="text-left">
                        <p className="font-medium">Add More Documents</p>
                        <p className="text-xs text-muted-foreground">Keep everything organized</p>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-3 p-4" asChild>
                  <Link to="/cards">
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4" />
                      <div className="text-left">
                        <p className="font-medium">Add More Cards</p>
                        <p className="text-xs text-muted-foreground">Keep track of the cards.</p>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-3 p-4" asChild>
                  <Link to="/cards">
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4" />
                      <div className="text-left">
                        <p className="font-medium">Manage Subscriptions</p>
                        <p className="text-xs text-muted-foreground">Keep track of your subscriptions.</p>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-3 p-4" asChild>
                  <Link to="/settings">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4" />
                      <div className="text-left">
                        <p className="font-medium">Enable Notifications</p>
                        <p className="text-xs text-muted-foreground">Get expiry alerts</p>
                      </div>
                    </div>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => stat.title !== 'Expiring Soon' && stat.statusCounts ? 
                  handleStatusModalOpen(stat.title.toLowerCase() as 'documents' | 'cards' | 'subscriptions') : 
                  undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.statusCounts && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {stat.statusCounts.active.length} Active
                  </Badge>
                  {stat.statusCounts.expiring.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.statusCounts.expiring.length} Expiring
                    </Badge>
                  )}
                  {stat.statusCounts.urgent.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stat.statusCounts.urgent.length} Urgent
                    </Badge>
                  )}
                  {stat.statusCounts.expired.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stat.statusCounts.expired.length} Expired
                    </Badge>
                  )}
                </div>
              )}
              {stat.href !== '#expiring' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Click to view status breakdown
                </p>
              )}
              {stat.href === '#expiring' && stat.value > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Items need attention
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasAnyData ? (
        /* Getting Started Section */
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome to DocuMate+</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start organizing your important documents, cards, and subscriptions securely. 
              All data is stored locally on your device.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/documents">
                <Button className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </Link>
              <Link to="/cards">
                <Button variant="outline" className="w-full sm:w-auto">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </Link>
              <Link to="/subscriptions">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    {getItemIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {format(new Date(item.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getItemBadgeText(item)}
                    </Badge>
                  </div>
                ))}
                {recentItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon */}
          <Card id="expiring">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-500" />
                Expiring Soon
                {expiringItems.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {expiringItems.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-green-50 dark:bg-green-950 rounded-full flex items-center justify-center mb-3">
                    <AlertCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    All good!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No items expiring soon
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringItems.slice(0, 5).map((item) => {
                    const isUrgent = item.status === 'urgent';
                    const isExpired = item.status === 'expired';
                    
                    return (
                      <div 
                        key={`${item.type}-${item.id}`} 
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/70 transition-colors ${
                          isUrgent ? 'bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900' : 
                          'bg-yellow-50 dark:bg-yellow-950 hover:bg-yellow-100 dark:hover:bg-yellow-900'
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center gap-2">
                          {getItemIcon(item.type)}
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isExpired ? 'Expired' : 'Expires'} {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                          {getStatusText(item.status)}
                          {!isExpired && ` (${item.daysUntilExpiry} days)`}
                        </Badge>
                      </div>
                    );
                  })}
                  {expiringItems.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      And {expiringItems.length - 5} more items...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {hasAnyData && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to="/documents">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </Link>
              <Link to="/cards">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </Link>
              <Link to="/subscriptions">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Item Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {renderItemDetails()}
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {statusModalType.charAt(0).toUpperCase() + statusModalType.slice(1)} Status
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