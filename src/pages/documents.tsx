import { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Calendar,
  Tag,
  Search,
  Filter,
  Download,
  Trash2,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDocuments, saveDocument, deleteDocument } from '@/utils/localdb';
import { generateUUID } from '@/utils/uuid';
import { getSelectedCountry } from '@/utils/countries';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import type { Document } from '@/utils/localdb';

const documentCategories = [
  'Identity',
  'Education',
  'Banking',
  'Insurance',
  'Medical',
  'Legal',
  'Tax',
  'Property',
  'Vehicle',
  'Other'
];

type DocumentStatus = 'active' | 'expiring' | 'expired';

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: '',
    expiryDate: '',
    tags: '',
    file: null as File | null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedCategory, selectedStatus]);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (expiryDate?: string): DocumentStatus => {
    if (!expiryDate) return 'active';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, now);
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'active';
  };

  const categorizeDocuments = () => {
    const documentsWithStatus = documents.map(doc => ({
      ...doc,
      status: getDocumentStatus(doc.expiryDate)
    }));

    return {
      active: documentsWithStatus.filter(doc => doc.status === 'active'),
      expiring: documentsWithStatus.filter(doc => doc.status === 'expiring'),
      expired: documentsWithStatus.filter(doc => doc.status === 'expired')
    };
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => getDocumentStatus(doc.expiryDate) === selectedStatus);
    }

    setFilteredDocuments(filtered);
  };

  const handleAddDocument = async () => {
    if (!newDocument.name || !newDocument.category) {
      toast.error('Please fill in required fields');
      return;
    }

    const document: Document = {
      id: generateUUID(),
      name: newDocument.name,
      category: newDocument.category,
      expiryDate: newDocument.expiryDate || undefined,
      file: newDocument.file || undefined,
      createdAt: new Date().toISOString(),
      tags: newDocument.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    try {
      await saveDocument(document);
      setDocuments(prev => [document, ...prev]);
      setNewDocument({
        name: '',
        category: '',
        expiryDate: '',
        tags: '',
        file: null
      });
      setIsAddDialogOpen(false);
      toast.success('Document added successfully');
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setNewDocument(prev => ({ ...prev, file }));
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  const renderStatusModal = () => {
    const categorized = categorizeDocuments();

    return (
      <div className="space-y-4">
        <Tabs defaultValue="expiring" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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

          <TabsContent value="expiring" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents expiring soon
              </p>
            ) : (
              categorized.expiring.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{doc.name}</span>
                    <p className="text-xs text-muted-foreground">{doc.category}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {doc.expiryDate ? differenceInDays(new Date(doc.expiryDate), new Date()) : 0} days
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-2 max-h-64 overflow-y-auto">
            {categorized.expired.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expired documents
              </p>
            ) : (
              categorized.expired.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{doc.name}</span>
                    <p className="text-xs text-muted-foreground">{doc.category}</p>
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
                No active documents
              </p>
            ) : (
              categorized.active.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-md">
                  <div>
                    <span className="text-sm font-medium">{doc.name}</span>
                    <p className="text-xs text-muted-foreground">{doc.category}</p>
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

  const country = getSelectedCountry();
  const categorized = categorizeDocuments();

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
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage your personal documents securely
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
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Passport, Driver's License"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newDocument.category}
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date (optional)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newDocument.tags}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., important, government, travel"
                  />
                </div>
                <div>
                  <Label htmlFor="file">Upload File (optional, max 10MB)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
                <Button onClick={handleAddDocument} className="w-full">
                  Add Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Smart Suggestions - Compact and Clickable */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {documents.length === 0 ? (
              <>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Add Essential Docs</p>
                      <p className="text-xs text-muted-foreground">Start with passport & ID</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Set Expiry Dates</p>
                      <p className="text-xs text-muted-foreground">Get renewal reminders</p>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Use Tags</p>
                      <p className="text-xs text-muted-foreground">Easy organization</p>
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
                      <p className="font-medium text-sm">Upload Files</p>
                      <p className="text-xs text-muted-foreground">Secure local storage</p>
                    </div>
                  </div>
                </Button>
              </>
            ) : (
              <>
                {categorized.expiring.length > 0 && (
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-3 text-left border-red-200 dark:border-red-800"
                    onClick={() => setSelectedStatus('expiring')}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-red-800 dark:text-red-200">Renewal Required</p>
                        <p className="text-xs text-red-700 dark:text-red-300">{categorized.expiring.length} expiring soon</p>
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
                        <p className="font-medium text-sm text-orange-800 dark:text-orange-200">Expired Documents</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">{categorized.expired.length} need renewal</p>
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
                    <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Add More Documents</p>
                      <p className="text-xs text-muted-foreground">Stay organized</p>
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
                      <p className="text-xs text-muted-foreground">Check all documents</p>
                    </div>
                  </div>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('active')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.active.length}</div>
            <p className="text-xs text-muted-foreground">Valid and up-to-date</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('expiring')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.expiring.length}</div>
            <p className="text-xs text-muted-foreground">Expires within 30 days</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStatus('expired')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorized.expired.length}</div>
            <p className="text-xs text-muted-foreground">Needs immediate renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {documentCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
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
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country-specific suggestions */}
      {documents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Documents for {country.name} {country.flag}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {country.documents.map(docName => (
                <Button
                  key={docName}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewDocument(prev => ({
                      ...prev,
                      name: docName,
                      category: docName.includes('Card') || docName.includes('License') ? 'Identity' : 'Other'
                    }));
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {docName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No documents found</p>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0
                ? "Start by adding your first document"
                : "Try adjusting your search or filters"}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => {
            const status = getDocumentStatus(document.expiryDate);
            return (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">{document.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {status === 'expiring' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                      {status === 'expired' && <XCircle className="h-5 w-5 text-red-500" />}
                      {status === 'active' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{document.category}</Badge>
                    <Badge 
                      variant={status === 'expired' ? 'destructive' : status === 'expiring' ? 'secondary' : 'outline'}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {document.expiryDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={status === 'expired' || status === 'expiring' ? 'text-red-600 font-medium' : ''}>
                          Expires: {format(new Date(document.expiryDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {document.tags.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {document.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{document.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Added {format(new Date(document.createdAt), 'MMM d, yyyy')}
                      </span>
                      <div className="flex gap-1">
                        {document.file && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Create download link for file
                              const url = URL.createObjectURL(document.file!);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = document.file!.name;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{document.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDocument(document.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
              Documents Status Overview
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