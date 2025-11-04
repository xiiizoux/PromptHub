/**
 * Context Memories API路由
 * 管理上下文记忆
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 认证检查
    const supabase = createServerSupabaseClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;

    if (req.method === 'GET') {
      // 查询记忆
      const { memoryType, title, minImportanceScore, relevanceTags, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('context_memories')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }
      if (title) {
        query = query.ilike('title', `%${title}%`);
      }
      if (minImportanceScore) {
        query = query.gte('importance_score', parseFloat(minImportanceScore as string));
      }
      if (relevanceTags && Array.isArray(relevanceTags)) {
        query = query.contains('relevance_tags', relevanceTags);
      }

      query = query.range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: data || [],
      });

    } else if (req.method === 'POST') {
      // 创建记忆
      const { memoryType, title, content, importanceScore, relevanceTags, expiresAt, metadata } = req.body;

      if (!memoryType || !content) {
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: memoryType 和 content',
        });
      }

      const { data, error } = await supabase
        .from('context_memories')
        .insert({
          user_id: userId,
          memory_type: memoryType,
          title: title || null,
          content: content,
          importance_score: importanceScore ?? 0.5,
          relevance_tags: relevanceTags || [],
          expires_at: expiresAt || null,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data,
      });

    } else if (req.method === 'PUT') {
      // 更新记忆
      const { id, title, content, importanceScore, relevanceTags, expiresAt, metadata } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: id',
        });
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (importanceScore !== undefined) updateData.importance_score = importanceScore;
      if (relevanceTags !== undefined) updateData.relevance_tags = relevanceTags;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt;
      if (metadata !== undefined) updateData.metadata = metadata;

      const { data, error } = await supabase
        .from('context_memories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data,
      });

    } else if (req.method === 'DELETE') {
      // 删除记忆
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: '缺少必需参数: id',
        });
      }

      const { error } = await supabase
        .from('context_memories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: '记忆已删除',
      });
    }

  } catch (error: any) {
    console.error('Context Memories API错误:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '操作失败',
    });
  }
}

