import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { Prompt } from '../types.js';

/**
 * 提示词使用记录接口
 */
export interface PromptUsage {
  promptId: string;
  promptVersion: number;
  userId?: string;
  sessionId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  clientMetadata?: any;
}

/**
 * 提示词反馈接口
 */
export interface PromptFeedback {
  usageId: string;
  rating: number;
  feedbackText?: string;
  categories?: string[];
  userId?: string;
}

/**
 * 提示词性能汇总接口
 */
export interface PromptPerformance {
  promptId: string;
  promptVersion: number;
  usageCount: number;
  avgRating?: number;
  avgLatencyMs: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  feedbackCount: number;
  lastUsedAt: Date;
}

/**
 * A/B测试配置接口
 */
export interface ABTestConfig {
  name: string;
  description?: string;
  promptId: string;
  versionA: number;
  versionB: number;
  metric: 'rating' | 'latency' | 'tokens';
  endDate?: Date;
}

/**
 * 提示词性能跟踪类
 */
export class PerformanceTracker {
  private supabase: SupabaseClient;
  private isEnabled: boolean = false;

  constructor() {
      // 初始化supabase客户端（避免初始化错误）
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
      
      console.log('\n🔍 [PerformanceTracker] 初始化诊断开始...');
      console.log('🔧 [PerformanceTracker] 检查配置条件:');
      console.log(`   - config.storage.type: "${config.storage.type}"`);
      console.log(`   - config.supabase存在: ${!!config.supabase}`);
      console.log(`   - config.supabase.url: "${config.supabase?.url || 'undefined'}"`);
      console.log(`   - config.supabase.anonKey: "${config.supabase?.anonKey ? config.supabase.anonKey.substring(0, 10) + '...' : 'undefined'}"`);
      console.log(`   - config.supabase.serviceKey: "${config.supabase?.serviceKey ? config.supabase.serviceKey.substring(0, 10) + '...' : 'undefined'}"`);
      
      // 如果使用Supabase存储，则启用性能跟踪
      if (config.storage.type === 'supabase' && config.supabase && config.supabase.url && config.supabase.anonKey) {
        // 优先使用服务密钥，这样可以绕过RLS策略
        const serviceKey = config.supabase.serviceKey || config.supabase.anonKey;
        
        this.supabase = createClient(config.supabase.url, serviceKey);
        this.isEnabled = true;
        console.log('✅ [PerformanceTracker] 性能分析功能已启用');
        console.log(`🔑 [PerformanceTracker] 数据库URL: ${config.supabase.url}`);
        
        if (config.supabase.serviceKey) {
          console.log('✅ [PerformanceTracker] 使用服务密钥，可绕过行级安全策略');
        } else {
          console.log('⚠️  [PerformanceTracker] 使用匿名密钥，受行级安全策略限制');
        }
        
        // 测试数据库连接
        this.testDatabaseConnection();
      } else {
        console.log('❌ [PerformanceTracker] 性能分析功能未启用，原因:');
        if (config.storage.type !== 'supabase') {
          console.log(`   - 存储类型不是Supabase: "${config.storage.type}"`);
        }
        if (!config.supabase) {
          console.log('   - 缺少Supabase配置');
        }
        if (!config.supabase?.url) {
          console.log('   - 缺少SUPABASE_URL环境变量');
        }
        if (!config.supabase?.anonKey) {
          console.log('   - 缺少SUPABASE_ANON_KEY环境变量');
        }
        console.log('💡 [PerformanceTracker] 要启用性能分析，请设置正确的Supabase环境变量');
      }
      
      console.log(`🎯 [PerformanceTracker] 最终状态: isEnabled = ${this.isEnabled}`);
      console.log('🔍 [PerformanceTracker] 初始化诊断完成\n');
    }
  
