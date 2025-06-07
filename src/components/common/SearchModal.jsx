import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ events: [], users: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        performSearch()
      }, 300)

      return () => clearTimeout(delayDebounceFn)
    } else {
      setResults({ events: [], users: [] })
    }
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    try {
      // Search events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_time, location')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(5)

      setResults({ events: events || [], users: [] })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (type, item) => {
    onClose()
    setQuery('')
    if (type === 'event') {
      navigate(`/events/${item.id}`)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-start justify-center p-4 pt-20">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, users, or schools..."
                className="flex-1 outline-none text-lg"
                autoFocus
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {query.length > 2 && (
            <div className="border-t max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              ) : (
                <>
                  {results.events.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Events
                      </h3>
                      <div className="space-y-2">
                        {results.events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleResultClick('event', event)}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.start_time).toLocaleDateString()} • {event.location}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.events.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                      No results found for "{query}"
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}