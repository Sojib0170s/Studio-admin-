import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, ShieldAlert, KeyRound, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { UserProfile } from '../../types';
import { getUserProfiles } from '../../services/userService';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfiles();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load user profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q) || u.uid.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Zero-Trust Architecture Notice */}
      <div className="bg-[#151726] border border-[#272A3E] rounded-2xl p-5 text-slate-200 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Zero-Trust User Security &amp; RBAC Architecture
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-lime-400/10 text-lime-400 border border-lime-400/20">
                Privacy Enforced
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In strict accordance with Firebase security principles, authentication credentials (passwords, hashes, and OAuth tokens) are securely guarded inside Firebase Authentication and never exposed to the client. Administrative roles are verified via cryptographic Firebase Custom Claims or the server allowlist. Client-side role modifications are deliberately blocked to prevent privilege escalation.
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#12131C] border border-[#222436] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or UID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#181A26] border border-[#272A3E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#181A26] hover:bg-[#222436] border border-[#272A3E] text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* User Directory Table */}
      {isLoading ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-8 animate-pulse space-y-4">
          <div className="h-6 bg-[#1F2133] rounded w-1/4" />
          <div className="h-10 bg-[#1F2133] rounded" />
          <div className="h-10 bg-[#1F2133] rounded" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Registered Users in Firestore</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When users register or sign in through the Prompt Studio mobile application, their privacy-conscious profiles appear in the <code className="text-purple-300 font-mono">userProfiles</code> collection.
          </p>
        </div>
      ) : (
        <div className="bg-[#12131C] border border-[#222436] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-[#161826] border-b border-[#222436] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">Firebase UID</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222436]">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-[#181A28] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover bg-black/40"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{user.displayName}</p>
                          <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                      {user.uid.substring(0, 12)}...
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-700/20 text-slate-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
