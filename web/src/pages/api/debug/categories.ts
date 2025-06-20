/**
 * 调试API - 测试分类获取
 * 
 * GET /api/debug/categories - 调试分类获取问题
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseClient } from '@/lib/supabase-adapter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== 开始调试分类获取 ===');
    
    // 创建Supabase客户端
    const supabase = createSupabaseClient();
    
    // 测试1: 检查数据库连接
    console.log('测试1: 检查数据库连接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact', head: true });
    
    console.log('连接测试结果:', { connectionError, count: connectionTest });
    
    // 测试2: 尝试获取所有分类（不加过滤条件）
    console.log('测试2: 获取所有分类...');
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    
    console.log('所有分类查询结果:', {
      error: allError,
      count: allCategories?.length || 0,
      data: allCategories
    });
    
    // 测试3: 只获取激活的分类
    console.log('测试3: 获取激活分类...');
    const { data: activeCategories, error: activeError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    console.log('激活分类查询结果:', {
      error: activeError,
      count: activeCategories?.length || 0,
      data: activeCategories
    });
    
    // 测试4: 检查RLS策略
    console.log('测试4: 检查RLS策略...');
    const { data: rlsTest, error: rlsError } = await supabase
      .rpc('get_categories_debug');
    
    console.log('RLS测试结果:', { rlsError, rlsTest });
    
    // 返回调试信息
    const debugInfo = {
      timestamp: new Date().toISOString(),
      tests: {
        connection: {
          success: !connectionError,
          error: connectionError,
          count: connectionTest
        },
        allCategories: {
          success: !allError,
          error: allError,
          count: allCategories?.length || 0,
          data: allCategories
        },
        activeCategories: {
          success: !activeError,
          error: activeError,
          count: activeCategories?.length || 0,
          data: activeCategories
        },
        rls: {
          success: !rlsError,
          error: rlsError,
          data: rlsTest
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    };
    
    console.log('=== 调试完成 ===');
    
    return res.status(200).json({
      success: true,
      message: '调试信息获取成功',
      debug: debugInfo
    });
    
  } catch (error: any) {
    console.error('调试过程中发生错误:', error);
    
    return res.status(500).json({
      success: false,
      error: '调试失败',
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }
}
