import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId, operation } = req.body;

    if (!promptId || !operation) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID和操作数据不能为空', 
      });
    }

    // 验证操作格式
    if (!operation.id || !operation.type || !operation.userId) {
      return res.status(400).json({ 
        success: false, 
        error: '操作数据格式不正确', 
      });
    }

    // 获取当前活跃的协作会话
    const { data: session, error: sessionError } = await supabase
      .from('collaborative_sessions')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('is_active', true)
      .single();

    if (sessionError) {
      return res.status(404).json({ 
        success: false, 
        error: '未找到活跃的协作会话', 
      });
    }

    // 检查用户是否是会话参与者
    const { data: participant, error: participantError } = await supabase
      .from('collaborative_participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('user_id', operation.userId)
      .eq('is_active', true)
      .single();

    if (participantError) {
      return res.status(403).json({ 
        success: false, 
        error: '用户不是会话参与者', 
      });
    }

    // 保存操作到数据库
    const { error: operationError } = await supabase
      .from('collaborative_operations')
      .insert({
        id: operation.id,
        session_id: session.id,
        user_id: operation.userId,
        type: operation.type,
        position: operation.position,
        content: operation.content,
        timestamp: operation.timestamp,
        cursor_position: operation.cursor ? JSON.stringify(operation.cursor) : null,
      });

    if (operationError) {throw operationError;}

    // 更新参与者的最后活动时间
    await supabase
      .from('collaborative_participants')
      .update({ 
        last_seen: new Date().toISOString(),
        cursor_position: operation.cursor ? JSON.stringify(operation.cursor) : null,
      })
      .eq('session_id', session.id)
      .eq('user_id', operation.userId);

    // 更新会话的最后活动时间
    await supabase
      .from('collaborative_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    // 检查是否有冲突
    const conflicts = await detectConflicts(session.id, operation);

    // 应用操作变换（如果需要）
    const transformedOperation = await applyOperationalTransform(session.id, operation);

    // 更新提示词内容（如果这是最终操作）
    if (operation.type === 'replace' || operation.type === 'insert') {
      await updatePromptContent(promptId, operation.content);
    }

    res.status(200).json({
      success: true,
      operationId: operation.id,
      transformed: transformedOperation,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    });
  } catch (error: any) {
    console.error('处理协作操作失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '处理协作操作失败', 
    });
  }
}

async function detectConflicts(sessionId: string, operation: any) {
  try {
    // 获取在相似时间范围内的其他操作
    const timeWindow = 5000; // 5秒内的操作
    const startTime = new Date(new Date(operation.timestamp).getTime() - timeWindow);
    const endTime = new Date(new Date(operation.timestamp).getTime() + timeWindow);

    const { data: recentOperations, error } = await supabase
      .from('collaborative_operations')
      .select('*')
      .eq('session_id', sessionId)
      .neq('user_id', operation.userId)
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', endTime.toISOString());

    if (error) {throw error;}

    const conflicts = [];
    for (const recentOp of recentOperations || []) {
      if (isConflicting(operation, recentOp)) {
        conflicts.push({
          id: generateConflictId(),
          operationId: operation.id,
          conflictingOperationId: recentOp.id,
          type: 'position_overlap',
          description: '操作位置重叠',
          timestamp: new Date(),
        });
      }
    }

    // 保存检测到的冲突
    if (conflicts.length > 0) {
      await supabase
        .from('collaborative_conflicts')
        .insert(conflicts.map(conflict => ({
          ...conflict,
          session_id: sessionId,
          status: 'pending',
        })));
    }

    return conflicts;
  } catch (error) {
    console.error('冲突检测失败:', error);
    return [];
  }
}

function isConflicting(op1: any, op2: any): boolean {
  // 简化的冲突检测逻辑
  if (op1.type === 'insert' && op2.type === 'insert') {
    return Math.abs(op1.position - op2.position) < 10; // 位置相近
  }
  
  if (op1.type === 'delete' && op2.type === 'delete') {
    return op1.position === op2.position;
  }
  
  return false;
}

async function applyOperationalTransform(sessionId: string, operation: any) {
  try {
    // 获取在此操作之前的操作
    const { data: precedingOps, error } = await supabase
      .from('collaborative_operations')
      .select('*')
      .eq('session_id', sessionId)
      .lt('timestamp', operation.timestamp)
      .order('timestamp', { ascending: true });

    if (error) {throw error;}

    const transformedOp = { ...operation };

    // 简化的操作变换
    for (const precedingOp of precedingOps || []) {
      if (precedingOp.type === 'insert' && transformedOp.type === 'insert') {
        if (precedingOp.position <= transformedOp.position) {
          transformedOp.position += precedingOp.content.length;
        }
      }
    }

    return transformedOp;
  } catch (error) {
    console.error('操作变换失败:', error);
    return operation;
  }
}

async function updatePromptContent(promptId: string, content: string) {
  try {
    await supabase
      .from('prompts')
      .update({ 
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId);
  } catch (error) {
    console.error('更新提示词内容失败:', error);
  }
}

function generateConflictId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 