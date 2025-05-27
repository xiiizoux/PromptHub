/**
 * Supabase适配器搜索扩展
 * 
 * 为Supabase适配器添加高级搜索和统计功能
 */

import { SupabaseAdapter } from './supabase-adapter.js';
import { Prompt, PaginatedResponse } from './types.js';

// 搜索参数接口
interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  userId?: string;
}

// 搜索统计参数
interface SearchStatsParams {
  query?: string;
  category?: string;
  tags?: string[];
  userId?: string;
  resultsCount: number;
}

/**
 * 扩展Supabase适配器，添加高级搜索功能
 */
export function extendSearchAdapter(adapter: SupabaseAdapter): any {
  // 创建一个新的对象，将所有现有方法复制过来
  const extendedAdapter = Object.create(adapter);
  
  /**
   * 高级提示词搜索
   * @param params 搜索参数
   * @returns 分页搜索结果
   */
  extendedAdapter.searchPrompts = async function(params: SearchParams): Promise<PaginatedResponse<Prompt>> {
    try {
      const {
        query = '',
        category,
        tags = [],
        page = 1,
        limit = 20,
        userId
      } = params;
      
      // 基础查询
      let dbQuery = this.supabase
        .from('prompts')
        .select('*', { count: 'exact' });
      
      // 添加全文搜索条件
      if (query && query.trim()) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      // 分类过滤
      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }
      
      // 标签过滤
      if (tags && tags.length > 0) {
        // 对于数组类型，我们需要使用Postgres的包含操作符
        // 这会查找tags数组包含所有指定标签的记录
        tags.forEach(tag => {
          dbQuery = dbQuery.contains('tags', [tag]);
        });
      }
      
      // 访问控制筛选
      if (userId) {
        // 用户自己的提示词 + 公开提示词
        dbQuery = dbQuery.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        // 没有用户ID时只返回公开内容
        dbQuery = dbQuery.eq('is_public', true);
      }
      
      // 分页
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // 执行查询
      const { data, error, count } = await dbQuery;
      
      if (error) {
        console.error('搜索提示词失败:', error);
        return {
          data: [],
          total: 0,
          page,
          pageSize: limit,
          totalPages: 0
        };
      }
      
      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize: limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      };
    } catch (err) {
      console.error('搜索提示词时出错:', err);
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        pageSize: params.limit || 20,
        totalPages: 0
      };
    }
  };
  
  /**
   * 记录搜索查询统计
   * @param params 搜索统计参数
   */
  extendedAdapter.recordSearchQuery = async function(params: SearchStatsParams): Promise<void> {
    try {
      const {
        query = '',
        category,
        tags = [],
        userId,
        resultsCount
      } = params;
      
      // 插入搜索记录
      await this.supabase
        .from('search_stats')
        .insert({
          query: query.trim() || null,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
          user_id: userId || null,
          results_count: resultsCount,
          search_time: new Date().toISOString()
        });
    } catch (err) {
      console.error('记录搜索统计时出错:', err);
      // 不抛出错误，允许搜索统计失败不影响主流程
    }
  };
  
  /**
   * 获取热门搜索查询
   * @param limit 结果数量限制
   * @param days 过去几天的数据
   * @returns 热门搜索词及其计数
   */
  extendedAdapter.getPopularSearches = async function(limit: number = 10, days: number = 7): Promise<{query: string; count: number}[]> {
    try {
      // 计算日期范围
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // 查询搜索统计
      const { data, error } = await this.supabase
        .from('search_stats')
        .select('query, count(*)')
        .not('query', 'is', null)
        .gte('search_time', startDate.toISOString())
        .group('query')
        .order('count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('获取热门搜索失败:', error);
        return [];
      }
      
      return data.map((item: any) => ({
        query: item.query,
        count: parseInt(item.count, 10)
      }));
    } catch (err) {
      console.error('获取热门搜索时出错:', err);
      return [];
    }
  };
  
  /**
   * 获取用户搜索历史
   * @param userId 用户ID
   * @param limit 结果数量限制
   * @returns 用户最近的搜索
   */
  extendedAdapter.getUserSearchHistory = async function(userId: string, limit: number = 20): Promise<{query: string; category?: string; tags?: string[]; timestamp: string}[]> {
    try {
      if (!userId) {
        return [];
      }
      
      // 查询用户搜索历史
      const { data, error } = await this.supabase
        .from('search_stats')
        .select('query, category, tags, search_time')
        .eq('user_id', userId)
        .not('query', 'is', null)
        .order('search_time', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('获取用户搜索历史失败:', error);
        return [];
      }
      
      return data.map((item: any) => ({
        query: item.query,
        category: item.category,
        tags: item.tags,
        timestamp: item.search_time
      }));
    } catch (err) {
      console.error('获取用户搜索历史时出错:', err);
      return [];
    }
  };
  
  return extendedAdapter;
}
