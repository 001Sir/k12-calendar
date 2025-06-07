import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { signUp } from '../../lib/supabase'
import { cn } from '../../utils/cn'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['parent', 'teacher', 'school_admin', 'district_admin']),
  schoolName: z.string().optional(),
  district: z.string().optional(),
  inviteCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function SignupForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const defaultRole = searchParams.get('role') || 'parent'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: defaultRole,
    },
  })

  const watchRole = watch('role')
  const isSchoolRole = watchRole === 'school_admin' || watchRole === 'district_admin'

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const metadata = {
        full_name: data.fullName,
        role: data.role,
        ...(isSchoolRole && {
          school_name: data.schoolName,
          district: data.district,
          invite_code: data.inviteCode,
        }),
      }

      const { error } = await signUp(data.email, data.password, metadata)
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Account created! Please check your email to verify.')
        navigate('/login')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            {t('auth.fullNameLabel')}
          </label>
          <input
            {...register('fullName')}
            type="text"
            autoComplete="name"
            className={cn(
              "mt-1 block w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-indigo-500 focus:ring-indigo-500",
              "px-3 py-2 border",
              errors.fullName && "border-red-500"
            )}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('auth.emailLabel')}
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={cn(
              "mt-1 block w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-indigo-500 focus:ring-indigo-500",
              "px-3 py-2 border",
              errors.email && "border-red-500"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            {t('auth.roleLabel')}
          </label>
          <select
            {...register('role')}
            className={cn(
              "mt-1 block w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-indigo-500 focus:ring-indigo-500",
              "px-3 py-2 border",
              errors.role && "border-red-500"
            )}
          >
            <option value="parent">{t('auth.roles.parent')}</option>
            <option value="teacher">{t('auth.roles.teacher')}</option>
            <option value="school_admin">{t('auth.roles.schoolAdmin')}</option>
            <option value="district_admin">{t('auth.roles.districtAdmin')}</option>
          </select>
        </div>

        {isSchoolRole && (
          <>
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                {t('auth.schoolNameLabel')}
              </label>
              <input
                {...register('schoolName')}
                type="text"
                className={cn(
                  "mt-1 block w-full rounded-md border-gray-300 shadow-sm",
                  "focus:border-indigo-500 focus:ring-indigo-500",
                  "px-3 py-2 border"
                )}
              />
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                {t('auth.districtLabel')}
              </label>
              <input
                {...register('district')}
                type="text"
                className={cn(
                  "mt-1 block w-full rounded-md border-gray-300 shadow-sm",
                  "focus:border-indigo-500 focus:ring-indigo-500",
                  "px-3 py-2 border"
                )}
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('auth.passwordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={cn(
                "block w-full rounded-md border-gray-300 shadow-sm",
                "focus:border-indigo-500 focus:ring-indigo-500",
                "px-3 py-2 pr-10 border",
                errors.password && "border-red-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('auth.confirmPasswordLabel')}
          </label>
          <div className="relative mt-1">
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={cn(
                "block w-full rounded-md border-gray-300 shadow-sm",
                "focus:border-indigo-500 focus:ring-indigo-500",
                "px-3 py-2 pr-10 border",
                errors.confirmPassword && "border-red-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm",
              "text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              t('auth.signupTitle')
            )}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">{t('auth.haveAccount')}</span>{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t('common.login')}
          </Link>
        </div>
      </form>
    </motion.div>
  )
}