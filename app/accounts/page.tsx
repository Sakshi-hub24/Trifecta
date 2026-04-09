'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Accounts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Fetch additional user data from our API
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          setUserData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch user data:', err);
          setLoading(false);
        });
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold">Account Settings</h1>
              <p className="text-slate-300 mt-2">Manage your profile and preferences</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-3xl border border-slate-700 bg-slate-950/90 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Username</label>
                    <div className="rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100">
                      {userData.username || session.user.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                    <div className="rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100">
                      {session.user.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">Current Role</label>
                  <div className="inline-flex items-center rounded-3xl border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                    {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Role changes require account re-registration with a different role.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="text-2xl font-semibold mb-6">Account Actions</h2>
              <div className="space-y-4">
                <button
                  onClick={() => alert('Password reset coming soon!')}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900 text-left"
                >
                  Change Password
                </button>
                <button
                  onClick={() => alert('Profile editing coming soon!')}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900 text-left"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => alert('Data export coming soon!')}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900 text-left"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Role:</span>
                  <span className="text-white font-medium">{userData.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Member since:</span>
                  <span className="text-white font-medium">2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Workspaces:</span>
                  <span className="text-white font-medium">{userData.workspaces?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 shadow-2xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-4 text-red-100">Sign Out</h3>
              <p className="text-sm text-red-200 mb-4">
                Sign out of your account. You'll need to sign in again to access your dashboard.
              </p>
              <button
                onClick={handleLogout}
                className="w-full rounded-3xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}