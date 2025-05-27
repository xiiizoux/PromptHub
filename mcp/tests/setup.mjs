/**
 * Jest测试设置文件
 * 
 * 在所有测试执行前运行，用于设置环境变量和全局配置
 */
// @ts-nocheck
import { jest } from '@jest/globals';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '9999';
process.env.API_KEY = 'test-api-key';
process.env.TRANSPORT_TYPE = 'http';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// 配置全局超时
jest.setTimeout(10000); // 10秒

// 禁用控制台日志以减少测试输出噪音
// 如果需要调试，可以注释掉这些行
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // 保留错误日志以便查看测试失败原因
  error: console.error,
};
