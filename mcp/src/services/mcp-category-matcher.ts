/**
 * MCP智能提示词分类匹配服务
 * 通过提示词内容智能匹配最适合的分类，并获取对应的优化模板
 * 适配MCP服务器环境，通过API获取数据库分类数据
 */

import axios from 'axios';
import { extractTemplateFromJsonb, isJsonbTemplate } from '../utils/jsonb-utils.js';

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
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // 处理 JSONB 优化模板
          this.categoryCache = response.data.data
            .filter((cat: any) => cat.is_active)
            .map((cat: any) => ({
              ...cat,
              optimization_template: cat.optimization_template_text ||
                (cat.optimization_template
                  ? (isJsonbTemplate(cat.optimization_template)
                      ? extractTemplateFromJsonb(cat.optimization_template)
                      : cat.optimization_template)
                  : '')
            }));
          this.lastCacheUpdate = now;
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

    // 基于分类名称和描述动态生成关键词匹配
    const generateKeywordScore = (prompt: string, category: MCPCategoryInfo): number => {
      const lowerPrompt = prompt.toLowerCase();
      const categoryName = category.name.toLowerCase();
      const categoryDesc = (category.description || '').toLowerCase();
      let score = 0;

      // 分类名称直接匹配
      if (lowerPrompt.includes(categoryName)) {
        score += 5;
      }

      // 基于分类名称关键词的智能匹配规则
      const keywordRules = [
        // 对话交流相关
        { patterns: ['对话', '聊天', '回答', '问答', '交流', '沟通'], categories: ['对话', '聊天', '交流', '沟通'] },

        // 客服服务相关
        { patterns: ['客服', '服务', '帮助', '支持', '咨询', '解答'], categories: ['客服', '服务', '支持', '帮助'] },

        // 角色扮演相关
        { patterns: ['角色', '扮演', '模拟', '假设'], categories: ['角色', '扮演', '模拟'] },

        // 学术研究相关
        { patterns: ['学术', '研究', '论文', '分析', '理论', '科研'], categories: ['学术', '研究', '科研', '论文'] },

        // 编程开发相关
        { patterns: ['编程', '代码', '开发', '技术', '算法', '系统'], categories: ['编程', '开发', '技术', '代码'] },

        // 商业咨询相关
        { patterns: ['商业', '营销', '销售', '市场', '策略', '管理'], categories: ['商业', '营销', '管理', '策略'] },

        // 法律相关
        { patterns: ['法律', '法规', '合同', '条款', '法条', '诉讼'], categories: ['法律', '法规', '合同'] },

        // 医疗健康相关
        { patterns: ['医疗', '健康', '疾病', '治疗', '药物', '症状'], categories: ['医疗', '健康', '治疗'] },

        // 文案写作相关
        { patterns: ['文案', '写作', '创作', '广告', '宣传'], categories: ['文案', '写作', '创作'] },

        // 翻译语言相关
        { patterns: ['翻译', '语言', '英语', '中文', '外语'], categories: ['翻译', '语言'] },

        // 教育相关
        { patterns: ['教育', '教学', '学习', '培训', '课程'], categories: ['教育', '教学', '学习', '培训'] },

        // 心理咨询相关
        { patterns: ['心理', '情感', '情绪', '咨询'], categories: ['心理', '情感', '咨询'] },

        // 摄影相关
        { patterns: ['摄影', '照片', '真实', '写实', '纪实'], categories: ['摄影', '照片', '真实'] },

        // 艺术绘画相关
        { patterns: ['绘画', '艺术', '画作', '油画', '水彩'], categories: ['绘画', '艺术', '画作'] },

        // 设计相关
        { patterns: ['插画', '设计', '图标', '海报'], categories: ['插画', '设计', '图标'] },

        // 视频相关
        { patterns: ['故事', '叙述', '剧情', '情节'], categories: ['故事', '叙述', '剧情'] },
        { patterns: ['纪录', '记录', '纪实'], categories: ['纪录', '记录', '纪实'] },
        { patterns: ['教学', '教程', '演示', '指导'], categories: ['教学', '教程', '演示'] },
        { patterns: ['动画', '特效', '动态', '效果'], categories: ['动画', '特效'] },
      ];

      // 检查关键词匹配
      keywordRules.forEach(rule => {
        const hasPattern = rule.patterns.some(pattern => lowerPrompt.includes(pattern));
        const matchesCategory = rule.categories.some(cat => categoryName.includes(cat));
        if (hasPattern && matchesCategory) {
          score += 3;
        }
      });

      // 描述匹配
      if (categoryDesc) {
        const descWords = categoryDesc.split(/[，。、\s]+/).filter(word => word.length > 1);
        descWords.forEach(word => {
          if (lowerPrompt.includes(word)) {
            score += 1;
          }
        });
      }

      return score;
    };

    // 计算每个分类的匹配分数
    categories.forEach(category => {
      const score = generateKeywordScore(prompt, category);
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

      // 如果没有匹配到，使用第一个可用分类
      if (!bestCategory) {
        bestCategory = categories[0];
        bestScore = 0.1;
        reason = '未找到明确匹配，使用第一个可用分类';
      }

      // 计算置信度 (0-1)
      const maxPossibleScore = 10; // 假设的最大可能分数
      const confidence = Math.min(bestScore / maxPossibleScore, 1);


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
  }
}

// 导出单例
export const mcpPromptCategoryMatcher = new MCPPromptCategoryMatcher();
export default mcpPromptCategoryMatcher;
