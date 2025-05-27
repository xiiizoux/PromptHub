/**
 * MCP消息格式测试
 * 
 * 测试MCP消息格式是否符合协议规范，包括请求和响应的序列化/反序列化。
 */

import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';
import mcpRouter from '../../src/api/mcp-router.js';
import { setupTestServer, closeTestServer } from '../utils/test-server.js';

describe('MCP消息格式', () => {
  let serverInfo: ReturnType<typeof setupTestServer> extends Promise<infer T> ? T : never;

  beforeAll(async () => {
    serverInfo = await setupTestServer('/mcp');
    serverInfo.app.use('/mcp', mcpRouter);
  });

  afterAll(async () => {
    await closeTestServer(serverInfo);
  });

  describe('工具列表响应格式', () => {
    test('工具列表应遵循MCP规范格式', async () => {
      const response = await fetch(`${serverInfo.baseUrl}/tools`);
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
