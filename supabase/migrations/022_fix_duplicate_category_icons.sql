-- =============================================
-- 022_fix_duplicate_category_icons.sql
-- Fix duplicate icon values in categories table
-- Replace duplicate icons with appropriate alternatives based on name_en
-- =============================================

-- Fix duplicate 'heart' icon
-- Medical Health (health) keeps 'heart' as it's appropriate for health
-- Psychology Counseling (psychology) changes to 'chat-bubble-left-right' for counseling/communication

UPDATE categories
SET icon = 'chat-bubble-left-right',
    updated_at = NOW()
WHERE name_en = 'psychology' 
  AND icon = 'heart';

-- Fix duplicate 'book-open' icon
-- Educational Tutoring (education) keeps 'book-open' as it's appropriate for education
-- Storytelling (Storytelling - case insensitive) changes to 'film' for story/video narrative

UPDATE categories
SET icon = 'film',
    updated_at = NOW()
WHERE LOWER(name_en) = 'storytelling' 
  AND icon = 'book-open';

-- Fix duplicate 'academic-cap' icon
-- Academic Research (academic) keeps 'academic-cap' as it's appropriate for academic
-- Educational Video (Educational Video) changes to 'video-camera' for video content

UPDATE categories
SET icon = 'video-camera',
    updated_at = NOW()
WHERE name_en = 'Educational Video' 
  AND icon = 'academic-cap';

-- Fix duplicate 'chat-bubble-left-right' icon
-- Psychology Counseling (psychology) keeps 'chat-bubble-left-right' as it's appropriate for counseling
-- General Chat (general) changes to 'sparkles' for general/versatile AI assistant

UPDATE categories
SET icon = 'sparkles',
    updated_at = NOW()
WHERE name_en = 'general' 
  AND icon = 'chat-bubble-left-right';

-- Verify the fix by checking for remaining duplicates
-- Display icon usage statistics
SELECT 
    icon,
    COUNT(*) as count,
    string_agg(name || ' (' || name_en || ')', ', ' ORDER BY name) as categories
FROM categories
WHERE icon IS NOT NULL
GROUP BY icon
HAVING COUNT(*) > 1
ORDER BY icon;

-- If no rows are returned, all duplicates have been fixed
-- Display final icon distribution
SELECT 
    icon,
    COUNT(*) as count,
    string_agg(name || ' (' || name_en || ')', ', ' ORDER BY name) as categories
FROM categories
WHERE icon IS NOT NULL
GROUP BY icon
ORDER BY icon;

