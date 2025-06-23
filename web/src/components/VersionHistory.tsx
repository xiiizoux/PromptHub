import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TagIcon,
  CodeBracketIcon,
  UserIcon,
  CalendarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getVersionHistory,
  saveVersion,
  restoreVersion,
  Version,
} from '@/lib/collaborative';
import toast from 'react-hot-toast';

interface VersionHistoryProps {
  promptId: string;
  currentContent: string;
  onRestore: (content: string) => void;
  className?: string;
}

interface VersionDiff {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  promptId,
  currentContent,
  onRestore,
  className = '',
}) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [newVersionMessage, setNewVersionMessage] = useState('');
  const [showCreateVersion, setShowCreateVersion] = useState(false);

  useEffect(() => {
    fetchVersionHistory();
  }, [promptId]);

  const fetchVersionHistory = async () => {
    try {
      setIsLoading(true);
      const versionList = await getVersionHistory(promptId);
      setVersions(versionList);
    } catch (error: any) {
      console.error('获取版本历史失败:', error);
      toast.error('获取版本历史失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!user || !newVersionMessage.trim()) {
      toast.error('请输入版本描述');
      return;
    }

    try {
      const newVersion = await saveVersion(promptId, currentContent, newVersionMessage);
      setVersions(prev => [newVersion, ...prev]);
      setNewVersionMessage('');
      setShowCreateVersion(false);
      toast.success('版本保存成功');
    } catch (error: any) {
      console.error('保存版本失败:', error);
      toast.error('保存版本失败: ' + error.message);
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    try {
      const content = await restoreVersion(promptId, version.id);
      onRestore(content);
      toast.success(`已恢复到版本: ${version.message || '无描述'}`);
    } catch (error: any) {
      console.error('恢复版本失败:', error);
      toast.error('恢复版本失败: ' + error.message);
    }
  };

  const calculateDiff = (oldContent: string, newContent: string): VersionDiff[] => {
    // 简化的diff算法，实际应该使用更复杂的算法
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: VersionDiff[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine === newLine) {
        diff.push({ type: 'unchanged', text: oldLine });
      } else if (oldLine && !newLine) {
        diff.push({ type: 'removed', text: oldLine });
      } else if (!oldLine && newLine) {
        diff.push({ type: 'added', text: newLine });
      } else {
        diff.push({ type: 'removed', text: oldLine });
        diff.push({ type: 'added', text: newLine });
      }
    }

    return diff;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const getVersionColor = (index: number) => {
    const colors = [
      'border-neon-cyan/30 bg-neon-cyan/5',
      'border-neon-purple/30 bg-neon-purple/5',
      'border-neon-pink/30 bg-neon-pink/5',
      'border-neon-yellow/30 bg-neon-yellow/5',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">加载版本历史...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClockIcon className="h-6 w-6 text-neon-cyan" />
          <h3 className="text-xl font-semibold text-white">版本历史</h3>
          <span className="text-sm text-gray-400">
            {versions.length} 个版本
          </span>
        </div>
        
        <button
          onClick={() => setShowCreateVersion(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          保存当前版本
        </button>
      </div>

      {/* 创建版本对话框 */}
      <AnimatePresence>
        {showCreateVersion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-lg border border-neon-cyan/30 p-6"
          >
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-neon-cyan" />
              保存新版本
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  版本描述
                </label>
                <input
                  type="text"
                  value={newVersionMessage}
                  onChange={(e) => setNewVersionMessage(e.target.value)}
                  placeholder="描述这个版本的更改..."
                  className="input-primary w-full"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateVersion(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!newVersionMessage.trim()}
                  className="btn-primary"
                >
                  保存版本
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 版本列表 */}
      <div className="space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <DocumentDuplicateIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">暂无版本历史</h4>
            <p className="text-gray-500">创建第一个版本来跟踪更改</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-lg border p-4 ${getVersionColor(index)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <CodeBracketIcon className="h-4 w-4 text-neon-cyan" />
                      <span className="text-white font-medium">
                        版本 #{versions.length - index}
                      </span>
                    </div>
                    
                    {index === 0 && (
                      <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full">
                        最新
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-3">
                    {version.message || '无描述'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {version.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatTimestamp(version.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CodeBracketIcon className="h-4 w-4" />
                      {version.content.length} 字符
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedVersion(version);
                      setShowDiff(true);
                    }}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    查看
                  </button>
                  
                  {index > 0 && (
                    <button
                      onClick={() => handleRestoreVersion(version)}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      恢复
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 版本对比对话框 */}
      <AnimatePresence>
        {showDiff && selectedVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDiff(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl border border-neon-cyan/30 p-6 max-w-4xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                  <DocumentDuplicateIcon className="h-6 w-6 text-neon-cyan" />
                  版本对比
                </h4>
                <button
                  onClick={() => setShowDiff(false)}
                  className="btn-secondary"
                >
                  关闭
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 当前版本 */}
                <div>
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-400"></span>
                    当前版本
                  </h5>
                  <div className="bg-dark-bg-secondary/50 rounded-lg p-4 h-96 overflow-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {currentContent}
                    </pre>
                  </div>
                </div>
                
                {/* 选中版本 */}
                <div>
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-neon-cyan"></span>
                    版本 #{versions.findIndex(v => v.id === selectedVersion.id) + 1}
                  </h5>
                  <div className="bg-dark-bg-secondary/50 rounded-lg p-4 h-96 overflow-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              </div>
              
              {/* 差异显示 */}
              <div className="mt-6">
                <h5 className="text-white font-medium mb-3">变更差异</h5>
                <div className="bg-dark-bg-secondary/50 rounded-lg p-4 max-h-64 overflow-auto">
                  {calculateDiff(selectedVersion.content, currentContent).map((diff, index) => (
                    <div
                      key={index}
                      className={`text-sm font-mono ${
                        diff.type === 'added' ? 'text-green-400 bg-green-400/10' :
                        diff.type === 'removed' ? 'text-red-400 bg-red-400/10' :
                        'text-gray-300'
                      } ${diff.type !== 'unchanged' ? 'px-2 py-1 rounded' : ''}`}
                    >
                      {diff.type === 'added' && '+ '}
                      {diff.type === 'removed' && '- '}
                      {diff.text}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDiff(false)}
                  className="btn-secondary"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleRestoreVersion(selectedVersion);
                    setShowDiff(false);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                  恢复此版本
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 