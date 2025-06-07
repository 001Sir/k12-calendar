# K12 Calendar System - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Git repository (optional)

### 1. Environment Setup

Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run these scripts in order:
   - `supabase/schema.sql`
   - `supabase/create-missing-tables.sql`
   - `supabase/parent-features-schema.sql`
   - `supabase/teacher-classroom-schema.sql`

#### Option B: Using CLI
```bash
# If you have psql installed
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/schema.sql
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/create-missing-tables.sql
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/parent-features-schema.sql
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/teacher-classroom-schema.sql
```

#### Option C: All-in-One Migration
```bash
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/full-migration.sql
```

### 4. Test Data (Optional)
```bash
psql -h db.your-project-id.supabase.co -U postgres -d postgres -f supabase/seed-test-data.sql
```

### 5. Run Application
```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

## 🏗️ Production Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial K12 Calendar deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy

3. **Domain Setup**
   - Configure custom domain in Vercel dashboard
   - Update Supabase auth settings with new domain

### Netlify Deployment

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables**
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy**
   ```bash
   # Using Netlify CLI
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

### Self-Hosted Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Serve with nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/k12-calendar/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **SSL Certificate**
   ```bash
   # Using Let's Encrypt
   sudo certbot --nginx -d your-domain.com
   ```

## 🔧 Configuration

### Supabase Configuration

1. **Authentication Settings**
   - Enable email authentication
   - Configure redirect URLs
   - Set up email templates

2. **Row Level Security**
   All tables have RLS enabled with appropriate policies.

3. **Storage (Optional)**
   ```sql
   -- Create storage bucket for files
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('uploads', 'uploads', true);
   ```

### Performance Optimization

1. **Supabase Indexes**
   All necessary indexes are created automatically by the migration scripts.

2. **Caching Headers**
   ```nginx
   # Add to nginx config
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **CDN Setup**
   Configure Cloudflare or similar CDN for static assets.

## 👥 User Management

### Creating Admin User

1. **Sign up through the app** using your admin email
2. **Update profile in database**:
   ```sql
   UPDATE profiles 
   SET role = 'school_admin',
       school_id = (SELECT id FROM schools LIMIT 1)
   WHERE email = 'admin@yourschool.edu';
   ```

### Creating Test Users

Use the seed data script to create test accounts for each role:
- `admin@test.com` (School Admin)
- `teacher@test.com` (Teacher)
- `parent@test.com` (Parent)

## 🧪 Testing in Production

### End-to-End Testing
```bash
npm test
npm run test:e2e
```

### Manual Testing Checklist

**Authentication:**
- [ ] User can sign up
- [ ] User can log in
- [ ] User can reset password
- [ ] Role-based redirects work

**Parent Flow:**
- [ ] Parent dashboard loads with children
- [ ] Can view academic records
- [ ] Can manage lunch accounts
- [ ] Can RSVP to events
- [ ] Communication system works

**Teacher Flow:**
- [ ] Teacher dashboard loads with classroom
- [ ] Can manage students
- [ ] Can create events
- [ ] Can take attendance
- [ ] Can enter grades

**School Admin Flow:**
- [ ] Admin dashboard shows school statistics
- [ ] Can manage teachers and classrooms
- [ ] Can create school-wide events
- [ ] Can generate reports

## 🔍 Monitoring & Maintenance

### Health Checks

1. **Database Connection**
   ```sql
   SELECT 1;
   ```

2. **Authentication**
   ```javascript
   // Test in browser console
   window.supabase.auth.getUser()
   ```

3. **Real-time Features**
   Test parent communications and notifications.

### Performance Monitoring

1. **Supabase Dashboard**
   - Monitor query performance
   - Check database usage
   - Review error logs

2. **Application Metrics**
   - Page load times
   - Error rates
   - User engagement

### Backup Strategy

1. **Database Backups**
   ```bash
   # Daily backup
   pg_dump -h db.your-project-id.supabase.co -U postgres postgres > backup-$(date +%Y%m%d).sql
   ```

2. **File Backups**
   Regular backups of Supabase storage if using file uploads.

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check environment variables
   - Verify Supabase URL and keys
   - Check auth settings in Supabase

2. **Database Connection Errors**
   - Verify migration scripts ran successfully
   - Check RLS policies
   - Ensure user permissions are correct

3. **Build Errors**
   - Verify all dependencies are installed
   - Check for missing environment variables
   - Review console errors

### Error Monitoring

1. **Setup Sentry (Optional)**
   ```bash
   npm install @sentry/react
   ```

2. **Error Boundaries**
   The app includes error boundaries for graceful error handling.

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 📋 Post-Deployment Checklist

- [ ] All migrations completed successfully
- [ ] Test users can sign up and access appropriate dashboards
- [ ] Real-time features working (communications, notifications)
- [ ] Email authentication configured
- [ ] SSL certificate installed (if self-hosting)
- [ ] Performance monitoring set up
- [ ] Backup strategy implemented
- [ ] Error monitoring configured
- [ ] Team trained on system usage

## 🔄 Updates & Maintenance

### Updating the Application

1. **Backup database** before major updates
2. **Test changes** in staging environment
3. **Deploy updates** using your chosen platform
4. **Run database migrations** if schema changes
5. **Monitor for issues** after deployment

### Version Control

Tag releases for easy rollbacks:
```bash
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

## 📞 Support

For technical support:
- Check application logs
- Review database logs in Supabase
- Consult this documentation
- Create issues in project repository