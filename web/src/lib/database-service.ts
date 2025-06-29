/**
 * Web服务数据库服务层
 * 
 * 为Web服务提供完整的数据库访问功能，完全独立于MCP服务
 * 使用Supabase作为数据库访问层
 */

import { SupabaseAdapter, Prompt, PromptFilters, PaginatedResponse, User } from './supabase-adapter';
import type { PromptTemplate, TemplateCategory } from '@/types';

// 扩展的提示词详情接口
export interface PromptDetails extends Prompt {
  content?: string;
  input_variables?: string[];
  compatible_models?: string[];
  allow_collaboration?: boolean;
  edit_permission?: 'owner_only' | 'collaborators' | 'public';
  author?: string;
  collaborators?: string[]; // 协作者用户名列表
  
  // 表单专用字段
  preview_assets?: Array<{
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
}

// 移除社交功能相关接口 - MCP服务专注于提示词管理

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
    this.adapter = new SupabaseAdapter(true); // 使用管理员权限以便查询用户信息
  }

  // ===== 提示词管理 =====

  /**
   * 获取所有分类
   * 从categories表获取数据，确保数据的一致性和完整性
   * @param type 可选的分类类型过滤 (chat, image, video)
   */
  async getCategories(type?: string): Promise<string[]> {
    console.log('=== 开始获取categories表数据 ===', { type });

    let query = this.adapter.supabase
      .from('categories')
      .select('id, name, name_en, description, sort_order, is_active, type')
      .eq('is_active', true);

    // 如果指定了type，则按type过滤
    if (type && ['chat', 'image', 'video'].includes(type)) {
      console.log('添加type过滤:', type);
      query = query.eq('type', type);
    } else {
      console.log('没有type过滤或type无效:', type);
    }

    console.log('执行查询，SQL预览:', query);

    // 先查询表结构确认type字段存在
    const { data: tableInfo, error: tableError } = await this.adapter.supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    console.log('categories表结构示例:', tableInfo?.[0]);

    const { data: categoriesData, error: categoriesError } = await query.order('sort_order');

    console.log('数据库查询结果:', {
      error: categoriesError,
      errorCode: categoriesError?.code,
      errorMessage: categoriesError?.message,
      dataLength: categoriesData?.length || 0,
      data: categoriesData?.slice(0, 5), // 显示前5个用于调试
      allData: categoriesData, // 显示全部数据用于调试
    });

    if (categoriesError) {
      console.error('数据库错误详情:', {
        code: categoriesError.code,
        message: categoriesError.message,
        details: categoriesError.details,
        hint: categoriesError.hint,
      });
      throw new Error(`获取分类失败: ${categoriesError.message}`);
    }

    if (!categoriesData || categoriesData.length === 0) {
      throw new Error('categories表中没有数据');
    }

    console.log('成功从categories表获取数据，数量:', categoriesData.length);
    const categoryNames = categoriesData.map(c => c.name);
    console.log('返回的分类名称:', categoryNames);
    return categoryNames;
  }






  /**
   * 获取所有标签
   */
  async getTags(): Promise<string[]> {
    return await this.adapter.getTags();
  }

  /**
   * 获取带使用频率的标签统计
   */
  async getTagsWithUsageStats(): Promise<Array<{tag: string, count: number}>> {
    return await this.adapter.getTagsWithUsageStats();
  }

  /**
   * 获取提示词列表
   */
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    return await this.adapter.getPrompts(filters);
  }

  /**
   * 根据名称或ID获取提示词详情
   * 支持通过UUID或名称查找提示词
   */
  async getPromptByName(nameOrId: string, userId?: string): Promise<PromptDetails | null> {
    try {
      console.log(`[DatabaseService] 开始获取提示词，标识符: ${nameOrId}, 用户ID: ${userId}`);

      // 检测是否为UUID格式
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameOrId);
      console.log(`[DatabaseService] 标识符类型: ${isUuid ? 'UUID' : 'Name'}`);

      // 首先获取提示词基本信息
      const prompt = await this.adapter.getPrompt(nameOrId, userId);
      if (!prompt) {
        console.log(`[DatabaseService] 未找到提示词，标识符: ${nameOrId}`);
        return null;
      }

      console.log(`[DatabaseService] 找到提示词: ${prompt.name} (ID: ${prompt.id})`);

      // 然后获取作者信息
      let authorName = '未知用户';
      const authorUserId = prompt.user_id; // 只使用 user_id

      if (authorUserId) {
        try {
          console.log(`[DatabaseService] 开始获取用户信息，用户ID: ${authorUserId}`);
          const { data: userData, error: userError } = await this.adapter.supabase
            .from('users')
            .select('display_name, email')
            .eq('id', authorUserId)
            .maybeSingle(); // 使用 maybeSingle() 而不是 single()，避免在没有记录时抛出错误

          if (userError) {
            console.warn('获取用户信息时发生错误:', userError);
          } else if (userData) {
            if (userData.display_name) {
              authorName = userData.display_name;
              console.log(`[DatabaseService] 成功获取用户信息: ${authorName}`);
            } else if (userData.email) {
              // 如果没有 display_name，使用 email 的前缀作为备用
              authorName = userData.email.split('@')[0];
              console.log(`[DatabaseService] 使用邮箱前缀作为用户名: ${authorName}`);
            } else {
              console.warn(`[DatabaseService] 用户 ${authorUserId} 存在但没有 display_name 或 email`);
            }
          } else {
            console.warn(`[DatabaseService] 用户 ${authorUserId} 不存在`);
          }
        } catch (userErr) {
          console.warn('获取用户信息失败，使用默认作者名:', userErr);
        }
      } else {
        console.warn('[DatabaseService] 提示词没有 user_id 字段');
      }

      // 获取协作者信息
      let collaborators: string[] = [];
      try {
        console.log(`[DatabaseService] 开始获取协作者信息，提示词ID: ${prompt.id}`);
        const { data: collaboratorData, error: collaboratorError } = await this.adapter.supabase
          .from('prompt_collaborators')
          .select(`
            user_id,
            users!prompt_collaborators_user_id_fkey (
              username,
              display_name,
              email
            )
          `)
          .eq('prompt_id', prompt.id);

        if (collaboratorError) {
          console.error(`[DatabaseService] 获取协作者信息失败:`, collaboratorError);
        } else if (collaboratorData && collaboratorData.length > 0) {
          collaborators = collaboratorData.map((collab: any) => {
            const user = collab.users;
            // 优先使用 username，然后是 display_name，最后是 email 的用户名部分
            return user?.username || user?.display_name || user?.email?.split('@')[0] || '未知用户';
          });
          console.log(`[DatabaseService] 找到 ${collaborators.length} 个协作者: ${collaborators.join(', ')}`);
        } else {
          console.log(`[DatabaseService] 该提示词没有协作者`);
        }
      } catch (collaboratorError) {
        console.error(`[DatabaseService] 获取协作者信息失败:`, collaboratorError);
      }

      // 处理内容提取
      let content = '';
      if (prompt.messages && Array.isArray(prompt.messages) && prompt.messages.length > 0) {
        const firstMessage = prompt.messages[0];
        if (typeof firstMessage.content === 'string') {
          content = firstMessage.content;
        } else if (typeof firstMessage.content === 'object' && firstMessage.content?.text) {
          content = firstMessage.content.text;
        }
      }

      // 转换为PromptDetails格式
      const promptDetails: PromptDetails = {
        id: prompt.id,
        name: prompt.name,
        description: prompt.description || '',
        category: prompt.category || '通用',
        category_type: prompt.category_type || 'chat', // 添加category_type字段
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        messages: prompt.messages || [],
        is_public: Boolean(prompt.is_public),
        user_id: prompt.user_id,
        version: prompt.version || 1,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,

        // 扩展字段
        content: content,
        input_variables: this.extractInputVariables(content),
        compatible_models: prompt.compatible_models || [], // 保持数据原始性，不添加假的默认值
        allow_collaboration: Boolean(prompt.allow_collaboration), // 使用数据库中的实际值
        edit_permission: (prompt.edit_permission as 'owner_only' | 'collaborators' | 'public') || 'owner_only',
        author: authorName,
        collaborators: collaborators, // 添加协作者列表

        // 媒体相关字段
        preview_asset_url: prompt.preview_asset_url, // 添加预览资源URL
        parameters: prompt.parameters || {}, // 添加参数字段
      };

      console.log('getPromptByName - 最终处理的数据:', {
        name: promptDetails.name,
        category: promptDetails.category,
        category_type: promptDetails.category_type,
        tags: promptDetails.tags,
        input_variables: promptDetails.input_variables,
        edit_permission: promptDetails.edit_permission,
        author: promptDetails.author,
        user_id: promptDetails.user_id,
        contentLength: content.length,
        preview_asset_url: promptDetails.preview_asset_url,
        parameters: promptDetails.parameters,
        hasMediaFiles: promptDetails.parameters?.media_files?.length || 0,
      });

      console.log('getPromptByName - 详细调试信息:', {
        prompt_user_id: prompt.user_id,
        // prompt_created_by 属性不存在，已移除
        final_author: authorName,
        prompt_is_public: prompt.is_public,
      });

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
    // 处理媒体文件：将preview_assets转换为parameters.media_files
    let parameters = promptData.parameters || {};
    let previewAssetUrl = promptData.preview_asset_url;

    if (promptData.preview_assets && promptData.preview_assets.length > 0) {
      parameters.media_files = promptData.preview_assets.map(asset => ({
        id: asset.id,
        url: asset.url,
        name: asset.name,
        size: asset.size,
        type: asset.type
      }));

      // 设置第一个媒体文件作为封面
      if (!previewAssetUrl) {
        previewAssetUrl = promptData.preview_assets[0].url;
      }
    }

    // 转换PromptDetails为Prompt格式
    const prompt: Partial<Prompt> = {
      name: promptData.name,
      description: promptData.description,
      category: promptData.category,
      category_type: promptData.category_type || 'chat', // 添加category_type字段
      tags: promptData.tags,
      messages: promptData.content ? [{
        role: 'system',
        content: promptData.content,
      }] : promptData.messages,
      is_public: promptData.is_public,
      user_id: promptData.user_id,
      version: promptData.version ? Number(promptData.version) : 1.0, // 新建提示词默认版本为1.0
      compatible_models: promptData.compatible_models, // 添加兼容模型字段
      preview_asset_url: previewAssetUrl, // 使用第一个媒体文件作为封面
      parameters: parameters, // 添加处理后的参数
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

      // 处理媒体文件删除：比较新旧文件列表，删除不再使用的文件
      const existingMediaFiles = existingPrompt.parameters?.media_files || [];
      const newMediaFiles = promptData.preview_assets || [];

      // 找出需要删除的文件（存在于旧列表但不在新列表中）
      const filesToDelete = existingMediaFiles.filter((existingFile: any) => 
        !newMediaFiles.some((newFile: any) => newFile.url === existingFile.url)
      );

      // 删除不再使用的文件
      for (const fileToDelete of filesToDelete) {
        try {
          await this.deleteMediaFile(fileToDelete.url, userId);
          console.log(`已删除不再使用的文件: ${fileToDelete.url}`);
        } catch (error) {
          console.error(`删除文件失败: ${fileToDelete.url}`, error);
          // 不抛出错误，允许更新继续进行
        }
      }

      // 处理媒体文件：将preview_assets转换为parameters.media_files
      let parameters = promptData.parameters || existingPrompt.parameters || {};
      let previewAssetUrl = promptData.preview_asset_url;

      if (promptData.preview_assets && promptData.preview_assets.length > 0) {
        parameters.media_files = promptData.preview_assets.map(asset => ({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          size: asset.size,
          type: asset.type
        }));

        // 设置第一个媒体文件作为封面（如果没有明确指定）
        if (previewAssetUrl === undefined) {
          previewAssetUrl = promptData.preview_assets[0].url;
        }
      } else if (promptData.preview_assets && promptData.preview_assets.length === 0) {
        // 如果明确传入空数组，则清空媒体文件和封面
        parameters.media_files = [];
        previewAssetUrl = undefined;
      }

      // 转换更新数据
      const updateData: any = {};

      if (promptData.name !== undefined) updateData.name = promptData.name;
      if (promptData.description !== undefined) updateData.description = promptData.description;
      if (promptData.category !== undefined) updateData.category = promptData.category;
      if (promptData.category_type !== undefined) updateData.category_type = promptData.category_type; // 添加category_type字段处理
      if (promptData.tags !== undefined) updateData.tags = promptData.tags;
      if (promptData.is_public !== undefined) updateData.is_public = promptData.is_public;
      if (promptData.compatible_models !== undefined) updateData.compatible_models = promptData.compatible_models;
      if (previewAssetUrl !== undefined) updateData.preview_asset_url = previewAssetUrl; // 使用处理后的预览资源URL
      updateData.parameters = parameters; // 添加处理后的参数

      // 处理content字段，转换为messages格式
      if (promptData.content !== undefined) {
        updateData.messages = [{
          role: 'system',
          content: promptData.content,
        }];
      }

      // 版本号处理 - 编辑时默认+0.1（支持小数版本号）
      const currentVersion = existingPrompt.version || 1.0;
      updateData.version = Math.round((currentVersion + 0.1) * 10) / 10;
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
   * 从URL中提取文件名
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || '';
    } catch (error) {
      console.error('提取文件名失败:', error);
      return '';
    }
  }

  /**
   * 删除提示词关联的媒体文件
   */
  private async deletePromptMediaFiles(prompt: any): Promise<void> {
    if (!prompt || (prompt.category_type !== 'image' && prompt.category_type !== 'video')) {
      return; // 非媒体类型提示词，无需删除文件
    }

    const filesToDelete: string[] = [];

    // 收集需要删除的文件
    // 1. preview_asset_url 中的文件
    if (prompt.preview_asset_url) {
      const filename = this.extractFilenameFromUrl(prompt.preview_asset_url);
      if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
        filesToDelete.push(filename);
      }
    }

    // 2. parameters.media_files 中的文件
    const mediaFiles = prompt.parameters?.media_files || [];
    mediaFiles.forEach((file: any) => {
      if (file.url) {
        const filename = this.extractFilenameFromUrl(file.url);
        if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
          filesToDelete.push(filename);
        }
      }
    });

    // 删除重复的文件名
    const uniqueFiles = [...new Set(filesToDelete)];

    // 逐个删除文件
    for (const filename of uniqueFiles) {
      try {
        // 确定存储桶
        const isImage = filename.startsWith('image_');
        const bucketName = isImage ? 'images' : 'videos';

        // 使用管理员客户端删除文件
        const { error } = await this.adapter.supabase.storage
          .from(bucketName)
          .remove([filename]);

        if (error) {
          console.warn(`删除文件失败: ${filename}`, error.message);
        } else {
          console.log(`文件删除成功: ${filename}`);
        }
      } catch (error) {
        console.warn(`删除文件时出错: ${filename}`, error);
      }
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

      // 先删除关联的媒体文件
      await this.deletePromptMediaFiles(existingPrompt);

      // 然后删除提示词记录
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

  // ===== 基础功能 =====
  // 移除社交功能，MCP服务专注于提示词管理

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
        }),
      );

      return {
        data: commentsWithReplies as Comment[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
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

  // ===== 模板相关方法 =====

  async getTemplates(filters?: {
    category?: string;
    subcategory?: string;
    difficulty?: string;
    featured?: boolean;
    premium?: boolean;
    official?: boolean;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PromptTemplate[]> {
    try {
      let query = this.adapter.supabase
        .from('prompt_templates')
        .select('*')
        .eq('is_active', filters?.is_active ?? true);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured);
      }

      if (filters?.premium !== undefined) {
        query = query.eq('is_premium', filters.premium);
      }

      if (filters?.official !== undefined) {
        query = query.eq('is_official', filters.official);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters?.limit || 10)) - 1);
      }

      query = query.order('sort_order', { ascending: true })
                   .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('获取模板失败:', error);
        throw new Error('获取模板失败');
      }

      if (!data || data.length === 0) {
        return [];
      }

      // 获取所有分类信息
      const categories = await this.getTemplateCategories();
      const categoryMap = new Map(categories.map(cat => [cat.name, cat]));

      return data.map(template => this.transformTemplateData(template, categoryMap.get(template.category)));
    } catch (error) {
      console.error('获取模板失败:', error);
      return [];
    }
  }

  async getTemplateById(id: string): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('prompt_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('获取模板详情失败:', error);
        return null;
      }

      if (!data) return null;

      // 获取分类信息
      const categories = await this.getTemplateCategories();
      const categoryInfo = categories.find(cat => cat.name === data.category);

      return this.transformTemplateData(data, categoryInfo);
    } catch (error) {
      console.error('获取模板详情失败:', error);
      return null;
    }
  }

  async getTemplateCategories(): Promise<TemplateCategory[]> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('获取模板分类失败:', error);
        throw new Error('获取模板分类失败');
      }

      return data || [];
    } catch (error) {
      console.error('获取模板分类失败:', error);
      return [];
    }
  }

  async incrementTemplateUsage(templateId: string, userId?: string): Promise<void> {
    try {
      // 增加使用次数
      await this.adapter.supabase
        .rpc('increment_template_usage', { template_id: templateId });
    } catch (error) {
      console.error('更新模板使用统计失败:', error);
    }
  }

  async rateTemplate(templateId: string, userId: string, rating: number, comment?: string): Promise<void> {
    try {
      await this.adapter.supabase
        .from('template_ratings')
        .upsert({
          template_id: templateId,
          user_id: userId,
          rating,
          comment,
          updated_at: new Date().toISOString(),
        });

      // 更新模板平均评分
      await this.updateTemplateRating(templateId);
    } catch (error) {
      console.error('评分模板失败:', error);
      throw new Error('评分模板失败');
    }
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    try {
      const { data, error } = await this.adapter.supabase
        .from('template_ratings')
        .select('rating')
        .eq('template_id', templateId);

      if (error || !data || data.length === 0) return;

      const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;

      await this.adapter.supabase
        .from('prompt_templates')
        .update({ rating: Number(averageRating.toFixed(2)) })
        .eq('id', templateId);
    } catch (error) {
      console.error('更新模板评分失败:', error);
    }
  }

  private transformTemplateData(data: any, categoryInfo?: TemplateCategory): PromptTemplate {
    return {
      id: data.id,
      name: data.name,
      title: data.title,
      description: data.description,
      content: data.content,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags || [],
      difficulty: data.difficulty,
      variables: data.variables || [],
      fields: data.fields || [],
      author: data.author,
      likes: data.likes || 0,
      usage_count: data.usage_count || 0,
      rating: data.rating || 0,
      estimated_time: data.estimated_time,
      language: data.language || 'zh-CN',
      is_featured: data.is_featured || false,
      is_premium: data.is_premium || false,
      is_official: data.is_official || false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      category_info: categoryInfo ? {
        name: categoryInfo.name,
        display_name: categoryInfo.display_name,
        icon: categoryInfo.icon,
        color: categoryInfo.color,
      } : undefined,
    };
  }









  // ===== 辅助方法 =====

  /**
   * 根据用户ID获取用户名
   */
  private async getUsernameById(userId: string): Promise<string> {
    try {
      console.log(`[DatabaseService] 获取用户名，用户ID: ${userId}`);
      const { data, error } = await this.adapter.supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle(); // 使用 maybeSingle() 而不是 single()

      if (error) {
        console.warn('获取用户名时发生错误:', error);
        return '未知用户';
      }

      if (!data || !data.display_name) {
        console.warn(`用户 ${userId} 不存在或没有 display_name`);
        return '未知用户';
      }

      console.log(`[DatabaseService] 成功获取用户名: ${data.display_name}`);
      return data.display_name;
    } catch (error) {
      console.warn('获取用户名失败:', error);
      return '未知用户';
    }
  }

  /**
   * 从提示词内容中提取输入变量
   */
  private extractInputVariables(content: string): string[] {
    if (!content) return [];

    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    return Array.from(new Set(
      matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim()),
    )).filter(variable => variable.length > 0);
  }

  /**
   * 删除媒体文件
   */
  private async deleteMediaFile(fileUrl: string, userId?: string): Promise<void> {
    try {
      // 从URL中提取文件路径
      // URL格式: https://.../storage/v1/object/public/{bucket}/{userId}/{filename}
      const urlParts = fileUrl.split('/');
      const pathIndex = urlParts.findIndex(part => part === 'public');
      
      if (pathIndex === -1 || pathIndex + 3 >= urlParts.length) {
        throw new Error('无效的文件URL格式');
      }

      const bucket = urlParts[pathIndex + 1];
      const userIdFromUrl = urlParts[pathIndex + 2];
      const filename = urlParts.slice(pathIndex + 3).join('/');

      // 验证用户权限
      if (userId && userIdFromUrl !== userId) {
        throw new Error('无权限删除此文件');
      }

      const filePath = `${userIdFromUrl}/${filename}`;
      
      // 使用删除API
      console.log(`准备删除文件: ${filePath}`);
      
      // 这里直接调用Supabase Storage删除，因为我们在服务端
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const adminClient = createClient(supabaseUrl, supabaseKey);

      const { error } = await adminClient.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`删除文件失败: ${error.message}`);
      }

      console.log(`文件删除成功: ${filePath}`);
    } catch (error) {
      console.error(`删除媒体文件失败: ${fileUrl}`, error);
      throw error;
    }
  }
}

// 创建服务实例
export const databaseService = new DatabaseService();

// 默认导出
export default databaseService; 
