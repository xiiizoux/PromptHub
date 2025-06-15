-- 修复版本：先添加唯一约束，然后安全插入数据

-- 为 prompt_templates 表的 name 字段添加唯一约束（如果不存在）
DO $$ 
BEGIN
    -- 检查约束是否已存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'prompt_templates_name_key' 
        AND table_name = 'prompt_templates'
    ) THEN
        ALTER TABLE prompt_templates ADD CONSTRAINT prompt_templates_name_key UNIQUE (name);
    END IF;
END $$;

-- 清理现有模板数据（避免冲突）
DELETE FROM template_ratings WHERE template_id IN (
    SELECT id FROM prompt_templates WHERE is_official = true
);
DELETE FROM template_usage_stats WHERE template_id IN (
    SELECT id FROM prompt_templates WHERE is_official = true
);
DELETE FROM prompt_templates WHERE is_official = true;

-- 插入模板分类数据（使用UPSERT）
INSERT INTO template_categories (name, display_name, description, icon, color, sort_order) VALUES
('writing', '写作助手', '各种写作场景的专业模板', 'PencilIcon', 'text-blue-400', 1),
('creative', '创意设计', '激发创意灵感的模板集合', 'SparklesIcon', 'text-purple-400', 2),
('business', '商务应用', '提升工作效率的商务模板', 'BriefcaseIcon', 'text-green-400', 3),
('education', '教育培训', '教学和学习的专业模板', 'AcademicCapIcon', 'text-yellow-400', 4),
('analysis', '分析研究', '数据分析和研究类模板', 'ChartBarIcon', 'text-red-400', 5),
('communication', '沟通交流', '各种沟通场景的模板', 'ChatBubbleLeftRightIcon', 'text-indigo-400', 6),
('technical', '技术开发', '技术文档和开发相关模板', 'DocumentTextIcon', 'text-cyan-400', 7),
('personal', '个人生活', '日常生活和个人发展模板', 'UserGroupIcon', 'text-pink-400', 8)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- 插入官方模板数据
INSERT INTO prompt_templates (
    name, title, description, content, category, subcategory, tags, difficulty, 
    variables, fields, author, likes, usage_count, rating, estimated_time, 
    is_featured, is_premium, is_official, sort_order
) VALUES
-- 写作助手类模板
(
    'professional_analyst',
    '专业分析师',
    '扮演专业分析师角色，为各类主题提供深度分析和见解',
    '你是一位专业的{{领域}}分析师，拥有丰富的行业经验和敏锐的洞察力。

请对以下内容进行深入分析：
{{分析对象}}

分析要求：
1. 从多个角度进行全面分析
2. 提供具体的数据和事实支撑
3. 给出可行的建议和解决方案

输出格式：
## 现状分析
[详细分析当前情况]

## 问题识别
[指出关键问题]

## 解决方案
[提供具体建议]

## 总结
[简要总结要点]',
    'analysis',
    'professional',
    ARRAY['分析', '专业', '深度研究', '商业'],
    'intermediate',
    '[
        {"name": "领域", "type": "text", "description": "专业领域，如金融、科技、市场等", "required": true},
        {"name": "分析对象", "type": "textarea", "description": "需要分析的具体内容或问题", "required": true}
    ]'::jsonb,
    '[
        {"key": "领域", "label": "专业领域", "type": "text", "placeholder": "例如：金融、科技、市场营销", "required": true},
        {"key": "分析对象", "label": "分析对象", "type": "textarea", "placeholder": "请描述需要分析的具体内容或问题", "required": true}
    ]'::jsonb,
    'AI专家团队',
    234,
    1200,
    4.8,
    '10-15分钟',
    true,
    false,
    true,
    1
),

