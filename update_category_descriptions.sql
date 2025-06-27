-- =============================================
-- 更新分类描述 - 精细化描述便于智能分析
-- =============================================

BEGIN;

-- =============================================
-- 📝 对话提示词（Chat）- 精细化描述更新
-- =============================================

-- 基础对话类
UPDATE categories SET description = '适用于日常生活交流、基础问题咨询、通用助手对话等场景。包含问候语、闲聊、基础信息查询、生活建议等通用性对话提示词，是最常用的对话类型。' 
WHERE name = '通用对话';

UPDATE categories SET description = '专门用于客户服务场景的对话提示词。包含客户咨询处理、问题解答、投诉处理、售后服务、FAQ回答等商业客服场景，帮助提升客户服务质量和效率。' 
WHERE name = '客服助手';

UPDATE categories SET description = '用于角色扮演和情景模拟的对话提示词。包含历史人物扮演、职业角色模拟、虚拟角色对话、情景演练等，适合教育培训、娱乐互动和创意写作场景。' 
WHERE name = '角色扮演';

-- 专业领域类
UPDATE categories SET description = '面向学术研究和科研工作的专业提示词。包含论文写作、文献综述、研究方法设计、数据分析、学术翻译、引用格式等学术场景，适合研究人员和学者使用。' 
WHERE name = '学术研究';

UPDATE categories SET description = '专门为程序员和开发者设计的技术对话提示词。包含代码编写、程序调试、技术问题解答、架构设计、代码审查、技术文档编写等软件开发全流程支持。' 
WHERE name = '编程开发';

UPDATE categories SET description = '面向商业决策和企业管理的专业咨询提示词。包含市场分析、商业策略制定、财务规划、项目管理、团队协作、商业计划书撰写等企业经营管理场景。' 
WHERE name = '商业咨询';

UPDATE categories SET description = '提供法律咨询和合规指导的专业提示词。包含法律条文解释、合同审查、法律风险评估、合规建议、法律文书起草等法律服务场景，仅供参考不构成正式法律意见。' 
WHERE name = '法律顾问';

UPDATE categories SET description = '关注健康医疗和养生保健的专业提示词。包含健康咨询、疾病预防、营养建议、运动健身、心理健康、医学知识普及等健康管理场景，不能替代专业医疗诊断。' 
WHERE name = '医疗健康';

-- 创作服务类
UPDATE categories SET description = '专注于营销文案和内容创作的提示词。包含广告文案、产品描述、品牌故事、社交媒体内容、邮件营销、新闻稿撰写等商业写作和营销推广场景。' 
WHERE name = '文案写作';

UPDATE categories SET description = '多语言翻译和语言学习的专业提示词。包含文本翻译、口语练习、语法纠错、语言文化解释、本地化翻译、语言学习指导等跨语言交流场景。' 
WHERE name = '翻译语言';

UPDATE categories SET description = '教育教学和知识传授的专业提示词。包含课程设计、教学方法、知识点解释、作业辅导、考试准备、学习计划制定等教育培训和知识分享场景。' 
WHERE name = '教育辅导';

UPDATE categories SET description = '心理健康和情感支持的专业提示词。包含情感疏导、心理咨询、压力管理、人际关系指导、情绪调节、心理健康评估等心理服务场景，不能替代专业心理治疗。'
WHERE name = '心理咨询';

-- =============================================
-- 🎨 图像提示词（Image）- 精细化描述更新
-- =============================================

-- 摄影风格类
UPDATE categories SET description = '真实摄影风格的图像生成提示词。专注于写实、自然、纪实风格的图像创作，包含人文摄影、街拍、生活记录、新闻摄影等真实场景的视觉表现，追求自然光影和真实质感。'
WHERE name = '真实摄影';

UPDATE categories SET description = '人像摄影专业提示词。包含肖像拍摄、人物特写、表情捕捉、人像构图、光影处理、情感表达等人像摄影技巧，适用于个人写真、商业人像、艺术肖像等场景。'
WHERE name = '人像摄影';

UPDATE categories SET description = '风景和景观摄影的专业提示词。涵盖自然风光、城市景观、建筑外观、天空云彩、山川河流、季节变化等景观摄影，注重构图美感和环境氛围的营造。'
WHERE name = '风景摄影';

UPDATE categories SET description = '商业产品摄影的专业提示词。专注于商品展示、产品特写、静物摄影、电商图片、包装展示、材质表现等商业摄影需求，强调产品细节和商业价值。'
WHERE name = '产品摄影';

-- 艺术创作类
UPDATE categories SET description = '传统艺术绘画风格的图像创作提示词。包含油画、水彩、素描、国画、版画等传统绘画技法和风格，追求艺术表现力和绘画质感，适合艺术创作和装饰用途。'
WHERE name = '艺术绘画';

UPDATE categories SET description = '动漫插画和二次元风格的图像创作提示词。包含日式动漫、卡通角色、插画设计、漫画风格、Q版形象等二次元文化相关的视觉创作，注重角色设计和风格表现。'
WHERE name = '动漫插画';

UPDATE categories SET description = '抽象艺术和现代艺术风格的图像创作提示词。包含抽象表现、几何构成、色彩实验、概念艺术、现代设计等前卫艺术形式，强调创意表达和视觉冲击力。'
WHERE name = '抽象艺术';

