# Production Database Migration Guide

## 🚨 Critical Database Schema Issues

Based on the production errors, the following issues need to be resolved:

### Issues Identified:
1. **Missing `parent_communications` table** - No relationship found between parent_communications and profiles
2. **Missing columns in `students` table** - `first_name` column doesn't exist  
3. **Missing `logo_url` column in `schools` table**
4. **Missing parent feature tables** - lunch_accounts, academic_records, etc.

## 🔧 Migration Steps

### Step 1: Execute the Production Schema Fix

Run the following SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of supabase/fix-production-schema.sql
```

**OR** use the Supabase CLI:

```bash
# If you have supabase CLI installed
supabase db push
```

### Step 2: Verify Migration Success

After running the migration, verify the following tables exist:

- ✅ `parent_communications` - For parent-school communication
- ✅ `lunch_accounts` - For student lunch account management  
- ✅ `lunch_transactions` - Transaction history
- ✅ `academic_records` - Student grades and academic data
- ✅ `attendance_records` - Student attendance tracking
- ✅ `student_parents` - Parent-student relationships

### Step 3: Check Required Columns

Verify these columns exist:

**students table:**
- ✅ `first_name` TEXT
- ✅ `last_name` TEXT  
- ✅ `current_gpa` DECIMAL(3,2)
- ✅ `attendance_rate` DECIMAL(5,2)

**schools table:**
- ✅ `logo_url` TEXT
- ✅ `website` TEXT
- ✅ `contact_email` TEXT

### Step 4: Test the Application

After migration:
1. ✅ Parent dashboard should load without errors
2. ✅ Student data should display properly
3. ✅ Communications section should work
4. ✅ Lunch account information should show

## 🔐 Security Notes

- All tables have Row Level Security (RLS) enabled
- Parents can only see data for their own children
- Teachers can manage data for their school
- School admins have broader access within their school

## 📊 Sample Data

The migration includes sample data generation:
- Sample lunch account balances
- Sample parent communications
- Updated student names and GPAs
- School contact information

## 🆘 Troubleshooting

If you encounter issues:

1. **Foreign key errors**: Make sure the `profiles` table exists and has the correct structure
2. **Permission errors**: Ensure you're running as a database admin
3. **RLS issues**: Check that the auth.uid() function is working properly

## 🔄 Rollback Plan

If needed, you can rollback by dropping the new tables:

```sql
DROP TABLE IF EXISTS parent_communications CASCADE;
DROP TABLE IF EXISTS lunch_accounts CASCADE;
DROP TABLE IF EXISTS lunch_transactions CASCADE;
DROP TABLE IF EXISTS academic_records CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS student_parents CASCADE;
```

## ✅ Post-Migration Checklist

- [ ] All tables created successfully
- [ ] RLS policies are active
- [ ] Sample data is populated
- [ ] Application loads without database errors
- [ ] Parent dashboard displays student information
- [ ] Communications system works
- [ ] Lunch account features functional

---

**⚠️ Important**: This migration is designed to be safe and idempotent - it can be run multiple times without causing issues.