(
    'creative_assistant',
    '创作助手',
    '富有创意的内容创作助手，适用于各种创作场景',
    '你是一位富有创意的{{类型}}创作者，擅长{{风格}}风格的内容创作。

创作任务：{{具体需求}}

创作要求：
- 目标受众：{{受众群体}}
- 内容长度：{{长度要求}}
- 风格调性：{{风格要求}}
- 特殊要求：{{其他要求}}

请创作出既有创意又实用的内容，确保符合以上所有要求。',
    'creative',
    'content',
    ARRAY['创作', '内容', '创意', '写作'],
    'beginner',
    '[
        {"name": "类型", "type": "select", "options": ["文案", "故事", "诗歌", "剧本"], "description": "创作类型", "required": true},
        {"name": "风格", "type": "text", "description": "创作风格", "required": true},
        {"name": "具体需求", "type": "textarea", "description": "具体的创作需求", "required": true},
        {"name": "受众群体", "type": "text", "description": "目标受众", "required": false},
        {"name": "长度要求", "type": "text", "description": "内容长度要求", "required": false},
        {"name": "风格要求", "type": "text", "description": "风格调性要求", "required": false},
        {"name": "其他要求", "type": "textarea", "description": "其他特殊要求", "required": false}
    ]'::jsonb,
    '[
        {"key": "类型", "label": "创作类型", "type": "select", "options": ["文案", "故事", "诗歌", "剧本"], "required": true},
        {"key": "风格", "label": "创作风格", "type": "text", "placeholder": "例如：幽默风趣、正式严谨", "required": true},
        {"key": "具体需求", "label": "创作需求", "type": "textarea", "placeholder": "请详细描述您的创作需求", "required": true},
        {"key": "受众群体", "label": "目标受众", "type": "text", "placeholder": "例如：年轻人、商务人士", "required": false},
        {"key": "长度要求", "label": "内容长度", "type": "text", "placeholder": "例如：500字左右", "required": false},
        {"key": "风格要求", "label": "风格调性", "type": "text", "placeholder": "例如：轻松活泼、专业严谨", "required": false},
        {"key": "其他要求", "label": "特殊要求", "type": "textarea", "placeholder": "其他需要注意的要求", "required": false}
    ]'::jsonb,
    'AI创作团队',
    456,
    2100,
    4.9,
    '8-12分钟',
    true,
    false,
    true,
    2
),

(
    'problem_solver',
    '问题解决专家',
    '系统性解决复杂问题的专业助手',
    '你是一位经验丰富的问题解决专家，善于分析复杂问题并提供系统性解决方案。

问题描述：{{问题详情}}

请按照以下步骤帮我解决：

1. **问题分析**
   - 问题的根本原因是什么？
   - 涉及哪些关键因素？

2. **解决方案**
   - 提供3-5个可行的解决方案
   - 分析每个方案的优缺点

3. **实施建议**
   - 推荐最佳方案
   - 提供具体的实施步骤

4. **风险预警**
   - 可能遇到的风险
   - 应对措施',
    'business',
    'problem_solving',
    ARRAY['问题解决', '分析', '方案', '实施'],
    'intermediate',
    '[
        {"name": "问题详情", "type": "textarea", "description": "详细描述需要解决的问题", "required": true}
    ]'::jsonb,
    '[
        {"key": "问题详情", "label": "问题描述", "type": "textarea", "placeholder": "请详细描述您遇到的问题，包括背景、现状、困难等", "required": true}
    ]'::jsonb,
    'AI咨询团队',
    312,
    1450,
    4.6,
    '15-20分钟',
    true,
    false,
    true,
    3
),

(
    'learning_tutor',
    '学习指导师',
    '个性化学习计划制定和指导专家',
    '你是一位专业的{{学科}}学习指导师，擅长根据学习者的水平制定个性化学习方案。

学习需求：
- 学习主题：{{主题}}
- 当前水平：{{水平描述}}
- 学习目标：{{目标}}
- 可用时间：{{时间安排}}

请为我制定一个系统的学习计划：

## 📚 学习路径
[详细的学习步骤]

## 📝 学习资源
[推荐的学习材料]

## ⏰ 时间安排
[具体的时间规划]

## 🎯 检验标准
[学习效果评估方法]',
    'education',
    'tutoring',
    ARRAY['教育', '学习', '指导', '计划'],
    'beginner',
    '[
        {"name": "学科", "type": "text", "description": "学习学科", "required": true},
        {"name": "主题", "type": "text", "description": "具体学习主题", "required": true},
        {"name": "水平描述", "type": "text", "description": "当前水平", "required": true},
        {"name": "目标", "type": "text", "description": "学习目标", "required": true},
        {"name": "时间安排", "type": "text", "description": "可用时间", "required": true}
    ]'::jsonb,
    '[
        {"key": "学科", "label": "学习学科", "type": "text", "placeholder": "例如：编程、英语、数学", "required": true},
        {"key": "主题", "label": "学习主题", "type": "text", "placeholder": "例如：Python基础、商务英语", "required": true},
        {"key": "水平描述", "label": "当前水平", "type": "text", "placeholder": "例如：零基础、有一定了解", "required": true},
        {"key": "目标", "label": "学习目标", "type": "text", "placeholder": "例如：能够独立完成项目", "required": true},
        {"key": "时间安排", "label": "可用时间", "type": "text", "placeholder": "例如：每天2小时，持续3个月", "required": true}
    ]'::jsonb,
    'AI教育团队',
    167,
    720,
    4.8,
    '12-18分钟',
    true,
    false,
    true,
    4
),

