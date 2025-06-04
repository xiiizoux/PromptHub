import { createClient } from '@supabase/supabase-js';

// 从本地复制需要的类型定义，避免跨目录导入问题
interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at?: string;
}

interface UserFollow {
  id?: string;
  follower_id: string;
  following_id: string;
  created_at?: string;
}

interface SocialInteraction {
  id?: string;
  prompt_id: string;
  user_id: string;
  type: 'like' | 'bookmark' | 'share';
  created_at?: string;
}

interface Comment {
  id?: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  replies?: Comment[];
}

interface Topic {
  id?: string;
  title: string;
  description?: string;
  creator_id: string;
  created_at?: string;
  updated_at?: string;
  post_count?: number;
  creator?: User;
}

interface TopicPost {
  id?: string;
  topic_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Supabase存储适配器的社交功能扩展
 * 实现用户关注、社交互动、评论和话题相关功能
 */
export const socialExtensions = (supabase: any) => {
  return {
    // 用户关注相关方法
    async followUser(followerId: string, followingId: string): Promise<UserFollow> {
      // 防止自己关注自己
      if (followerId === followingId) {
        throw new Error('不能关注自己');
      }

      // 检查是否已经关注
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (existingFollow) {
        return existingFollow;
      }

      // 创建新的关注关系
      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })
        .select()
        .single();

      if (error) {
        console.error('关注用户失败:', error);
        throw new Error(`关注用户失败: ${error.message}`);
      }

      return data;
    },

