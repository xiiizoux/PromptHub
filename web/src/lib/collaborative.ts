// 协作编辑核心库
import api from './api';

// 类型定义
export interface CollaborativeSession {
  id: string;
  promptId: string;
  createdAt: Date;
  lastActivity: Date;
  participants: string[];
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  userId: string;
  userName: string;
  timestamp: Date;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  position: number;
  selection: [number, number];
}

export interface ConflictResolution {
  id: string;
  operations: Operation[];
  resolvedBy: string | null;
  resolution: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
}

export interface CollaborativeStatus {
  sessionId: string;
  isActive: boolean;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    lastSeen: Date;
    cursor?: CursorPosition;
  }>;
  lockedSections: Array<{
    range: [number, number];
    userId: string;
    timestamp: Date;
  }>;
}

// WebSocket连接管理
class CollaborativeWebSocket {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(promptId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 在实际环境中应该使用 wss://
        const wsUrl = `ws://localhost:3001/collaborative/${promptId}?userId=${userId}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('协作WebSocket连接已建立');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.type, data.payload);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('协作WebSocket连接已关闭');
          this.attemptReconnect(promptId, userId);
        };

        this.socket.onerror = (error) => {
          console.error('协作WebSocket错误:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(promptId: string, userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(promptId, userId).catch(() => {
          // 重连失败，继续尝试
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(type: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

// 全局WebSocket实例
const collaborativeWS = new CollaborativeWebSocket();

// API函数
export async function joinCollaborativeSession(promptId: string, userId: string): Promise<CollaborativeSession> {
  try {
    const response = await api.post('/collaborative/join', {
      promptId,
      userId,
    });

    if (!response.data.success) {
      throw new Error('加入协作会话失败');
    }

    // 建立WebSocket连接
    await collaborativeWS.connect(promptId, userId);

    return response.data.session;
  } catch (error: any) {
    console.error('加入协作会话失败:', error);
    throw error;
  }
}

export async function leaveCollaborativeSession(promptId: string, userId: string): Promise<void> {
  try {
    await api.post('/collaborative/leave', {
      promptId,
      userId,
    });

    // 断开WebSocket连接
    collaborativeWS.disconnect();
  } catch (error: any) {
    console.error('离开协作会话失败:', error);
    throw error;
  }
}

export async function sendOperation(promptId: string, operation: Operation): Promise<void> {
  try {
    // 通过WebSocket实时发送操作
    collaborativeWS.send('operation', operation);

    // 同时通过HTTP API发送（作为备份）
    await api.post('/collaborative/operation', {
      promptId,
      operation,
    });
  } catch (error: any) {
    console.error('发送操作失败:', error);
    throw error;
  }
}

export function subscribeToOperations(promptId: string, callback: (operation: Operation) => void): () => void {
  const handleOperation = (operation: Operation) => {
    callback(operation);
  };

  collaborativeWS.on('operation', handleOperation);

  // 返回取消订阅函数
  return () => {
    collaborativeWS.off('operation', handleOperation);
  };
}

export async function getCollaborativeStatus(promptId: string): Promise<CollaborativeStatus> {
  try {
    const response = await api.get(`/collaborative/status?promptId=${promptId}`);

    if (!response.data.success) {
      throw new Error('获取协作状态失败');
    }

    return response.data.status;
  } catch (error: any) {
    console.error('获取协作状态失败:', error);
    throw error;
  }
}

export async function lockSection(promptId: string, userId: string, startPos: number, endPos: number): Promise<void> {
  try {
    const response = await api.post('/collaborative/lock', {
      promptId,
      userId,
      startPos,
      endPos,
    });

    if (!response.data.success) {
      throw new Error('锁定区域失败');
    }

    // 通过WebSocket通知其他用户
    collaborativeWS.send('lock', {
      userId,
      range: [startPos, endPos],
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('锁定区域失败:', error);
    throw error;
  }
}

export async function unlockSection(promptId: string, userId: string, startPos: number, endPos: number): Promise<void> {
  try {
    const response = await api.post('/collaborative/unlock', {
      promptId,
      userId,
      startPos,
      endPos,
    });

    if (!response.data.success) {
      throw new Error('解锁区域失败');
    }

    // 通过WebSocket通知其他用户
    collaborativeWS.send('unlock', {
      userId,
      range: [startPos, endPos],
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('解锁区域失败:', error);
    throw error;
  }
}

export async function sendCursorPosition(promptId: string, userId: string, cursor: CursorPosition): Promise<void> {
  try {
    // 实时发送光标位置（通过WebSocket）
    collaborativeWS.send('cursor', {
      userId,
      cursor,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('发送光标位置失败:', error);
    // 光标位置失败不影响主要功能，只记录错误
  }
}

// 操作变换算法（简化版）
export class OperationalTransform {
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // 这是一个简化的OT算法实现
    // 实际生产环境需要更复杂的算法来处理各种边缘情况
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        // op1在op2之前，调整op2的位置
        return [
          op1,
          { ...op2, position: op2.position + op1.content.length },
        ];
      } else {
        // op2在op1之前，调整op1的位置
        return [
          { ...op1, position: op1.position + op2.content.length },
          op2,
        ];
      }
    }

    // 其他操作类型的处理...
    return [op1, op2];
  }

  static apply(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               operation.content + 
               content.slice(operation.position);
               
      case 'delete': {
        const deleteLength = operation.content.length;
        return content.slice(0, operation.position) + 
               content.slice(operation.position + deleteLength);
      }
               
      case 'replace': {
        const replaceLength = operation.content.length;
        return content.slice(0, operation.position) + 
               operation.content + 
               content.slice(operation.position + replaceLength);
      }
               
      default:
        return content;
    }
  }
}

// 冲突检测和解决
export class ConflictResolver {
  static detectConflict(op1: Operation, op2: Operation): boolean {
    // 简化的冲突检测逻辑
    const op1End = op1.position + (op1.content?.length || 0);
    const op2End = op2.position + (op2.content?.length || 0);
    
    // 检查操作是否重叠
    return !(op1End <= op2.position || op2End <= op1.position);
  }

  static resolveConflict(operations: Operation[], strategy: 'timestamp' | 'user_priority' = 'timestamp'): Operation {
    // 根据策略解决冲突
    switch (strategy) {
      case 'timestamp':
        // 使用最新的操作
        return operations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        
      case 'user_priority':
        // 可以根据用户权限等因素决定优先级
        return operations[0];
        
      default:
        return operations[0];
    }
  }
}

// 版本控制
export interface Version {
  id: string;
  content: string;
  operations: Operation[];
  timestamp: Date;
  author: string;
  message?: string;
}

export async function saveVersion(promptId: string, content: string, message?: string): Promise<Version> {
  try {
    const response = await api.post('/collaborative/version', {
      promptId,
      content,
      message,
    });

    if (!response.data.success) {
      throw new Error('保存版本失败');
    }

    return response.data.version;
  } catch (error: any) {
    console.error('保存版本失败:', error);
    throw error;
  }
}

export async function getVersionHistory(promptId: string): Promise<Version[]> {
  try {
    const response = await api.get(`/collaborative/versions?promptId=${promptId}`);

    if (!response.data.success) {
      throw new Error('获取版本历史失败');
    }

    return response.data.versions;
  } catch (error: any) {
    console.error('获取版本历史失败:', error);
    throw error;
  }
}

export async function restoreVersion(promptId: string, versionId: string): Promise<string> {
  try {
    const response = await api.post('/collaborative/restore', {
      promptId,
      versionId,
    });

    if (!response.data.success) {
      throw new Error('恢复版本失败');
    }

    return response.data.content;
  } catch (error: any) {
    console.error('恢复版本失败:', error);
    throw error;
  }
} 