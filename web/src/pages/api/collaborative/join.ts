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
    const { promptId, userId } = req.body;

    if (!promptId || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: '提示词ID和用户ID不能为空', 
      });
    }

    // 查找或创建协作会话
    const { data: initialSession, error: sessionError } = await supabase
      .from('collaborative_sessions')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('is_active', true)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError;
    }

    // 如果没有活跃会话，创建新的
    let session = initialSession;
    if (!session) {
      const { data: newSession, error: createError } = await supabase
        .from('collaborative_sessions')
        .insert({
          prompt_id: promptId,
          created_by: userId,
          is_active: true,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      session = newSession;
    }

    // 添加或更新参与者
    const { error: participantError } = await supabase
      .from('collaborative_participants')
      .upsert({
        session_id: session.id,
        user_id: userId,
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'session_id,user_id',
      });

    if (participantError) throw participantError;

    // 更新会话的最后活动时间
    await supabase
      .from('collaborative_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    // 获取当前参与者列表
    const { data: participants, error: participantsError } = await supabase
      .from('collaborative_participants')
      .select(`
        user_id,
        joined_at,
        last_seen,
        is_active,
        users (
          email,
          display_name
        )
      `)
      .eq('session_id', session.id)
      .eq('is_active', true);

    if (participantsError) throw participantsError;

    const sessionData = {
      id: session.id,
      promptId: session.prompt_id,
      createdAt: session.created_at,
      lastActivity: session.last_activity,
      participants: participants?.map(p => p.user_id) || [],
    };

    res.status(200).json({
      success: true,
      session: sessionData,
      collaborators: participants?.map(p => ({
        id: p.user_id,
        name: (p.users as any)?.display_name || (p.users as any)?.email || '匿名用户',
        email: (p.users as any)?.email || '',
        lastSeen: p.last_seen,
        isActive: p.is_active,
      })) || [],
    });
  } catch (error: any) {
    console.error('加入协作会话失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '加入协作会话失败', 
    });
  }
} 