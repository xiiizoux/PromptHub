import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdapter } from '@/lib/supabase-adapter';
import { databaseService } from '@/lib/database-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, userId } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' });
  }

  try {
    console.log(`[DEBUG] 测试提示词获取，ID: ${id}, 用户ID: ${userId || '未提供'}`);

    // 1. 测试直接从Supabase适配器获取
    console.log('[DEBUG] 1. 测试Supabase适配器...');
    const promptFromAdapter = await supabaseAdapter.getPrompt(id as string, userId as string);
    console.log('[DEBUG] Supabase适配器结果:', promptFromAdapter ? '成功' : '失败');

    // 2. 测试从数据库服务获取
    console.log('[DEBUG] 2. 测试数据库服务...');
    const promptFromService = await databaseService.getPromptByName(id as string, userId as string);
    console.log('[DEBUG] 数据库服务结果:', promptFromService ? '成功' : '失败');

    // 3. 直接查询数据库
    console.log('[DEBUG] 3. 直接查询数据库...');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id as string);
    console.log('[DEBUG] ID格式检查 - 是UUID:', isUuid);

    let directQuery = supabaseAdapter.supabase
      .from('prompts')
      .select('id, name, description, user_id, is_public, created_at');

    if (isUuid) {
      directQuery = directQuery.eq('id', id);
    } else {
      directQuery = directQuery.eq('name', id);
    }

    const { data: directResult, error: directError } = await directQuery.maybeSingle();
    console.log('[DEBUG] 直接查询结果:', directResult ? '成功' : '失败');
    if (directError) {
      console.log('[DEBUG] 直接查询错误:', directError);
    }

    // 4. 检查所有提示词（限制前10个）
    console.log('[DEBUG] 4. 检查现有提示词...');
    const { data: allPrompts, error: allError } = await supabaseAdapter.supabase
      .from('prompts')
      .select('id, name, user_id, is_public')
      .limit(10);

    console.log('[DEBUG] 现有提示词数量:', allPrompts?.length || 0);
    if (allPrompts && allPrompts.length > 0) {
      console.log('[DEBUG] 前几个提示词ID格式:');
      allPrompts.slice(0, 3).forEach((p, i) => {
        console.log(`[DEBUG] ${i + 1}. ID: ${p.id}, Name: ${p.name}`);
      });
    }

    return res.json({
      success: true,
      debug: {
        inputId: id,
        inputUserId: userId,
        isUuid,
        results: {
          supabaseAdapter: promptFromAdapter ? 'success' : 'failed',
          databaseService: promptFromService ? 'success' : 'failed',
          directQuery: directResult ? 'success' : 'failed'
        },
        data: {
          fromAdapter: promptFromAdapter ? {
            id: promptFromAdapter.id,
            name: promptFromAdapter.name,
            user_id: promptFromAdapter.user_id,
            is_public: promptFromAdapter.is_public
          } : null,
          fromService: promptFromService ? {
            id: promptFromService.id,
            name: promptFromService.name,
            user_id: promptFromService.user_id,
            is_public: promptFromService.is_public
          } : null,
          fromDirect: directResult,
          samplePrompts: allPrompts?.slice(0, 3)
        },
        errors: {
          directError: directError?.message,
          allError: allError?.message
        }
      }
    });

  } catch (error: any) {
    console.error('[DEBUG] 测试过程中出错:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        inputId: id,
        inputUserId: userId
      }
    });
  }
}
