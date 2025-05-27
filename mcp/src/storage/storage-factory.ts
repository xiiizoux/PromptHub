import { StorageAdapter } from '../types.js';
// 导入适配器包装器
import { SupabaseAdapter } from './supabase-adapter-wrapper.js';

export class StorageFactory {
  static getStorage(): StorageAdapter {
    console.log('使用存储类型: supabase');
    // 使用包装器类创建新实例
    return new SupabaseAdapter();
  }
}
