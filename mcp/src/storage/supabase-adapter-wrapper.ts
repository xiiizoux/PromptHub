/**
 * Supabase适配器包装器
 * 
 * 这个文件包装了共享的Supabase适配器，确保它符合MCP服务的StorageAdapter接口
 * 增强了错误处理和日志记录能力
 */

// 导入MCP服务的类型定义
import { StorageAdapter, Prompt, PromptVersion, User, AuthResponse, PromptFilters, PaginatedResponse, ApiKey, Comment } from '../types.js';
import { extendedSupabaseAdapter as supabaseAdapterInstance } from '../../../supabase/index.js';
import { SocialStorageExtensions } from './stub-social-adapter.js';

/**
 * 包装共享的Supabase适配器，确保类型兼容性
 * 添加了错误处理和日志能力
 * 继承SocialStorageExtensions以实现社交功能相关的存根方法
 */
export class SupabaseAdapter extends SocialStorageExtensions implements StorageAdapter {
  private connectionVerified: boolean = false;
  
  constructor() {
    // 调用父类构造函数
    super();
    
    // 在创建适配器时验证连接
    this.verifyConnection().catch(err => {
      console.error('警告: Supabase连接验证失败:', err.message);
      console.error('请检查您的Supabase配置和凭证是否正确。');
      console.error('如果您使用的是Docker环境，请确保映射了正确的.env文件。');
    });
  }
  
  /**
   * 验证与Supabase的连接
   */
  private async verifyConnection(): Promise<boolean> {
    try {
      // 执行简单查询验证连接
      const { data, error } = await supabaseAdapterInstance.supabase.from('system_settings').select('name').limit(1);
      
      if (error) {
        throw new Error(`Supabase connection test failed: ${error.message}`);
      }
      
      this.connectionVerified = true;
      return true;
    } catch (err) {
      this.connectionVerified = false;
      console.error('SUPABASE_URL未设置或连接失败');
      throw err;
    }
  }
  
  /**
   * 处理API调用错误
   */
  private handleError<T>(operation: string, error: any, defaultValue: T): T {
    const err = error as Error;
    console.error(`Supabase操作 '${operation}' 失败:`, err.message);
    if (err.stack) {
      console.debug(err.stack);
    }
    return defaultValue;
  }
  
  // 获取存储类型
  getType(): string {
    return 'supabase';
  }
  
