import { io, Socket } from 'socket.io-client';
import { supabase } from './supabase';

// WebSocket事件类型
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
  
  // 自定义事件
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
}

// 事件回调类型
type EventCallback = (data: any) => void;

// WebSocket客户端单例类
class WebSocketClient {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3秒
  
  /**
   * 连接到WebSocket服务器
   */
  async connect(): Promise<boolean> {
    if (this.connected || this.connecting) {
      return this.connected;
    }
    
    this.connecting = true;
    
    try {
      // 获取当前会话令牌
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError);
        this.connecting = false;
        return false;
      }
      
      if (!session?.access_token) {
        console.warn('未登录，无法连接WebSocket');
        this.connecting = false;
        return false;
      }
      
      // 创建Socket.IO客户端
      this.socket = io({
        path: '/api/ws',
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });
      
      // 注册基本事件处理程序
      this.socket.on(WebSocketEvents.CONNECT, this.handleConnect.bind(this));
      this.socket.on(WebSocketEvents.DISCONNECT, this.handleDisconnect.bind(this));
      this.socket.on('error', this.handleError.bind(this));
      
      // 为所有已注册的事件添加监听器
      this.eventListeners.forEach((callbacks, event) => {
        if (event !== WebSocketEvents.CONNECT && event !== WebSocketEvents.DISCONNECT) {
          this.socket!.on(event, (data: any) => {
            this.dispatchEvent(event, data);
          });
        }
      });
      
      // 连接到服务器
      this.socket.connect();
      
      // 等待连接完成
      await new Promise<void>((resolve, reject) => {
        const connectTimeout = setTimeout(() => {
          reject(new Error('WebSocket连接超时'));
        }, 5000);
        
        this.socket!.once(WebSocketEvents.CONNECT, () => {
          clearTimeout(connectTimeout);
          resolve();
        });
      });
      
      // 认证
      await this.authenticate(session.access_token);
      
      // 订阅当前用户的通知
      const { user } = session;
      if (user?.id) {
        await this.subscribe(`user:${user.id}`);
      }
      
      this.connecting = false;
      return true;
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.cleanup();
      this.connecting = false;
      
      // 尝试重新连接
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
      
      return false;
    }
  }
  
  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.cleanup();
    }
  }
  
  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.socket) {
      this.socket.off();
      this.socket.close();
      this.socket = null;
    }
    
    this.connected = false;
  }
  
  /**
   * 处理连接成功
   */
  private handleConnect(): void {
    console.log('WebSocket连接成功');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.dispatchEvent(WebSocketEvents.CONNECT, null);
  }
  
  /**
   * 处理连接断开
   */
  private handleDisconnect(reason: string): void {
    console.log(`WebSocket连接断开: ${reason}`);
    this.connected = false;
    this.dispatchEvent(WebSocketEvents.DISCONNECT, { reason });
    
    // 如果不是主动断开连接，尝试重新连接
    if (reason !== 'io client disconnect') {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    }
  }
  
  /**
   * 处理连接错误
   */
  private handleError(error: Error): void {
    console.error('WebSocket错误:', error);
  }
  
  /**
   * 认证连接
   */
  private async authenticate(token: string): Promise<boolean> {
    if (!this.socket || !this.connected) {
      return false;
    }
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        this.socket!.emit('authenticate', { token }, (response: any) => {
          if (response?.success) {
            console.log('WebSocket认证成功');
            resolve(true);
          } else {
            console.error('WebSocket认证失败:', response?.error || '未知错误');
            reject(new Error(response?.error || '认证失败'));
          }
        });
        
        // 添加超时处理，确保认证请求不会一直挂起
        setTimeout(() => {
          reject(new Error('WebSocket认证超时'));
        }, 5000);
      } catch (error) {
        console.error('发送认证请求时出错:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 订阅主题
   */
  async subscribe(topic: string): Promise<boolean> {
    if (!this.socket || !this.connected) {
      await this.connect();
      if (!this.connected) {
        return false;
      }
    }
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        this.socket!.emit(WebSocketEvents.SUBSCRIBE, topic, (response: any) => {
          if (response?.success) {
            console.log(`订阅主题成功: ${topic}`);
            resolve(true);
          } else {
            console.error(`订阅主题失败: ${topic}`, response?.error || '未知错误');
            reject(new Error(response?.error || '订阅失败'));
          }
        });
        
        // 添加超时处理
        setTimeout(() => {
          reject(new Error(`订阅主题超时: ${topic}`));
        }, 5000);
      } catch (error) {
        console.error(`发送订阅请求时出错: ${topic}`, error);
        reject(error);
      }
    });
  }
  
  /**
   * 取消订阅主题
   */
  async unsubscribe(topic: string): Promise<boolean> {
    if (!this.socket || !this.connected) {
      return false;
    }
    
    return new Promise<boolean>((resolve, reject) => {
      try {
        this.socket!.emit(WebSocketEvents.UNSUBSCRIBE, topic, (response: any) => {
          if (response?.success) {
            console.log(`取消订阅主题成功: ${topic}`);
            resolve(true);
          } else {
            console.error(`取消订阅主题失败: ${topic}`, response?.error || '未知错误');
            reject(new Error(response?.error || '取消订阅失败'));
          }
        });
        
        // 添加超时处理
        setTimeout(() => {
          reject(new Error(`取消订阅主题超时: ${topic}`));
        }, 5000);
      } catch (error) {
        console.error(`发送取消订阅请求时出错: ${topic}`, error);
        reject(error);
      }
    });
  }
  
  /**
   * 注册事件监听器
   */
  on(event: string, callback: EventCallback): void {
    // 初始化事件监听器集合（如果不存在）
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
      
      // 如果已连接，为新事件添加监听器
      if (this.socket && this.connected && 
          event !== WebSocketEvents.CONNECT && 
          event !== WebSocketEvents.DISCONNECT) {
        this.socket.on(event, (data: any) => {
          this.dispatchEvent(event, data);
        });
      }
    }
    
    // 添加回调函数到集合
    this.eventListeners.get(event)!.add(callback);
  }
  
  /**
   * 移除事件监听器
   */
  off(event: string, callback: EventCallback): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(callback);
    }
  }
  
  /**
   * 分发事件
   */
  private dispatchEvent(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件处理函数执行错误: ${event}`, error);
        }
      });
    }
  }
  
  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// 创建单例实例
const websocketClient = new WebSocketClient();

export default websocketClient;