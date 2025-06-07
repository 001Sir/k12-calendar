#!/usr/bin/env node

/**
 * Quick diagnosis script for the ParentDashboardEnhanced error
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Diagnosing ParentDashboardEnhanced.jsx Error')
console.log('==============================================\n')

// Check .env file
console.log('1. Checking .env file...')
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL')
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY')
  
  console.log(`✅ .env file exists`)
  console.log(`${hasSupabaseUrl ? '✅' : '❌'} VITE_SUPABASE_URL is ${hasSupabaseUrl ? 'present' : 'missing'}`)
  console.log(`${hasSupabaseKey ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY is ${hasSupabaseKey ? 'present' : 'missing'}`)
} else {
  console.log('❌ .env file is missing')
}

// Check if ParentDashboardEnhanced file exists and is readable
console.log('\n2. Checking ParentDashboardEnhanced.jsx...')
const dashboardPath = path.join(__dirname, 'src/pages/dashboard/ParentDashboardEnhanced.jsx')
if (fs.existsSync(dashboardPath)) {
  console.log('✅ ParentDashboardEnhanced.jsx exists')
  
  // Check for syntax issues
  try {
    const content = fs.readFileSync(dashboardPath, 'utf8')
    
    // Check for duplicate imports
    const lines = content.split('\n')
    const imports = lines.filter(line => line.trim().startsWith('import'))
    const importSet = new Set()
    let duplicateImports = []
    
    imports.forEach(importLine => {
      if (importSet.has(importLine)) {
        duplicateImports.push(importLine)
      }
      importSet.add(importLine)
    })
    
    if (duplicateImports.length > 0) {
      console.log('❌ Found duplicate imports:')
      duplicateImports.forEach(dup => console.log(`   ${dup}`))
    } else {
      console.log('✅ No duplicate imports found')
    }
    
    // Check for CalendarIcon usage (should be CalendarDaysIcon)
    if (content.includes('CalendarIcon') && content.includes('CalendarDaysIcon')) {
      console.log('⚠️  Both CalendarIcon and CalendarDaysIcon found - check for conflicts')
    } else if (content.includes('CalendarIcon')) {
      console.log('❌ CalendarIcon found - should be CalendarDaysIcon')
    } else {
      console.log('✅ Icon imports look correct')
    }
    
  } catch (err) {
    console.log(`❌ Error reading file: ${err.message}`)
  }
} else {
  console.log('❌ ParentDashboardEnhanced.jsx is missing')
}

// Check if all hook files exist
console.log('\n3. Checking data hooks...')
const hooks = [
  'useStudents.js',
  'useCommunications.js', 
  'useAcademicRecords.js',
  'useLunchAccounts.js'
]

hooks.forEach(hook => {
  const hookPath = path.join(__dirname, 'src/hooks', hook)
  if (fs.existsSync(hookPath)) {
    console.log(`✅ ${hook} exists`)
  } else {
    console.log(`❌ ${hook} is missing`)
  }
})

// Check if Supabase lib exists
console.log('\n4. Checking Supabase configuration...')
const supabasePath = path.join(__dirname, 'src/lib/supabase.js')
if (fs.existsSync(supabasePath)) {
  console.log('✅ supabase.js exists')
} else {
  console.log('❌ supabase.js is missing')
}

// Check package.json dependencies
console.log('\n5. Checking dependencies...')
const packagePath = path.join(__dirname, 'package.json')
if (fs.existsSync(packagePath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const requiredDeps = [
      '@supabase/supabase-js',
      '@heroicons/react',
      'react-hot-toast',
      'date-fns'
    ]
    
    requiredDeps.forEach(dep => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        console.log(`✅ ${dep} is installed`)
      } else {
        console.log(`❌ ${dep} is missing`)
      }
    })
  } catch (err) {
    console.log(`❌ Error reading package.json: ${err.message}`)
  }
} else {
  console.log('❌ package.json is missing')
}

console.log('\n🚀 Solutions:')
console.log('1. Restart the development server:')
console.log('   Ctrl+C to stop, then: npm run dev')
console.log('2. If .env is missing, copy from .env.example')
console.log('3. Make sure all dependencies are installed: npm install')
console.log('4. Check browser console for additional error details')
console.log('5. If using CalendarIcon, replace with CalendarDaysIcon')

process.exit(0)