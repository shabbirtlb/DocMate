import { supabase } from './supabaseClient';

export interface Document {
  id: string;
  name: string;
  category: string;
  expiryDate?: string;
  fileUrl?: string;
  createdAt: string;
  tags: string[];
  userId: string;
}

export interface Card {
  id: string;
  name: string;
  lastFourDigits: string;
  bank: string;
  expiryDate: string;
  type: 'debit' | 'credit';
  supportContact?: string;
  createdAt: string;
  userId: string;
}

export interface Subscription {
  id: string;
  name: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  renewalDate: string;
  autoRenewal: boolean;
  managementUrl?: string;
  cost?: number;
  currency?: string;
  createdAt: string;
  userId: string;
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not authenticated');
  return data.user.id;
}

// --- DOCUMENTS ---
export async function saveDocument(doc: Omit<Document, 'userId'>) {
  const userId = await getUserId();
  const { error } = await supabase.from('documents').upsert({ ...doc, userId });
  if (error) throw error;
}

export async function getDocuments(): Promise<Document[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('documents').select('*').eq('userId', userId);
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// --- CARDS ---
export async function saveCard(card: Omit<Card, 'userId'>) {
  const userId = await getUserId();
  const { error } = await supabase.from('cards').upsert({ ...card, userId });
  if (error) throw error;
}

export async function getCards(): Promise<Card[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('cards').select('*').eq('userId', userId);
  if (error) throw error;
  return data;
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
}

// --- SUBSCRIPTIONS ---
export async function saveSubscription(sub: Omit<Subscription, 'userId'>) {
  const userId = await getUserId();
  const { error } = await supabase.from('subscriptions').upsert({ ...sub, userId });
  if (error) throw error;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('subscriptions').select('*').eq('userId', userId);
  if (error) throw error;
  return data;
}

export async function deleteSubscription(id: string) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw error;
}

// --- EXPORT / IMPORT ---
export async function exportAllData() {
  const [documents, cards, subscriptions] = await Promise.all([
    getDocuments(),
    getCards(),
    getSubscriptions()
  ]);
  return { documents, cards, subscriptions };
}

export async function importAllData(data: {
  documents?: Document[];
  cards?: Card[];
  subscriptions?: Subscription[];
}) {
  if (data.documents) {
    for (const doc of data.documents) await saveDocument(doc);
  }
  if (data.cards) {
    for (const card of data.cards) await saveCard(card);
  }
  if (data.subscriptions) {
    for (const sub of data.subscriptions) await saveSubscription(sub);
  }
}