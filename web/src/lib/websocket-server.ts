/**
 * WebSocket服务器实现
 * 提供实时通信功能
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './error-handler';
import supabaseAdapter from './supabase-adapter';

// 定义事件类型
export enum WebSocketEvents {
  // 连接事件
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  
  // 提示词相关事件
  PROMPT_CREATED = 'prompt:created',
  PROMPT_UPDATED = 'prompt:updated',
  PROMPT_DELETED = 'prompt:deleted',
  
  // 用户相关事件
  USER_ACTIVITY = 'user:activity',
  
  // 通知事件
  NOTIFICATION = 'notification',
  
  // MCP工具相关事件
  TOOL_INVOCATION_STARTED = 'tool:invocation:started',
  TOOL_INVOCATION_PROGRESS = 'tool:invocation:progress',
  TOOL_INVOCATION_COMPLETED = 'tool:invocation:completed',
  TOOL_INVOCATION_ERROR = 'tool:invocation:error',
  
  // 自定义事件
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
}

// WebSocket服务器类
class WebSocketServer {
  private io: SocketIOServer | null = null;
  
  /**
   * 初始化WebSocket服务器
   * @param httpServer HTTP服务器实例
   */
  initialize(httpServer: HTTPServer): void {
    if (this.io) {
      logger.warn('WebSocket服务器已经初始化');
      return;
    }
    
    // 创建Socket.IO服务器
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      },
      path: '/api/ws'
    });
    
    // 设置连接处理器
    this.io.on(WebSocketEvents.CONNECT, (socket) => this.handleConnection(socket));
    
    logger.info('WebSocket服务器初始化完成');
  }
  
  /**
   * 处理新的WebSocket连接
   * @param socket Socket实例
   */
  private handleConnection(socket: any): void {
    const clientId = socket.id;
    logger.info(`新的WebSocket连接: ${clientId}`);
    
    // 处理认证
    socket.on('authenticate', async (data: { token?: string; apiKey?: string }, callback: Function) => {
      try {
        let user = null;
        
        // 使用令牌认证
        if (data.token) {
          user = await supabaseAdapter.verifyToken(data.token);
        }
        // 使用API密钥认证
        else if (data.apiKey) {
                      user = await supabaseAdapter.verifyApiKey(data.apiKey);
            if (user) {
              await supabaseAdapter.updateApiKeyLastUsed(data.apiKey);
          }
        }
        
        if (!user) {
          callback({ success: false, error: '认证失败' });
          return;
        }
        
        // 保存用户信息到socket
        socket.user = user;
        
        // 加入用户特定的房间
        socket.join(`user:${user.id}`);
        
        callback({ success: true, user });
        
        logger.info(`用户认证成功: ${user.id}`);
      } catch (error) {
        logger.error('WebSocket认证错误', error instanceof Error ? error : new Error(String(error)));
        callback({ success: false, error: '认证过程中发生错误' });
      }
    });
    
    // 订阅特定主题
    socket.on(WebSocketEvents.SUBSCRIBE, (topic: string, callback?: Function) => {
      if (!this.isValidTopic(topic)) {
        if (callback) callback({ success: false, error: '无效的主题' });
        return;
      }
      
      socket.join(topic);
      logger.debug(`客户端 ${clientId} 订阅了主题: ${topic}`);
      
      if (callback) callback({ success: true });
    });
    
    // 取消订阅特定主题
    socket.on(WebSocketEvents.UNSUBSCRIBE, (topic: string, callback?: Function) => {
      socket.leave(topic);
      logger.debug(`客户端 ${clientId} 取消订阅了主题: ${topic}`);
      
      if (callback) callback({ success: true });
    });
    
    // 加入房间
    socket.on(WebSocketEvents.JOIN_ROOM, (room: string, callback?: Function) => {
      if (!this.isValidRoom(room, socket.user)) {
        if (callback) callback({ success: false, error: '无法加入房间' });
        return;
      }
      
      socket.join(room);
      logger.debug(`客户端 ${clientId} 加入了房间: ${room}`);
      
      if (callback) callback({ success: true });
    });
    
    // 离开房间
    socket.on(WebSocketEvents.LEAVE_ROOM, (room: string, callback?: Function) => {
      socket.leave(room);
      logger.debug(`客户端 ${clientId} 离开了房间: ${room}`);
      
      if (callback) callback({ success: true });
    });
    
    // 处理断开连接
    socket.on(WebSocketEvents.DISCONNECT, () => {
      logger.info(`WebSocket连接断开: ${clientId}`);
    });
  }
  
  /**
   * 检查主题是否有效
   * @param topic 主题名称
   */
  private isValidTopic(topic: string): boolean {
    // 根据需要实现主题验证逻辑
    const validPrefixes = ['prompt:', 'notification:', 'tool:'];
    return validPrefixes.some(prefix => topic.startsWith(prefix));
  }
  
  /**
   * 检查房间是否有效且用户有权限加入
   * @param room 房间名称
   * @param user 用户信息
   */
  private isValidRoom(room: string, user: any): boolean {
    // 公共房间，任何人都可以加入
    if (room.startsWith('public:')) {
      return true;
    }
    
    // 用户特定房间，只有相应用户可以加入
    if (room.startsWith('user:')) {
      const userId = room.split(':')[1];
      return user && user.id === userId;
    }
    
    // 其他类型的房间可以添加额外的权限检查
    
    return false;
  }
  
  /**
   * 向特定房间或主题发送事件
   * @param room 房间或主题名称
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket服务器未初始化，无法发送事件');
      return;
    }
    
    this.io.to(room).emit(event, data);
    logger.debug(`向房间 ${room} 发送事件 ${event}`);
  }
  
  /**
   * 向特定用户发送事件
   * @param userId 用户ID
   * @param event 事件名称
   * @param data 事件数据
   */
  emitToUser(userId: string, event: string, data: any): void {
    this.emit(`user:${userId}`, event, data);
  }
  
  /**
   * 广播事件给所有连接的客户端
   * @param event 事件名称
   * @param data 事件数据
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket服务器未初始化，无法广播事件');
      return;
    }
    
    this.io.emit(event, data);
    logger.debug(`广播事件 ${event}`);
  }
  
  /**
   * 获取房间中的客户端数量
   * @param room 房间名称
   */
  async getRoomSize(room: string): Promise<number> {
    if (!this.io) {
      logger.warn('WebSocket服务器未初始化，无法获取房间大小');
      return 0;
    }
    
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.length;
  }
}

// 创建单例实例
const websocketServer = new WebSocketServer();

export default websocketServer;
