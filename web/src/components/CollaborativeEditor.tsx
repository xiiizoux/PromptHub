import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  // PencilSquareIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  // CheckCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  // ChatBubbleLeftIcon,
  // DocumentDuplicateIcon,
  LockClosedIcon,
  // LockOpenIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { 
  joinCollaborativeSession,
  leaveCollaborativeSession,
  sendOperation,
  subscribeToOperations,
  getCollaborativeStatus,
  lockSection,
  unlockSection,
  sendCursorPosition,
  CollaborativeSession,
  Operation,
  CursorPosition,
  ConflictResolution,
} from '@/lib/collaborative';
import toast from 'react-hot-toast';

interface CollaborativeEditorProps {
  promptId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
  className?: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: CursorPosition;
  isActive: boolean;
  lastSeen: Date;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  promptId,
  initialContent,
  onContentChange,
  readOnly = false,
  className = '',
}) => {
  const { user } = useAuth();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [lockedSections, setLockedSections] = useState<Map<string, string>>(new Map());
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [operationQueue, setOperationQueue] = useState<Operation[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // 协作者颜色映射
  const collaboratorColors = [
    'bg-neon-cyan', 'bg-neon-purple', 'bg-neon-pink', 'bg-neon-yellow',
    'bg-blue-400', 'bg-green-400', 'bg-orange-400', 'bg-red-400',
  ];

  useEffect(() => {
    if (!user || !promptId) return;

    initializeCollaboration();
    
    return () => {
      cleanup();
    };
  }, [user, promptId]);

  const initializeCollaboration = async () => {
    try {
      // 加入协作会话
      const sessionData = await joinCollaborativeSession(promptId, user!.id);
      setSession(sessionData);
      setIsConnected(true);

      // 订阅操作更新
      const unsubscribe = subscribeToOperations(promptId, handleRemoteOperation);

      // 获取当前协作者状态
      await refreshCollaborators();

      // 设置定期同步
      const syncInterval = setInterval(syncWithServer, 5000);

      return () => {
        unsubscribe();
        clearInterval(syncInterval);
      };
    } catch (error: unknown) {
      console.error('初始化协作失败:', error);
      toast.error('连接协作服务失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const cleanup = async () => {
    if (session && user) {
      await leaveCollaborativeSession(promptId, user.id);
      setIsConnected(false);
    }
  };

  const handleRemoteOperation = (operation: Operation) => {
    if (operation.userId === user?.id) return; // 忽略自己的操作

    try {
      // 应用远程操作到本地内容
      const newContent = applyOperation(content, operation);
      setContent(newContent);
      onContentChange(newContent);
      setLastSyncTime(new Date());
      
      // 更新协作者光标位置
      updateCollaboratorCursor(operation.userId, operation.cursor);
      
      toast.success(`${operation.userName} 更新了内容`, {
        duration: 2000,
        icon: '👥',
      });
    } catch (error: unknown) {
      console.error('应用远程操作失败:', error);
      // 处理冲突
      handleConflict(operation);
    }
  };

  const handleLocalChange = useCallback(async (newContent: string) => {
    if (!session || !user) return;

    const cursorPos = editorRef.current?.selectionStart || 0;
    
    // 创建操作对象
    const operation: Operation = {
      id: generateOperationId(),
      type: 'insert', // 简化处理，实际应该计算diff
      position: cursorPos,
      content: newContent,
      userId: user.id,
      userName: user.email || '匿名用户',
      timestamp: new Date(),
      cursor: { position: cursorPos, selection: [cursorPos, cursorPos] },
    };

    // 添加到操作队列
    setOperationQueue(prev => [...prev, operation]);
    setHasUnsavedChanges(true);

    // 立即更新本地内容
    setContent(newContent);
    onContentChange(newContent);

    // 发送操作到服务器
    try {
      await sendOperation(promptId, operation);
      // 发送光标位置
      await sendCursorPosition(promptId, user.id, {
        position: cursorPos,
        selection: [cursorPos, cursorPos],
      });
      
      setHasUnsavedChanges(false);
    } catch (error: unknown) {
      console.error('发送操作失败:', error);
      toast.error('同步失败，请检查网络连接');
    }
  }, [session, user, promptId, onContentChange]);

  const applyOperation = (currentContent: string, operation: Operation): string => {
    // 简化的操作应用逻辑
    // 实际实现应该使用更复杂的OT算法
    switch (operation.type) {
      case 'insert':
        return operation.content;
      case 'delete':
        // 处理删除操作
        return currentContent;
      case 'replace':
        // 处理替换操作
        return operation.content;
      default:
        return currentContent;
    }
  };

  const handleConflict = (operation: Operation) => {
    const conflict: ConflictResolution = {
      id: generateOperationId(),
      operations: [operation],
      resolvedBy: null,
      resolution: 'pending',
      timestamp: new Date(),
    };
    
    setConflicts(prev => [...prev, conflict]);
    toast.error('检测到编辑冲突，请手动解决');
  };

  const resolveConflict = async (conflictId: string, _resolution: 'accept' | 'reject') => {
    try {
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      toast.success('冲突已解决');
    } catch (error: unknown) {
      console.error('解决冲突失败:', error);
      toast.error('解决冲突失败');
    }
  };

  const handleLockSection = async (startPos: number, endPos: number) => {
    if (!user) return;
    
    try {
      await lockSection(promptId, user.id, startPos, endPos);
      setLockedSections(prev => new Map(prev.set(`${startPos}-${endPos}`, user.id)));
      toast.success('区域已锁定');
    } catch (error: unknown) {
      console.error('锁定失败:', error);
      toast.error('锁定失败');
    }
  };

  const _handleUnlockSection = async (startPos: number, endPos: number) => {
    if (!user) return;
    
    try {
      await unlockSection(promptId, user.id, startPos, endPos);
      setLockedSections(prev => {
        const newMap = new Map(prev);
        newMap.delete(`${startPos}-${endPos}`);
        return newMap;
      });
      toast.success('区域已解锁');
    } catch (error: unknown) {
      console.error('解锁失败:', error);
      toast.error('解锁失败');
    }
  };

  const refreshCollaborators = async () => {
    try {
      const status = await getCollaborativeStatus(promptId);
      const collaboratorList = status.collaborators.map((collab: { lastSeen: string }, index: number) => ({
        ...collab,
        color: collaboratorColors[index % collaboratorColors.length],
        isActive: (Date.now() - new Date(collab.lastSeen).getTime()) < 30000, // 30秒内活跃
      }));
      setCollaborators(collaboratorList);
    } catch (error: unknown) {
      console.error('获取协作者失败:', error);
    }
  };

  const updateCollaboratorCursor = (userId: string, cursor?: CursorPosition) => {
    setCollaborators(prev => 
      prev.map(collab => 
        collab.id === userId 
          ? { ...collab, cursor, lastSeen: new Date() }
          : collab,
      ),
    );
  };

  const syncWithServer = async () => {
    try {
      await refreshCollaborators();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  const generateOperationId = () => {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 协作状态栏 */}
      <div className="flex items-center justify-between p-4 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm font-medium">
              {isConnected ? '已连接' : '连接中...'}
            </span>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1 text-yellow-400">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">有未保存更改</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-gray-400">
            <ArrowPathIcon className="h-4 w-4" />
            <span className="text-xs">
              上次同步: {lastSyncTime.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 协作者列表 */}
          <button
            onClick={() => setShowCollaborators(!showCollaborators)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <UserGroupIcon className="h-5 w-5" />
            <span className="text-sm">{collaborators.length} 协作者</span>
          </button>

          {/* 冲突指示器 */}
          {conflicts.length > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">{conflicts.length} 冲突</span>
            </div>
          )}
        </div>
      </div>

      {/* 协作者面板 */}
      <AnimatePresence>
        {showCollaborators && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-lg border border-neon-cyan/20 p-4"
          >
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-neon-cyan" />
              当前协作者
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {collaborators.map((collaborator) => (
                <motion.div
                  key={collaborator.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    collaborator.isActive 
                      ? 'border-green-400/30 bg-green-400/5' 
                      : 'border-gray-600/30 bg-gray-600/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${collaborator.color} flex items-center justify-center text-white text-sm font-medium`}>
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {collaborator.name}
                    </div>
                    <div className="text-gray-400 text-xs truncate">
                      {collaborator.isActive ? '正在编辑' : `${Math.round((Date.now() - collaborator.lastSeen.getTime()) / 1000)}秒前`}
                    </div>
                  </div>
                  
                  {collaborator.isActive && (
                    <EyeIcon className="h-4 w-4 text-green-400" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 冲突解决面板 */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-lg border border-red-400/30 p-4"
          >
            <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              编辑冲突 ({conflicts.length})
            </h4>
            
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="p-3 bg-red-400/10 rounded-lg border border-red-400/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">
                      检测到冲突 - {conflict.timestamp.toLocaleTimeString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveConflict(conflict.id, 'accept')}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        接受
                      </button>
                      <button
                        onClick={() => resolveConflict(conflict.id, 'reject')}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-300 text-xs">
                    {conflict.operations.length} 个操作需要解决
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑器主体 */}
      <div className="relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => handleLocalChange(e.target.value)}
          disabled={readOnly}
          placeholder="开始协作编辑..."
          className={`w-full h-96 p-4 bg-dark-bg-secondary border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-neon-cyan transition-colors ${
            readOnly ? 'cursor-not-allowed opacity-70' : ''
          }`}
          style={{
            fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        />

        {/* 协作者光标显示 */}
        {collaborators.map((collaborator) => 
          collaborator.cursor && collaborator.isActive && collaborator.id !== user?.id && (
            <div
              key={collaborator.id}
              className={'absolute pointer-events-none'}
              style={{
                // 简化的光标位置计算，实际需要更复杂的逻辑
                top: `${Math.floor(collaborator.cursor.position / 50) * 21 + 16}px`,
                left: `${(collaborator.cursor.position % 50) * 8 + 16}px`,
              }}
            >
              <div className={`w-0.5 h-5 ${collaborator.color}`} />
              <div className={`text-xs text-white px-1 py-0.5 rounded ${collaborator.color} whitespace-nowrap mt-1`}>
                {collaborator.name}
              </div>
            </div>
          ),
        )}

        {/* 锁定区域显示 */}
        {Array.from(lockedSections.entries()).map(([range, userId]) => {
          const collaborator = collaborators.find(c => c.id === userId);
          if (!collaborator) return null;
          
          return (
            <div
              key={range}
              className="absolute pointer-events-none border-2 border-dashed border-yellow-400 bg-yellow-400/10 rounded"
              style={{
                // 简化的区域计算
                top: '16px',
                left: '16px',
                right: '16px',
                bottom: '16px',
              }}
            >
              <div className="absolute -top-6 left-0 text-xs text-yellow-400 flex items-center gap-1">
                <LockClosedIcon className="h-3 w-3" />
                {collaborator.name} 正在编辑
              </div>
            </div>
          );
        })}
      </div>

      {/* 操作工具栏 */}
      <div className="flex items-center justify-between p-3 bg-dark-bg-secondary/30 rounded-lg border border-gray-700/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const selection = editorRef.current?.selectionStart || 0;
              handleLockSection(selection, selection + 10);
            }}
            disabled={readOnly}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <LockClosedIcon className="h-4 w-4" />
            锁定选区
          </button>
          
          <button
            onClick={syncWithServer}
            disabled={!isConnected}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            同步
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>队列: {operationQueue.length} 操作</span>
          <span>•</span>
          <span>字符: {content.length}</span>
        </div>
      </div>
    </div>
  );
}; 