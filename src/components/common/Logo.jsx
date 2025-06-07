import { CalendarDaysIcon, AcademicCapIcon } from '@heroicons/react/24/solid'

export default function Logo({ className = "h-8", showText = true }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur-lg opacity-70" />
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-2 shadow-lg">
          <CalendarDaysIcon className={`${className} text-white`} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            EduCalendar
          </span>
          <span className="text-xs text-gray-500 -mt-1">School Events Platform</span>
        </div>
      )}
    </div>
  )
}