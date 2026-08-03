'use client';

import React from 'react';
import { PageHeader } from '../../../../components/layout/PageHeader';

const mockSemesterResult = {
  id: '1',
  examination: { name: 'Fall 2026 End Term' },
  sgpa: 8.5,
  cgpa: 8.2,
  earnedCredits: 20,
  totalCredits: 20,
  status: 'PASS',
  courseResults: [
    { id: '1', courseName: 'Data Structures', grade: 'A', gradePoints: 9, credits: 4 },
    { id: '2', courseName: 'Computer Networks', grade: 'B+', gradePoints: 8, credits: 4 },
    { id: '3', courseName: 'Operating Systems', grade: 'A+', gradePoints: 10, credits: 4 },
    { id: '4', courseName: 'Database Management', grade: 'B', gradePoints: 7, credits: 4 },
    { id: '5', courseName: 'Software Engineering', grade: 'A', gradePoints: 9, credits: 4 },
  ]
};

export default function StudentResultsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Results" 
        description="View your semester results, CGPA, and download grade cards." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Current CGPA</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{mockSemesterResult.cgpa.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Latest SGPA</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{mockSemesterResult.sgpa.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Earned Credits</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{mockSemesterResult.earnedCredits}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{mockSemesterResult.examination.name}</h2>
          <button 
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
            onClick={() => alert('Downloading Grade Card PDF...')}
            aria-label="Download Grade Card"
          >
            Download Grade Card
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockSemesterResult.courseResults.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.courseName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.credits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{result.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.gradePoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Status: <span className={`font-semibold ${mockSemesterResult.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>{mockSemesterResult.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