UPDATE categories SET description = '数字艺术和CG创作的专业提示词。包含数字绘画、3D渲染、特效制作、游戏美术、影视概念图等数字化艺术创作，结合技术手段实现创意视觉效果。'
WHERE name = '数字艺术';

-- 设计应用类
UPDATE categories SET description = '品牌标识和Logo设计的专业提示词。包含企业标志、品牌符号、图标设计、视觉识别、标识系统等品牌视觉设计，注重识别性、记忆性和品牌价值传达。'
WHERE name = 'Logo设计';

UPDATE categories SET description = '海报和平面设计的创作提示词。包含宣传海报、广告设计、版面布局、字体设计、色彩搭配、视觉传达等平面设计应用，适用于营销推广和信息传播。'
WHERE name = '海报设计';

UPDATE categories SET description = '时尚设计和造型创作的专业提示词。包含服装设计、时尚搭配、造型设计、潮流趋势、面料材质、时装展示等时尚领域的视觉创作和设计应用。'
WHERE name = '时尚设计';

UPDATE categories SET description = '建筑设计和空间规划的专业提示词。包含建筑外观、室内设计、空间布局、装修风格、家具搭配、环境设计等建筑和室内空间的视觉设计和规划。'
WHERE name = '建筑空间';

-- 特殊效果类
UPDATE categories SET description = '概念设计和创意构思的专业提示词。包含概念图、设定画、创意草图、想象场景、未来设计等概念性视觉创作，注重创意表达和想象力的视觉化。'
WHERE name = '概念设计';

UPDATE categories SET description = '科幻奇幻题材的图像创作提示词。包含科幻场景、未来世界、奇幻生物、魔法场景、太空探索、异世界设定等科幻奇幻元素的视觉创作和世界构建。'
WHERE name = '科幻奇幻';

UPDATE categories SET description = '复古怀旧风格的图像创作提示词。包含复古色调、怀旧氛围、年代感、老照片效果、复古设计、历史重现等怀旧主题的视觉创作和风格表现。'
WHERE name = '复古怀旧';

-- =============================================
-- 🎬 视频提示词（Video）- 精细化描述更新
-- =============================================

-- 内容创作类
UPDATE categories SET description = '故事叙述和剧情创作的视频提示词。包含剧本创作、故事结构、角色发展、情节设计、对话编写、微电影制作等叙事性视频内容的创作和制作指导。'
WHERE name = '故事叙述';

UPDATE categories SET description = '纪录片制作和纪实拍摄的专业提示词。包含纪实拍摄、专题制作、调研采访、真实记录、社会议题、历史文献等纪录片创作的各个环节和制作技巧。'
WHERE name = '纪录片';

UPDATE categories SET description = '教学视频和知识分享的制作提示词。包含课程录制、教程制作、知识讲解、技能演示、在线教育、培训视频等教育类视频内容的策划和制作指导。'
WHERE name = '教学视频';

UPDATE categories SET description = '访谈节目和对话类视频的制作提示词。包含人物访谈、专家对话、座谈会、问答环节、深度访谈、脱口秀等对话类视频节目的策划和制作技巧。'
WHERE name = '访谈对话';

-- 商业应用类
UPDATE categories SET description = '产品展示和商品演示的视频制作提示词。包含产品介绍、功能演示、使用教程、开箱视频、产品测评、电商视频等商业产品推广视频的制作指导。'
WHERE name = '产品展示';

UPDATE categories SET description = '广告营销和品牌推广的视频创作提示词。包含广告创意、品牌宣传、营销视频、推广短片、病毒营销、社交媒体视频等商业营销视频的策划和制作。'
WHERE name = '广告营销';

UPDATE categories SET description = '企业宣传和公司形象展示的视频制作提示词。包含企业介绍、公司文化、团队展示、发展历程、价值观传达、招聘宣传等企业形象视频的创作指导。'
WHERE name = '企业宣传';

UPDATE categories SET description = '活动记录和事件拍摄的视频制作提示词。包含会议记录、活动拍摄、庆典仪式、展览展示、现场直播、事件纪实等活动类视频的拍摄和制作技巧。'
WHERE name = '活动记录';

-- 艺术表现类
UPDATE categories SET description = '动画制作和特效合成的专业提示词。包含动画创作、特效制作、后期合成、动态图形、视觉效果、创意动画等动画和特效相关的制作技术和创意指导。'
WHERE name = '动画特效';

UPDATE categories SET description = '音乐视频和MV制作的创作提示词。包含音乐MV、演出录制、音乐表演、艺术表达、视听结合、创意剪辑等音乐类视频的创作和制作指导。'
WHERE name = '音乐视频';

UPDATE categories SET description = '艺术短片和实验影像的创作提示词。包含实验电影、艺术表达、创意短片、视觉艺术、影像艺术、前卫创作等艺术性视频作品的创作和表现手法。'
WHERE name = '艺术短片';

-- 生活记录类
UPDATE categories SET description = '自然风景和风光摄影的视频制作提示词。包含风光拍摄、自然纪录、延时摄影、航拍视频、季节变化、生态记录等自然题材视频的拍摄技巧和创作指导。'
WHERE name = '自然风景';

-- =============================================
-- 提交更改
-- =============================================

COMMIT;

-- 显示更新结果
SELECT '=== 分类描述更新完成 ===' as status;
SELECT name, type, LEFT(description, 50) || '...' as description_preview
FROM categories
ORDER BY sort_order;
