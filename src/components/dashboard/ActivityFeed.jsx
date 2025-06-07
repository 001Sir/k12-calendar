export default function ActivityFeed({ activities }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activities</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <img 
              src={activity.avatar} 
              alt={activity.user}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span>{' '}
                <span className="text-gray-600">{activity.action}</span>{' '}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
            </div>
            {activity.badge && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${activity.badge.className}`}>
                {activity.badge.text}
              </span>
            )}
          </div>
        ))}
      </div>
      <button className="mt-3 text-xs text-blue-600 hover:text-blue-700">
        view more activities
      </button>
    </div>
  )
}