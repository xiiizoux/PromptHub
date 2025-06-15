-- 创建递增模板使用次数的函数
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE prompt_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- 创建更新模板评分的函数
CREATE OR REPLACE FUNCTION update_template_rating(template_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT AVG(rating)::DECIMAL(3,2) INTO avg_rating
    FROM template_ratings
    WHERE template_id = template_id;
    
    UPDATE prompt_templates 
    SET rating = COALESCE(avg_rating, 0.0),
        updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- 添加权限说明
COMMENT ON FUNCTION increment_template_usage(UUID) IS '递增模板使用次数';
COMMENT ON FUNCTION update_template_rating(UUID) IS '更新模板平均评分'; 