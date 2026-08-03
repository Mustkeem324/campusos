'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Plus, Edit2, Trash2, Building2, AlertCircle, Loader2 } from 'lucide-react';

interface Campus {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  campusId: string;
  campus: { name: string };
  _count: { programs: number; courses: number };
}

export function DepartmentsConsole() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', code: '', campusId: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, camRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/campuses')
      ]);

      if (!depRes.ok || !camRes.ok) throw new Error('Failed to load data');
      
      const depData = await depRes.json();
      const camData = await camRes.json();
      
      setDepartments(depData);
      setCampuses(camData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingId ? `/api/departments/${editingId}` : '/api/departments';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save department');
      }
      
      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete department');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEdit = (dep: Department) => {
    setFormData({ name: dep.name, code: dep.code, campusId: dep.campusId });
    setEditingId(dep.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', campusId: '' });
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-lg flex items-center gap-3">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage academic departments across all campuses"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Departments' }]}
        action={
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        }
      />

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {departments.length === 0 ? (
          <div className="p-12 text-center text-text-secondary flex flex-col items-center">
            <Building2 size={48} className="mb-4 text-border" />
            <p className="text-lg font-medium text-text-primary">No Departments Found</p>
            <p className="mt-1">Get started by creating a new department.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-text-secondary text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Campus</th>
                  <th className="px-6 py-4 text-center">Programs</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-surface-muted/50 transition">
                    <td className="px-6 py-4 font-medium text-text-primary">{dep.name}</td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{dep.code}</td>
                    <td className="px-6 py-4 text-text-secondary">{dep.campus.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-primary-soft text-primary px-2 py-1 rounded-full text-xs font-medium min-w-[2rem]">
                        {dep._count.programs}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(dep)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary-soft rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(dep.id)}
                        className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">
                {editingId ? 'Edit Department' : 'Create Department'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="CSE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Campus</label>
                <select
                  required
                  value={formData.campusId}
                  onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Campus...</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-70 transition flex items-center gap-2"
                >
                  {formLoading && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
