'use client';

import React, { useState } from 'react';
import { PageHeader } from '../../../../../components/layout/PageHeader';
import { DataTable } from '../../../../../components/ui/DataTable';

const mockStudents = [
  { id: '1', name: 'John Doe', rollNumber: 'R001', marks: 0, maxMarks: 100, isAbsent: false },
  { id: '2', name: 'Jane Smith', rollNumber: 'R002', marks: 0, maxMarks: 100, isAbsent: false },
];

export default function MarksEntryPage() {
  const [students, setStudents] = useState(mockStudents);

  const handleMarksChange = (id: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/examinations/marks-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examinationId: '00000000-0000-0000-0000-000000000001',
          courseOfferingId: '00000000-0000-0000-0000-000000000002',
          studentMarks: students.map(s => ({
            studentId: s.id,
            marksObtained: Number(s.marks),
            maxMarks: Number(s.maxMarks),
            isAbsent: s.isAbsent
          }))
        })
      });
      if (response.ok) {
        alert('Marks submitted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (e) {
      alert('Error submitting marks');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Marks Entry" 
        description="Enter marks for students in your assigned course offerings." 
      />
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Course: Computer Networks - Mid Term</h2>
        
        <DataTable
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Roll Number', key: 'rollNumber' },
            { header: 'Name', key: 'name' },
            { 
              header: 'Marks Obtained', 
              key: 'marks', 
              render: (item) => (
                <input 
                  type="number" 
                  value={item.marks}
                  onChange={(e) => handleMarksChange(item.id, 'marks', e.target.value)}
                  className="w-24 p-2 border rounded"
                  disabled={item.isAbsent}
                  aria-label={`Marks for ${item.name}`}
                />
              )
            },
            { 
              header: 'Absent', 
              key: 'isAbsent', 
              render: (item) => (
                <input 
                  type="checkbox" 
                  checked={item.isAbsent}
                  onChange={(e) => handleMarksChange(item.id, 'isAbsent', e.target.checked)}
                  className="w-5 h-5 rounded"
                  aria-label={`Mark ${item.name} as absent`}
                />
              )
            }
          ]}
          data={students}
        />

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Submit Marks
          </button>
        </div>
      </div>
    </div>
  );
}
