import {
  StorageAdapter,
  PaginatedResponse,
  User,
  UserFollow,
  SocialInteraction,
  Comment,
  Topic,
  TopicPost,
  Notification,
  NotificationPreference,
  NotificationType
} from '../types.js';

/**
 * Social and notification methods implementation for StorageAdapter
 * Extend this class to add social features support to a storage adapter
 */
export class SocialStorageExtensions {
  // 社交关系管理
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    console.warn('Method not implemented: followUser');
    return {
      follower_id: followerId,
      following_id: followingId,
      created_at: new Date().toISOString()
    };
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    console.warn('Method not implemented: unfollowUser');
    return true;
  }

  async getUserFollowers(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<User>> {
    console.warn('Method not implemented: getUserFollowers');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  async getUserFollowing(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<User>> {
    console.warn('Method not implemented: getUserFollowing');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    console.warn('Method not implemented: checkIfFollowing');
    return false;
  }

  // 社交互动（点赞、收藏、分享）
  async createSocialInteraction(userId: string, promptId: string, type: string): Promise<SocialInteraction> {
    console.warn('Method not implemented: createSocialInteraction');
    return {
      prompt_id: promptId,
      user_id: userId,
      type: type as 'like' | 'bookmark' | 'share',
      created_at: new Date().toISOString()
    };
  }

  async removeSocialInteraction(userId: string, promptId: string, type: string): Promise<boolean> {
    console.warn('Method not implemented: removeSocialInteraction');
    return true;
  }

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
    console.warn('Method not implemented: getPromptInteractions');
    return {
      likes: 0,
      bookmarks: 0,
      shares: 0,
      userInteraction: userId ? {
        liked: false,
        bookmarked: false,
        shared: false
      } : undefined
    };
  }

  // 评论管理
  async createComment(userId: string, promptId: string, content: string, parentId?: string): Promise<Comment> {
    console.warn('Method not implemented: createComment');
    return {
      prompt_id: promptId,
      user_id: userId,
      content,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getPromptComments(promptId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Comment>> {
    console.warn('Method not implemented: getPromptComments');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    console.warn('Method not implemented: deleteComment');
    return true;
  }

  // 话题管理
  async createTopic(topic: Topic): Promise<Topic> {
    console.warn('Method not implemented: createTopic');
    return {
      ...topic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getTopics(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Topic>> {
    console.warn('Method not implemented: getTopics');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  async getTopic(topicId: string): Promise<Topic | null> {
    console.warn('Method not implemented: getTopic');
    return null;
  }

  // 话题帖子管理
  async createTopicPost(post: TopicPost): Promise<TopicPost> {
    console.warn('Method not implemented: createTopicPost');
    return {
      ...post,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getTopicPosts(topicId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<TopicPost>> {
    console.warn('Method not implemented: getTopicPosts');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  async getTopicPost(postId: string): Promise<TopicPost | null> {
    console.warn('Method not implemented: getTopicPost');
    return null;
  }

  // 通知管理
  async createNotification(notification: Notification): Promise<Notification> {
    console.warn('Method not implemented: createNotification');
    return {
      ...notification,
      is_read: false,
      created_at: notification.created_at || new Date().toISOString()
    };
  }

  async getUserNotifications(userId: string, page: number = 1, pageSize: number = 20, unreadOnly: boolean = false): Promise<PaginatedResponse<Notification>> {
    console.warn('Method not implemented: getUserNotifications');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    console.warn('Method not implemented: markNotificationAsRead');
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    console.warn('Method not implemented: markAllNotificationsAsRead');
    return 0;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    console.warn('Method not implemented: getUnreadNotificationCount');
    return 0;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    console.warn('Method not implemented: deleteNotification');
    return true;
  }

  async getGroupedNotifications(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Notification[]>> {
    console.warn('Method not implemented: getGroupedNotifications');
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }

  // 通知偏好设置
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreference> {
    console.warn('Method not implemented: getUserNotificationPreferences');
    return {
      user_id: userId,
      follow_notifications: true,
      like_notifications: true,
      comment_notifications: true,
      reply_notifications: true,
      mention_notifications: true,
      system_notifications: true,
      email_notifications: false,
      push_notifications: false,
      digest_notifications: false,
      digest_frequency: 'daily'
    };
  }

  async updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<NotificationPreference> {
    console.warn('Method not implemented: updateUserNotificationPreferences');
    return {
      user_id: userId,
      follow_notifications: preferences.follow_notifications ?? true,
      like_notifications: preferences.like_notifications ?? true,
      comment_notifications: preferences.comment_notifications ?? true,
      reply_notifications: preferences.reply_notifications ?? true,
      mention_notifications: preferences.mention_notifications ?? true,
      system_notifications: preferences.system_notifications ?? true,
      email_notifications: preferences.email_notifications ?? false,
      push_notifications: preferences.push_notifications ?? false,
      digest_notifications: preferences.digest_notifications ?? false,
      digest_frequency: preferences.digest_frequency ?? 'daily'
    };
  }

  async shouldSendNotification(userId: string, type: NotificationType): Promise<boolean> {
    console.warn('Method not implemented: shouldSendNotification');
    const prefs = await this.getUserNotificationPreferences(userId);
    
    switch (type) {
      case 'follow':
        return prefs.follow_notifications !== false;
      case 'like':
        return prefs.like_notifications !== false;
      case 'comment':
        return prefs.comment_notifications !== false;
      case 'reply':
        return prefs.reply_notifications !== false;
      case 'mention':
        return prefs.mention_notifications !== false;
      case 'system':
        return prefs.system_notifications !== false;
      default:
        return true;
    }
  }
}
