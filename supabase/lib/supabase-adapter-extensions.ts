/**
 * Supabase适配器扩展
 * 
 * 为共享的Supabase适配器添加MCP服务所需的额外方法
 */

import { SupabaseAdapter } from './supabase-adapter.js';
import {
  Prompt,
  PromptVersion,
  PaginatedResponse
} from './types.js';

/**
 * 扩展基础Supabase适配器，添加MCP服务所需的方法
 */
export function extendSupabaseAdapter(adapter: SupabaseAdapter): any {
  // 创建一个新的对象，将所有现有方法复制过来
  const extendedAdapter = Object.create(adapter);
  
  // 添加创建提示词的方法
  extendedAdapter.createPrompt = async function(prompt: Prompt): Promise<Prompt> {
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .insert({
          name: prompt.name,
          description: prompt.description,
          category: prompt.category,
          tags: prompt.tags,
          content: prompt.content || '',
          is_public: prompt.is_public,
          user_id: prompt.user_id,
          version: prompt.version || 1
        })
        .select()
        .single();
        
      if (error) throw new Error(`创建提示词失败: ${error.message}`);
      return data;
    } catch (err: any) {
      console.error('创建提示词时出错:', err);
      throw err;
    }
  };
  
  // 添加更新提示词的方法
  extendedAdapter.updatePrompt = async function(nameOrId: string, prompt: Partial<Prompt>, userId?: string): Promise<Prompt> {
    try {
      // 首先获取现有提示词
      const existingPrompt = await this.getPrompt(nameOrId, userId);
      if (!existingPrompt) {
        throw new Error(`提示词不存在或您没有权限访问: ${nameOrId}`);
      }
      
      // 准备更新数据
      const updateData: any = {};
      if (prompt.name) updateData.name = prompt.name;
      if (prompt.description) updateData.description = prompt.description;
      if (prompt.category) updateData.category = prompt.category;
      if (prompt.tags) updateData.tags = prompt.tags;
      if (prompt.content) updateData.content = prompt.content;
      if (prompt.is_public !== undefined) updateData.is_public = prompt.is_public;
      
      // 添加更新时间
      updateData.updated_at = new Date().toISOString();
      
      // 如果内容有变化，增加版本号
      if (prompt.content) {
        updateData.version = (existingPrompt.version || 1) + 1;
        
        // 创建版本记录
        await this.createPromptVersion({
          prompt_id: existingPrompt.id,
          version: existingPrompt.version || 1,
          content: existingPrompt.content || '',
          description: existingPrompt.description,
          category: existingPrompt.category,
          tags: existingPrompt.tags || [],
          user_id: existingPrompt.user_id
        });
      }
      
      // 执行更新
      const { data, error } = await this.supabase
        .from('prompts')
        .update(updateData)
        .eq('id', existingPrompt.id)
        .select()
        .single();
        
      if (error) throw new Error(`更新提示词失败: ${error.message}`);
      return data;
    } catch (err: any) {
      console.error('更新提示词时出错:', err);
      throw err;
    }
  };
  
  // 添加删除提示词的方法
  extendedAdapter.deletePrompt = async function(nameOrId: string, userId?: string): Promise<boolean> {
    try {
      // 首先获取现有提示词
      const existingPrompt = await this.getPrompt(nameOrId, userId);
      if (!existingPrompt) {
        throw new Error(`提示词不存在或您没有权限访问: ${nameOrId}`);
      }
      
      // 构建查询
      let query = this.supabase
        .from('prompts')
        .delete()
        .eq('id', existingPrompt.id);
        
      // 如果提供了用户ID，确保只能删除自己的提示词
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { error } = await query;
      
      if (error) throw new Error(`删除提示词失败: ${error.message}`);
      return true;
    } catch (err: any) {
      console.error('删除提示词时出错:', err);
      return false;
    }
  };
  
  // 添加获取提示词版本列表的方法
  extendedAdapter.getPromptVersions = async function(promptId: string, userId?: string): Promise<PromptVersion[]> {
    try {
      // 首先检查用户是否有权限访问此提示词
      if (userId) {
        const { data: promptData, error: promptError } = await this.supabase
          .from('prompts')
          .select('user_id, is_public')
          .eq('id', promptId)
          .single();
          
        if (promptError || !promptData) {
          return [];
        }
        
        // 如果既不是公开的也不是用户自己的，返回空
        if (promptData.user_id !== userId && !promptData.is_public) {
          return [];
        }
      }
      
      // 查询版本历史
      let query = this.supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version', { ascending: false });
        
      const { data, error } = await query;
      
      if (error) {
        console.error('获取提示词版本失败:', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('获取提示词版本时出错:', err);
      return [];
    }
  };
  
  // 添加获取特定提示词版本的方法
  extendedAdapter.getPromptVersion = async function(promptId: string, version: number, userId?: string): Promise<PromptVersion | null> {
    try {
      // 首先检查用户是否有权限访问此提示词
      if (userId) {
        const { data: promptData, error: promptError } = await this.supabase
          .from('prompts')
          .select('user_id, is_public')
          .eq('id', promptId)
          .single();
          
        if (promptError || !promptData) {
          return null;
        }
        
        // 如果既不是公开的也不是用户自己的，返回null
        if (promptData.user_id !== userId && !promptData.is_public) {
          return null;
        }
      }
      
      // 查询特定版本
      const { data, error } = await this.supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('version', version)
        .single();
        
      if (error) {
        console.error('获取提示词版本失败:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('获取提示词版本时出错:', err);
      return null;
    }
  };
  
  // 添加创建提示词版本的方法
  extendedAdapter.createPromptVersion = async function(promptVersion: PromptVersion): Promise<PromptVersion> {
    try {
      const { data, error } = await this.supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptVersion.prompt_id,
          version: promptVersion.version,
          content: promptVersion.content || '',
          description: promptVersion.description,
          category: promptVersion.category,
          tags: promptVersion.tags,
          user_id: promptVersion.user_id
        })
        .select()
        .single();
        
      if (error) throw new Error(`创建提示词版本失败: ${error.message}`);
      return data;
    } catch (err: any) {
      console.error('创建提示词版本时出错:', err);
      throw err;
    }
  };
  
  // 添加恢复提示词版本的方法
  extendedAdapter.restorePromptVersion = async function(promptId: string, version: number, userId?: string): Promise<Prompt> {
    try {
      // 获取要恢复的版本
      const versionToRestore = await this.getPromptVersion(promptId, version, userId);
      if (!versionToRestore) {
        throw new Error(`提示词版本不存在或您没有权限访问: ${promptId}@${version}`);
      }
      
      // 获取当前提示词
      const currentPrompt = await this.getPrompt(promptId, userId);
      if (!currentPrompt) {
        throw new Error(`提示词不存在或您没有权限访问: ${promptId}`);
      }
      
      // 创建新版本记录（保存当前状态）
      await this.createPromptVersion({
        prompt_id: currentPrompt.id,
        version: currentPrompt.version || 1,
        content: currentPrompt.content || '',
        description: currentPrompt.description,
        category: currentPrompt.category,
        tags: currentPrompt.tags || [],
        user_id: currentPrompt.user_id
      });
      
      // 更新提示词为恢复的版本
      const { data, error } = await this.supabase
        .from('prompts')
        .update({
          content: versionToRestore.content || '',
          description: versionToRestore.description,
          category: versionToRestore.category,
          tags: versionToRestore.tags,
          version: (currentPrompt.version || 1) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)
        .select()
        .single();
        
      if (error) throw new Error(`恢复提示词版本失败: ${error.message}`);
      return data;
    } catch (err: any) {
      console.error('恢复提示词版本时出错:', err);
      throw err;
    }
  };
  
  // 添加导出提示词的方法
  extendedAdapter.exportPrompts = async function(userId?: string, promptIds?: string[]): Promise<Prompt[]> {
    try {
      let query = this.supabase
        .from('prompts')
        .select('*');
        
      // 如果提供了特定的提示词ID列表
      if (promptIds && promptIds.length > 0) {
        query = query.in('id', promptIds);
      }
      
      // 如果提供了用户ID，只导出该用户的提示词
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // 否则只导出公开提示词
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('导出提示词失败:', error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error('导出提示词时出错:', err);
      return [];
    }
  };
  
  // 添加导入提示词的方法
  extendedAdapter.importPrompts = async function(prompts: Prompt[], userId?: string): Promise<{success: number; failed: number; messages: string[]}> {
    const result = { success: 0, failed: 0, messages: [] };
    
    if (!prompts || prompts.length === 0) {
      result.messages.push('没有提供要导入的提示词' as never);
      return result;
    }
    
    for (const prompt of prompts) {
      try {
        // 为每个提示词设置用户ID
        if (userId) {
          prompt.user_id = userId;
        }
        
        // 移除ID以便创建新记录
        const newPrompt = { ...prompt };
        delete (newPrompt as any).id;
        
        // 确保有版本号
        if (!newPrompt.version) {
          newPrompt.version = 1;
        }
        
        // 创建提示词
        await this.createPrompt(newPrompt);
        result.success++;
      } catch (err: any) {
        result.failed++;
        result.messages.push(`导入"${prompt.name}"失败: ${err.message}` as never);
      }
    }
    
    return result;
  };
  
  return extendedAdapter;
}
