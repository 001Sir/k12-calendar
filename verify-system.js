#!/usr/bin/env node

/**
 * K12 Calendar System Verification Script
 * Checks system integrity and readiness for deployment
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 K12 Calendar System Verification')
console.log('=====================================\n')

let errorCount = 0
let warningCount = 0

function logError(message) {
  console.log(`❌ ERROR: ${message}`)
  errorCount++
}

function logWarning(message) {
  console.log(`⚠️  WARNING: ${message}`)
  warningCount++
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`)
}

// Check required files
console.log('📁 Checking Required Files...')
const requiredFiles = [
  'package.json',
  'vite.config.js',
  '.env.example',
  'src/App.jsx',
  'src/main.jsx',
  'src/index.css',
  'src/lib/supabase.js',
  'src/store/authStore.js',
  'supabase/schema.sql',
  'supabase/create-missing-tables.sql',
  'supabase/parent-features-schema.sql',
  'supabase/teacher-classroom-schema.sql',
  'supabase/full-migration.sql'
]

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    logSuccess(`Found ${file}`)
  } else {
    logError(`Missing required file: ${file}`)
  }
})

// Check dashboard components
console.log('\n🏗️  Checking Dashboard Components...')
const dashboardComponents = [
  'src/pages/dashboard/ParentDashboardEnhanced.jsx',
  'src/pages/dashboard/TeacherDashboardUpdated.jsx',
  'src/pages/dashboard/SchoolDashboardUpdated.jsx'
]

dashboardComponents.forEach(component => {
  const componentPath = path.join(__dirname, component)
  if (fs.existsSync(componentPath)) {
    logSuccess(`Found ${component}`)
  } else {
    logError(`Missing dashboard component: ${component}`)
  }
})

// Check data hooks
console.log('\n🪝 Checking Data Hooks...')
const dataHooks = [
  'src/hooks/useStudents.js',
  'src/hooks/useCommunications.js',
  'src/hooks/useAcademicRecords.js',
  'src/hooks/useLunchAccounts.js',
  'src/hooks/useClassroom.js',
  'src/hooks/useTeacherEvents.js',
  'src/hooks/useSchoolManagement.js'
]

dataHooks.forEach(hook => {
  const hookPath = path.join(__dirname, hook)
  if (fs.existsSync(hookPath)) {
    logSuccess(`Found ${hook}`)
  } else {
    logError(`Missing data hook: ${hook}`)
  }
})

// Check authentication components
console.log('\n🔐 Checking Authentication Components...')
const authComponents = [
  'src/components/auth/RoleBasedRoute.jsx',
  'src/pages/auth/LoginPage.jsx',
  'src/pages/auth/RegisterPage.jsx',
  'src/pages/auth/ResetPassword.jsx',
  'src/pages/auth/AuthCallback.jsx'
]

authComponents.forEach(component => {
  const componentPath = path.join(__dirname, component)
  if (fs.existsSync(componentPath)) {
    logSuccess(`Found ${component}`)
  } else {
    logError(`Missing auth component: ${component}`)
  }
})

// Check test files
console.log('\n🧪 Checking Test Infrastructure...')
const testFiles = [
  'src/tests/setup.js',
  'src/tests/hooks/useStudents.test.js',
  'src/tests/hooks/useCommunications.test.js',
  'src/tests/integration/ParentDashboard.test.jsx',
  'src/tests/integration/RouteProtection.test.jsx',
  'src/tests/e2e/userFlows.test.js'
]

testFiles.forEach(test => {
  const testPath = path.join(__dirname, test)
  if (fs.existsSync(testPath)) {
    logSuccess(`Found ${test}`)
  } else {
    logWarning(`Missing test file: ${test}`)
  }
})

// Check package.json dependencies
console.log('\n📦 Checking Dependencies...')
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
  
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    '@heroicons/react',
    'framer-motion',
    'date-fns',
    'react-hot-toast',
    'zustand',
    'clsx',
    'tailwind-merge'
  ]

  const requiredDevDeps = [
    'vite',
    '@vitejs/plugin-react',
    'tailwindcss',
    'vitest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    'jsdom'
  ]

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      logSuccess(`Found dependency: ${dep}`)
    } else {
      logError(`Missing dependency: ${dep}`)
    }
  })

  requiredDevDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      logSuccess(`Found dev dependency: ${dep}`)
    } else {
      logWarning(`Missing dev dependency: ${dep}`)
    }
  })

  // Check test scripts
  if (packageJson.scripts && packageJson.scripts.test) {
    logSuccess('Found test script in package.json')
  } else {
    logError('Missing test script in package.json')
  }

} catch (err) {
  logError('Could not read package.json')
}

// Check for common issues
console.log('\n🔍 Checking for Common Issues...')

// Check for CalendarIcon imports (should be CalendarDaysIcon)
const jsxFiles = [
  'src/components/common/EventCard.jsx',
  'src/pages/events/EventDetails.jsx',
  'src/pages/public/EventsExplore.jsx',
  'src/pages/profile/EnhancedProfile.jsx',
  'src/pages/dashboard/ParentDashboardEnhanced.jsx'
]

jsxFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes('CalendarIcon') && !content.includes('CalendarDaysIcon')) {
      logError(`${file} still uses CalendarIcon instead of CalendarDaysIcon`)
    } else {
      logSuccess(`${file} uses correct icon imports`)
    }
  }
})

// Check App.jsx routes
console.log('\n🛣️  Checking Routes...')
const appPath = path.join(__dirname, 'src/App.jsx')
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8')
  
  if (appContent.includes('RoleBasedRoute')) {
    logSuccess('App.jsx uses RoleBasedRoute for protection')
  } else {
    logError('App.jsx missing RoleBasedRoute protection')
  }
  
  if (appContent.includes('ParentDashboardEnhanced')) {
    logSuccess('App.jsx uses updated ParentDashboard')
  } else {
    logWarning('App.jsx might be using old ParentDashboard')
  }
  
  if (appContent.includes('TeacherDashboardUpdated')) {
    logSuccess('App.jsx uses updated TeacherDashboard')
  } else {
    logWarning('App.jsx might be using old TeacherDashboard')
  }
}

// Environment check
console.log('\n🌍 Environment Configuration...')
const envExample = path.join(__dirname, '.env.example')
const envLocal = path.join(__dirname, '.env')

if (fs.existsSync(envExample)) {
  logSuccess('Found .env.example file')
} else {
  logWarning('Missing .env.example file')
}

if (fs.existsSync(envLocal)) {
  logInfo('Found .env file (check that it contains correct Supabase credentials)')
} else {
  logWarning('No .env file found - create one from .env.example')
}

// Final summary
console.log('\n📊 Verification Summary')
console.log('======================')

if (errorCount === 0 && warningCount === 0) {
  console.log('🎉 PERFECT! System is ready for deployment!')
} else if (errorCount === 0) {
  console.log(`✨ GOOD! System is ready with ${warningCount} minor warning(s)`)
} else {
  console.log(`🚨 ISSUES FOUND: ${errorCount} error(s) and ${warningCount} warning(s) need attention`)
}

console.log(`\nErrors: ${errorCount}`)
console.log(`Warnings: ${warningCount}`)

if (errorCount === 0) {
  console.log('\n🚀 Next Steps:')
  console.log('1. Run: npm install')
  console.log('2. Create .env file with Supabase credentials')
  console.log('3. Run database migrations')
  console.log('4. Start with: npm run dev')
  console.log('5. Run tests: npm test')
  console.log('6. Deploy to production!')
}

process.exit(errorCount > 0 ? 1 : 0)