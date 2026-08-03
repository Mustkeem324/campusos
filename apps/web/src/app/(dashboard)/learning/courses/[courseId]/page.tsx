"use client";

import React, { useState } from 'react';

export default function CourseWorkspace({ params }: { params: { courseId: string } }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    "Overview", "Lessons", "Live Classes", "Recordings", 
    "Assignments", "Quizzes", "Discussion", "Grades", "Progress", "Resources"
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold">Course Workspace</h1>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Course ID: {params.courseId}</span>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.toLowerCase()
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Course Overview</h2>
            <p className="text-gray-600">Welcome to this course. Here you will find all your learning materials.</p>
          </div>
        )}
        
        {activeTab === "lessons" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Course Lessons</h2>
            <p className="text-gray-600">Course modules and lessons will appear here.</p>
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Assignments</h2>
            <p className="text-gray-600">List of assignments and submission status.</p>
          </div>
        )}

        {activeTab === "quizzes" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Quizzes</h2>
            <p className="text-gray-600">Upcoming and completed quizzes.</p>
          </div>
        )}

        {activeTab === "grades" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Gradebook</h2>
            <p className="text-gray-600">Your performance in this course.</p>
          </div>
        )}

        {/* Fallback for other tabs */}
        {!["overview", "lessons", "assignments", "quizzes", "grades"].includes(activeTab) && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 capitalize">{activeTab}</h2>
            <p className="text-gray-600">Content for {activeTab} is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
}
