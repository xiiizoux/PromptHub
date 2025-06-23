import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  HeartIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
  DocumentTextIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LightBulbIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useUserLevel } from '@/hooks/useUserLevel';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  subcategory: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  author: string;
  likes: number;
  usage: number;
  rating: number;
  lastUpdated: string;
  featured: boolean;
  premium: boolean;
  estimatedTime: string;
  language: string;
  isNew: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  subcategories: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  count: number;
  featured: Template[];
}

const ExpandedTemplateLibrary: React.FC = () => {
  const { userLevel, levelData, isLoading } = useUserLevel();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'usage'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 生成模板数据
  const generateTemplates = (): Template[] => {
    const templateData: Template[] = [
      // 写作助手类
      {
        id: 'writing-001',
        name: '文章大纲生成器',
        description: '根据主题快速生成结构化的文章大纲',
        content: '请为"{topic}"这个主题创建一个详细的文章大纲...',
        category: 'writing',
        subcategory: 'article',
        difficulty: 'beginner',
        tags: ['文章', '大纲', '结构化', '写作'],
        author: 'AI写作专家',
        likes: 234,
        usage: 1200,
        rating: 4.8,
        lastUpdated: '2024-01-15',
        featured: true,
        premium: false,
        estimatedTime: '5分钟',
        language: 'zh-CN',
        isNew: false,
      },
      {
        id: 'writing-002',
        name: '邮件撰写助手',
        description: '快速生成各种场景的专业邮件',
        content: '请帮我写一封{type}邮件，收件人是{recipient}...',
        category: 'writing',
        subcategory: 'email',
        difficulty: 'beginner',
        tags: ['邮件', '商务', '沟通', '专业'],
        author: '商务专家',
        likes: 456,
        usage: 2100,
        rating: 4.9,
        lastUpdated: '2024-01-20',
        featured: true,
        premium: false,
        estimatedTime: '3分钟',
        language: 'zh-CN',
        isNew: true,
      },
      // 创意设计类
      {
        id: 'creative-001',
        name: '品牌故事创作',
        description: '为品牌或产品创作吸引人的故事',
        content: '为{brand}品牌创作一个感人的品牌故事...',
        category: 'creative',
        subcategory: 'branding',
        difficulty: 'intermediate',
        tags: ['品牌', '故事', '营销', '创意'],
        author: '创意总监',
        likes: 189,
        usage: 850,
        rating: 4.7,
        lastUpdated: '2024-01-18',
        featured: false,
        premium: true,
        estimatedTime: '15分钟',
        language: 'zh-CN',
        isNew: false,
      },
      // 商务应用类
      {
        id: 'business-001',
        name: '会议纪要生成',
        description: '将会议录音或笔记转换为专业的会议纪要',
        content: '请将以下会议内容整理成专业的会议纪要...',
        category: 'business',
        subcategory: 'meeting',
        difficulty: 'intermediate',
        tags: ['会议', '纪要', '整理', '商务'],
        author: '项目经理',
        likes: 312,
        usage: 1450,
        rating: 4.6,
        lastUpdated: '2024-01-22',
        featured: true,
        premium: false,
        estimatedTime: '8分钟',
        language: 'zh-CN',
        isNew: true,
      },
      // 教育培训类
      {
        id: 'education-001',
        name: '课程计划制定',
        description: '为特定主题制定详细的教学计划',
        content: '为{subject}课程制定一个{duration}的教学计划...',
        category: 'education',
        subcategory: 'curriculum',
        difficulty: 'advanced',
        tags: ['教育', '课程', '计划', '教学'],
        author: '教育专家',
        likes: 167,
        usage: 720,
        rating: 4.8,
        lastUpdated: '2024-01-16',
        featured: false,
        premium: true,
        estimatedTime: '20分钟',
        language: 'zh-CN',
        isNew: false,
      },
    ];

    return templateData;
  };

  // 生成分类数据
  const generateCategories = (): Category[] => {
    return [
      {
        id: 'writing',
        name: '写作助手',
        description: '各种写作场景的专业模板',
        icon: <PencilIcon className="h-6 w-6" />,
        color: 'text-blue-400',
        count: 85,
        subcategories: [
          { id: 'article', name: '文章写作', count: 25 },
          { id: 'email', name: '邮件撰写', count: 18 },
          { id: 'report', name: '报告撰写', count: 22 },
          { id: 'creative', name: '创意写作', count: 20 },
        ],
        featured: templates.filter(t => t.category === 'writing').slice(0, 3),
      },
      {
        id: 'creative',
        name: '创意设计',
        description: '激发创意灵感的模板集合',
        icon: <SparklesIcon className="h-6 w-6" />,
        color: 'text-purple-400',
        count: 62,
        subcategories: [
          { id: 'branding', name: '品牌设计', count: 15 },
          { id: 'content', name: '内容创作', count: 20 },
          { id: 'idea', name: '创意构思', count: 12 },
          { id: 'story', name: '故事创作', count: 15 },
        ],
        featured: templates.filter(t => t.category === 'creative').slice(0, 3),
      },
      {
        id: 'business',
        name: '商务应用',
        description: '提升工作效率的商务模板',
        icon: <BriefcaseIcon className="h-6 w-6" />,
        color: 'text-green-400',
        count: 94,
        subcategories: [
          { id: 'meeting', name: '会议管理', count: 18 },
          { id: 'analysis', name: '数据分析', count: 22 },
          { id: 'planning', name: '项目规划', count: 25 },
          { id: 'communication', name: '商务沟通', count: 29 },
        ],
        featured: templates.filter(t => t.category === 'business').slice(0, 3),
      },
      {
        id: 'education',
        name: '教育培训',
        description: '教学和学习的专业模板',
        icon: <AcademicCapIcon className="h-6 w-6" />,
        color: 'text-yellow-400',
        count: 73,
        subcategories: [
          { id: 'curriculum', name: '课程设计', count: 20 },
          { id: 'assessment', name: '评估测试', count: 18 },
          { id: 'explanation', name: '知识讲解', count: 15 },
          { id: 'exercise', name: '练习题目', count: 20 },
        ],
        featured: templates.filter(t => t.category === 'education').slice(0, 3),
      },
      {
        id: 'analysis',
        name: '分析研究',
        description: '数据分析和研究类模板',
        icon: <ChartBarIcon className="h-6 w-6" />,
        color: 'text-red-400',
        count: 58,
        subcategories: [
          { id: 'data', name: '数据分析', count: 16 },
          { id: 'research', name: '研究报告', count: 14 },
          { id: 'market', name: '市场分析', count: 15 },
          { id: 'trend', name: '趋势预测', count: 13 },
        ],
        featured: templates.filter(t => t.category === 'analysis').slice(0, 3),
      },
      {
        id: 'communication',
        name: '沟通交流',
        description: '各种沟通场景的模板',
        icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
        color: 'text-indigo-400',
        count: 67,
        subcategories: [
          { id: 'presentation', name: '演讲稿', count: 18 },
          { id: 'negotiation', name: '谈判沟通', count: 12 },
          { id: 'customer', name: '客户服务', count: 20 },
          { id: 'social', name: '社交媒体', count: 17 },
        ],
        featured: templates.filter(t => t.category === 'communication').slice(0, 3),
      },
      {
        id: 'technical',
        name: '技术开发',
        description: '技术文档和开发相关模板',
        icon: <DocumentTextIcon className="h-6 w-6" />,
        color: 'text-cyan-400',
        count: 41,
        subcategories: [
          { id: 'documentation', name: '技术文档', count: 12 },
          { id: 'code', name: '代码注释', count: 10 },
          { id: 'api', name: 'API设计', count: 9 },
          { id: 'testing', name: '测试用例', count: 10 },
        ],
        featured: templates.filter(t => t.category === 'technical').slice(0, 3),
      },
      {
        id: 'personal',
        name: '个人生活',
        description: '日常生活和个人发展模板',
        icon: <UserGroupIcon className="h-6 w-6" />,
        color: 'text-pink-400',
        count: 39,
        subcategories: [
          { id: 'planning', name: '规划总结', count: 12 },
          { id: 'learning', name: '学习笔记', count: 10 },
          { id: 'health', name: '健康管理', count: 8 },
          { id: 'travel', name: '旅行规划', count: 9 },
        ],
        featured: templates.filter(t => t.category === 'personal').slice(0, 3),
      },
    ];
  };

  useEffect(() => {
    const templateData = generateTemplates();
    setTemplates(templateData);
    setCategories(generateCategories());
    setFilteredTemplates(templateData);
  }, []);

  // 筛选和搜索逻辑
  useEffect(() => {
    let filtered = templates;

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // 子分类过滤
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(template => template.subcategory === selectedSubcategory);
    }

    // 难度过滤
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // 根据用户级别推荐
    if (userLevel === 'beginner') {
      filtered = filtered.filter(template => 
        template.difficulty === 'beginner' || 
        (template.difficulty === 'intermediate' && template.rating >= 4.5),
      );
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'usage':
        filtered = filtered.sort((a, b) => b.usage - a.usage);
        break;
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedSubcategory, selectedDifficulty, sortBy, userLevel]);

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-900/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-900/20';
      case 'advanced': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '新手友好';
      case 'intermediate': return '进阶';
      case 'advanced': return '高级';
      default: return difficulty;
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          <span className="ml-3 text-gray-400">正在加载模板库...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {userLevel === 'beginner' ? '精选模板库' : '专业模板库'}
          </h2>
          <p className="text-gray-400">
            {categories.reduce((total, cat) => total + cat.count, 0)}+ 个专业模板，覆盖 {categories.length} 个专业领域
          </p>
        </div>
        {levelData && (
          <div className="text-right">
            <div className="text-sm text-gray-400">为您个性化推荐</div>
            <div className="text-neon-cyan font-medium">
              {getDifficultyText(userLevel)} 级别用户
            </div>
          </div>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="glass rounded-xl border border-gray-700/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="template-search-input"
              name="templateSearch"
              type="search"
              placeholder={userLevel === 'beginner' ? '搜索您需要的模板...' : '搜索模板或功能...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              aria-label="搜索模板"
              className="w-full pl-10 pr-4 py-2 bg-dark-bg-secondary border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-neon-cyan focus:border-transparent"
            />
          </div>

          {/* 筛选器 */}
          <div className="flex gap-3">
            {/* 分类筛选 */}
            <select
              id="category-filter"
              name="categoryFilter"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all');
              }}
              aria-label="选择分类"
              className="bg-dark-bg-secondary border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-neon-cyan focus:border-transparent"
            >
              <option value="all">所有分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>

            {/* 子分类筛选 */}
            {selectedCategory !== 'all' && (
              <select
                id="subcategory-filter"
                name="subcategoryFilter"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                aria-label="选择子分类"
                className="bg-dark-bg-secondary border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-neon-cyan focus:border-transparent"
              >
                <option value="all">所有子类</option>
                {categories
                  .find(cat => cat.id === selectedCategory)
                  ?.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.count})
                    </option>
                  ))}
              </select>
            )}

            {/* 难度筛选 */}
            <select
              id="difficulty-filter"
              name="difficultyFilter"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              aria-label="选择难度"
              className="bg-dark-bg-secondary border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-neon-cyan focus:border-transparent"
            >
              <option value="all">所有难度</option>
              <option value="beginner">新手友好</option>
              <option value="intermediate">进阶</option>
              <option value="advanced">高级</option>
            </select>

            {/* 排序 */}
            <select
              id="sort-filter"
              name="sortFilter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="选择排序方式"
              className="bg-dark-bg-secondary border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-neon-cyan focus:border-transparent"
            >
              <option value="popular">最受欢迎</option>
              <option value="newest">最新发布</option>
              <option value="rating">评分最高</option>
              <option value="usage">使用最多</option>
            </select>
          </div>
        </div>
      </div>

      {/* 分类导航 */}
      <div className="flex overflow-x-auto gap-4 pb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-neon-cyan text-dark-bg-primary'
              : 'bg-dark-bg-secondary/50 text-gray-400 hover:text-white'
          }`}
        >
          <GlobeAltIcon className="h-4 w-4" />
          全部分类
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setSelectedSubcategory('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-neon-cyan text-dark-bg-primary'
                : 'bg-dark-bg-secondary/50 text-gray-400 hover:text-white'
            }`}
          >
            <span className={category.color}>{category.icon}</span>
            {category.name}
            <span className="text-xs opacity-70">({category.count})</span>
          </button>
        ))}
      </div>

      {/* 模板网格 */}
      <AnimatePresence>
        {filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <DocumentTextIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">未找到匹配的模板</h3>
            <p className="text-gray-500">
              {searchQuery ? '尝试调整搜索条件或浏览其他分类' : '该分类下暂无模板'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl border border-gray-700/50 p-6 hover:border-neon-cyan/30 transition-all group"
              >
                {/* 模板标题和标签 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white group-hover:text-neon-cyan transition-colors line-clamp-1">
                        {template.name}
                      </h3>
                      {template.isNew && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          NEW
                        </span>
                      )}
                      {template.featured && (
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(template.difficulty)}`}>
                      {getDifficultyText(template.difficulty)}
                    </span>
                  </div>
                  {template.premium && (
                    <span className="px-2 py-1 bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-xs rounded-full">
                      PRO
                    </span>
                  )}
                </div>

                {/* 描述 */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-neon-cyan/10 text-neon-cyan rounded-full border border-neon-cyan/20"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <HeartIcon className="h-3 w-3" />
                      {template.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="h-3 w-3" />
                      {template.usage}
                    </span>
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      {template.rating}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {template.estimatedTime}
                  </span>
                </div>

                {/* 作者和更新时间 */}
                <div className="flex items-center justify-between text-xs text-gray-500 pb-4 border-b border-gray-700/50 mb-4">
                  <span>by {template.author}</span>
                  <span>{template.lastUpdated}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Link
                    href={`/templates/${template.id}`}
                    className="flex-1 btn-primary text-sm text-center"
                  >
                    {userLevel === 'beginner' ? '立即使用' : '查看模板'}
                  </Link>
                  <button className="btn-secondary px-3">
                    <HeartIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* 新手提示 */}
                {userLevel === 'beginner' && template.difficulty === 'beginner' && (
                  <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-300">
                    <LightBulbIcon className="h-3 w-3 inline mr-1" />
                    推荐：此模板特别适合新手入门使用
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载更多 */}
      {filteredTemplates.length > 0 && filteredTemplates.length >= 12 && (
        <div className="text-center">
          <button className="btn-secondary">
            加载更多模板
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpandedTemplateLibrary; 