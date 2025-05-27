// @ts-nocheck
/**
 * MCP消息格式测试
 * 
 * 测试MCP消息格式是否符合协议规范，包括请求和响应的序列化/反序列化。
 */
import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';
import mcpRouter from '../../src/api/mcp-router.js';
import { setupTestServer, closeTestServer } from '../utils/test-server.js';
import { StorageFactory } from '../../src/storage/storage-factory.js';
import type { StorageAdapter } from '../../src/types.js';

// 模拟 Supabase 客户端
jest.mock('../../../supabase/lib/supabase-client.ts', () => ({
  createSupabaseClient: jest.fn().mockReturnValue({
    // 返回一个模拟的 Supabase 客户端
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(callback => callback({ data: [], error: null }))
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com' } })
      })
    },
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@example.com' } }, error: null })
    }
  })
}));

// 添加必要的类型定义以匹配 StorageAdapter 接口
type PromptData = any;
type User = any;
type ApiKey = any;
type ServerInfo = any;
type Tool = any;
type Conversation = any;
type Message = any;
type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
type Prompt = any;
type PromptVersion = any;
type PromptFilters = any;

describe('MCP消息格式', () => {
  let serverInfo: ReturnType<typeof setupTestServer> extends Promise<infer T> ? T : never;
  let originalGetStorage: typeof StorageFactory.getStorage;
  
  beforeAll(async () => {
    // 保存原始方法以便恢复
    originalGetStorage = StorageFactory.getStorage;
    
    // 创建模拟存储适配器
    const mockStorageAdapter: Partial<StorageAdapter> = {
      getType: jest.fn().mockReturnValue('mock'),
      getPrompts: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } as PaginatedResponse<Prompt>),
      getPrompt: jest.fn().mockResolvedValue(null),
      getCategories: jest.fn().mockResolvedValue(['测试分类1', '测试分类2']),
      getTags: jest.fn().mockResolvedValue(['测试标签1', '测试标签2']),
      getPromptVersions: jest.fn().mockResolvedValue([]),
      getPromptVersion: jest.fn().mockResolvedValue(null),
      searchPrompts: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } as PaginatedResponse<Prompt>),
      createPrompt: jest.fn().mockImplementation((prompt: PromptData) => Promise.resolve({ ...prompt, id: 'mock-id' } as Prompt)),
      updatePrompt: jest.fn().mockImplementation((prompt: PromptData) => Promise.resolve({ ...prompt } as Prompt)),
      deletePrompt: jest.fn().mockResolvedValue(true),
      restorePromptVersion: jest.fn().mockResolvedValue(null),
      getUserByEmail: jest.fn().mockResolvedValue(null),
      getUserById: jest.fn().mockResolvedValue(null),
      getApiKeys: jest.fn().mockResolvedValue([]),
      createApiKey: jest.fn().mockResolvedValue({ id: 'mock-key-id', name: 'Mock Key', key: 'mock-key-value' } as ApiKey),
      deleteApiKey: jest.fn().mockResolvedValue(true),
      verifyApiKey: jest.fn().mockResolvedValue(true),
      getServerInfo: jest.fn().mockResolvedValue({
        name: "Test MCP Server",
        version: "1.0.0",
        description: "Test server for Model Context Protocol",
        vendor: "PromptHub",
        models: [],
        max_tokens: 8192
      } as ServerInfo),
      getTools: jest.fn().mockResolvedValue([]),
      createConversation: jest.fn().mockResolvedValue({
        id: 'test-conversation-id'
      } as Conversation),
      addMessage: jest.fn().mockResolvedValue({
        id: 'test-message-id'
      } as Message)
    };
    
    // 覆盖 StorageFactory.getStorage 方法
    StorageFactory.getStorage = jest.fn().mockReturnValue(mockStorageAdapter as StorageAdapter);
    
    // 初始化测试服务器
    serverInfo = await setupTestServer('/api');
    serverInfo.app.use('/api/mcp', mcpRouter);
  });

  afterAll(async () => {
    // 恢复原始方法
    StorageFactory.getStorage = originalGetStorage;
    await closeTestServer(serverInfo);
  });

  describe('工具列表响应格式', () => {
    test('工具列表应遵循MCP规范格式', async () => {
      const response = await fetch(`${serverInfo.baseUrl}/api/mcp/tools`);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      
      // 验证schema版本
      expect(data).toHaveProperty('schema_version');
      expect(['v1', 'v2']).toContain(data.schema_version);
      
      // 验证工具列表是数组
      expect(Array.isArray(data.tools)).toBe(true);
      
      if (data.tools.length > 0) {
        // 验证工具结构
        const tool = data.tools[0];
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('schema_version');
        expect(tool).toHaveProperty('parameters');
        
        // 验证参数结构
        if (Object.keys(tool.parameters).length > 0) {
          const firstParam = Object.values(tool.parameters)[0] as any;
          expect(firstParam).toHaveProperty('type');
          expect(firstParam).toHaveProperty('description');
          expect(firstParam).toHaveProperty('required');
        }
      }
    });
  });

  describe('工具调用请求/响应格式', () => {
    test('成功响应应符合MCP规范', async () => {
      // 获取工具列表
      const toolsResponse = await fetch(`${serverInfo.baseUrl}/tools`);
      const toolsData = await toolsResponse.json() as any;
      
      if (toolsData.tools && toolsData.tools.length > 0) {
        // 找一个无参数的工具
        const simpleToolName = 'get_prompt_names';
        
        // 调用工具
        const invokeResponse = await fetch(
          `${serverInfo.baseUrl}/tools/${simpleToolName}/invoke`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }
        );
        
        if (invokeResponse.status === 200) {
          const data = await invokeResponse.json() as any;
          
          // 验证schema版本
          expect(data).toHaveProperty('schema_version');
          expect(['v1', 'v2']).toContain(data.schema_version);
          
          // 验证内容格式
          expect(data).toHaveProperty('content');
          expect(data.content).toHaveProperty('type');
          
          // 根据类型验证数据格式
          if (data.content.type === 'text') {
            expect(data.content).toHaveProperty('text');
            expect(typeof data.content.text).toBe('string');
          } else if (data.content.type === 'json') {
            expect(data.content).toHaveProperty('json');
          }
        }
      }
    });
    
    test('错误响应应符合MCP规范', async () => {
      // 调用不存在的工具
      const response = await fetch(
        `${serverInfo.baseUrl}/tools/non_existent_tool/invoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      
      expect([404, 400]).toContain(response.status);
      
      const data = await response.json() as any;
      
      // 验证schema版本
      expect(data).toHaveProperty('schema_version');
      
      // 验证错误格式
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('message');
      expect(typeof data.error.message).toBe('string');
    });
  });

  describe('消息内容类型', () => {
    test('应支持文本内容类型', async () => {
      // 调用一个返回文本内容的工具
      const response = await fetch(
        `${serverInfo.baseUrl}/tools/get_prompt_template/invoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      
      if (response.status === 200) {
        const data = await response.json() as any;
        
        expect(data.content).toHaveProperty('type', 'text');
        expect(data.content).toHaveProperty('text');
        expect(typeof data.content.text).toBe('string');
      }
    });
    
    test('响应内容应可解析为JSON', async () => {
      // 调用一个返回JSON格式的工具
      const response = await fetch(
        `${serverInfo.baseUrl}/tools/get_prompt_template/invoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      
      if (response.status === 200) {
        const data = await response.json() as any;
        
        if (data.content.type === 'text') {
          // 尝试解析内容为JSON
          expect(() => {
            JSON.parse(data.content.text);
          }).not.toThrow();
        }
      }
    });
  });
});
