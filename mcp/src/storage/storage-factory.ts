import { StorageAdapter } from '../types.js';
// 导入主 Supabase 适配器
import { SupabaseAdapter } from './supabase-adapter.js';
// 导入配置
import { config } from '../config.js';

/**
 * 存储工厂类 - 负责创建和管理存储适配器
 * 支持多种存储类型，已预留接口: 'supabase', 'file', 'postgresql', 'mysql' 等
 * 目前只实现了supabase存储适配器
 */
export class StorageFactory {
  /**
   * 获取存储适配器实例
   * @returns 存储适配器实例
   */
  static getStorage(): StorageAdapter {
    // 从配置中获取存储类型
    const storageType = config.storage.type || 'supabase';
    
    // 输出存储类型信息
    
    // TODO: 根据配置的存储类型创建相应的适配器
    // 当前只实现了supabase适配器，其他类型将在未来扩展
    switch (storageType.toLowerCase()) {
      // case 'file':
      //   // 在未来实现文件存储适配器
      //   return new FileAdapter(config.storage.path);
      
      // case 'postgresql':
      //   // 在未来实现PostgreSQL存储适配器
      //   return new PostgreSQLAdapter();
      
      // case 'mysql':
      //   // 在未来实现MySQL存储适配器
      //   return new MySQLAdapter();
      
      case 'supabase':
      default:
        // 默认使用Supabase存储
        return new SupabaseAdapter();
    }
  }
}
