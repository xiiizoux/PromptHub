/**
 * Web服务数据库服务层
 * 
 * 为Web服务提供完整的数据库访问功能，完全独立于MCP服务
 * 使用Supabase作为数据库访问层
 */

import { SupabaseAdapter, Prompt, PromptFilters, PaginatedResponse, User } from './supabase-adapter';

// 扩展的提示词详情接口
export interface PromptDetails extends Prompt {
  content?: string;
  input_variables?: string[];
  compatible_models?: string[];
  allow_collaboration?: boolean;
  edit_permission?: 'owner' | 'collaborators' | 'public';
  author?: string;
}

// 社交功能相关接口
export interface Comment {
  id: string;
  content: string;
  user_id: string;
  prompt_id: string;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    display_name?: string;
  };
  replies?: Comment[];
}

export interface Interaction {
  id: string;
  user_id: string;
  prompt_id: string;
  type: 'like' | 'dislike' | 'bookmark' | 'share';
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    display_name?: string;
  };
}

export interface Post {
  id: string;
  topic_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    display_name?: string;
  };
}

/**
 * Web服务数据库服务类
 * 提供完整的业务数据访问功能
 */
export class DatabaseService {
  private adapter: SupabaseAdapter;

  constructor() {
    this.adapter = new SupabaseAdapter(true); // 使用管理员权限
  }

  // ===== 提示词管理 =====

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<string[]> {
    try {
      // 先尝试从专用的categories表获取
      const { data: categoriesData, error: categoriesError } = await this.adapter.supabase
        .from('categories')
        .select('name, sort_order')
        .eq('is_active', true)
        .order('sort_order');

      if (!categoriesError && categoriesData && categoriesData.length > 0) {
        return categoriesData.map(item => item.name);
      }

      console.log('categories表为空或不存在，初始化预设分类');
      
      // 如果categories表为空，初始化预设分类
      const defaultCategories = [
        { name: '通用', sort_order: 1 },
        { name: '创意写作', sort_order: 2 },
        { name: '代码辅助', sort_order: 3 },
        { name: '数据分析', sort_order: 4 },
        { name: '营销推广', sort_order: 5 },
        { name: '学术研究', sort_order: 6 },
        { name: '教育培训', sort_order: 7 },
        { name: '商务办公', sort_order: 8 },
        { name: '内容翻译', sort_order: 9 },
        { name: '问答助手', sort_order: 10 }
      ];

      // 尝试插入默认分类到categories表
      const { data: insertData, error: insertError } = await this.adapter.supabase
        .from('categories')
        .insert(defaultCategories.map(cat => ({
          name: cat.name,
          sort_order: cat.sort_order,
          is_active: true,
          created_at: new Date().toISOString()
        })))
        .select('name');

      if (!insertError && insertData) {
        console.log('成功初始化categories表');
        return insertData.map(item => item.name);
      }

      console.log('无法写入categories表，使用提示词中的分类作为备选');
      
      // 如果无法写入categories表，从prompts表中提取现有分类
      const { data: promptsData, error: promptsError } = await this.adapter.supabase
        .from('prompts')
        .select('category')
        .not('category', 'is', null)
        .order('category');

      if (!promptsError && promptsData) {
        const existingCategories = Array.from(new Set(
          promptsData.map(item => item.category).filter(Boolean)
        ));
        
        if (existingCategories.length > 0) {
          return existingCategories as string[];
        }
      }

      // 最后的兜底方案：返回默认分类名称
      return defaultCategories.map(cat => cat.name);
      
    } catch (error) {
      console.error('获取分类失败:', error);
      // 发生错误时返回默认分类
      return ['通用', '创意写作', '代码辅助', '数据分析', '营销推广', '学术研究', '教育培训', '商务办公', '内容翻译', '问答助手'];
    }
  }

  /**
   * 获取所有标签
   */
  async getTags(): Promise<string[]> {
    return await this.adapter.getTags();
  }

