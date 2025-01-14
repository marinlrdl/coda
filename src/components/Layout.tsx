import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music4, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <Music4 className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900">Coda</span>
              </Link>
            </div>

            <div className="flex items-center">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="ml-4 flex items-center">
                    <div className="relative">
                      <div className="flex items-center">
                        {profile?.avatar_url ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={profile.avatar_url}
                            alt={profile.full_name}
                          />
                        ) : (
                          <User className="h-8 w-8 text-gray-400" />
                        )}
                        <span className="ml-2 text-gray-700">{profile?.full_name}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="ml-4 text-gray-700 hover:text-indigo-600"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
