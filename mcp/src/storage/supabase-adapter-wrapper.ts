/**
 * Supabase适配器包装器
 * 
 * 这个文件包装了共享的Supabase适配器，确保它符合MCP服务的StorageAdapter接口
 */

// 导入MCP服务的类型定义
import { StorageAdapter, Prompt, PromptVersion, User, AuthResponse, PromptFilters, PaginatedResponse, ApiKey } from '../types.js';
// 导入共享的扩展Supabase适配器实例
import { extendedSupabaseAdapter as supabaseAdapterInstance } from '../../../supabase/index.js';

/**
 * 包装共享的Supabase适配器，确保类型兼容性
 */
export class SupabaseAdapter implements StorageAdapter {
  // 代理到共享适配器的方法
  getType(): string {
    return supabaseAdapterInstance.getType();
  }
  
  // 基本提示词管理
  async getPrompts(filters?: PromptFilters): Promise<PaginatedResponse<Prompt>> {
    return supabaseAdapterInstance.getPrompts(filters);
  }
  
  async getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null> {
    return supabaseAdapterInstance.getPrompt(nameOrId, userId);
  }
  
  async createPrompt(prompt: Prompt): Promise<Prompt> {
    return supabaseAdapterInstance.createPrompt(prompt);
  }
  
  async updatePrompt(nameOrId: string, prompt: Partial<Prompt>, userId?: string): Promise<Prompt> {
    return supabaseAdapterInstance.updatePrompt(nameOrId, prompt, userId);
  }
  
  async deletePrompt(nameOrId: string, userId?: string): Promise<boolean> {
    return supabaseAdapterInstance.deletePrompt(nameOrId, userId);
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
}
