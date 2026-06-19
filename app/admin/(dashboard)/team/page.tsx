'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Shield, ShieldAlert, Trash2, Edit } from 'lucide-react';
import type { Role } from '@prisma/client';
import { getTeamMembers, createAdminUser, deleteTeamMember, updateTeamMemberRole } from './actions';

type AdminRole = Extract<Role, 'SUPERADMIN' | 'ADMIN'>;
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: Date | string;
};

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('ADMIN');

  // MOCK: Current logged in user role (Change this to test ADMIN vs SUPERADMIN)
  const currentUserRole: AdminRole = 'SUPERADMIN';

  useEffect(() => {
    if (currentUserRole !== 'SUPERADMIN') {
      // In a real app, this would be a server-side redirect, but we mock it here.
      window.location.href = '/admin/dashboard';
      return;
    }

    getTeamMembers()
      .then(data => setMembers(data as TeamMember[]))
      .finally(() => setIsLoading(false));
  }, [currentUserRole]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const newMember = await createAdminUser({ name: newName, email: newEmail, role: newRole });
      setMembers([newMember as TeamMember, ...members]);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('ADMIN');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to add this team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to revoke access for this admin?')) {
      await deleteTeamMember(id);
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleRoleChange = async (id: string, currentRole: Role) => {
    const nextRole: AdminRole = currentRole === 'ADMIN' ? 'SUPERADMIN' : 'ADMIN';
    await updateTeamMemberRole(id, nextRole);
    setMembers(members.map(m => m.id === id ? { ...m, role: nextRole } : m));
  };

  if (currentUserRole !== 'SUPERADMIN') {
    return <div className="p-8 text-center text-red-500 font-medium">Access Denied. Super Admin only.</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage admin access and roles across the platform.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 focus:outline-none"
        >
          <Plus className="w-5 h-5" />
          Add Team Member
        </button>
      </div>

      <div className="bg-white dark:bg-[#1C1D21] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading team members...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No team members found. Add one above.</td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/30">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'SUPERADMIN' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                    }`}>
                      {member.role === 'SUPERADMIN' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      {member.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleRoleChange(member.id, member.role)}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mr-4 transition-colors p-1"
                      title="Toggle Role"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(member.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1D21] w-full max-w-md rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Team Member</h2>
              <p className="text-sm text-gray-500 mt-1">Grant access to the Zentra admin panel.</p>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#3C4043] bg-white dark:bg-[#28292A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#3C4043] bg-white dark:bg-[#28292A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role Level</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#3C4043] bg-white dark:bg-[#28292A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="ADMIN">Admin (Standard Access)</option>
                    <option value="SUPERADMIN">Super Admin (Full Access & User Management)</option>
                  </select>
                </div>

                {formError && (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formError}
                  </p>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 text-white transition-colors focus:outline-none shadow-sm"
                >
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
