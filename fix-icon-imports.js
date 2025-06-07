#!/usr/bin/env node

/**
 * Fix icon import issues across all files
 * This script fixes common Heroicons v2 import issues
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 Fixing Icon Import Issues')
console.log('============================\n')

// Icon name mappings for Heroicons v2
const iconMappings = {
  'TrendingUpIcon': 'ArrowTrendingUpIcon',
  'TrendingDownIcon': 'ArrowTrendingDownIcon',
  'CalendarIcon': 'CalendarDaysIcon',
  // Add more mappings as needed
}

function fixIconsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false
    
    // Fix imports
    Object.entries(iconMappings).forEach(([oldName, newName]) => {
      const importRegex = new RegExp(`\\b${oldName}\\b`, 'g')
      if (content.includes(oldName)) {
        content = content.replace(importRegex, newName)
        changed = true
        console.log(`✅ Fixed ${oldName} → ${newName} in ${path.relative(__dirname, filePath)}`)
      }
    })
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }
    return false
  } catch (err) {
    console.log(`❌ Error fixing ${filePath}: ${err.message}`)
    return false
  }
}

function findJSXFiles(dir) {
  const files = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath)
      } else if (stat.isFile() && (item.endsWith('.jsx') || item.endsWith('.js'))) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

// Find all JSX/JS files in src directory
const srcDir = path.join(__dirname, 'src')
const files = findJSXFiles(srcDir)

console.log(`Found ${files.length} files to check...\n`)

let totalFixed = 0
files.forEach(file => {
  if (fixIconsInFile(file)) {
    totalFixed++
  }
})

console.log(`\n🎉 Fixed ${totalFixed} files`)

if (totalFixed === 0) {
  console.log('✅ All icon imports are already correct!')
} else {
  console.log('🚀 Restart your development server to see the changes.')
}

process.exit(0)