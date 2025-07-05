/**
 * 智能提示词分类匹配服务
 * 通过提示词内容智能匹配最适合的分类，并获取对应的优化模板
 */

import { CategoryInfo } from './categoryService';
import { logger } from '@/lib/error-handler';
import { databaseService } from '@/lib/database-service';
import { extractTemplateFromJsonb, isJsonbTemplate } from '@/lib/jsonb-utils';

export interface CategoryMatchResult {
  category: CategoryInfo;
  confidence: number;
  reason: string;
}

export interface OptimizationTemplateResult {
  template: string;
  category: CategoryInfo;
  confidence: number;
}

/**
 * 智能提示词分类匹配器
 */
class PromptCategoryMatcher {
  private categoryCache: CategoryInfo[] = [];
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取所有分类（带缓存）
   */
  private async getCategories(): Promise<CategoryInfo[]> {
    const now = Date.now();
    if (this.categoryCache.length === 0 || now - this.lastCacheUpdate > this.CACHE_TTL) {
      try {
        // 直接使用数据库服务，避免HTTP请求循环
        const categoriesData = await databaseService.getCategories();

        // 转换为CategoryInfo格式，处理 JSONB 优化模板
        this.categoryCache = categoriesData.map((category) => ({
          id: category.id,
          name: category.name,
          name_en: category.name_en,
          icon: category.icon,
          description: category.description,
          type: category.type as 'chat' | 'image' | 'video',
          sort_order: category.sort_order,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at,
          optimization_template: category.optimization_template_text ||
            (category.optimization_template
              ? (isJsonbTemplate(category.optimization_template)
                  ? extractTemplateFromJsonb(category.optimization_template)
                  : category.optimization_template)
              : undefined),
        }));

        this.lastCacheUpdate = now;
        logger.info('分类缓存已更新', { count: this.categoryCache.length });
      } catch (error) {
        logger.error('获取分类数据失败', error instanceof Error ? error : new Error(String(error)));
        // 如果有缓存数据，继续使用
        if (this.categoryCache.length === 0) {
          throw new Error('无法获取分类数据');
        }
      }
    }
    return this.categoryCache;
  }

  /**
   * 通过关键词匹配分析提示词类型
   */
  private analyzePromptByKeywords(prompt: string): { [categoryName: string]: number } {
    const lowerPrompt = prompt.toLowerCase();
    const scores: { [categoryName: string]: number } = {};

    // 基于数据库分类动态匹配关键词
    const matchCategoryByKeywords = (content: string, categories: any[]): string | null => {
      const lowerContent = content.toLowerCase();

      // 为每个分类计算匹配分数
      const categoryScores = categories.map(category => {
        let score = 0;
        const categoryName = category.name.toLowerCase();
        const categoryDesc = (category.description || '').toLowerCase();

        // 分类名称直接匹配
        if (lowerContent.includes(categoryName)) {
          score += 10;
        }

        // 描述关键词匹配
        if (categoryDesc) {
          const descWords = categoryDesc.split(/[，。、\s]+/).filter(word => word.length > 1);
          descWords.forEach(word => {
            if (lowerContent.includes(word)) {
              score += 3;
            }
          });
        }

        // 通用关键词匹配规则
        const keywordRules = [
          { patterns: ['对话', '聊天', '回答', '问答', '交流', '沟通'], categories: ['对话', '通用', '聊天'] },
          { patterns: ['客服', '服务', '帮助', '支持', '咨询', '解答'], categories: ['客服', '服务', '支持'] },
          { patterns: ['角色', '扮演', '模拟', '假设'], categories: ['角色', '扮演', '模拟'] },
          { patterns: ['学术', '研究', '论文', '分析', '理论', '科研'], categories: ['学术', '研究', '科研'] },
          { patterns: ['编程', '代码', '开发', '技术', '算法', '系统'], categories: ['编程', '开发', '技术', '代码'] },
          { patterns: ['商业', '营销', '销售', '市场', '策略', '管理'], categories: ['商业', '营销', '管理', '策略'] },
          { patterns: ['法律', '法规', '合同', '条款', '法条', '诉讼'], categories: ['法律', '法规', '合同'] },
          { patterns: ['医疗', '健康', '疾病', '治疗', '药物', '症状'], categories: ['医疗', '健康', '治疗'] },
        ];

        keywordRules.forEach(rule => {
          const hasPattern = rule.patterns.some(pattern => lowerContent.includes(pattern));
          const matchesCategory = rule.categories.some(cat => categoryName.includes(cat));
          if (hasPattern && matchesCategory) {
            score += 5;
          }
        });

        return { category, score };
      });

      // 找到最高分的分类
      const bestMatch = categoryScores.reduce((best, current) =>
        current.score > best.score ? current : best,
      );

      return bestMatch.score > 0 ? bestMatch.category.name : null;
    };

    return null; // 如果没有匹配的分类，返回null
  }

  /**
   * 基于描述分析提示词分类
   */
  private analyzePromptByDescription(prompt: string, categories: CategoryInfo[]): { [categoryName: string]: number } {
    const scores: { [categoryName: string]: number } = {};
    const lowerPrompt = prompt.toLowerCase();

    // 基于分类描述进行匹配
    categories.forEach(category => {
      let score = 0;
      const description = category.description?.toLowerCase() || '';

      // 基于描述关键词匹配
      if (description) {
        const descriptionWords = description.split(/\s+/);
        descriptionWords.forEach(word => {
          if (word.length > 2 && lowerPrompt.includes(word)) {
            score += 1;
          }
        });
      }

      // 基于分类名称匹配
      const categoryName = category.name.toLowerCase();
      if (lowerPrompt.includes(categoryName)) {
        score += 3;
      }

      if (score > 0) {
        scores[category.name] = score;
      }
    });

    return scores;
  }



  /**
   * 智能匹配最适合的分类
   */
  async matchCategory(prompt: string): Promise<CategoryMatchResult> {
    try {
      const categories = await this.getCategories();
      
      if (categories.length === 0) {
        throw new Error('没有可用的分类数据');
      }

      // 通过关键词匹配
      const keywordScores = this.analyzePromptByKeywords(prompt);
      
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
      let bestCategory: CategoryInfo | null = null;
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

      logger.info('分类匹配完成', {
        prompt: prompt.substring(0, 100),
        matchedCategory: bestCategory.name,
        confidence,
        reason,
      });

      return {
        category: bestCategory,
        confidence,
        reason,
      };

    } catch (error) {
      logger.error('分类匹配失败', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`分类匹配失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取优化模板
   */
  async getOptimizationTemplate(prompt: string): Promise<OptimizationTemplateResult> {
    const matchResult = await this.matchCategory(prompt);
    
    if (!matchResult.category.optimization_template) {
      throw new Error(`分类 "${matchResult.category.name}" 没有配置优化模板`);
    }

    return {
      template: matchResult.category.optimization_template,
      category: matchResult.category,
      confidence: matchResult.confidence,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.categoryCache = [];
    this.lastCacheUpdate = 0;
    logger.info('提示词分类匹配器缓存已清除');
  }
}

// 导出单例
export const promptCategoryMatcher = new PromptCategoryMatcher();
export default promptCategoryMatcher;
