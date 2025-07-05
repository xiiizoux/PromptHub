import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId } = req.query;

    if (!promptId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID不能为空', 
      });
    }

    // 获取活跃的协作会话
    const { data: session, error: sessionError } = await supabase
      .from('collaborative_sessions')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('is_active', true)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError;
    }

    if (!session) {
      return res.status(200).json({
        success: true,
        status: {
          sessionId: null,
          isActive: false,
          collaborators: [],
          lockedSections: [],
        },
      });
    }

    // 获取活跃的参与者
    const { data: participants, error: participantsError } = await supabase
      .from('collaborative_participants')
      .select(`
        user_id,
        joined_at,
        last_seen,
        cursor_position,
        is_active,
        users (
          email,
          display_name
        )
      `)
      .eq('session_id', session.id)
      .eq('is_active', true);

    if (participantsError) {throw participantsError;}

    // 清理非活跃用户（超过5分钟未活动）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeParticipants = participants?.filter(p => 
      new Date(p.last_seen) > fiveMinutesAgo,
    ) || [];

    // 更新非活跃用户状态
    if (participants && participants.length !== activeParticipants.length) {
      const inactiveUserIds = participants
        .filter(p => new Date(p.last_seen) <= fiveMinutesAgo)
        .map(p => p.user_id);

      await supabase
        .from('collaborative_participants')
        .update({ is_active: false })
        .eq('session_id', session.id)
        .in('user_id', inactiveUserIds);
    }

    // 获取锁定的区域
    const { data: locks, error: locksError } = await supabase
      .from('collaborative_locks')
      .select(`
        start_position,
        end_position,
        user_id,
        created_at,
        users (
          email,
          display_name
        )
      `)
      .eq('session_id', session.id)
      .eq('is_active', true);

    if (locksError) {throw locksError;}

    // 清理过期锁定（超过10分钟）
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeLocks = locks?.filter(lock => 
      new Date(lock.created_at) > tenMinutesAgo,
    ) || [];

    if (locks && locks.length !== activeLocks.length) {
      await supabase
        .from('collaborative_locks')
        .update({ is_active: false })
        .eq('session_id', session.id)
        .lt('created_at', tenMinutesAgo.toISOString());
    }

    const collaborators = activeParticipants.map(p => ({
      id: p.user_id,
      name: (p.users as any)?.display_name || (p.users as any)?.email || '匿名用户',
      email: (p.users as any)?.email || '',
      lastSeen: new Date(p.last_seen),
      cursor: p.cursor_position ? JSON.parse(p.cursor_position) : undefined,
    }));

    const lockedSections = activeLocks.map(lock => ({
      range: [lock.start_position, lock.end_position] as [number, number],
      userId: lock.user_id,
      timestamp: new Date(lock.created_at),
      userName: (lock.users as any)?.display_name || (lock.users as any)?.email || '匿名用户',
    }));

    res.status(200).json({
      success: true,
      status: {
        sessionId: session.id,
        isActive: true,
        collaborators,
        lockedSections,
      },
    });
  } catch (error: any) {
    console.error('获取协作状态失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '获取协作状态失败', 
    });
  }
} 