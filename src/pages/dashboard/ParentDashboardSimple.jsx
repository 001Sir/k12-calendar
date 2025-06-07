import React from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import Header from '../../components/layout/Header'

export default function ParentDashboardSimple() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-24 px-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <CalendarDaysIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Parent Dashboard
            </h1>
          </div>
          <p className="text-gray-600">
            Welcome to your parent dashboard. This is a simplified version to test basic functionality.
          </p>
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">
              ✅ Dashboard loads successfully! The issue was likely with the complex component imports.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}