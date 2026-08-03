'use client';

import React, { useState } from 'react';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { DataTable } from '../../../../components/ui/DataTable';

const mockExaminations = [
  { id: '1', name: 'Fall 2026 Mid Term', type: 'MID_TERM', status: 'DRAFT', pendingBatches: 2 },
  { id: '2', name: 'Spring 2026 End Term', type: 'END_TERM', status: 'PUBLISHED', pendingBatches: 0 },
];

export default function ResultProcessingPage() {
  const [examinations, setExaminations] = useState(mockExaminations);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleProcess = async (examId: string) => {
    setProcessing(examId);
    try {
      const response = await fetch('/api/examinations/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examinationId: examId })
      });
      if (response.ok) {
        alert('Results processed successfully!');
        setExaminations(prev => prev.map(e => e.id === examId ? { ...e, status: 'COMPLETED' } : e));
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (e) {
      alert('Error processing results');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Result Processing Control Room" 
        description="Verify marks entry, process SGPA/CGPA, and publish results." 
      />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <DataTable
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Examination Name', key: 'name' },
            { header: 'Type', key: 'type' },
            { 
              header: 'Status', 
              key: 'status',
              render: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {item.status}
                </span>
              )
            },
            { header: 'Pending Batches', key: 'pendingBatches' },
            { 
              header: 'Actions', 
              key: 'actions',
              render: (item) => (
                <button
                  onClick={() => handleProcess(item.id)}
                  disabled={processing === item.id || item.status === 'PUBLISHED' || item.pendingBatches > 0}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing === item.id ? 'Processing...' : 'Process Results'}
                </button>
              )
            }
          ]}
          data={examinations}
        />
      </div>
    </div>
  );
}