(
    'email_writer',
    '邮件撰写助手',
    '快速生成各种场景的专业邮件',
    '你是一个专业的邮件写作助手。

请帮我写一封{{邮件类型}}邮件，内容如下：

收件人：{{收件人}}
主题：{{主题}}
主要内容：{{主要内容}}
语调：{{语调}}

请确保邮件：
1. 语言{{语调}}且专业
2. 结构清晰
3. 包含适当的开头和结尾
4. 长度适中

输出格式：
主题：[邮件主题]
正文：[邮件正文]',
    'writing',
    'email',
    ARRAY['邮件', '商务', '沟通', '专业'],
    'beginner',
    '[
        {"name": "邮件类型", "type": "select", "options": ["商务邮件", "感谢邮件", "道歉邮件", "询问邮件", "通知邮件"], "description": "邮件类型", "required": true},
        {"name": "收件人", "type": "text", "description": "收件人姓名或称呼", "required": true},
        {"name": "主题", "type": "text", "description": "邮件主题", "required": true},
        {"name": "主要内容", "type": "textarea", "description": "邮件主要内容要点", "required": true},
        {"name": "语调", "type": "select", "options": ["正式", "友好", "紧急", "感谢"], "description": "邮件语调", "required": true}
    ]'::jsonb,
    '[
        {"key": "邮件类型", "label": "邮件类型", "type": "select", "options": ["商务邮件", "感谢邮件", "道歉邮件", "询问邮件", "通知邮件"], "required": true},
        {"key": "收件人", "label": "收件人", "type": "text", "placeholder": "例如：张经理、李总", "required": true},
        {"key": "主题", "label": "邮件主题", "type": "text", "placeholder": "例如：关于项目进展的汇报", "required": true},
        {"key": "主要内容", "label": "主要内容", "type": "textarea", "placeholder": "请描述邮件的主要内容要点", "required": true},
        {"key": "语调", "label": "语调风格", "type": "select", "options": ["正式", "友好", "紧急", "感谢"], "required": true}
    ]'::jsonb,
    'AI写作团队',
    523,
    2800,
    4.7,
    '5分钟',
    true,
    false,
    true,
    5
),

(
    'code_reviewer',
    '代码审查专家',
    '专业的代码质量检查和改进建议助手',
    '你是一个经验丰富的{{编程语言}}开发者和代码审查员。

请审查以下{{代码类型}}代码：

```{{编程语言}}
{{代码内容}}
```

审查重点：{{审查重点}}

请提供：
1. 代码质量评估
2. 潜在问题识别
3. 性能优化建议
4. 最佳实践建议
5. 修改建议（如需要）

输出格式：
## 总体评价
[整体评价]

## 发现的问题
[问题列表]

## 改进建议
[具体建议]

## 优化后的代码
[如果需要重写，提供优化版本]',
    'technical',
    'code_review',
    ARRAY['代码', '审查', '质量', '优化'],
    'advanced',
    '[
        {"name": "编程语言", "type": "select", "options": ["JavaScript", "Python", "Java", "C++", "Go", "PHP"], "description": "编程语言", "required": true},
        {"name": "代码类型", "type": "select", "options": ["函数", "类", "模块", "组件"], "description": "代码类型", "required": true},
        {"name": "代码内容", "type": "textarea", "description": "要审查的代码", "required": true},
        {"name": "审查重点", "type": "select", "options": ["性能优化", "安全性", "可读性", "最佳实践"], "description": "审查重点", "required": true}
    ]'::jsonb,
    '[
        {"key": "编程语言", "label": "编程语言", "type": "select", "options": ["JavaScript", "Python", "Java", "C++", "Go", "PHP"], "required": true},
        {"key": "代码类型", "label": "代码类型", "type": "select", "options": ["函数", "类", "模块", "组件"], "required": true},
        {"key": "代码内容", "label": "代码内容", "type": "textarea", "placeholder": "请粘贴需要审查的代码", "required": true},
        {"key": "审查重点", "label": "审查重点", "type": "select", "options": ["性能优化", "安全性", "可读性", "最佳实践"], "required": true}
    ]'::jsonb,
    'AI技术团队',
    189,
    850,
    4.9,
    '8-15分钟',
    true,
    true,
    true,
    6
),