    async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) {
        console.error('取消关注用户失败:', error);
        throw new Error(`取消关注用户失败: ${error.message}`);
      }

      return true;
    },

    async getUserFollowers(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<User>> {
      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取关注者总数
      const { count, error: countError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (countError) {
        console.error('获取关注者总数失败:', countError);
        throw new Error(`获取关注者总数失败: ${countError.message}`);
      }

      // 获取关注者列表
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id, users:follower_id(id, email, display_name, created_at)')
        .eq('following_id', userId)
        .range(from, to);

      if (error) {
        console.error('获取关注者失败:', error);
        throw new Error(`获取关注者失败: ${error.message}`);
      }

      // 转换数据格式
      const followers = data.map((item: any) => item.users);

      return {
        data: followers,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    },

    async getUserFollowing(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<User>> {
      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取关注的用户总数
      const { count, error: countError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (countError) {
        console.error('获取关注的用户总数失败:', countError);
        throw new Error(`获取关注的用户总数失败: ${countError.message}`);
      }

      // 获取关注的用户列表
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id, users:following_id(id, email, display_name, created_at)')
        .eq('follower_id', userId)
        .range(from, to);

      if (error) {
        console.error('获取关注的用户失败:', error);
        throw new Error(`获取关注的用户失败: ${error.message}`);
      }

      // 转换数据格式
      const following = data.map((item: any) => item.users);

      return {
        data: following,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    },

    async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116是"未找到结果"的错误
        console.error('检查关注状态失败:', error);
        throw new Error(`检查关注状态失败: ${error.message}`);
      }

      return !!data;
    },

    // 社交互动相关方法
    async createSocialInteraction(userId: string, promptId: string, type: string): Promise<SocialInteraction> {
      // 检查互动类型是否有效
      if (!['like', 'bookmark', 'share'].includes(type)) {
        throw new Error(`无效的互动类型: ${type}`);
      }

      // 检查提示词是否存在
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select('id')
        .eq('id', promptId)
        .single();

      if (promptError || !prompt) {
        throw new Error(`提示词不存在: ${promptId}`);
      }

      // 检查是否已存在相同的互动
      const { data: existingInteraction } = await supabase
        .from('social_interactions')
        .select('*')
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .eq('type', type)
        .single();

      if (existingInteraction) {
        return existingInteraction;
      }

      // 创建新的互动记录
      const { data, error } = await supabase
        .from('social_interactions')
        .insert({
          user_id: userId,
          prompt_id: promptId,
          type
        })
        .select()
        .single();

      if (error) {
        console.error('创建社交互动失败:', error);
        throw new Error(`创建社交互动失败: ${error.message}`);
      }

      return data;
    },

    async removeSocialInteraction(userId: string, promptId: string, type: string): Promise<boolean> {
      const { error } = await supabase
        .from('social_interactions')
        .delete()
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .eq('type', type);

      if (error) {
        console.error('删除社交互动失败:', error);
        throw new Error(`删除社交互动失败: ${error.message}`);
      }

      return true;
    },

    async getPromptInteractions(promptId: string, type?: string, userId?: string): Promise<{
      likes: number;
      bookmarks: number;
      shares: number;
      userInteraction?: {
        liked: boolean;
        bookmarked: boolean;
        shared: boolean;
      }
    }> {
      // 获取互动计数
      let query = supabase
        .from('social_interactions')
        .select('type')
        .eq('prompt_id', promptId);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('获取互动数据失败:', error);
        throw new Error(`获取互动数据失败: ${error.message}`);
      }

      // 计算各类型的数量
      const counts = {
        likes: data.filter((i: any) => i.type === 'like').length,
        bookmarks: data.filter((i: any) => i.type === 'bookmark').length,
        shares: data.filter((i: any) => i.type === 'share').length
      };

      // 如果提供了用户ID，获取用户的互动状态
      let userInteraction;
      if (userId) {
        const { data: userInteractions, error: userError } = await supabase
          .from('social_interactions')
          .select('type')
          .eq('prompt_id', promptId)
          .eq('user_id', userId);

        if (userError) {
          console.error('获取用户互动状态失败:', userError);
          throw new Error(`获取用户互动状态失败: ${userError.message}`);
        }

        userInteraction = {
          liked: userInteractions.some((i: any) => i.type === 'like'),
          bookmarked: userInteractions.some((i: any) => i.type === 'bookmark'),
          shared: userInteractions.some((i: any) => i.type === 'share')
        };
      }

      return {
        ...counts,
        userInteraction
      };
    },

    // 评论相关方法
    async createComment(userId: string, promptId: string, content: string, parentId?: string): Promise<Comment> {
      // 检查提示词是否存在
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select('id')
        .eq('id', promptId)
        .single();

      if (promptError || !prompt) {
        throw new Error(`提示词不存在: ${promptId}`);
      }

      // 如果有父评论ID，检查父评论是否存在
      if (parentId) {
        const { data: parentComment, error: parentError } = await supabase
          .from('comments')
          .select('id')
          .eq('id', parentId)
          .single();

        if (parentError || !parentComment) {
          throw new Error(`父评论不存在: ${parentId}`);
        }
      }

      // 创建评论
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          prompt_id: promptId,
          content,
          parent_id: parentId || null
        })
        .select()
        .single();

      if (error) {
        console.error('创建评论失败:', error);
        throw new Error(`创建评论失败: ${error.message}`);
      }

      return data;
    },

    async getPromptComments(promptId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Comment>> {
      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取评论总数（只计算顶级评论）
      const { count, error: countError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', promptId)
        .is('parent_id', null);

      if (countError) {
        console.error('获取评论总数失败:', countError);
        throw new Error(`获取评论总数失败: ${countError.message}`);
      }

      // 获取顶级评论
      const { data: topLevelComments, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (id, email, display_name)
        `)
        .eq('prompt_id', promptId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取评论失败:', error);
        throw new Error(`获取评论失败: ${error.message}`);
      }

      // 对于每个顶级评论，获取其回复
      for (const comment of topLevelComments) {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(`
            *,
            user:user_id (id, email, display_name)
          `)
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('获取评论回复失败:', repliesError);
          throw new Error(`获取评论回复失败: ${repliesError.message}`);
        }

        comment.replies = replies;
      }

      return {
        data: topLevelComments,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    },

    async deleteComment(commentId: string, userId: string): Promise<boolean> {
      // 检查评论是否存在且属于该用户
      const { data: comment, error: checkError } = await supabase
        .from('comments')
        .select('id, user_id')
        .eq('id', commentId)
        .single();

      if (checkError) {
        console.error('检查评论失败:', checkError);
        throw new Error(`评论不存在: ${commentId}`);
      }

      if (comment.user_id !== userId) {
        throw new Error('无权删除此评论');
      }

      // 删除评论及其回复
      const { error } = await supabase
        .from('comments')
        .delete()
        .or(`id.eq.${commentId},parent_id.eq.${commentId}`);

      if (error) {
        console.error('删除评论失败:', error);
        throw new Error(`删除评论失败: ${error.message}`);
      }

      return true;
    },

    // 话题相关方法
    async createTopic(topic: Topic): Promise<Topic> {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          title: topic.title,
          description: topic.description || '',
          creator_id: topic.creator_id
        })
        .select()
        .single();

      if (error) {
        console.error('创建话题失败:', error);
        throw new Error(`创建话题失败: ${error.message}`);
      }

      return data;
    },

    async getTopics(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Topic>> {
      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取话题总数
      const { count, error: countError } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('获取话题总数失败:', countError);
        throw new Error(`获取话题总数失败: ${countError.message}`);
      }

      // 获取话题列表
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          creator:creator_id (id, email, display_name)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取话题失败:', error);
        throw new Error(`获取话题失败: ${error.message}`);
      }

      // 对于每个话题，获取帖子数量
      for (const topic of data) {
        const { count: postCount, error: postCountError } = await supabase
          .from('topic_posts')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);

        if (postCountError) {
          console.error('获取话题帖子数量失败:', postCountError);
          continue;
        }

        topic.post_count = postCount;
      }

      return {
        data,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    },

    async getTopic(topicId: string): Promise<Topic | null> {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          creator:creator_id (id, email, display_name)
        `)
        .eq('id', topicId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // 未找到记录
          return null;
        }
        console.error('获取话题失败:', error);
        throw new Error(`获取话题失败: ${error.message}`);
      }

      // 获取帖子数量
      const { count: postCount, error: postCountError } = await supabase
        .from('topic_posts')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);

      if (!postCountError) {
        data.post_count = postCount;
      }

      return data;
    },

    // 话题帖子相关方法
    async createTopicPost(post: TopicPost): Promise<TopicPost> {
      // 检查话题是否存在
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('id')
        .eq('id', post.topic_id)
        .single();

      if (topicError || !topic) {
        throw new Error(`话题不存在: ${post.topic_id}`);
      }

      // 创建帖子
      const { data, error } = await supabase
        .from('topic_posts')
        .insert({
          topic_id: post.topic_id,
          user_id: post.user_id,
          title: post.title,
          content: post.content
        })
        .select()
        .single();

      if (error) {
        console.error('创建话题帖子失败:', error);
        throw new Error(`创建话题帖子失败: ${error.message}`);
      }

      return data;
    },

    async getTopicPosts(topicId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<TopicPost>> {
      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 获取帖子总数
      const { count, error: countError } = await supabase
        .from('topic_posts')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);

      if (countError) {
        console.error('获取帖子总数失败:', countError);
        throw new Error(`获取帖子总数失败: ${countError.message}`);
      }

      // 获取帖子列表
      const { data, error } = await supabase
        .from('topic_posts')
        .select(`
          *,
          user:user_id (id, email, display_name)
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('获取帖子失败:', error);
        throw new Error(`获取帖子失败: ${error.message}`);
      }

      return {
        data,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    },

    async getTopicPost(postId: string): Promise<TopicPost | null> {
      const { data, error } = await supabase
        .from('topic_posts')
        .select(`
          *,
          user:user_id (id, email, display_name)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // 未找到记录
          return null;
        }
        console.error('获取帖子失败:', error);
        throw new Error(`获取帖子失败: ${error.message}`);
      }

      return data;
    }
  };
};