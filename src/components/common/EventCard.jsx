import { motion } from 'framer-motion'
import { CalendarDaysIcon, MapPinIcon, UserGroupIcon, CurrencyDollarIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { cn } from '../../utils/cn'
import { useSavedEvents } from '../../hooks/useSavedEvents'

export default function EventCard({ 
  event, 
  onClick,
  className,
  showActions = true,
  showSaveButton = true 
}) {
  const {
    title,
    description,
    start_time,
    end_time,
    location,
    capacity,
    event_attendees = [],
    price,
    image_url,
    event_type,
    school
  } = event

  const eventDate = new Date(start_time)
  const eventTime = eventDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  const dateStr = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  })

  const attendees_count = event_attendees?.length || 0
  const capacityPercentage = capacity ? (attendees_count / capacity) * 100 : 0
  
  const { isEventSaved, toggleSaveEvent } = useSavedEvents()
  const isSaved = isEventSaved(event.id)
  
  const handleSave = async (e) => {
    e.stopPropagation()
    await toggleSaveEvent(event.id)
  }

  const typeColors = {
    academic: 'bg-blue-100 text-blue-700',
    sports: 'bg-green-100 text-green-700',
    arts: 'bg-purple-100 text-purple-700',
    fundraiser: 'bg-orange-100 text-orange-700',
    meeting: 'bg-gray-100 text-gray-700',
    other: 'bg-indigo-100 text-indigo-700'
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all",
        className
      )}
    >
      {image_url && (
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          <img 
            src={image_url} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              typeColors[event_type] || typeColors.other
            )}>
              {event_type}
            </span>
            {showSaveButton && (
              <button
                onClick={handleSave}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
              >
                {isSaved ? (
                  <BookmarkSolidIcon className="h-5 w-5 text-indigo-600" />
                ) : (
                  <BookmarkIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {title}
          </h3>
          {!image_url && showSaveButton && (
            <button
              onClick={handleSave}
              className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSaved ? (
                <BookmarkSolidIcon className="h-5 w-5 text-indigo-600" />
              ) : (
                <BookmarkIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
        </div>
        
        {school && (
          <p className="text-sm text-gray-600 mb-3">{school.name}</p>
        )}

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{dateStr} at {eventTime}</span>
          </div>
          
          {location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}

          {capacity && (
            <div className="flex items-center text-sm text-gray-600">
              <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{attendees_count} / {capacity} attending</span>
            </div>
          )}

          {price && price > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>${price.toFixed(2)}</span>
            </div>
          )}
        </div>

        {capacity && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all",
                  capacityPercentage >= 90 ? 'bg-red-500' :
                  capacityPercentage >= 70 ? 'bg-orange-500' :
                  'bg-green-500'
                )}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {showActions && (
          <div className="flex items-center justify-between">
            <button className="text-indigo-600 font-medium text-sm hover:text-indigo-700">
              View Details →
            </button>
            {capacity && attendees_count < capacity && (
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                RSVP
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}