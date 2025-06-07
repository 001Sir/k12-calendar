import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Header from '../../components/layout/Header'
import { cn } from '../../utils/cn'

export default function Homepage() {
  const navigate = useNavigate()
  const [pricingTab, setPricingTab] = useState('schools')

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative flex items-center justify-center overflow-hidden bg-white pt-16" style={{ minHeight: '100vh' }}>
        {/* Decorative Emojis */}
        <div className="absolute top-20 left-10 text-6xl animate-bounce" style={{ animationDelay: '0s' }}>🏫</div>
        <div className="absolute top-40 right-20 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>⏰</div>
        <div className="absolute bottom-32 left-1/4 text-5xl animate-bounce" style={{ animationDelay: '1s' }}>🎒</div>
        <div className="absolute bottom-20 right-1/3 text-6xl animate-bounce" style={{ animationDelay: '1.5s' }}>🚌</div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                The School Calendar,
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                Finally Reimagined.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Manage, discover, and join K-12 events in one beautiful, connected space.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/explore')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all inline-flex items-center"
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Browse Events
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register?role=school')}
                className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-full font-medium hover:shadow-lg transition-all inline-flex items-center"
              >
                🏫 Try as a School
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to transform your school's event management experience
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                emoji: '🎫',
                title: 'Create Events',
                description: 'Schools can easily create and manage events with our intuitive event builder.',
                cta: 'For Schools',
                ctaColor: 'bg-blue-500 hover:bg-blue-600',
                action: () => navigate('/register?role=school'),
              },
              {
                emoji: '👶',
                title: 'Find Events',
                description: 'Families and students can discover exciting events happening in their school community.',
                cta: 'For Families',
                ctaColor: 'bg-green-500 hover:bg-green-600',
                action: () => navigate('/explore'),
              },
              {
                emoji: '🔧',
                title: 'Collaborate & Share',
                description: 'Teachers and staff can work together to organize amazing educational experiences.',
                cta: 'For Educators',
                ctaColor: 'bg-purple-500 hover:bg-purple-600',
                action: () => navigate('/register?role=teacher'),
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
              >
                <div className="text-6xl mb-6">{item.emoji}</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {item.description}
                </p>
                <button
                  onClick={item.action}
                  className={cn(
                    "px-6 py-2 text-white rounded-full font-medium transition-colors",
                    item.ctaColor
                  )}
                >
                  {item.cta}
                </button>
                <button
                  onClick={item.action}
                  className="block mx-auto mt-4 text-blue-600 font-medium hover:text-blue-700"
                >
                  Get Started →
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Calendar Preview Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600">
              Experience how K12Calendar transforms event discovery and management
            </p>
          </motion.div>

          {/* Calendar Preview */}
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">March 2024</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 pb-2">
                  {day}
                </div>
              ))}
              {/* Sample calendar days with events */}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 3 + 1; // Start from the 4th cell (Thursday)
                const isCurrentMonth = day > 0 && day <= 31;
                const hasEvent = [5, 12, 15, 20, 28].includes(day);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-lg p-2 text-sm",
                      isCurrentMonth ? "text-gray-900" : "text-gray-400",
                      hasEvent && "bg-blue-50 border-2 border-blue-200"
                    )}
                  >
                    {isCurrentMonth && (
                      <>
                        <div className="font-medium">{day}</div>
                        {hasEvent && (
                          <div className="mt-1 text-xs text-blue-600 truncate">
                            {day === 5 && "Science Fair"}
                            {day === 12 && "PTA Meeting"}
                            {day === 15 && "Book Fair"}
                            {day === 20 && "Spring Concert"}
                            {day === 28 && "Field Day"}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Built for Everyone Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              K12Calendar brings the entire school community together on one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: '🏫', 
                title: 'Schools',
                description: 'Streamline event management and boost community engagement',
                features: ['Easy event creation', 'Automated notifications', 'Analytics dashboard'],
                color: 'blue',
                role: 'school' 
              },
              { 
                icon: '👨‍👩‍👧‍👦', 
                title: 'Parents',
                description: 'Stay connected with your child\'s school community',
                features: ['Event discovery', 'RSVP management', 'Calendar sync'],
                color: 'green',
                role: 'parent' 
              },
              { 
                icon: '🧑‍🏫', 
                title: 'Teachers',
                description: 'Organize educational activities with ease',
                features: ['Collaboration tools', 'Resource sharing', 'Parent communication'],
                color: 'purple',
                role: 'teacher' 
              },
              { 
                icon: '🧑‍🎓', 
                title: 'Students',
                description: 'Discover and participate in exciting school events',
                features: ['Event browsing', 'Friend connections', 'Achievement tracking'],
                color: 'orange',
                role: 'student' 
              },
            ].map((item, index) => {
              const colorClasses = {
                blue: 'bg-blue-500 hover:bg-blue-600',
                green: 'bg-green-500 hover:bg-green-600',
                purple: 'bg-purple-500 hover:bg-purple-600',
                orange: 'bg-orange-500 hover:bg-orange-600',
              }
              
              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <ul className="space-y-2 mb-6">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm text-gray-600">
                        <span className="text-gray-400 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(`/register?role=${item.role}`)}
                    className={cn(
                      "w-full py-3 px-4 text-white rounded-lg font-medium transition-colors",
                      colorClasses[item.color]
                    )}
                  >
                    Get Started
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Choose the perfect plan for your educational community
            </p>
          </motion.div>

          {/* Pricing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-full inline-flex">
              {['Schools', 'Districts', 'Free'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPricingTab(tab.toLowerCase())}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    pricingTab === tab.toLowerCase()
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {tab}
                  {tab === 'Schools' && (
                    <span className="ml-2 bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: '/forever',
                description: 'Perfect for small schools just getting started',
                features: [
                  'Up to 50 events per year',
                  'Basic event templates',
                  'Email notifications',
                  'Parent RSVP tracking',
                  'Community support'
                ],
                cta: 'Start Free',
                highlight: false,
              },
              {
                name: 'School Pro',
                price: '$49',
                period: '/month',
                description: 'Everything you need to manage school events professionally',
                features: [
                  'Unlimited events',
                  'Advanced analytics',
                  'Custom branding',
                  'SMS notifications',
                  'Priority support',
                  'Calendar integrations',
                  'Volunteer management'
                ],
                cta: 'Start Free Trial',
                highlight: true,
              },
              {
                name: 'District',
                price: 'Custom',
                period: '',
                description: 'Tailored solutions for multi-school districts',
                features: [
                  'Everything in School Pro',
                  'Multi-school dashboard',
                  'District-wide analytics',
                  'Custom integrations',
                  'Dedicated account manager',
                  'On-site training',
                  'SLA guarantee'
                ],
                cta: 'Contact Sales',
                highlight: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className={cn(
                  "relative bg-white rounded-2xl p-8 transition-all",
                  plan.highlight 
                    ? "shadow-2xl border-2 border-indigo-600" 
                    : "shadow-lg border border-gray-200"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={cn(
                    "w-full py-3 px-6 rounded-lg font-medium transition-colors",
                    plan.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <CalendarDaysIcon className="h-8 w-8 text-indigo-400" />
              <span className="text-xl font-bold">K12Calendar</span>
            </div>
            
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" className="hover:text-indigo-400 transition-colors">About</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                Built with ❤️ for Education 🚌
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}