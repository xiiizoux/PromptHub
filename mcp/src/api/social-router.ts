import express from 'express';
import { StorageFactory } from '../storage/storage-factory.js';
import { StorageAdapter, NotificationType, Prompt, Comment, User } from '../types.js';
import { authenticateRequest, optionalAuthMiddleware } from './auth-middleware.js';
import { createNotification } from './notification-router.js';

// 创建社交功能路由器
const router = express.Router();
const storage: StorageAdapter = StorageFactory.getStorage();

// 关注用户
router.post('/follow', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: userId'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const result = await storage.followUser(req.user.id, userId);
    
    // 创建关注通知
    const currentUser = await storage.getUser(req.user.id);
    const userName = currentUser?.display_name || currentUser?.email || '有人';
    
    await createNotification(
      userId,                      // 被关注用户ID
      'follow',                    // 通知类型
      `${userName}关注了你`,       // 通知内容
      undefined,                   // 相关资源ID
      req.user.id                  // 触发用户ID
    );
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('关注用户失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 取消关注用户
router.post('/unfollow', authenticateRequest, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: userId'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const result = await storage.unfollowUser(req.user.id, userId);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('取消关注用户失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取用户的关注者
router.get('/followers/:userId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const followers = await storage.getUserFollowers(userId, page, pageSize);
    
    return res.json({
      success: true,
      data: followers
    });
  } catch (error) {
    console.error('获取关注者失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取用户关注的人
router.get('/following/:userId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const following = await storage.getUserFollowing(userId, page, pageSize);
    
    return res.json({
      success: true,
      data: following
    });
  } catch (error) {
    console.error('获取关注的人失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 社交互动 (点赞、收藏、分享)
router.post('/interact', authenticateRequest, async (req, res) => {
  try {
    const { promptId, type } = req.body;
    
    if (!promptId || !type) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: promptId, type'
      });
    }
    
    if (!['like', 'bookmark', 'share'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '无效的互动类型，允许的值: like, bookmark, share'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const result = await storage.createSocialInteraction(req.user.id, promptId, type);
    
    // 获取提示词所有者
    const promptData = await storage.getPrompt(promptId);
    
    if (promptData && promptData.user_id && promptData.user_id !== req.user.id) {
      // 获取当前用户信息
      const currentUser = await storage.getUser(req.user.id);
      const userName = currentUser?.display_name || currentUser?.email || '有人';
      
      // 根据互动类型创建不同的通知内容
      let notificationContent = '';
      let notificationType: NotificationType = 'like';
      
      if (type === 'like') {
        notificationContent = `${userName}点赞了你的提示词"${promptData.name}"`;
        notificationType = 'like';
      } else if (type === 'bookmark') {
        notificationContent = `${userName}收藏了你的提示词"${promptData.name}"`;
        notificationType = 'like'; // 收藏通知也归为"喜欢"类通知
      } else {
        // type === 'share'
        notificationContent = `${userName}分享了你的提示词"${promptData.name}"`;
        notificationType = 'like'; // 分享通知也归为"喜欢"类通知
      }
      
      // 创建通知
      await createNotification(
        promptData.user_id,         // 提示词所有者ID
        notificationType,           // 通知类型
        notificationContent,        // 通知内容
        promptId,                   // 相关提示词ID
        req.user.id                 // 触发用户ID
      );
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('社交互动失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 取消社交互动
router.post('/remove-interaction', authenticateRequest, async (req, res) => {
  try {
    const { promptId, type } = req.body;
    
    if (!promptId || !type) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: promptId, type'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const result = await storage.removeSocialInteraction(req.user.id, promptId, type);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('取消社交互动失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取提示词的互动数据
router.get('/interactions/:promptId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { promptId } = req.params;
    const { type } = req.query;
    
    const interactions = await storage.getPromptInteractions(
      promptId, 
      type as string || undefined, 
      req.user?.id
    );
    
    return res.json({
      success: true,
      data: interactions
    });
  } catch (error) {
    console.error('获取互动数据失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 添加评论
router.post('/comments', authenticateRequest, async (req, res) => {
  try {
    const { promptId, content, parentId } = req.body;
    
    if (!promptId || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: promptId, content'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const comment = await storage.createComment(req.user.id, promptId, content, parentId);
    
    // 获取当前用户信息
    const currentUser = await storage.getUser(req.user.id);
    const userName = currentUser?.display_name || currentUser?.email || '有人';
    
    // 获取提示词信息
    const promptData = await storage.getPrompt(promptId);
    
    if (parentId) {
      // 如果是回复评论，通知原评论作者
      const parentComment = await storage.getComment(parentId);
      
      if (parentComment && parentComment.user_id && parentComment.user_id !== req.user.id) {
        // 创建回复通知
        await createNotification(
          parentComment.user_id,                               // 原评论作者ID
          'reply',                                             // 通知类型
          `${userName}回复了你在"${promptData?.name || '提示词'}"下的评论`,  // 通知内容
          promptId,                                            // 相关提示词ID
          req.user.id                                          // 触发用户ID
        );
      }
    } else if (promptData && promptData.user_id && promptData.user_id !== req.user.id) {
      // 如果是对提示词的评论，通知提示词作者
      await createNotification(
        promptData.user_id,                                    // 提示词作者ID
        'comment',                                             // 通知类型
        `${userName}评论了你的提示词"${promptData.name}"`,      // 通知内容
        promptId,                                              // 相关提示词ID
        req.user.id                                            // 触发用户ID
      );
    }
    
    return res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取提示词的评论
router.get('/comments/:promptId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { promptId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const comments = await storage.getPromptComments(promptId, page, pageSize);
    
    return res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 声明存储适配器扩展方法
declare module '../types.js' {
  interface StorageAdapter {
    getComment(commentId: string): Promise<Comment | null>;
    getUser(userId: string): Promise<User | null>;
    getPrompt(nameOrId: string, userId?: string): Promise<Prompt | null>;
  }
}

export default router;