    /**
     * 测试数据库连接和表结构
     */
    private async testDatabaseConnection(): Promise<void> {
      if (!this.isEnabled) return;
      
      try {
        console.log('🔗 [PerformanceTracker] 测试数据库连接...');
        
        // 检查prompt_usage表是否存在
        const { data, error } = await this.supabase
          .from('prompt_usage')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('❌ [PerformanceTracker] 数据库连接测试失败:', error.message);
          console.error('   可能原因: 表不存在、权限不足或网络问题');
          console.error('   请检查数据库模式和RLS策略');
          
          // 如果是权限问题，尝试降级处理
          if (error.message.includes('permission') || error.message.includes('RLS')) {
            console.log('⚠️  [PerformanceTracker] 检测到权限问题，可能需要服务密钥');
          }
          
          return;
        }
        
        console.log('✅ [PerformanceTracker] 数据库连接测试成功');
        console.log(`📊 [PerformanceTracker] prompt_usage表可访问，当前记录数: ${data ? data.length : 0}`);
        
      } catch (err) {
        console.error('❌ [PerformanceTracker] 数据库连接测试异常:', err);
      }
    }


  /**
   * 记录提示词使用
   * @param usage 使用记录数据
   * @returns 新创建的记录ID或null
   */
  public async trackUsage(usage: PromptUsage): Promise<string | null> {
      console.log('🎯 [PerformanceTracker] trackUsage调用开始');
      console.log(`   - isEnabled: ${this.isEnabled}`);
      console.log(`   - promptId: ${usage.promptId}`);
      console.log(`   - userId: ${usage.userId}`);
      console.log(`   - toolName: ${usage.clientMetadata?.toolName || 'unknown'}`);
      
      if (!this.isEnabled) {
        console.log('❌ [PerformanceTracker] 性能跟踪未启用，跳过记录');
        return null;
      }
  
      try {
        // 对于搜索操作，使用特殊的处理方式
        if (usage.promptId === '00000000-0000-4000-8000-000000000001') {
          console.log('🔍 [PerformanceTracker] 记录搜索操作到数据库...');
          
          const insertData = {
            prompt_id: null, // 搜索操作不关联具体提示词
            prompt_version: usage.promptVersion,
            user_id: usage.userId === 'anonymous' ? null : usage.userId,
            session_id: usage.sessionId || this.generateSessionId(),
            model: usage.model,
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            latency_ms: usage.latencyMs,
            client_metadata: {
              ...usage.clientMetadata,
              search_operation: true, // 标记为搜索操作
              prompt_placeholder_id: usage.promptId // 保存原始的占位符ID
            }
          };
          
          console.log('📝 [PerformanceTracker] 插入数据:', JSON.stringify(insertData, null, 2));
          
          const { data, error } = await this.supabase
            .from('prompt_usage')
            .insert([insertData])
            .select('id');
  
          if (error) {
            console.error('❌ [PerformanceTracker] 记录搜索操作使用时出错:', error);
            console.error('   错误详情:', JSON.stringify(error, null, 2));
            return null;
          }
  
          const usageId = data && data[0] ? data[0].id : null;
          console.log(`✅ [PerformanceTracker] 搜索操作使用记录已创建，ID: ${usageId}`);
          return usageId;
        } else {
          console.log('📝 [PerformanceTracker] 记录普通提示词使用到数据库...');
          
          const insertData = {
            prompt_id: usage.promptId,
            prompt_version: usage.promptVersion,
            user_id: usage.userId === 'anonymous' ? null : usage.userId,
            session_id: usage.sessionId || this.generateSessionId(),
            model: usage.model,
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            latency_ms: usage.latencyMs,
            client_metadata: usage.clientMetadata || {}
          };
          
          console.log('📝 [PerformanceTracker] 插入数据:', JSON.stringify(insertData, null, 2));
          
          const { data, error } = await this.supabase
            .from('prompt_usage')
            .insert([insertData])
            .select('id');
  
          if (error) {
            console.error('❌ [PerformanceTracker] 记录提示词使用时出错:', error);
            console.error('   错误详情:', JSON.stringify(error, null, 2));
            return null;
          }
  
          const usageId = data && data[0] ? data[0].id : null;
          console.log(`✅ [PerformanceTracker] 提示词使用记录已创建，ID: ${usageId}`);
          return usageId;
        }
      } catch (err) {
        console.error('❌ [PerformanceTracker] 跟踪提示词使用时出错:', err);
        return null;
      }
    }



  /**
   * 提交提示词使用反馈
   * @param feedback 反馈数据
   * @returns 是否成功
   */
  public async submitFeedback(feedback: PromptFeedback): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const { error } = await this.supabase
        .from('prompt_feedback')
        .insert([{
          usage_id: feedback.usageId,
          rating: feedback.rating,
          feedback_text: feedback.feedbackText,
          categories: feedback.categories,
          user_id: feedback.userId
        }]);

      if (error) {
        console.error('提交反馈时出错:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('提交反馈时出错:', err);
      return false;
    }
  }

  /**
   * 获取提示词性能数据
   * @param promptId 提示词ID
   * @param version 可选的特定版本
   * @returns 性能数据数组
   */
  public async getPerformance(promptId: string, version?: number): Promise<PromptPerformance[]> {
    if (!this.isEnabled) return [];

    try {
      let query = this.supabase
        .from('prompt_performance')
        .select('*')
        .eq('prompt_id', promptId);
      
      if (version !== undefined) {
        query = query.eq('prompt_version', version);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取性能数据时出错:', error);
        return [];
      }

      return data.map(item => ({
        promptId: item.prompt_id,
        promptVersion: item.prompt_version,
        usageCount: item.usage_count,
        avgRating: item.avg_rating,
        avgLatencyMs: item.avg_latency_ms,
        avgInputTokens: item.avg_input_tokens,
        avgOutputTokens: item.avg_output_tokens,
        feedbackCount: item.feedback_count,
        lastUsedAt: new Date(item.last_used_at)
      }));
    } catch (err) {
      console.error('获取性能数据时出错:', err);
      return [];
    }
  }

  /**
   * 创建A/B测试
   * @param config A/B测试配置
   * @returns 创建的测试ID或null
   */
  public async createABTest(config: ABTestConfig): Promise<string | null> {
    if (!this.isEnabled) return null;

    try {
      const { data, error } = await this.supabase
        .from('prompt_ab_tests')
        .insert([{
          name: config.name,
          description: config.description,
          prompt_id: config.promptId,
          version_a: config.versionA,
          version_b: config.versionB,
          metric: config.metric,
          end_date: config.endDate?.toISOString(),
          status: 'active'
        }])
        .select('id');

      if (error) {
        console.error('创建A/B测试时出错:', error);
        return null;
      }

      return data && data[0] ? data[0].id : null;
    } catch (err) {
      console.error('创建A/B测试时出错:', err);
      return null;
    }
  }

  /**
   * 获取A/B测试结果
   * @param testId 测试ID
   * @returns 测试结果数据
   */
  public async getABTestResults(testId: string): Promise<any> {
    if (!this.isEnabled) return null;

    try {
      // 获取测试配置
      const { data: testData, error: testError } = await this.supabase
        .from('prompt_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError || !testData) {
        console.error('获取A/B测试数据时出错:', testError);
        return null;
      }

      // 获取两个版本的性能数据
      const [perfA, perfB] = await Promise.all([
        this.getPerformance(testData.prompt_id, testData.version_a),
        this.getPerformance(testData.prompt_id, testData.version_b)
      ]);

      const versionAData = perfA.length > 0 ? perfA[0] : null;
      const versionBData = perfB.length > 0 ? perfB[0] : null;

      // 计算结果数据
      const results = {
        test: testData,
        versionA: versionAData,
        versionB: versionBData,
        comparison: this.compareVersions(versionAData, versionBData, testData.metric),
        recommendation: null as string | null
      };

      // 生成推荐
      results.recommendation = this.generateRecommendation(results);

      // 如果测试已完成，更新测试状态和结果
      if (testData.status === 'active' && testData.end_date && new Date(testData.end_date) <= new Date()) {
        await this.supabase
          .from('prompt_ab_tests')
          .update({ 
            status: 'completed',
            result: results,
            updated_at: new Date().toISOString()
          })
          .eq('id', testId);
      }

      return results;
    } catch (err) {
      console.error('获取A/B测试结果时出错:', err);
      return null;
    }
  }

  /**
   * 获取提示词使用历史
   * @param promptId 提示词ID
   * @param limit 限制结果数量
   * @param offset 分页偏移量
   * @returns 使用记录数组
   */
  public async getUsageHistory(promptId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    if (!this.isEnabled) return [];

    try {
      const { data, error } = await this.supabase
        .from('prompt_usage')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('获取使用历史时出错:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('获取使用历史时出错:', err);
      return [];
    }
  }

  /**
   * 生成性能报告
   * @param promptId 提示词ID
   * @returns 性能报告数据
   */
  public async generatePerformanceReport(promptId: string): Promise<any> {
    if (!this.isEnabled) return null;

    try {
      // 获取提示词信息
      const { data: promptData, error: promptError } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (promptError || !promptData) {
        console.error('获取提示词数据时出错:', promptError);
        return null;
      }

      // 获取所有版本的性能数据
      const performanceData = await this.getPerformance(promptId);

      // 获取最近的使用记录
      const recentUsage = await this.getUsageHistory(promptId, 10);

      // 计算总成本估算
      const totalTokens = performanceData.reduce((sum, p) => {
        return sum + (p.avgInputTokens + p.avgOutputTokens) * p.usageCount;
      }, 0);
      
      // 假设GPT-3.5的价格为$0.002/1K tokens，GPT-4为$0.06/1K tokens
      // 这里简化计算，实际应用中应根据不同模型的实际使用比例计算
      const estimatedCost = (totalTokens / 1000) * 0.002;
      
      // 收集常见反馈主题
      const { data: feedbackData, error: feedbackError } = await this.supabase
        .from('prompt_feedback')
        .select('categories')
        .eq('prompt_id', promptId);
        
      const feedbackThemes: Record<string, number> = {};
      if (!feedbackError && feedbackData) {
        feedbackData.forEach(feedback => {
          if (feedback.categories) {
            feedback.categories.forEach((category: string) => {
              feedbackThemes[category] = (feedbackThemes[category] || 0) + 1;
            });
          }
        });
      }

      // 生成性能优化建议
      const suggestions = this.generateOptimizationSuggestions(performanceData, recentUsage);

      return {
        prompt: promptData,
        currentVersion: promptData.version,
        performance: {
          totalUsageCount: performanceData.reduce((sum, p) => sum + p.usageCount, 0),
          averageRating: this.calculateAverageRating(performanceData),
          averageLatency: this.calculateAverageMetric(performanceData, 'avgLatencyMs'),
          totalTokens,
          estimatedCost
        },
        versionComparison: performanceData,
        recentUsage,
        feedbackThemes,
        optimizationSuggestions: suggestions
      };
    } catch (err) {
      console.error('生成性能报告时出错:', err);
      return null;
    }
  }

  // 辅助方法

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * 比较两个版本的性能
   */
  private compareVersions(versionA: PromptPerformance | null, versionB: PromptPerformance | null, metric: string): any {
    if (!versionA || !versionB) return null;

    let comparison: any = {
      winner: null,
      improvement: 0,
      confidenceLevel: 'low'
    };

    if (metric === 'rating') {
      if (versionA.avgRating && versionB.avgRating) {
        const diff = versionB.avgRating - versionA.avgRating;
        comparison.improvement = (diff / versionA.avgRating) * 100;
        comparison.winner = diff > 0 ? 'B' : (diff < 0 ? 'A' : 'tie');
      }
    } else if (metric === 'latency') {
      const diff = versionA.avgLatencyMs - versionB.avgLatencyMs;
      comparison.improvement = (diff / versionA.avgLatencyMs) * 100;
      comparison.winner = diff > 0 ? 'B' : (diff < 0 ? 'A' : 'tie');
    } else if (metric === 'tokens') {
      const tokensA = versionA.avgInputTokens + versionA.avgOutputTokens;
      const tokensB = versionB.avgInputTokens + versionB.avgOutputTokens;
      const diff = tokensA - tokensB;
      comparison.improvement = (diff / tokensA) * 100;
      comparison.winner = diff > 0 ? 'B' : (diff < 0 ? 'A' : 'tie');
    }

    // 根据样本量确定置信度
    const minSamples = Math.min(versionA.usageCount, versionB.usageCount);
    if (minSamples >= 100) {
      comparison.confidenceLevel = 'high';
    } else if (minSamples >= 30) {
      comparison.confidenceLevel = 'medium';
    }

    return comparison;
  }

  /**
   * 生成测试推荐
   */
  private generateRecommendation(results: any): string | null {
    if (!results.comparison || !results.comparison.winner || results.comparison.winner === 'tie') {
      return "测试结果没有显示明显的优胜者，建议继续测试或调整提示词以获得更明显的差异。";
    }

    const winner = results.comparison.winner === 'A' ? '版本A' : '版本B';
    const improvement = Math.abs(results.comparison.improvement).toFixed(2);
    const metric = results.test.metric === 'rating' ? '评分' : 
                  (results.test.metric === 'latency' ? '响应时间' : 'token使用量');
    const confidence = results.comparison.confidenceLevel === 'high' ? '高' : 
                      (results.comparison.confidenceLevel === 'medium' ? '中等' : '低');

    return `建议使用${winner}，它在${metric}方面显示出${improvement}%的改进，置信度${confidence}。`;
  }

  /**
   * 计算平均评分
   */
  private calculateAverageRating(performanceData: PromptPerformance[]): number | null {
    const validRatings = performanceData.filter(p => p.avgRating !== undefined && p.feedbackCount > 0);
    if (validRatings.length === 0) return null;

    const totalWeightedRating = validRatings.reduce((sum, p) => sum + (p.avgRating || 0) * p.feedbackCount, 0);
    const totalFeedbacks = validRatings.reduce((sum, p) => sum + p.feedbackCount, 0);
    
    return totalWeightedRating / totalFeedbacks;
  }

  /**
   * 计算指定指标的平均值
   */
  private calculateAverageMetric(performanceData: PromptPerformance[], metricKey: keyof PromptPerformance): number | null {
    const validData = performanceData.filter(p => p.usageCount > 0);
    if (validData.length === 0) return null;

    const totalWeightedMetric = validData.reduce((sum, p) => {
      const metricValue = p[metricKey];
      return sum + (typeof metricValue === 'number' ? metricValue * p.usageCount : 0);
    }, 0);
    
    const totalUsage = validData.reduce((sum, p) => sum + p.usageCount, 0);
    
    return totalWeightedMetric / totalUsage;
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(performanceData: PromptPerformance[], recentUsage: any[]): string[] {
    const suggestions: string[] = [];
    
    // 检查样本量
    if (performanceData.every(p => p.usageCount < 10)) {
      suggestions.push("提示词使用量较低，建议增加使用量以获得更准确的性能分析。");
    }
    
    // 检查评分
    const avgRating = this.calculateAverageRating(performanceData);
    if (avgRating !== null) {
      if (avgRating < 3.5) {
        suggestions.push(`当前平均评分较低(${avgRating.toFixed(1)}/5.0)，建议审查用户反馈并改进提示词内容。`);
      }
    } else {
      suggestions.push("缺少用户评分数据，建议添加反馈机制以收集用户评价。");
    }
    
    // 检查token使用量
    const highTokenVersions = performanceData.filter(p => p.avgInputTokens + p.avgOutputTokens > 1000);
    if (highTokenVersions.length > 0) {
      suggestions.push("部分版本token使用量较大，考虑简化提示词或优化指令以减少成本。");
    }
    
    // 检查响应时间
    const avgLatency = this.calculateAverageMetric(performanceData, 'avgLatencyMs');
    if (avgLatency !== null && avgLatency > 3000) {
      suggestions.push(`平均响应时间(${(avgLatency/1000).toFixed(1)}秒)较长，考虑简化提示词或优化模型选择以提高响应速度。`);
    }
    
    // 版本比较
    if (performanceData.length > 1) {
      const bestVersion = performanceData.reduce((best, current) => {
        if (!best) return current;
        if (current.avgRating && best.avgRating && current.avgRating > best.avgRating) return current;
        return best;
      }, null as PromptPerformance | null);
      
      if (bestVersion && bestVersion.promptVersion !== performanceData[0].promptVersion) {
        suggestions.push(`版本${bestVersion.promptVersion}的性能数据优于当前版本，考虑恢复到该版本或基于该版本创建新版本。`);
      }
    }
    
    // 如果没有发现明显问题
    if (suggestions.length === 0) {
      suggestions.push("当前提示词性能良好，无明显优化需求。可以考虑进行A/B测试来进一步改进性能。");
    }
    
    return suggestions;
  }
}

// 创建单例实例
export const performanceTracker = new PerformanceTracker();
