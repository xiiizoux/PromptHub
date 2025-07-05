/**
 * Web服务数据库服务层
 * 
 * 为Web服务提供完整的数据库访问功能，完全独立于MCP服务
 * 使用Supabase作为数据库访问层
 */

import { SupabaseAdapter, Prompt, PromptFilters, PaginatedResponse, Category, PromptContentJsonb, OptimizationTemplateJsonb } from './supabase-adapter';
import type { PromptTemplate, TemplateCategory, TemplateVariable, TemplateField, PromptDeletionResult } from '../types';
import {
  extractContentFromJsonb,
  extractTemplateFromJsonb,
  safeConvertPromptContent,
  isJsonbContent,
  createEmptyContextEngineeringContent,
} from './jsonb-utils';

// 扩展的提示词详情接口
export interface PromptDetails extends Prompt {
  input_variables?: string[];
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

  // JSONB 内容处理字段
  content_text?: string; // 从 JSONB 提取的可编辑文本内容
  content_structure?: PromptContentJsonb; // 完整的 JSONB 结构
  context_engineering_enabled?: boolean; // 是否启用 Context Engineering
}

// 移除社交功能相关接口 - MCP服务专注于提示词管理

export interface Interaction {
  id: string;
  user_id: string;
  prompt_id: string;
  type: 'like' | 'dislike' | 'bookmark' | 'share';
  created_at: string;
}

