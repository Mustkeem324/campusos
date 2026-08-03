import React from 'react';

export default function StudentLearningDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">My Learning Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Enrolled Courses</h2>
          <p>No courses found.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Upcoming Assignments</h2>
          <p>No upcoming assignments.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Recent Quizzes</h2>
          <p>No recent quizzes.</p>
        </div>
      </div>
    </div>
  );
}