  // 基本提示词管理
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    try {
      return await supabaseAdapterInstance.getPrompts(filters);
    } catch (error) {
      return this.handleError<PaginatedResponse<Prompt>>('getPrompts', error, {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0  // 添加缺少的totalPages属性
      });
    }
  }
  
  async getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null> {
    try {
      return await supabaseAdapterInstance.getPrompt(nameOrId, userId);
    } catch (error) {
      return this.handleError<Prompt | null>('getPrompt', error, null);
    }
  }
  
  async createPrompt(prompt: Prompt): Promise<Prompt> {
    try {
      return await supabaseAdapterInstance.createPrompt(prompt);
    } catch (error) {
      // 创建失败时返回原始提示词，并添加错误信息
      const err = error as Error;
      console.error('创建提示词失败:', err.message);
      prompt.error = err.message;
      return prompt;
    }
  }
  
  async updatePrompt(nameOrId: string, prompt: Partial<Prompt>, userId?: string): Promise<Prompt> {
    try {
      return await supabaseAdapterInstance.updatePrompt(nameOrId, prompt, userId);
    } catch (error) {
      const err = error as Error;
      // 将错误信息添加到提示词对象
      const errorPrompt = { ...prompt } as Prompt;
      errorPrompt.error = err.message;
      errorPrompt.id = nameOrId;
      return this.handleError<Prompt>('updatePrompt', error, errorPrompt);
    }
  }
  
  async deletePrompt(nameOrId: string, userId?: string): Promise<boolean> {
    try {
      return await supabaseAdapterInstance.deletePrompt(nameOrId, userId);
    } catch (error) {
      return this.handleError<boolean>('deletePrompt', error, false);
    }
  }
  
  async searchPrompts(query: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    return supabaseAdapterInstance.searchPrompts(query, userId, includePublic);
  }
  
  // 分类和标签管理
  async getCategories(): Promise<string[]> {
    return supabaseAdapterInstance.getCategories();
  }
  
  async getTags(): Promise<string[]> {
    return supabaseAdapterInstance.getTags();
  }
  
  async getPromptsByCategory(category: string, userId?: string, includePublic: boolean = true): Promise<Prompt[]> {
    return supabaseAdapterInstance.getPromptsByCategory(category, userId, includePublic);
  }
  
  // 版本控制
  async getPromptVersions(promptId: string, userId?: string): Promise<PromptVersion[]> {
    return supabaseAdapterInstance.getPromptVersions(promptId, userId);
  }
  
  async getPromptVersion(promptId: string, version: number, userId?: string): Promise<PromptVersion | null> {
    return supabaseAdapterInstance.getPromptVersion(promptId, version, userId);
  }
  
  async createPromptVersion(promptVersion: PromptVersion): Promise<PromptVersion> {
    return supabaseAdapterInstance.createPromptVersion(promptVersion);
  }
  
  async restorePromptVersion(promptId: string, version: number, userId?: string): Promise<Prompt> {
    return supabaseAdapterInstance.restorePromptVersion(promptId, version, userId);
  }
  
  // 导入导出
  async exportPrompts(userId?: string, promptIds?: string[]): Promise<Prompt[]> {
    return supabaseAdapterInstance.exportPrompts(userId, promptIds);
  }
  
  async importPrompts(prompts: Prompt[], userId?: string): Promise<{success: number; failed: number; messages: string[]}> {
    return supabaseAdapterInstance.importPrompts(prompts, userId);
  }
  
  // 认证相关
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    return supabaseAdapterInstance.signUp(email, password, displayName);
  }
  
  async signIn(email: string, password: string): Promise<AuthResponse> {
    return supabaseAdapterInstance.signIn(email, password);
  }
  
  async signOut(): Promise<void> {
    return supabaseAdapterInstance.signOut();
  }
  
  async getCurrentUser(): Promise<User | null> {
    return supabaseAdapterInstance.getCurrentUser();
  }
  
  async verifyToken(token: string): Promise<User | null> {
    // 这个方法在共享适配器中可能不存在，但在MCP服务中需要
    // 可以根据需要实现
    if ('verifyToken' in supabaseAdapterInstance) {
      return (supabaseAdapterInstance as any).verifyToken(token);
    }
    console.warn('verifyToken方法在共享适配器中不存在');
    return null;
  }
  
  // API密钥管理
  async generateApiKey(userId: string, name: string, expiresInDays?: number): Promise<string> {
    return supabaseAdapterInstance.generateApiKey(userId, name, expiresInDays);
  }
  
  async verifyApiKey(apiKey: string): Promise<User | null> {
    return supabaseAdapterInstance.verifyApiKey(apiKey);
  }
  
  async updateApiKeyLastUsed(apiKey: string): Promise<void> {
    return supabaseAdapterInstance.updateApiKeyLastUsed(apiKey);
  }
  
  async listApiKeys(userId: string): Promise<ApiKey[]> {
    return supabaseAdapterInstance.listApiKeys(userId);
  }
  
  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    return supabaseAdapterInstance.deleteApiKey(userId, keyId);
  }

  // 获取用户信息
  async getUser(userId: string): Promise<User | null> {
    try {
      return await supabaseAdapterInstance.getUser(userId);
    } catch (error) {
      return this.handleError<User | null>('getUser', error, null);
    }
  }
  
  // 获取单条评论
  async getComment(commentId: string): Promise<Comment | null> {
    try {
      return await supabaseAdapterInstance.getComment(commentId);
    } catch (error) {
      return this.handleError<Comment | null>('getComment', error, null);
    }
  }
}
