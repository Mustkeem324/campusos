import React from 'react';

export default function GradingView({ params }: { params: { courseId: string; assignmentId: string } }) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Assignment Grading</h1>
          <p className="text-gray-500 mt-1">Assignment ID: {params.assignmentId} | Course: {params.courseId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4">Submission Preview</h2>
          <div className="h-[500px] bg-gray-100 rounded flex items-center justify-center text-gray-500">
            Select a student to view submission
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Students</h2>
            <div className="space-y-2">
              <div className="p-3 border rounded cursor-pointer hover:bg-gray-50 border-blue-500 bg-blue-50">
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-gray-500">Submitted 2 hours ago</p>
              </div>
              <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                <p className="font-medium">Jane Smith</p>
                <p className="text-sm text-gray-500">Not graded</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Grading</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                <input type="number" className="w-full border rounded-md p-2" placeholder="0 - 100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea className="w-full border rounded-md p-2" rows={4} placeholder="Enter feedback here..."></textarea>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                Save Grade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
