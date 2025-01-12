import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, User, Download, Calendar, History } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { FileObject, OrderStatus, StatusHistoryEntry } from '../types/supabase';
import FileUpload from '../components/FileUpload';
import StatusBadge from '../components/StatusBadge';
import StatusSelect from '../components/StatusSelect';
import StatusTimeline from '../components/StatusTimeline';
import StatusHistory from '../components/StatusHistory';
import { useOrderStore } from '../store/orders';

type Order = Database['public']['Tables']['orders']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Revision = Database['public']['Tables']['revisions']['Row'];

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { updateOrderStatus } = useOrderStore();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [client, setClient] = React.useState<Profile | null>(null);
  const [revisions, setRevisions] = React.useState<Revision[]>([]);
  const [statusHistory, setStatusHistory] = React.useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showHistory, setShowHistory] = React.useState(false);

  const loadOrderDetails = React.useCallback(async () => {
    if (!id || !profile) return;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select()
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Verify user has access to this order
      const canAccess = 
        profile.role === 'admin' || 
        orderData.client_id === profile.id;

      if (!canAccess) {
        toast.error('You do not have access to this order');
        navigate('/dashboard');
        return;
      }

      setOrder(orderData);

      // Load client details
      const { data: clientData } = await supabase
        .from('profiles')
        .select()
        .eq('id', orderData.client_id)
        .single();

      setClient(clientData);

      // Load revisions
      const { data: revisionData } = await supabase
        .from('revisions')
        .select()
        .eq('order_id', id)
        .order('version', { ascending: false });

      setRevisions(revisionData || []);

      // Load status history
      const { data: historyData } = await supabase
        .from('status_history')
        .select(`
          *,
          changed_by:profiles(full_name)
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      setStatusHistory(historyData || []);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, profile, navigate]);

  React.useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      await updateOrderStatus(order.id, newStatus);
      await loadOrderDetails();
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order || !client) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">Order Not Found</h2>
        <p className="mt-1 text-sm text-gray-500">
          The order you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{order.title}</h1>
        <div className="flex items-center space-x-4">
          <StatusBadge status={order.status} />
          {profile.role === 'admin' && (
            <div className="flex items-center space-x-2">
              <StatusSelect
                value={order.status}
                onChange={handleStatusUpdate}
                disabled={false}
                className="w-48"
              />
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="View status history"
              >
                <History className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
        </div>
        <StatusTimeline status={order.status} className="mb-8" />
        {showHistory && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
            <StatusHistory history={statusHistory} />
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.service_type.charAt(0).toUpperCase() + order.service_type.slice(1)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Music Style</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.music_style.charAt(0).toUpperCase() + order.music_style.slice(1)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Price</dt>
              <dd className="mt-1 text-sm text-gray-900">${order.price}</dd>
            </div>
            {order.deadline && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(order.deadline).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="flex items-center mb-4">
            {client.avatar_url ? (
              <img
                src={client.avatar_url}
                alt={client.full_name}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <User className="h-12 w-12 text-gray-400" />
            )}
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{client.full_name}</h3>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
        </div>
      </div>

      {order.description && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Files</h2>
        {order.files && order.files.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {order.files.map((file: FileObject, index: number) => (
              <li key={index} className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <a
                  href={file.url}
                  download
                  className="flex items-center text-indigo-600 hover:text-indigo-900"
                >
                  <Download className="h-5 w-5" />
                  <span className="ml-1 text-sm">Download</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No files uploaded yet.</p>
        )}

        {profile?.role === 'admin' && (
          <div className="mt-6">
            <FileUpload orderId={order.id} onUploadComplete={(files) => loadOrderDetails()} />
          </div>
        )}
      </div>

      {revisions.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revisions</h2>
          <ul className="divide-y divide-gray-200">
            {revisions.map((revision) => (
              <li key={revision.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Version {revision.version}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(revision.created_at).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={revision.status} />
                </div>
                {revision.feedback && (
                  <p className="mt-2 text-sm text-gray-700">{revision.feedback}</p>
                )}
                {revision.files && (
                  <ul className="mt-2 divide-y divide-gray-100">
                    {revision.files.map((file: FileObject, index: number) => (
                      <li key={index} className="py-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                        </div>
                        <a
                          href={file.url}
                          download
                          className="flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                          <Download className="h-4 w-4" />
                          <span className="ml-1 text-sm">Download</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}