(
    'meeting_minutes',
    '会议纪要生成器',
    '将会议录音或笔记转换为专业的会议纪要',
    '你是一个专业的会议纪要整理助手。

请将以下会议内容整理成专业的会议纪要：

会议信息：
- 会议主题：{{会议主题}}
- 参会人员：{{参会人员}}
- 会议时间：{{会议时间}}
- 会议地点：{{会议地点}}

会议内容：
{{会议内容}}

请按照以下格式整理：

# 会议纪要

## 基本信息
- **会议主题**：{{会议主题}}
- **时间**：{{会议时间}}
- **地点**：{{会议地点}}
- **参会人员**：{{参会人员}}

## 会议内容
[整理讨论的主要内容]

## 决议事项
[明确的决定和结论]

## 行动计划
[具体的任务分工和时间节点]

## 待办事项
[需要跟进的问题]',
    'business',
    'meeting',
    ARRAY['会议', '纪要', '整理', '商务'],
    'intermediate',
    '[
        {"name": "会议主题", "type": "text", "description": "会议主题", "required": true},
        {"name": "参会人员", "type": "text", "description": "参会人员列表", "required": true},
        {"name": "会议时间", "type": "text", "description": "会议时间", "required": true},
        {"name": "会议地点", "type": "text", "description": "会议地点", "required": false},
        {"name": "会议内容", "type": "textarea", "description": "会议讨论内容", "required": true}
    ]'::jsonb,
    '[
        {"key": "会议主题", "label": "会议主题", "type": "text", "placeholder": "例如：产品规划讨论会", "required": true},
        {"key": "参会人员", "label": "参会人员", "type": "text", "placeholder": "例如：张总、李经理、王设计师", "required": true},
        {"key": "会议时间", "label": "会议时间", "type": "text", "placeholder": "例如：2024年1月15日 14:00-16:00", "required": true},
        {"key": "会议地点", "label": "会议地点", "type": "text", "placeholder": "例如：会议室A、线上会议", "required": false},
        {"key": "会议内容", "label": "会议内容", "type": "textarea", "placeholder": "请输入会议的主要讨论内容、录音转录或会议笔记", "required": true}
    ]'::jsonb,
    'AI商务团队',
    278,
    1120,
    4.5,
    '10分钟',
    true,
    false,
    true,
    7
),

(
    'article_outline',
    '文章大纲生成器',
    '根据主题快速生成结构化的文章大纲',
    '你是一个专业的内容策划师，擅长创建结构清晰、逻辑严密的文章大纲。

请为"{{文章主题}}"这个主题创建一个详细的文章大纲。

文章信息：
- 目标读者：{{目标读者}}
- 文章类型：{{文章类型}}
- 预期长度：{{预期长度}}
- 写作目的：{{写作目的}}

要求：
1. 大纲结构清晰，层次分明
2. 每个部分都有具体的内容要点
3. 逻辑顺序合理，便于阅读
4. 包含引人入胜的开头和有力的结尾

输出格式：
# {{文章主题}}

## 一、引言
[开头策略和要点]

## 二、主体内容
### 2.1 [第一个要点]
[具体内容说明]

### 2.2 [第二个要点]
[具体内容说明]

### 2.3 [第三个要点]
[具体内容说明]

## 三、结论
[总结和呼吁行动]

## 四、补充建议
[写作建议和注意事项]',
    'writing',
    'article',
    ARRAY['文章', '大纲', '结构化', '写作'],
    'beginner',
    '[
        {"name": "文章主题", "type": "text", "description": "文章的主要主题", "required": true},
        {"name": "目标读者", "type": "text", "description": "文章的目标读者群体", "required": true},
        {"name": "文章类型", "type": "select", "options": ["科普文章", "技术教程", "观点评论", "新闻报道", "产品介绍"], "description": "文章类型", "required": true},
        {"name": "预期长度", "type": "text", "description": "文章预期长度", "required": false},
        {"name": "写作目的", "type": "text", "description": "写作目的和期望达到的效果", "required": true}
    ]'::jsonb,
    '[
        {"key": "文章主题", "label": "文章主题", "type": "text", "placeholder": "例如：人工智能在教育中的应用", "required": true},
        {"key": "目标读者", "label": "目标读者", "type": "text", "placeholder": "例如：教育工作者、技术爱好者", "required": true},
        {"key": "文章类型", "label": "文章类型", "type": "select", "options": ["科普文章", "技术教程", "观点评论", "新闻报道", "产品介绍"], "required": true},
        {"key": "预期长度", "label": "预期长度", "type": "text", "placeholder": "例如：3000字左右", "required": false},
        {"key": "写作目的", "label": "写作目的", "type": "text", "placeholder": "例如：普及知识、分享经验、推广产品", "required": true}
    ]'::jsonb,
    'AI写作团队',
    394,
    1680,
    4.6,
    '5-8分钟',
    true,
    false,
    true,
    8
); 