/**
 * MCP智能提示词分类匹配服务
 * 通过提示词内容智能匹配最适合的分类，并获取对应的优化模板
 * 适配MCP服务器环境，通过API获取数据库分类数据
 */

import axios from 'axios';

export interface MCPCategoryInfo {
  id: number;
  name: string;
  name_en: string;
  icon: string;
  description: string;
  type: 'chat' | 'image' | 'video';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  optimization_template: string;
}

export interface MCPCategoryMatchResult {
  category: MCPCategoryInfo;
  confidence: number;
  reason: string;
}

export interface MCPOptimizationTemplateResult {
  template: string;
  category: MCPCategoryInfo;
  confidence: number;
}

/**
 * MCP智能提示词分类匹配器
 */
class MCPPromptCategoryMatcher {
  private categoryCache: MCPCategoryInfo[] = [];
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private readonly API_BASE_URL = process.env.WEB_SERVER_URL || 'http://localhost:9011';

  /**
   * 获取所有分类（带缓存）
   */
  private async getCategories(type?: 'chat' | 'image' | 'video'): Promise<MCPCategoryInfo[]> {
    const now = Date.now();
    const _cacheKey = type || 'all';
    
    if (this.categoryCache.length === 0 || now - this.lastCacheUpdate > this.CACHE_TTL) {
      try {
        // 通过API获取分类数据
        const url = `${this.API_BASE_URL}/api/categories${type ? `?type=${type}` : ''}`;
        console.log(`[MCP分类匹配] 获取分类数据: ${url}`);
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          this.categoryCache = response.data.data.filter((cat: any) => cat.is_active);
          this.lastCacheUpdate = now;
          console.log(`[MCP分类匹配] 成功获取分类数据: ${this.categoryCache.length}个分类`);
        } else {
          throw new Error('API返回数据格式错误');
        }
      } catch (error) {
        console.error('[MCP分类匹配] 获取分类数据失败:', error);
        // 如果有缓存数据，继续使用
        if (this.categoryCache.length === 0) {
          throw new Error(`无法获取分类数据: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    }

    // 如果指定了类型，过滤返回
    if (type) {
      return this.categoryCache.filter(cat => cat.type === type);
    }
    
    return this.categoryCache;
  }

  /**
   * 通过关键词匹配分析提示词类型
   */
  private analyzePromptByKeywords(prompt: string, categories: MCPCategoryInfo[]): { [categoryName: string]: number } {
    const lowerPrompt = prompt.toLowerCase();
    const scores: { [categoryName: string]: number } = {};

    // 定义关键词权重映射
    const keywordPatterns = {
      // 对话类关键词
      '通用对话': ['对话', '聊天', '回答', '问答', '交流', '沟通', 'chat', 'conversation', 'talk', 'discuss'],
      '客服助手': ['客服', '服务', '帮助', '支持', '咨询', '解答', 'customer', 'service', 'support', 'help'],
      '角色扮演': ['角色', '扮演', '模拟', '假设', '扮演', 'role', 'play', 'character', 'persona'],
      '学术研究': ['学术', '研究', '论文', '分析', '理论', '科研', 'academic', 'research', 'paper', 'study'],
      '编程开发': ['编程', '代码', '开发', '技术', '算法', '系统', 'code', 'programming', 'development', 'algorithm'],
      '商业咨询': ['商业', '营销', '销售', '市场', '策略', '管理', 'business', 'marketing', 'strategy', 'management'],
      '法律顾问': ['法律', '法规', '合同', '条款', '法条', '诉讼', 'legal', 'law', 'contract', 'regulation'],
      '医疗健康': ['医疗', '健康', '疾病', '治疗', '药物', '症状', 'medical', 'health', 'disease', 'treatment'],
      '文案写作': ['文案', '写作', '创作', '广告', '宣传', '营销', 'copywriting', 'writing', 'advertising', 'content'],
      '翻译语言': ['翻译', '语言', '英语', '中文', '外语', 'translation', 'language', 'translate', 'english'],
      '教育辅导': ['教育', '教学', '学习', '培训', '课程', 'education', 'teaching', 'learning', 'training'],
      '心理咨询': ['心理', '情感', '情绪', '咨询', '心理健康', 'psychology', 'emotional', 'mental', 'counseling'],
      '旅行攻略': ['旅行', '旅游', '攻略', '景点', '路线', 'travel', 'tourism', 'trip', 'destination'],
      '生活常识': ['生活', '日常', '常识', '技巧', '建议', 'life', 'daily', 'tips', 'advice'],
      '金融投资': ['金融', '投资', '理财', '股票', '基金', 'finance', 'investment', 'financial', 'stock'],

      // 图像类关键词
      '真实摄影': ['摄影', '照片', '真实', '写实', '纪实', 'photography', 'photo', 'realistic', 'portrait'],
      '艺术绘画': ['绘画', '艺术', '画作', '油画', '水彩', 'painting', 'art', 'artwork', 'drawing'],
      '插画设计': ['插画', '设计', '图标', '海报', 'illustration', 'design', 'graphic', 'poster'],
      '建筑空间': ['建筑', '空间', '室内', '装修', 'architecture', 'interior', 'building', 'space'],
      '概念设计': ['概念', '设计', '创意', '想象', 'concept', 'creative', 'imagination', 'fantasy'],
      '科幻奇幻': ['科幻', '奇幻', '未来', '魔法', 'sci-fi', 'fantasy', 'futuristic', 'magic'],
      '复古怀旧': ['复古', '怀旧', 'vintage', '老式', 'retro', 'vintage', 'nostalgic', 'classic'],

      // 视频类关键词
      '故事叙述': ['故事', '叙述', '剧情', '情节', 'story', 'narrative', 'plot', 'storytelling'],
      '纪录片': ['纪录', '记录', '真实', '纪实', 'documentary', 'record', 'factual', 'real'],
      '教学视频': ['教学', '教程', '演示', '指导', 'tutorial', 'instruction', 'demonstration', 'guide'],
      '访谈对话': ['访谈', '采访', '对话', '交流', 'interview', 'conversation', 'dialogue', 'talk'],
      '产品展示': ['产品', '展示', '演示', '介绍', 'product', 'demo', 'showcase', 'presentation'],
      '广告营销': ['广告', '营销', '宣传', '推广', 'advertising', 'marketing', 'promotion', 'commercial'],
      '企业宣传': ['企业', '公司', '宣传', '介绍', 'corporate', 'company', 'business', 'introduction'],
      '活动记录': ['活动', '事件', '记录', '现场', 'event', 'activity', 'live', 'recording'],
      '动画特效': ['动画', '特效', '动态', '效果', 'animation', 'effects', 'motion', 'animated'],
      '音乐视频': ['音乐', '歌曲', 'MV', '音频', 'music', 'song', 'audio', 'musical'],
      '艺术短片': ['艺术', '短片', '创意', '实验', 'art', 'short', 'creative', 'experimental'],
      '自然风景': ['自然', '风景', '风光', '户外', 'nature', 'landscape', 'scenery', 'outdoor']
    };

    // 计算每个分类的匹配分数
    categories.forEach(category => {
      const keywords = keywordPatterns[category.name] || [];
      let score = 0;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = lowerPrompt.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      
      if (score > 0) {
        scores[category.name] = score;
      }
    });

    return scores;
  }

  /**
   * 通过描述相似度匹配分类
   */
  private analyzePromptByDescription(prompt: string, categories: MCPCategoryInfo[]): { [categoryName: string]: number } {
    const scores: { [categoryName: string]: number } = {};
    const lowerPrompt = prompt.toLowerCase();

    categories.forEach(category => {
      if (!category.description) return;

      const description = category.description.toLowerCase();
      let score = 0;

      // 计算描述中关键词在提示词中的出现频率
      const descWords = description.split(/[，。、；：！？\s,.\-;:!?]+/).filter(word => word.length > 1);
      descWords.forEach(word => {
        if (lowerPrompt.includes(word)) {
          score += 1;
        }
      });

      // 计算提示词中关键词在描述中的出现频率
      const promptWords = lowerPrompt.split(/[，。、；：！？\s,.\-;:!?]+/).filter(word => word.length > 1);
      promptWords.forEach(word => {
        if (description.includes(word)) {
          score += 0.5;
        }
      });

      if (score > 0) {
        scores[category.name] = score;
      }
    });

    return scores;
  }

  /**
   * 智能匹配最适合的分类
   */
  async matchCategory(prompt: string, type?: 'chat' | 'image' | 'video'): Promise<MCPCategoryMatchResult> {
    try {
      const categories = await this.getCategories(type);
      
      if (categories.length === 0) {
        throw new Error('没有可用的分类数据');
      }

      // 通过关键词匹配
      const keywordScores = this.analyzePromptByKeywords(prompt, categories);
      
      // 通过描述匹配
      const descriptionScores = this.analyzePromptByDescription(prompt, categories);

      // 合并分数
      const combinedScores: { [categoryName: string]: number } = {};
      
      // 关键词匹配权重更高
      Object.entries(keywordScores).forEach(([name, score]) => {
        combinedScores[name] = (combinedScores[name] || 0) + score * 2;
      });
      
      // 描述匹配作为补充
      Object.entries(descriptionScores).forEach(([name, score]) => {
        combinedScores[name] = (combinedScores[name] || 0) + score;
      });

      // 找到最高分的分类
      let bestCategory: MCPCategoryInfo | null = null;
      let bestScore = 0;
      let reason = '';

      Object.entries(combinedScores).forEach(([name, score]) => {
        if (score > bestScore) {
          const category = categories.find(c => c.name === name);
          if (category) {
            bestCategory = category;
            bestScore = score;
            reason = `关键词匹配度: ${keywordScores[name] || 0}, 描述匹配度: ${descriptionScores[name] || 0}`;
          }
        }
      });

      // 如果没有匹配到，使用默认分类
      if (!bestCategory) {
        bestCategory = categories.find(c => c.name === '通用对话') || categories[0];
        bestScore = 0.1;
        reason = '未找到明确匹配，使用默认分类';
      }

      // 计算置信度 (0-1)
      const maxPossibleScore = 10; // 假设的最大可能分数
      const confidence = Math.min(bestScore / maxPossibleScore, 1);

      console.log(`[MCP分类匹配] 匹配完成: ${bestCategory.name}, 置信度: ${confidence.toFixed(2)}`);

      return {
        category: bestCategory,
        confidence,
        reason
      };

    } catch (error) {
      console.error('[MCP分类匹配] 匹配失败:', error);
      throw new Error(`分类匹配失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 根据分类名称获取分类信息
   */
  async getCategoryByName(categoryName: string, type?: 'chat' | 'image' | 'video'): Promise<MCPCategoryInfo | null> {
    try {
      const categories = await this.getCategories(type);
      return categories.find(c => c.name === categoryName || c.name_en === categoryName) || null;
    } catch (error) {
      console.error('[MCP分类匹配] 获取分类失败:', error);
      return null;
    }
  }

  /**
   * 获取优化模板
   */
  async getOptimizationTemplate(prompt: string, type?: 'chat' | 'image' | 'video'): Promise<MCPOptimizationTemplateResult> {
    const matchResult = await this.matchCategory(prompt, type);
    
    if (!matchResult.category.optimization_template) {
      throw new Error(`分类 "${matchResult.category.name}" 没有配置优化模板`);
    }

    return {
      template: matchResult.category.optimization_template,
      category: matchResult.category,
      confidence: matchResult.confidence
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.categoryCache = [];
    this.lastCacheUpdate = 0;
    console.log('[MCP分类匹配] 缓存已清除');
  }
}

// 导出单例
export const mcpPromptCategoryMatcher = new MCPPromptCategoryMatcher();
export default mcpPromptCategoryMatcher;
