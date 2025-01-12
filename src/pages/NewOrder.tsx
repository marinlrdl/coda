import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { FileObject } from '../types/supabase';

const ALLOWED_FILE_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/octet-stream'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function NewOrder() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  React.useEffect(() => {
    if (!profile) {
      navigate('/login');
      return;
    }
  }, [profile, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const invalidFiles = selectedFiles.filter(
      file => !ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
    );

    if (invalidFiles.length > 0) {
      toast.error('Invalid files selected. Please check file types and sizes.');
      return;
    }

    setFiles(selectedFiles);
  };

  const uploadFiles = async (): Promise<FileObject[]> => {
    const uploadedFiles: FileObject[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('order-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-files')
        .getPublicUrl(filePath);

      uploadedFiles.push({
        name: file.name,
        type: file.type,
        url: publicUrl,
        size: file.size,
      });

      // Update progress
      setUploadProgress((uploadedFiles.length / files.length) * 100);
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const serviceType = formData.get('serviceType') as 'mixing' | 'mastering';
    const musicStyle = formData.get('musicStyle') as string;
    const description = formData.get('description') as string;

    try {
      setLoading(true);

      // Upload files first
      const uploadedFiles = files.length > 0 ? await uploadFiles() : [];

      const { error } = await supabase.from('orders').insert({
        client_id: profile.id,
        title,
        service_type: serviceType,
        music_style: musicStyle,
        description,
        price: serviceType === 'mixing' ? 299 : 199,
        files: uploadedFiles,
        status: 'new'
      });

      if (error) throw error;
      toast.success('Order created successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Order</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., My New Track"
          />
        </div>

        <div>
          <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
            Service Type
          </label>
          <select
            id="serviceType"
            name="serviceType"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="mixing">Mixing ($299)</option>
            <option value="mastering">Mastering ($199)</option>
          </select>
        </div>

        <div>
          <label htmlFor="musicStyle" className="block text-sm font-medium text-gray-700">
            Music Style
          </label>
          <select
            id="musicStyle"
            name="musicStyle"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="pop">Pop</option>
            <option value="rock">Rock</option>
            <option value="hiphop">Hip Hop</option>
            <option value="electronic">Electronic</option>
            <option value="jazz">Jazz</option>
            <option value="classical">Classical</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Project Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Describe your project and any specific requirements..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Project Files
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="files"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload files</span>
                  <input
                    id="files"
                    name="files"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".wav,.mp3,.zip"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                WAV, MP3, ZIP up to 500MB
              </p>
            </div>
          </div>
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}