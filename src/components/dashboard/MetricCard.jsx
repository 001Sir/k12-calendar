import { cn } from '../../utils/cn'

export default function MetricCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  trend,
  className 
}) {
  return (
    <div className={cn("bg-white rounded-lg p-4 shadow-sm", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 bg-gray-50 rounded">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}