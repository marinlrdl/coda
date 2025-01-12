import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type Freelancer = Database['public']['Tables']['freelancers']['Row'];

export default function FreelancerManagement() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [freelancers, setFreelancers] = React.useState<Freelancer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingFreelancer, setEditingFreelancer] = React.useState<Freelancer | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!profile?.role || profile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadFreelancers();
  }, [profile, navigate]);

  const loadFreelancers = async () => {
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFreelancers(data || []);
    } catch (error) {
      console.error('Error loading freelancers:', error);
      toast.error('Failed to load freelancers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const freelancerData = {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      fiverr_profile: formData.get('fiverr_profile') as string,
      notes: formData.get('notes') as string,
      active: true,
    };

    try {
      if (editingFreelancer) {
        const { error } = await supabase
          .from('freelancers')
          .update(freelancerData)
          .eq('id', editingFreelancer.id);

        if (error) throw error;
        toast.success('Freelancer updated successfully');
      } else {
        const { error } = await supabase
          .from('freelancers')
          .insert([freelancerData]);

        if (error) throw error;
        toast.success('Freelancer added successfully');
      }

      setIsModalOpen(false);
      setEditingFreelancer(null);
      loadFreelancers();
    } catch (error) {
      console.error('Error saving freelancer:', error);
      toast.error('Failed to save freelancer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this freelancer?')) return;

    try {
      const { error } = await supabase
        .from('freelancers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Freelancer deleted successfully');
      loadFreelancers();
    } catch (error) {
      console.error('Error deleting freelancer:', error);
      toast.error('Failed to delete freelancer');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading freelancers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Freelancer Management</h1>
        <button
          onClick={() => {
            setEditingFreelancer(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Freelancer
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiverr Profile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {freelancers.map((freelancer) => (
              <tr key={freelancer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {freelancer.full_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{freelancer.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {freelancer.fiverr_profile && (
                    <a
                      href={freelancer.fiverr_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Profile
                    </a>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {freelancer.notes}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingFreelancer(freelancer);
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(freelancer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingFreelancer ? 'Edit Freelancer' : 'Add Freelancer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  defaultValue={editingFreelancer?.full_name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={editingFreelancer?.email || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="fiverr_profile" className="block text-sm font-medium text-gray-700">
                  Fiverr Profile URL
                </label>
                <input
                  type="url"
                  id="fiverr_profile"
                  name="fiverr_profile"
                  defaultValue={editingFreelancer?.fiverr_profile || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={editingFreelancer?.notes || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingFreelancer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingFreelancer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}