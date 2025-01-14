import React from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { FileObject } from '../types/supabase';

interface FileUploadProps {
  orderId: string;
  onUploadComplete: (files: FileObject[]) => void;
}

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'application/zip',
  'application/x-zip-compressed',
  'application/pdf'
];

export default function FileUpload({ orderId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Invalid file type: ${file.name}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large: ${file.name}`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(validateFile);
    setFiles(validFiles);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    try {
      setUploading(true);
      const uploadedFiles: FileObject[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${orderId}/${fileName}`;

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

        setProgress(((i + 1) / files.length) * 100);
      }

      onUploadComplete(uploadedFiles);
      toast.success('Files uploaded successfully');
      setFiles([]);
      setProgress(0);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Drop files here or click to upload
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
                accept=".wav,.mp3,.zip,.pdf"
                disabled={uploading}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              WAV, MP3, ZIP up to 1GB
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
          {files.map((file, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">
                  {file.name}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}

          {uploading ? (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <button
                onClick={handleUpload}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Upload Files
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
