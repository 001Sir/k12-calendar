import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CameraIcon,
  KeyIcon,
  ChartBarIcon,
  ShareIcon,
  QrCodeIcon,
  DocumentArrowDownIcon,
  CheckBadgeIcon,
  EyeIcon,
  PencilIcon,
  BriefcaseIcon,
  TrophyIcon,
  CalendarDaysIcon,
  LinkIcon,
  StarIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  PhotoIcon,
  ClockIcon,
  MapPinIcon,
  AcademicCapIcon as EducationIcon,
  BeakerIcon,
  BookOpenIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { 
  CheckBadgeIcon as CheckBadgeSolidIcon,
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { useSchool } from '../../hooks/useSchool'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Header from '../../components/layout/Header'
import { cn } from '../../utils/cn'

// Mock data for analytics
const profileViewsData = [
  { day: 'Mon', views: 12 },
  { day: 'Tue', views: 19 },
  { day: 'Wed', views: 15 },
  { day: 'Thu', views: 25 },
  { day: 'Fri', views: 22 },
  { day: 'Sat', views: 30 },
  { day: 'Sun', views: 28 },
]

const engagementData = [
  { name: 'Profile Views', value: 156, color: '#6366f1' },
  { name: 'Event Interactions', value: 89, color: '#8b5cf6' },
  { name: 'Messages Sent', value: 45, color: '#ec4899' },
  { name: 'Events Created', value: 23, color: '#10b981' },
]

const skillsData = [
  { skill: 'Teaching', level: 95 },
  { skill: 'Communication', level: 90 },
  { skill: 'Leadership', level: 85 },
  { skill: 'Technology', level: 80 },
  { skill: 'Collaboration', level: 92 },
]

const radarData = [
  { subject: 'Engagement', A: 120, fullMark: 150 },
  { subject: 'Activity', A: 98, fullMark: 150 },
  { subject: 'Reliability', A: 140, fullMark: 150 },
  { subject: 'Communication', A: 99, fullMark: 150 },
  { subject: 'Leadership', A: 85, fullMark: 150 },
  { subject: 'Innovation', A: 110, fullMark: 150 },
]

const themes = [
  { id: 'default', name: 'Default', primary: 'indigo', secondary: 'purple' },
  { id: 'ocean', name: 'Ocean', primary: 'blue', secondary: 'cyan' },
  { id: 'sunset', name: 'Sunset', primary: 'orange', secondary: 'pink' },
  { id: 'forest', name: 'Forest', primary: 'green', secondary: 'emerald' },
  { id: 'royal', name: 'Royal', primary: 'purple', secondary: 'indigo' },
]

export default function EnhancedProfile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { user, profile: currentUserProfile } = useAuthStore()
  const { school } = useSchool()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [following, setFollowing] = useState(false)
  const [profileViews, setProfileViews] = useState(1234)
  const [showLightbox, setShowLightbox] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showVideoIntro, setShowVideoIntro] = useState(false)
  const [profileCompleteness, setProfileCompleteness] = useState(75)
  
  const headerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: headerRef,
    offset: ["start start", "end start"]
  })
  
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const headerScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    tagline: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    skills: [],
    education: [],
    experience: [],
    certifications: [],
    achievements: [],
    languages: [],
    availability: {},
    preferences: {},
  })

  const sections = [
    { id: 'overview', label: 'Overview', icon: UserCircleIcon },
    { id: 'about', label: 'About', icon: BookOpenIcon },
    { id: 'skills', label: 'Skills & Expertise', icon: LightBulbIcon },
    { id: 'education', label: 'Education', icon: EducationIcon },
    { id: 'experience', label: 'Experience', icon: BriefcaseIcon },
    { id: 'portfolio', label: 'Portfolio', icon: PresentationChartLineIcon },
    { id: 'activity', label: 'Activity', icon: ChartBarIcon },
    { id: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon },
    { id: 'social', label: 'Social', icon: UserGroupIcon },
    { id: 'calendar', label: 'Availability', icon: CalendarDaysIcon },
  ]

  useEffect(() => {
    loadProfile()
    generateQRCode()
  }, [userId])

  const loadProfile = async () => {
    try {
      const targetUserId = userId || user?.id
      if (!targetUserId) return

      setIsOwnProfile(targetUserId === user?.id)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        tagline: data.tagline || '',
        location: data.location || '',
        website: data.website || '',
        linkedin: data.linkedin || '',
        twitter: data.twitter || '',
        skills: data.skills || [],
        education: data.education || [],
        experience: data.experience || [],
        certifications: data.certifications || [],
        achievements: data.achievements || [],
        languages: data.languages || [],
        availability: data.availability || {},
        preferences: data.preferences || {},
      })

      // Track profile view
      if (!isOwnProfile) {
        await trackProfileView(targetUserId)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const trackProfileView = async (profileId) => {
    try {
      await supabase.from('profile_views').insert({
        profile_id: profileId,
        viewer_id: user?.id,
        viewed_at: new Date().toISOString()
      })
      setProfileViews(prev => prev + 1)
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const generateQRCode = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${userId || user?.id}`
      const url = await QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      setEditMode(false)
      await loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    // In a real app, this would generate a PDF
    toast.success('PDF export coming soon!')
  }

  const handleExportVCard = () => {
    // In a real app, this would generate a vCard
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${formData.full_name}
EMAIL:${formData.email}
TEL:${formData.phone}
ORG:${school?.name || 'K12 School'}
URL:${formData.website}
END:VCARD`

    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.full_name.replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('vCard downloaded!')
  }

  const handleFollow = async () => {
    setFollowing(!following)
    toast.success(following ? 'Unfollowed user' : 'Following user')
  }

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name}'s Profile`,
          text: `Check out ${profile.full_name}'s profile on K12 Calendar`,
          url: profileUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(profileUrl)
      toast.success('Profile URL copied to clipboard!')
    }
  }

  const addSkill = (skill) => {
    if (!formData.skills.includes(skill) && skill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill.trim()]
      })
    }
  }

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const theme = themes.find(t => t.id === selectedTheme) || themes[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Parallax Header */}
      <motion.div 
        ref={headerRef}
        style={{ y: headerY, opacity: headerOpacity, scale: headerScale }}
        className="relative h-96 overflow-hidden"
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-${theme.primary}-500 via-${theme.secondary}-500 to-${theme.primary}-600`}>
          <div className="absolute inset-0 bg-black/20" />
          <motion.div 
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      </motion.div>

      {/* Profile Content */}
      <div className="relative -mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative p-8">
            {/* Profile Completeness */}
            <div className="absolute top-4 right-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-indigo-600"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: profileCompleteness / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    strokeDasharray="220"
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold">{profileCompleteness}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">Complete</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Section */}
              <div className="relative group">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                    <div className="h-full w-full rounded-2xl bg-white p-1">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name}
                          className="h-full w-full rounded-xl object-cover"
                          onClick={() => {
                            setSelectedImage(profile.avatar_url)
                            setShowLightbox(true)
                          }}
                        />
                      ) : (
                        <UserCircleIcon className="h-full w-full text-gray-300" />
                      )}
                    </div>
                  </div>
                  
                  {/* Verified Badge */}
                  {profile?.verified && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1"
                    >
                      <CheckBadgeIcon className="h-6 w-6 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Upload button for own profile */}
                {isOwnProfile && editMode && (
                  <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-100 group-hover:scale-110 transition-transform">
                    <CameraIcon className="h-5 w-5 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => console.log('Upload avatar')}
                    />
                  </label>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="border-b-2 border-indigo-500 focus:outline-none"
                        />
                      ) : (
                        profile?.full_name || 'User'
                      )}
                      {profile?.verified && (
                        <CheckBadgeSolidIcon className="h-7 w-7 text-blue-500" />
                      )}
                    </h1>
                    
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        className="text-lg text-gray-600 mt-1 border-b border-gray-300 focus:outline-none w-full"
                        placeholder="Add a tagline..."
                      />
                    ) : (
                      <p className="text-lg text-gray-600 mt-1">
                        {profile?.tagline || 'Education Professional'}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        {editMode ? (
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="border-b border-gray-300 focus:outline-none"
                            placeholder="Location"
                          />
                        ) : (
                          profile?.location || 'Location not set'
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <BriefcaseIcon className="h-4 w-4" />
                        {profile?.role === 'teacher' ? 'Teacher' : 
                         profile?.role === 'parent' ? 'Parent' :
                         profile?.role === 'school_admin' ? 'School Administrator' :
                         'Member'}
                      </span>
                      <span className="flex items-center gap-1">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        {school?.name || 'No school'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Joined {new Date(profile?.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Achievements */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <TrophyIcon className="h-3 w-3" />
                        Top Contributor
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <StarIcon className="h-3 w-3" />
                        5 Years Experience
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <SparklesIcon className="h-3 w-3" />
                        Event Creator
                      </motion.div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors",
                            editMode
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          )}
                        >
                          {editMode ? 'Save Profile' : 'Edit Profile'}
                        </motion.button>
                        {editMode && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditMode(false)
                              loadProfile()
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleFollow}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-colors",
                            following
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          )}
                        >
                          {following ? 'Following' : 'Follow'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <ChatBubbleLeftIcon className="h-5 w-5" />
                        </motion.button>
                      </>
                    )}
                    
                    {/* More Actions Dropdown */}
                    <div className="relative group">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <CogIcon className="h-5 w-5" />
                      </motion.button>
                      
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={handleShareProfile}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ShareIcon className="h-4 w-4" />
                          Share Profile
                        </button>
                        <button
                          onClick={() => setShowQRCode(true)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <QrCodeIcon className="h-4 w-4" />
                          Show QR Code
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          Export as PDF
                        </button>
                        <button
                          onClick={handleExportVCard}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Download vCard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-900">{profileViews}</div>
                    <div className="text-xs text-gray-500">Profile Views</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-900">89</div>
                    <div className="text-xs text-gray-500">Events Created</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-900">456</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-900">4.8</div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                    activeSection === section.id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <section.icon className="h-5 w-5" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-8"
            >
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <div className="space-y-8">
                  {/* Video Introduction */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <VideoCameraIcon className="h-5 w-5 text-indigo-600" />
                      Video Introduction
                    </h3>
                    <div className="relative bg-gray-100 rounded-lg aspect-video overflow-hidden">
                      {showVideoIntro ? (
                        <video
                          controls
                          className="w-full h-full object-cover"
                          src="/demo-video.mp4"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowVideoIntro(true)}
                            className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-lg"
                          >
                            <PlayIcon className="h-8 w-8 text-indigo-600" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 bg-indigo-50 rounded-lg text-center hover:bg-indigo-100 transition-colors"
                      >
                        <EnvelopeIcon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                        <span className="text-sm font-medium">Send Message</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                      >
                        <CalendarDaysIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <span className="text-sm font-medium">Schedule Meeting</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShareProfile}
                        className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
                      >
                        <ShareIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <span className="text-sm font-medium">Share Profile</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
                      >
                        <HeartSolidIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <span className="text-sm font-medium">Recommend</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Recent Visitors */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <EyeIcon className="h-5 w-5 text-indigo-600" />
                      Recent Visitors
                    </h3>
                    <div className="flex -space-x-2">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative"
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white" />
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                            {String.fromCharCode(65 + i)}
                          </div>
                        </motion.div>
                      ))}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-gray-600">+12</span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {/* About Section */}
              {activeSection === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About Me</h3>
                    {editMode ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={6}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-600 leading-relaxed">
                        {profile?.bio || 'No bio added yet.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">English (Native)</span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Spanish (Fluent)</span>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">French (Basic)</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{profile?.email || user?.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{profile?.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                        {editMode ? (
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="border-b border-gray-300 focus:outline-none"
                            placeholder="Your website"
                          />
                        ) : (
                          <a href={profile?.website} className="text-indigo-600 hover:underline">
                            {profile?.website || 'No website'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {activeSection === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
                    <div className="space-y-4">
                      {skillsData.map((skill, index) => (
                        <motion.div
                          key={skill.skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{skill.skill}</span>
                            <span className="text-sm text-gray-500">{skill.level}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.level}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <motion.span
                          key={skill}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-1"
                        >
                          {skill}
                          {editMode && (
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-indigo-900"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          )}
                        </motion.span>
                      ))}
                      {editMode && (
                        <button
                          onClick={() => {
                            const skill = prompt('Add a skill:')
                            if (skill) addSkill(skill)
                          }}
                          className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-gray-400"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Skill Radar Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Competency Overview</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={90} domain={[0, 150]} />
                          <Radar
                            name="Skills"
                            dataKey="A"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.6}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Education Section */}
              {activeSection === 'education' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Education & Certifications</h3>
                  
                  {/* Education Timeline */}
                  <div className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-8 border-l-2 border-gray-200"
                    >
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-indigo-600 rounded-full" />
                      <div>
                        <h4 className="font-semibold">Master of Education</h4>
                        <p className="text-gray-600">Stanford University</p>
                        <p className="text-sm text-gray-500">2018 - 2020</p>
                        <p className="mt-2 text-gray-600">
                          Specialized in Educational Technology and Curriculum Development
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative pl-8 border-l-2 border-gray-200"
                    >
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-600 rounded-full" />
                      <div>
                        <h4 className="font-semibold">Bachelor of Science in Education</h4>
                        <p className="text-gray-600">UC Berkeley</p>
                        <p className="text-sm text-gray-500">2014 - 2018</p>
                        <p className="mt-2 text-gray-600">
                          Major in Elementary Education, Minor in Psychology
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h4 className="font-semibold mb-4">Certifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-start gap-3">
                          <CheckBadgeSolidIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                          <div>
                            <h5 className="font-medium">Google Certified Educator Level 2</h5>
                            <p className="text-sm text-gray-600 mt-1">Issued: March 2023</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-start gap-3">
                          <CheckBadgeSolidIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                          <div>
                            <h5 className="font-medium">Special Education Certification</h5>
                            <p className="text-sm text-gray-600 mt-1">Issued: January 2022</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {/* Experience Section */}
              {activeSection === 'experience' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Work Experience</h3>
                  
                  <div className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Senior Teacher</h4>
                          <p className="text-gray-600">Lincoln Elementary School</p>
                          <p className="text-sm text-gray-500">Aug 2020 - Present</p>
                          <ul className="mt-2 text-gray-600 space-y-1 list-disc list-inside">
                            <li>Lead teacher for 5th grade classroom with 28 students</li>
                            <li>Developed innovative STEM curriculum adopted district-wide</li>
                            <li>Mentored 3 new teachers through their first year</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Elementary Teacher</h4>
                          <p className="text-gray-600">Washington Elementary School</p>
                          <p className="text-sm text-gray-500">Aug 2018 - Jul 2020</p>
                          <ul className="mt-2 text-gray-600 space-y-1 list-disc list-inside">
                            <li>Taught 3rd grade with focus on reading comprehension</li>
                            <li>Increased student reading levels by average of 1.5 grades</li>
                            <li>Coordinated after-school tutoring program</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Portfolio Section */}
              {activeSection === 'portfolio' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Portfolio & Projects</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200"
                    >
                      <h4 className="font-semibold mb-2">STEM Curriculum Development</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Created comprehensive STEM curriculum for grades 3-5 focusing on hands-on learning
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Education</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">STEM</span>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200"
                    >
                      <h4 className="font-semibold mb-2">Reading Intervention Program</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Designed targeted intervention program that improved reading scores by 40%
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Literacy</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Research</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Photo Gallery */}
                  <div>
                    <h4 className="font-semibold mb-4">Photo Gallery</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => {
                            setSelectedImage(`/gallery-${i}.jpg`)
                            setShowLightbox(true)
                          }}
                        >
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Section */}
              {activeSection === 'activity' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    {[
                      { icon: CalendarDaysIcon, text: 'Created "Science Fair 2024" event', time: '2 hours ago', color: 'indigo' },
                      { icon: ChatBubbleLeftIcon, text: 'Commented on "Parent-Teacher Conference Tips"', time: '5 hours ago', color: 'blue' },
                      { icon: HeartSolidIcon, text: 'Liked "Innovative Teaching Methods" post', time: '1 day ago', color: 'pink' },
                      { icon: TrophyIcon, text: 'Earned "Event Creator" achievement', time: '2 days ago', color: 'yellow' },
                      { icon: UserGroupIcon, text: 'Joined "Elementary Educators" group', time: '3 days ago', color: 'purple' },
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 bg-${activity.color}-100 rounded-full flex items-center justify-center`}>
                          <activity.icon className={`h-5 w-5 text-${activity.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{activity.text}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics Section */}
              {activeSection === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Analytics</h3>
                  
                  {/* Profile Views Chart */}
                  <div>
                    <h4 className="font-medium mb-4">Profile Views This Week</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={profileViewsData}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorViews)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Engagement Breakdown */}
                  <div>
                    <h4 className="font-medium mb-4">Engagement Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={engagementData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {engagementData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                        {engagementData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <span className="text-sm text-gray-600">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Growth Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Followers Growth</h5>
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-700">+23%</p>
                      <p className="text-sm text-gray-600">vs last month</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Engagement Rate</h5>
                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-700">4.8%</p>
                      <p className="text-sm text-gray-600">Above average</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Profile Score</h5>
                        <StarSolidIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-700">92/100</p>
                      <p className="text-sm text-gray-600">Excellent</p>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Social Section */}
              {activeSection === 'social' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Social Connections</h3>
                  
                  {/* Similar Profiles */}
                  <div>
                    <h4 className="font-medium mb-4">People You May Know</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400" />
                          <div className="flex-1">
                            <h5 className="font-medium">Teacher {i}</h5>
                            <p className="text-sm text-gray-600">5th Grade Teacher</p>
                          </div>
                          <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                            Connect
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Testimonials */}
                  <div>
                    <h4 className="font-medium mb-4">Testimonials</h4>
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex-shrink-0" />
                          <div>
                            <h5 className="font-medium">Principal Johnson</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              "An exceptional educator who goes above and beyond for their students. Their innovative teaching methods have transformed our classroom dynamics."
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <StarSolidIcon key={i} className="h-4 w-4 text-yellow-500" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Section */}
              {activeSection === 'calendar' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Availability Calendar</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium mb-4">Office Hours</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Monday - Friday</span>
                        <span className="font-medium">3:00 PM - 5:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Saturday</span>
                        <span className="font-medium">By appointment</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sunday</span>
                        <span className="font-medium text-gray-400">Unavailable</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Schedule a Meeting</h4>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      <CalendarDaysIcon className="h-5 w-5" />
                      Book Appointment
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-center">Profile QR Code</h3>
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="Profile QR Code" className="w-48 h-48" />
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Scan this code to view the profile
              </p>
              <button
                onClick={() => setShowQRCode(false)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowLightbox(false)
              setSelectedImage(null)
            }}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Gallery"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => {
                setShowLightbox(false)
                setSelectedImage(null)
              }}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}