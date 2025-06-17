/**
 * 共享服务模块
 * 统一管理存储适配器和AI分析器实例，避免重复初始化
 */

import { StorageFactory } from '../storage/storage-factory.js';
import { MCPAIAnalyzer } from '../ai/mcp-ai-analyzer.js';
import { StorageAdapter } from '../types.js';

/**
 * 单例存储适配器实例
 */
export const storage: StorageAdapter = StorageFactory.getStorage();

/**
 * 单例AI分析器实例
 */
export const aiAnalyzer = new MCPAIAnalyzer();

/**
 * 获取存储适配器实例
 */
export function getStorageInstance(): StorageAdapter {
  return storage;
}

/**
 * 获取AI分析器实例
 */
export function getAIAnalyzer(): MCPAIAnalyzer {
  return aiAnalyzer;
} 