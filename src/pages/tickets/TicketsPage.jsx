import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDaysIcon, TicketIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import useAuthStore from '../../store/authStore'
import { useRSVPs } from '../../hooks/useRSVPs'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

export default function TicketsPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { rsvps, loading } = useRSVPs(user?.id)
  const [filter, setFilter] = useState('all')

  const filteredRSVPs = rsvps.filter(rsvp => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return new Date(rsvp.event?.start_time) > new Date()
    if (filter === 'past') return new Date(rsvp.event?.start_time) <= new Date()
    return rsvp.status === filter
  })

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading tickets..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">My Tickets</h1>
                <p className="text-sm text-gray-500">Manage your event tickets and RSVPs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'past'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past Events
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'confirmed'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Confirmed
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <main className="p-6">
        {filteredRSVPs.length === 0 ? (
          <EmptyState
            icon={<TicketIcon className="h-12 w-12 text-gray-400" />}
            title="No tickets found"
            description="You haven't RSVP'd to any events yet"
            action={{
              label: "Browse Events",
              onClick: () => navigate('/explore')
            }}
          />
        ) : (
          <div className="grid gap-4">
            {filteredRSVPs.map((rsvp) => (
              <div
                key={rsvp.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/events/${rsvp.event_id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {rsvp.event?.image_url && (
                      <img
                        src={rsvp.event.image_url}
                        alt={rsvp.event.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{rsvp.event?.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(rsvp.event?.start_time).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} at {new Date(rsvp.event?.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-500">{rsvp.event?.location}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rsvp.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : rsvp.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rsvp.status ? rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1) : 'Pending'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {rsvp.number_of_guests} {rsvp.number_of_guests === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {rsvp.event?.price > 0 && (
                      <p className="text-lg font-semibold">${rsvp.event.price}</p>
                    )}
                    <p className="text-sm text-gray-500">per ticket</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}