  /**
   * 获取提示词列表
   */
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    return await this.adapter.getPrompts(filters);
  }

  /**
   * 根据名称获取提示词详情
   */
  async getPromptByName(name: string, userId?: string): Promise<PromptDetails | null> {
    try {
      // 使用联合查询一次性获取提示词和用户信息
      const { data, error } = await this.adapter.supabase
        .from('prompts')
        .select(`
          *,
          user:users!prompts_user_id_fkey(username, display_name)
        `)
        .eq('name', name)
        .or(userId ? `user_id.eq.${userId},is_public.eq.true` : 'is_public.eq.true')
        .single();

      if (error || !data) {
        console.error('获取提示词详情失败:', error);
        return null;
      }

      // 转换为PromptDetails格式
      const promptDetails: PromptDetails = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category || '通用',
        tags: Array.isArray(data.tags) ? data.tags : [],
        messages: data.messages || [],
        is_public: Boolean(data.is_public),
        user_id: data.user_id,
        version: data.version || 1,
        created_at: data.created_at,
        updated_at: data.updated_at,
        
        // 扩展字段
        content: data.messages?.[0]?.content || '',
        input_variables: this.extractInputVariables(data.messages?.[0]?.content || ''),
        compatible_models: data.compatible_models || ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
        allow_collaboration: Boolean(data.allow_collaboration || data.is_public),
        edit_permission: data.edit_permission || 'owner',
        author: data.user?.display_name || data.user?.username || '未知用户'
      };

      return promptDetails;
    } catch (error) {
      console.error('获取提示词详情失败:', error);
      return null;
    }
  }

  /**
   * 创建新提示词
   */
  async createPrompt(promptData: Partial<PromptDetails>): Promise<Prompt> {
    // 转换PromptDetails为Prompt格式
    const prompt: Partial<Prompt> = {
      name: promptData.name,
      description: promptData.description,
      category: promptData.category,
      tags: promptData.tags,
      messages: promptData.content ? [{
        role: 'system',
        content: promptData.content
      }] : promptData.messages,
      is_public: promptData.is_public,
      user_id: promptData.user_id,
      version: promptData.version
    };

    return await this.adapter.createPrompt(prompt);
  }

  /**
   * 更新提示词
   */
  async updatePrompt(name: string, promptData: Partial<PromptDetails>, userId?: string): Promise<Prompt> {
    try {
      // 首先获取现有提示词
      const existingPrompt = await this.adapter.getPrompt(name, userId);
      if (!existingPrompt) {
        throw new Error('提示词不存在');
      }

      // 检查权限
      if (userId && existingPrompt.user_id !== userId) {
        throw new Error('无权限修改此提示词');
      }

      // 转换更新数据
      const updateData: any = {};
      
      if (promptData.name !== undefined) updateData.name = promptData.name;
      if (promptData.description !== undefined) updateData.description = promptData.description;
      if (promptData.category !== undefined) updateData.category = promptData.category;
      if (promptData.tags !== undefined) updateData.tags = promptData.tags;
      if (promptData.is_public !== undefined) updateData.is_public = promptData.is_public;
      
      // 处理content字段，转换为messages格式
      if (promptData.content !== undefined) {
        updateData.messages = [{
          role: 'system',
          content: promptData.content
        }];
      }

      // 增加版本号
      updateData.version = (existingPrompt.version || 1) + 1;
      updateData.updated_at = new Date().toISOString();

      // 执行更新
      const { data, error } = await this.adapter.supabase
        .from('prompts')
        .update(updateData)
        .eq('id', existingPrompt.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`更新提示词失败: ${error.message}`);
      }

      return data as Prompt;
    } catch (error) {
      console.error('更新提示词失败:', error);
      throw error;
    }
  }

  /**
   * 删除提示词
   */
  async deletePrompt(name: string, userId?: string): Promise<boolean> {
    try {
      const existingPrompt = await this.adapter.getPrompt(name, userId);
      if (!existingPrompt) {
        throw new Error('提示词不存在');
      }

      // 检查权限
      if (userId && existingPrompt.user_id !== userId) {
        throw new Error('无权限删除此提示词');
      }

      const { error } = await this.adapter.supabase
        .from('prompts')
        .delete()
        .eq('id', existingPrompt.id);

      return !error;
    } catch (error) {
      console.error('删除提示词失败:', error);
      throw error;
    }
  }

  // ===== 社交功能 =====

  /**
   * 添加评论
   */
  async addComment(promptId: string, content: string, userId: string, parentId?: string): Promise<Comment> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('comments')
        .insert({
          content,
          user_id: userId,
          prompt_id: promptId,
          parent_id: parentId,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          user:users(username, display_name)
        `)
        .single();

      if (error) {
        throw new Error(`添加评论失败: ${error.message}`);
      }

      return data as Comment;
    } catch (error) {
      console.error('添加评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取评论列表
   */
  async getComments(promptId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Comment>> {
    try {
      const offset = (page - 1) * pageSize;

      const { data, error, count } = await this.adapter.supabase
        .from('comments')
        .select(`
          *,
          user:users(username, display_name)
        `, { count: 'exact' })
        .eq('prompt_id', promptId)
        .is('parent_id', null) // 只获取顶级评论
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(`获取评论失败: ${error.message}`);
      }

      // 获取回复
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const replies = await this.getCommentReplies(comment.id);
          return { ...comment, replies };
        })
      );

      return {
        data: commentsWithReplies as Comment[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取评论回复
   */
  async getCommentReplies(commentId: string): Promise<Comment[]> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('comments')
        .select(`
          *,
          user:users(username, display_name)
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`获取回复失败: ${error.message}`);
      }

      return data as Comment[];
    } catch (error) {
      console.error('获取回复失败:', error);
      return [];
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.adapter.supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('删除评论失败:', error);
      return false;
    }
  }

  /**
   * 添加互动（点赞、收藏等）
   */
  async addInteraction(promptId: string, type: 'like' | 'dislike' | 'bookmark' | 'share', userId: string): Promise<boolean> {
    try {
      // 检查是否已存在相同的互动
      const { data: existing } = await this.adapter.supabase
        .from('interactions')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .eq('type', type)
        .single();

      if (existing) {
        return true; // 已存在，视为成功
      }

      const { error } = await this.adapter.supabase
        .from('interactions')
        .insert({
          prompt_id: promptId,
          user_id: userId,
          type,
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('添加互动失败:', error);
      return false;
    }
  }

  /**
   * 移除互动
   */
  async removeInteraction(promptId: string, type: 'like' | 'dislike' | 'bookmark' | 'share', userId: string): Promise<boolean> {
    try {
      const { error } = await this.adapter.supabase
        .from('interactions')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .eq('type', type);

      return !error;
    } catch (error) {
      console.error('移除互动失败:', error);
      return false;
    }
  }

  /**
   * 获取互动统计
   */
  async getInteractionStats(promptId: string, userId?: string): Promise<any> {
    try {
      // 获取各类型互动数量
      const { data: stats, error } = await this.adapter.supabase
        .from('interactions')
        .select('type')
        .eq('prompt_id', promptId);

      if (error) {
        throw new Error(`获取互动统计失败: ${error.message}`);
      }

      const statsMap = {
        like: 0,
        dislike: 0,
        bookmark: 0,
        share: 0
      };

      stats?.forEach(item => {
        if (item.type in statsMap) {
          statsMap[item.type as keyof typeof statsMap]++;
        }
      });

      // 获取用户的互动状态
      let userInteractions: string[] = [];
      if (userId) {
        const { data: userStats } = await this.adapter.supabase
          .from('interactions')
          .select('type')
          .eq('prompt_id', promptId)
          .eq('user_id', userId);

        userInteractions = userStats?.map(item => item.type) || [];
      }

      return {
        stats: statsMap,
        userInteractions
      };
    } catch (error) {
      console.error('获取互动统计失败:', error);
      return {
        stats: { like: 0, dislike: 0, bookmark: 0, share: 0 },
        userInteractions: []
      };
    }
  }

  // ===== 辅助方法 =====

  /**
   * 根据用户ID获取用户名
   */
  private async getUsernameById(userId: string): Promise<string> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('users')
        .select('username, display_name')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return '未知用户';
      }

      return data.display_name || data.username || '未知用户';
    } catch (error) {
      return '未知用户';
    }
  }

  /**
   * 从提示词内容中提取输入变量
   */
  private extractInputVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return Array.from(new Set(
      matches.map(match => match.replace(/[{}]/g, ''))
    ));
  }
}

// 创建服务实例
export const databaseService = new DatabaseService();

// 默认导出
export default databaseService; 