export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface FileObject {
  name: string;
  type: string;
  url: string;
  size: number;
  version?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export type OrderStatus = 'new' | 'in_progress' | 'review' | 'completed';

export interface StatusHistoryEntry {
  id: string;
  created_at: string;
  order_id: string;
  previous_status: OrderStatus | null;
  current_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
}