export interface Comment {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    display_name?: string;
  };
  replies?: Comment[];
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

  // ===== JSONB 数据处理方法 =====

  /**
   * 处理从数据库读取的提示词，提取 JSONB 内容
   * @param prompt 原始提示词数据
   * @returns 处理后的提示词详情
   */
  private processPromptDetails(prompt: Prompt): PromptDetails {
    const details: PromptDetails = { ...prompt };

    // 处理 content 字段
    if (prompt.content) {
      if (isJsonbContent(prompt.content)) {
        details.content_structure = prompt.content;
        details.content_text = extractContentFromJsonb(prompt.content);
        details.context_engineering_enabled = prompt.content.type === 'context_engineering';
        // 为前端兼容性，将 content 字段设置为字符串格式
        details.content = details.content_text;
      } else if (typeof prompt.content === 'string') {
        details.content_text = prompt.content;
        details.context_engineering_enabled = false;
        // content 字段已经是字符串格式，无需处理
      }
    }

    return details;
  }

  /**
   * 准备要写入数据库的提示词数据
   * @param promptDetails 提示词详情
   * @returns 数据库写入格式的数据
   */
  private preparePromptForDatabase(promptDetails: Partial<PromptDetails>): Partial<Prompt> {
    const dbPrompt: Partial<Prompt> = { ...promptDetails };

    // 处理 content 字段
    if (promptDetails.content_text !== undefined || promptDetails.content_structure !== undefined) {
      if (promptDetails.context_engineering_enabled && promptDetails.content_structure) {
        // 使用 Context Engineering 结构
        dbPrompt.content = promptDetails.content_structure;
      } else if (promptDetails.content_text) {
        // 转换文本为 JSONB 格式
        const conversion = safeConvertPromptContent(promptDetails.content_text);
        dbPrompt.content = conversion.success ? conversion.data : promptDetails.content_text;
      }
    }

    // 移除 Web 专用字段
    delete (dbPrompt as Record<string, unknown>).content_text;
    delete (dbPrompt as Record<string, unknown>).content_structure;
    delete (dbPrompt as Record<string, unknown>).context_engineering_enabled;
    delete (dbPrompt as Record<string, unknown>).preview_assets;
    delete (dbPrompt as Record<string, unknown>).author;
    delete (dbPrompt as Record<string, unknown>).collaborators;

    return dbPrompt;
  }

  /**
   * 创建空的 Context Engineering 提示词
   * @returns 空的 Context Engineering 结构
   */
  createEmptyContextEngineeringPrompt(): PromptDetails {
    return {
      id: '',
      name: '',
      description: '',
      category: '',
      tags: [],
      content: createEmptyContextEngineeringContent(),
      content_structure: createEmptyContextEngineeringContent(),
      content_text: '',
      context_engineering_enabled: true,
      is_public: false,
      user_id: '',
      created_at: new Date().toISOString(),
    };
  }

  // ===== 提示词管理 =====

  /**
   * 获取所有分类（完整信息）
   * 从categories表获取数据，确保数据的一致性和完整性
   * @param type 可选的分类类型过滤 (chat, image, video)
   */
  async getCategories(type?: string): Promise<Array<{
    id: string;
    name: string;
    name_en?: string;
    icon?: string;
    description?: string;
    type: string;
    sort_order?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    optimization_template?: OptimizationTemplateJsonb | string;
    optimization_template_text?: string; // 提取的文本版本
  }>> {
    try {
      let categories: Category[];

      if (type && ['chat', 'image', 'video'].includes(type)) {
        categories = await this.adapter.getCategoriesByType(type as 'chat' | 'image' | 'video');
      } else {
        categories = await this.adapter.getCategoriesWithType();
      }

      // 处理优化模板 JSONB 数据
      return categories.map(category => ({
        ...category,
        optimization_template_text: category.optimization_template
          ? extractTemplateFromJsonb(category.optimization_template)
          : undefined,
      }));
    } catch (error) {
      console.error('获取分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类名称列表（向后兼容）
   * @param type 可选的分类类型过滤 (chat, image, video)
   */
  async getCategoryNames(type?: string): Promise<string[]> {
    const categories = await this.getCategories(type);
    return categories.map(c => c.name);
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
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<PromptDetails>> {
    const result = await this.adapter.getPrompts(filters);

    // 处理 JSONB 内容
    const processedData = result.data.map(prompt => this.processPromptDetails(prompt));

    return {
      ...result,
      data: processedData,
    };
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
          console.error('[DatabaseService] 获取协作者信息失败:', collaboratorError);
        } else if (collaboratorData && collaboratorData.length > 0) {
          collaborators = collaboratorData.map((collab: { user_id: string; users: Array<{ username: string; display_name: string; email: string }> }) => {
            const user = collab.users[0]; // 假设 users 是数组，取第一个用户
            // 优先使用 username，然后是 display_name，最后是 email 的用户名部分
            return user?.username || user?.display_name || user?.email?.split('@')[0] || '未知用户';
          });
          console.log(`[DatabaseService] 找到 ${collaborators.length} 个协作者: ${collaborators.join(', ')}`);
        } else {
          console.log('[DatabaseService] 该提示词没有协作者');
        }
      } catch (collaboratorError) {
        console.error('[DatabaseService] 获取协作者信息失败:', collaboratorError);
      }

      // 使用新的 JSONB 处理逻辑
      const processedPrompt = this.processPromptDetails(prompt);

      // 转换为PromptDetails格式
      const promptDetails: PromptDetails = {
        ...processedPrompt,
        // 保持原有的扩展字段
        input_variables: this.extractInputVariables(processedPrompt.content_text || ''),
        author: authorName,
        collaborators: collaborators, // 添加协作者列表
      };

      console.log('getPromptByName - 最终处理的数据:', {
        name: promptDetails.name,
        category: promptDetails.category,
        category_type: promptDetails.category_type,
        tags: promptDetails.tags,
        input_variables: promptDetails.input_variables,
        author: promptDetails.author,
        user_id: promptDetails.user_id,
        contentLength: promptDetails.content_text?.length || 0,
        context_engineering_enabled: promptDetails.context_engineering_enabled,
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
    const parameters = promptData.parameters || {};
    let previewAssetUrl = promptData.preview_asset_url;

    if (promptData.preview_assets && promptData.preview_assets.length > 0) {
      parameters.media_files = promptData.preview_assets.map(asset => ({
        id: asset.id,
        url: asset.url,
        name: asset.name,
        size: asset.size,
        type: asset.type,
      }));

      // 设置第一个媒体文件作为封面
      if (!previewAssetUrl) {
        previewAssetUrl = promptData.preview_assets[0].url;
      }
    }

    // 使用新的 JSONB 处理逻辑转换数据
    const dbPrompt = this.preparePromptForDatabase({
      ...promptData,
      preview_asset_url: previewAssetUrl,
      parameters: parameters,
      category_type: promptData.category_type || 'chat',
      version: promptData.version ? Number(promptData.version) : 1.0, // 恢复 version 字段，确保数字类型
    });

    return await this.adapter.createPrompt(dbPrompt);
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
      const filesToDelete = (existingMediaFiles as Array<{ url: string }>).filter((existingFile: { url: string }) => 
        !newMediaFiles.some((newFile: { url: string }) => newFile.url === existingFile.url),
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
      const parameters = promptData.parameters || existingPrompt.parameters || {};
      let previewAssetUrl = promptData.preview_asset_url;

      if (promptData.preview_assets && promptData.preview_assets.length > 0) {
        parameters.media_files = promptData.preview_assets.map(asset => ({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          size: asset.size,
          type: asset.type,
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

      // 使用新的 JSONB 处理逻辑转换更新数据
      const updateData = this.preparePromptForDatabase({
        ...promptData,
        preview_asset_url: previewAssetUrl,
        parameters: parameters,
      });

      // 处理版本号更新，确保数字类型
      if (promptData.version !== undefined) {
        updateData.version = Number(promptData.version);
      }
      updateData.updated_at = new Date().toISOString();

      // 🛡️ 保护检查：如果要将公开提示词改为私有，检查是否有其他用户的context数据
      if (promptData.is_public !== undefined && 
          existingPrompt.is_public === true && 
          promptData.is_public === false && 
          userId) {
        
        const { data: protectionCheck, error: protectionError } = await this.adapter.supabase
          .rpc('can_make_prompt_private', {
            prompt_id_param: existingPrompt.id,
            user_id_param: userId
          });

        if (protectionError) {
          throw new Error(`权限检查失败: ${protectionError.message}`);
        }

        const protection = protectionCheck[0];
        if (protection && !protection.can_convert) {
          throw new Error(protection.reason);
        }
      }

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
  private async deletePromptMediaFiles(prompt: { category_type?: string; parameters?: { media_files?: Array<{ url: string }> }; preview_asset_url?: string }): Promise<void> {
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
    mediaFiles.forEach((file: { url: string }) => {
      if (file.url) {
        const filename = this.extractFilenameFromUrl(file.url);
        if (filename && (filename.startsWith('image_') || filename.startsWith('video_'))) {
          filesToDelete.push(filename);
        }
      }
    });

    // 删除重复的文件名
    const uniqueFiles = Array.from(new Set(filesToDelete));

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

  /**
   * 智能删除/归档方法 - 检测后决定删除还是归档
   * @param promptId 提示词ID
   * @param userId 用户ID
   * @returns 删除/归档结果详情
   */
  async deletePromptEnhanced(promptId: string, userId: string): Promise<PromptDeletionResult> {
    try {
      // 🎯 第一步：检查删除策略
      const { data: policyCheck, error: policyError } = await this.adapter.supabase
        .rpc('check_prompt_deletion_policy', {
          prompt_id_param: promptId,
          user_id_param: userId
        });

      if (policyError) {
        throw new Error(`策略检查失败: ${policyError.message}`);
      }

      const policy = policyCheck[0];
      if (!policy) {
        throw new Error('无法获取删除策略');
      }

      // 🚫 不能删除也不能归档的情况
      if (!policy.can_delete && !policy.must_archive) {
        return {
          success: false,
          type: 'error',
          message: policy.reason,
          details: '操作被拒绝'
        };
      }

      // 📚 必须归档的情况
      if (policy.must_archive) {
        const { data: archiveResult, error: archiveError } = await this.adapter.supabase
          .rpc('archive_user_prompt', {
            prompt_id_param: promptId,
            user_id_param: userId,
            reason_param: policy.reason
          });

        if (archiveError) {
          throw new Error(`归档失败: ${archiveError.message}`);
        }

        return {
          success: true,
          type: 'archived',
          message: '提示词已归档',
          details: `${policy.reason}。提示词已从您的列表中移除，但仍保持公开状态，其他用户可以正常使用。您可以随时取消归档。`,
          affectedUsers: policy.context_users_count,
          canRestore: true,
          transferReason: policy.reason
        };
      }

      // 🗑️ 可以安全删除的情况
      if (policy.can_delete) {
        // 删除关联的媒体文件
        const { data: prompt } = await this.adapter.supabase
          .from('prompts')
          .select('*')
          .eq('id', promptId)
          .single();

        if (prompt) {
          await this.deletePromptMediaFiles(prompt);
        }

        // 执行真正的删除
        const { error: deleteError } = await this.adapter.supabase
          .from('prompts')
          .delete()
          .eq('id', promptId)
          .eq('user_id', userId);

        if (deleteError) {
          throw new Error(`删除失败: ${deleteError.message}`);
        }

        return {
          success: true,
          type: 'deleted',
          message: '提示词已彻底删除',
          details: '提示词及所有相关数据已永久删除。',
          affectedUsers: 0
        };
      }

      // 理论上不应该到达这里
      throw new Error('未知的删除策略结果');
    } catch (error: any) {
      console.error('智能删除/归档失败:', error);
      
      return {
        success: false,
        type: 'error',
        message: error.message || '操作过程中发生未知错误',
        error: error.message
      };
    }
  }

  /**
   * 取消归档（恢复到用户活跃列表）
   * @param promptId 提示词ID
   * @param userId 用户ID
   * @returns 取消归档结果
   */
  async restoreArchivedPrompt(promptId: string, userId: string): Promise<PromptDeletionResult> {
    try {
      const { data: result, error } = await this.adapter.supabase
        .rpc('unarchive_user_prompt', {
          prompt_id_param: promptId,
          user_id_param: userId
        });

      if (error) {
        throw new Error(`取消归档失败: ${error.message}`);
      }

      if (!result) {
        throw new Error('未找到归档记录或取消归档失败');
      }

      return {
        success: true,
        type: 'restored',
        message: '已取消归档',
        details: '提示词已重新出现在您的活跃列表中。'
      };
    } catch (error: any) {
      console.error('取消归档失败:', error);
      
      return {
        success: false,
        type: 'error',
        message: error.message || '取消归档过程中发生未知错误',
        error: error.message
      };
    }
  }

  /**
   * 检查删除策略
   * @param promptId 提示词ID
   * @param userId 用户ID
   * @returns 删除策略信息
   */
  async checkDeletionPolicy(promptId: string, userId: string): Promise<{
    canDelete: boolean;
    mustArchive: boolean;
    reason: string;
    contextUsersCount: number;
  }> {
    try {
      const { data: policyCheck, error: policyError } = await this.adapter.supabase
        .rpc('check_prompt_deletion_policy', {
          prompt_id_param: promptId,
          user_id_param: userId
        });

      if (policyError) {
        throw new Error(`策略检查失败: ${policyError.message}`);
      }

      const policy = policyCheck[0];
      if (!policy) {
        throw new Error('无法获取删除策略');
      }

      return {
        canDelete: policy.can_delete,
        mustArchive: policy.must_archive,
        reason: policy.reason,
        contextUsersCount: policy.context_users_count
      };
    } catch (error: any) {
      console.error('检查删除策略失败:', error);
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

      if (!data) { return null; }

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

  async incrementTemplateUsage(templateId: string, _userId?: string): Promise<void> {
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

      if (error || !data || data.length === 0) { return; }

      const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;

      await this.adapter.supabase
        .from('prompt_templates')
        .update({ rating: Number(averageRating.toFixed(2)) })
        .eq('id', templateId);
    } catch (error) {
      console.error('更新模板评分失败:', error);
    }
  }

  private transformTemplateData(data: Record<string, unknown>, categoryInfo?: TemplateCategory): PromptTemplate {
    return {
      id: String(data.id || ''),
      name: String(data.name || ''),
      title: String(data.title || ''),
      description: String(data.description || ''),
      content: String(data.content || ''),
      category: String(data.category || ''),
      subcategory: data.subcategory ? String(data.subcategory) : undefined,
      tags: Array.isArray(data.tags) ? data.tags as string[] : [],
      difficulty: (data.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
      variables: Array.isArray(data.variables) ? data.variables as TemplateVariable[] : [],
      fields: Array.isArray(data.fields) ? data.fields as TemplateField[] : [],
      author: data.author ? String(data.author) : undefined,
      likes: Number(data.likes) || 0,
      usage_count: Number(data.usage_count) || 0,
      rating: Number(data.rating) || 0,
      estimated_time: data.estimated_time ? String(data.estimated_time) : undefined,
      language: String(data.language || 'zh-CN'),
      is_featured: Boolean(data.is_featured),
      is_premium: Boolean(data.is_premium),
      is_official: Boolean(data.is_official),
      created_at: String(data.created_at || ''),
      updated_at: data.updated_at ? String(data.updated_at) : undefined,
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
   * 从提示词内容中提取输入变量
   */
  private extractInputVariables(content: string): string[] {
    if (!content) { return []; }

    // 修复正则表达式以正确匹配 {{variable}} 格式
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) { return []; }

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
