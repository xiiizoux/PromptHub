// 本地定义类型以避免rootDir错误
type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system' | 'reply';

type User = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  related_id?: string;
  reference_type?: string;
  actor_id?: string;
  actor?: User;
  content?: string;
  is_read: boolean;
  created_at: string;
  group_id?: string;
};

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  totalPages?: number; // 添加可选的totalPages字段
};

type DigestFrequency = 'immediate' | 'daily' | 'weekly' | 'never';

type NotificationPreference = {
  user_id: string;
  notification_type?: NotificationType;
  email?: boolean;
  push?: boolean;
  in_app?: boolean;
  digest_frequency?: DigestFrequency;
  follow_notifications?: boolean;
  like_notifications?: boolean;
  comment_notifications?: boolean;
  reply_notifications?: boolean;
  mention_notifications?: boolean;
  system_notifications?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  digest_notifications?: boolean;
};

/**
 * Supabase存储适配器的通知功能扩展
 * 实现用户通知的创建、查询和管理
 */
export const notificationExtensions = (supabase: any) => {
  return {
    /**
     * 创建新通知
     * @param notification 通知对象
     * @returns 创建的通知对象
     */
    async createNotification(notification: Notification): Promise<Notification> {
      // 确保必要字段存在
      if (!notification.user_id || !notification.type || !notification.content) {
        throw new Error('缺少必要字段: user_id, type, content');
      }

      // 创建通知
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          content: notification.content,
          related_id: notification.related_id || null,
          actor_id: notification.actor_id || null,
          is_read: notification.is_read || false,
          created_at: notification.created_at || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('创建通知失败:', error);
        throw new Error(`创建通知失败: ${error.message}`);
      }

      return data;
    },

    /**
     * 获取用户的通知列表
     * @param userId 用户ID
     * @param page 页码
     * @param pageSize 每页数量
     * @param unreadOnly 是否只获取未读通知
     * @returns 分页的通知列表
     */
    async getUserNotifications(
      userId: string, 
      page: number = 1, 
      pageSize: number = 20,
      unreadOnly: boolean = false
    ): Promise<PaginatedResponse<Notification>> {
      // 计算分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 构建查询
      let query = supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (id, email, display_name)
        `, { count: 'exact' })
        .eq('user_id', userId);

      // 如果只查询未读通知
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      // 添加排序和分页
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      // 执行查询
      const { data, error, count } = await query;

      if (error) {
        console.error('获取通知列表失败:', error);
        throw new Error(`获取通知列表失败: ${error.message}`);
      }

      return {
        data,
        total: count || 0,
        page,
        pageSize,
        pageCount: Math.ceil((count || 0) / pageSize),
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },

    /**
     * 标记单个通知为已读
     * @param notificationId 通知ID
     * @param userId 用户ID
     * @returns 操作是否成功
     */
    async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
      // 检查通知是否属于该用户
      const { data: notification, error: checkError } = await supabase
        .from('notifications')
        .select('id, user_id')
        .eq('id', notificationId)
        .single();

      if (checkError) {
        console.error('查找通知失败:', checkError);
        throw new Error(`通知不存在: ${notificationId}`);
      }

      if (notification.user_id !== userId) {
        throw new Error('无权操作此通知');
      }

      // 标记为已读
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('标记通知已读失败:', error);
        throw new Error(`标记通知已读失败: ${error.message}`);
      }

      return true;
    },

    /**
     * 标记用户所有通知为已读
     * @param userId 用户ID
     * @returns 标记的通知数量
     */
    async markAllNotificationsAsRead(userId: string): Promise<number> {
      // 获取未读通知数量
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (countError) {
        console.error('获取未读通知数量失败:', countError);
        throw new Error(`获取未读通知数量失败: ${countError.message}`);
      }

      if (count === 0) {
        return 0; // 没有未读通知
      }

      // 标记所有通知为已读
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('标记所有通知已读失败:', error);
        throw new Error(`标记所有通知已读失败: ${error.message}`);
      }

      return count;
    },

    /**
     * 获取用户未读通知数量
     * @param userId 用户ID
     * @returns 未读通知数量
     */
    async getUnreadNotificationCount(userId: string): Promise<number> {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('获取未读通知数量失败:', error);
        throw new Error(`获取未读通知数量失败: ${error.message}`);
      }

      return count || 0;
    },

    /**
     * 删除指定通知
     * @param notificationId 通知ID
     * @param userId 用户ID
     * @returns 操作是否成功
     */
    async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
      // 检查通知是否属于该用户
      const { data: notification, error: checkError } = await supabase
        .from('notifications')
        .select('id, user_id')
        .eq('id', notificationId)
        .single();

      if (checkError) {
        console.error('查找通知失败:', checkError);
        throw new Error(`通知不存在: ${notificationId}`);
      }

      if (notification.user_id !== userId) {
        throw new Error('无权操作此通知');
      }

      // 删除通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('删除通知失败:', error);
        throw new Error(`删除通知失败: ${error.message}`);
      }

      return true;
    },

    /**
     * 获取分组的通知
     * @param userId 用户ID
     * @param page 页码
     * @param pageSize 每页数量
     * @returns 分页的通知分组列表
     */
    async getGroupedNotifications(
      userId: string,
      page: number = 1,
      pageSize: number = 20
    ): Promise<PaginatedResponse<Notification[]>> {
      // 获取所有通知
      const { data, error, count } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (id, email, display_name)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取通知列表失败:', error);
        throw new Error(`获取通知列表失败: ${error.message}`);
      }

      // 分组通知
      const groupedMap = new Map<string, Notification[]>();
      
      data.forEach((notification: Notification) => {
        // 分组逻辑：
        // 1. 按类型和actor_id分组 (同一用户的相同类型通知)
        // 2. 时间接近的合并 (24小时内)
        
        const groupKey = notification.group_id ||
                         `${notification.type}_${notification.actor_id || ''}_${new Date(notification.created_at).toDateString()}`;
        
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, []);
        }
        
        groupedMap.get(groupKey)?.push(notification);
      });

      // 转换为数组
      const groupedArray = Array.from(groupedMap.values());
      
      // 分页处理
      const startIndex = (page - 1) * pageSize;
      const paginatedGroups = groupedArray.slice(startIndex, startIndex + pageSize);
      
      return {
        data: paginatedGroups,
        total: groupedArray.length,
        page,
        pageSize,
        pageCount: Math.ceil(groupedArray.length / pageSize),
        totalPages: Math.ceil(groupedArray.length / pageSize)
      };
    },

    /**
     * 获取用户通知偏好设置
     * @param userId 用户ID
     * @returns 用户通知偏好设置
     */
    async getUserNotificationPreferences(userId: string): Promise<NotificationPreference> {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // 没有找到记录
          // 创建默认设置
          return this.updateUserNotificationPreferences(userId, {
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
          });
        }
        
        console.error('获取通知偏好设置失败:', error);
        throw new Error(`获取通知偏好设置失败: ${error.message}`);
      }

      return data;
    },

    /**
     * 更新用户通知偏好设置
     * @param userId 用户ID
     * @param preferences 通知偏好设置
     * @returns 更新后的通知偏好设置
     */
    async updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<NotificationPreference> {
      const updatedPrefs = {
        ...preferences,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(updatedPrefs)
        .select()
        .single();

      if (error) {
        console.error('更新通知偏好设置失败:', error);
        throw new Error(`更新通知偏好设置失败: ${error.message}`);
      }

      return data;
    },

    /**
     * 检查是否应该向用户发送指定类型的通知
     * @param userId 用户ID
     * @param type 通知类型
     * @returns 是否应该发送通知
     */
    async shouldSendNotification(userId: string, type: NotificationType): Promise<boolean> {
      const prefs = await this.getUserNotificationPreferences(userId);
      
      // 根据通知类型检查偏好设置
      switch (type) {
        case 'follow':
          return prefs.follow_notifications !== false; // 返回true除非明确设置为false
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
  };
};