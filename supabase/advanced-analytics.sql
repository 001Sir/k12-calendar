-- Advanced Analytics Schema for K12 Calendar
-- This adds sophisticated tracking and analytics capabilities

-- Event Analytics Table
CREATE TABLE IF NOT EXISTS event_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    rsvp_clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(event_id, date)
);

-- Revenue Tracking Table
CREATE TABLE IF NOT EXISTS revenue_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('ticket_sale', 'refund', 'donation')),
    user_id UUID REFERENCES auth.users(id),
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Attendance Patterns Table
CREATE TABLE IF NOT EXISTS attendance_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    event_type TEXT,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
    average_attendance DECIMAL(5, 2),
    total_events INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Event Comments Table
CREATE TABLE IF NOT EXISTS event_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(comment_id, user_id)
);

-- Event Waitlist Table
CREATE TABLE IF NOT EXISTS event_waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, user_id)
);

-- Event Check-ins Table
CREATE TABLE IF NOT EXISTS event_checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    check_in_method TEXT DEFAULT 'manual',
    qr_code TEXT,
    location POINT,
    UNIQUE(event_id, user_id)
);

-- School Analytics Summary (Materialized View)
CREATE MATERIALIZED VIEW IF NOT EXISTS school_analytics_summary AS
SELECT 
    s.id as school_id,
    s.name as school_name,
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_events,
    COUNT(DISTINCT ea.user_id) as total_attendees,
    COALESCE(SUM(rt.amount), 0) as total_revenue,
    AVG(EXTRACT(EPOCH FROM (e.end_time - e.start_time))/3600) as avg_event_duration_hours,
    COUNT(DISTINCT DATE_TRUNC('month', e.start_time)) as months_active
FROM schools s
LEFT JOIN events e ON s.id = e.school_id
LEFT JOIN event_attendees ea ON e.id = ea.event_id
LEFT JOIN revenue_tracking rt ON e.id = rt.event_id AND rt.status = 'completed'
GROUP BY s.id, s.name;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_analytics_event_date ON event_analytics(event_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_event ON revenue_tracking(event_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_patterns_school ON attendance_patterns(school_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_event ON event_waitlist(event_id, position);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event ON event_checkins(event_id, checked_in_at DESC);

-- Enable RLS
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_analytics
CREATE POLICY "School admins can view their analytics" ON event_analytics
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e
        JOIN profiles p ON p.school_id = e.school_id
        WHERE e.id = event_analytics.event_id
        AND p.user_id = auth.uid()
        AND p.role = 'school_admin'
    )
);

-- RLS Policies for event_comments
CREATE POLICY "Anyone can view comments" ON event_comments
FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create comments" ON event_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON event_comments
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for event_waitlist
CREATE POLICY "Users can view waitlists they're on" ON event_waitlist
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM events e
    JOIN profiles p ON p.school_id = e.school_id
    WHERE e.id = event_waitlist.event_id
    AND p.user_id = auth.uid()
    AND p.role IN ('school_admin', 'teacher')
));

CREATE POLICY "Users can join waitlists" ON event_waitlist
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for analytics
CREATE OR REPLACE FUNCTION calculate_event_conversion_rate(p_event_id UUID)
RETURNS TABLE(
    views BIGINT,
    rsvp_clicks BIGINT,
    conversions BIGINT,
    view_to_click_rate DECIMAL,
    click_to_conversion_rate DECIMAL,
    overall_conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ea.views), 0) as views,
        COALESCE(SUM(ea.rsvp_clicks), 0) as rsvp_clicks,
        COALESCE(SUM(ea.conversions), 0) as conversions,
        CASE 
            WHEN SUM(ea.views) > 0 
            THEN ROUND((SUM(ea.rsvp_clicks)::DECIMAL / SUM(ea.views)) * 100, 2)
            ELSE 0
        END as view_to_click_rate,
        CASE 
            WHEN SUM(ea.rsvp_clicks) > 0 
            THEN ROUND((SUM(ea.conversions)::DECIMAL / SUM(ea.rsvp_clicks)) * 100, 2)
            ELSE 0
        END as click_to_conversion_rate,
        CASE 
            WHEN SUM(ea.views) > 0 
            THEN ROUND((SUM(ea.conversions)::DECIMAL / SUM(ea.views)) * 100, 2)
            ELSE 0
        END as overall_conversion_rate
    FROM event_analytics ea
    WHERE ea.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending events
CREATE OR REPLACE FUNCTION get_trending_events(p_school_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
    event_id UUID,
    event_title TEXT,
    trend_score DECIMAL,
    recent_views INTEGER,
    recent_conversions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.title as event_title,
        (
            COALESCE(SUM(ea.views), 0) * 0.3 + 
            COALESCE(SUM(ea.conversions), 0) * 0.7
        ) as trend_score,
        COALESCE(SUM(ea.views), 0)::INTEGER as recent_views,
        COALESCE(SUM(ea.conversions), 0)::INTEGER as recent_conversions
    FROM events e
    LEFT JOIN event_analytics ea ON e.id = ea.event_id 
        AND ea.date >= CURRENT_DATE - INTERVAL '7 days'
    WHERE e.school_id = p_school_id
        AND e.status = 'active'
        AND e.start_time > NOW()
    GROUP BY e.id, e.title
    ORDER BY trend_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track event views
CREATE OR REPLACE FUNCTION track_event_view(p_event_id UUID, p_unique BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO event_analytics (event_id, date, views, unique_views)
    VALUES (p_event_id, CURRENT_DATE, 1, CASE WHEN p_unique THEN 1 ELSE 0 END)
    ON CONFLICT (event_id, date) DO UPDATE
    SET 
        views = event_analytics.views + 1,
        unique_views = event_analytics.unique_views + CASE WHEN p_unique THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW school_analytics_summary;
END;
$$ LANGUAGE plpgsql;