import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, User, Calendar, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type ProjectWithDetails = Order & {
  client: Profile;
};

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [projects, setProjects] = React.useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'date' | 'deadline'>('date');

  React.useEffect(() => {
    if (!profile?.role || profile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadProjects();
  }, [profile, navigate, sortBy]);

  const loadProjects = async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          client:profiles!orders_client_id_fkey (*)
        `)
        .order(sortBy === 'date' ? 'created_at' : 'deadline', { ascending: false });

      if (ordersError) throw ordersError;
      setProjects(orders || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'deadline')}
              className="border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date">Sort by Date</option>
              <option value="deadline">Sort by Deadline</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No projects match the selected filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/orders/${project.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {project.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400" />
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {project.client.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.client.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {project.service_type.charAt(0).toUpperCase() + project.service_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : 'No deadline'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}