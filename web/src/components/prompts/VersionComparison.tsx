import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { PromptVersion } from '@/types';
import { formatVersionDisplay } from '@/lib/version-utils';

interface VersionComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  version1: PromptVersion;
  version2: PromptVersion;
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  isOpen,
  onClose,
  version1,
  version2
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentDiff = (content1: string, content2: string) => {
    // 简单的文本对比，显示字符数差异
    const diff = content2.length - content1.length;
    if (diff > 0) {
      return `+${diff} 字符`;
    } else if (diff < 0) {
      return `${diff} 字符`;
    } else {
      return '无变化';
    }
  };

  const getTagsDiff = (tags1?: string[], tags2?: string[]) => {
    const set1 = new Set(tags1 || []);
    const set2 = new Set(tags2 || []);
    
    const added = Array.from(set2).filter(tag => !set1.has(tag));
    const removed = Array.from(set1).filter(tag => !set2.has(tag));
    
    return { added, removed };
  };

  const tagsDiff = getTagsDiff(version1.tags, version2.tags);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-black bg-opacity-25"
        />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl glass border border-neon-cyan/20 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-white flex items-center"
                  >
                    <ArrowsRightLeftIcon className="h-6 w-6 mr-2 text-neon-cyan" />
                    版本对比
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 版本1 */}
                  <div className="space-y-4">
                    <div className="bg-neon-red/10 border border-neon-red/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-neon-red mb-2">
                        版本 {formatVersionDisplay(version1.version)}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {formatDate(version1.created_at)}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">描述</h5>
                      <div className="bg-dark-bg-secondary rounded-lg p-3 border border-gray-600">
                        <p className="text-gray-300 text-sm">
                          {version1.description || '无描述'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">内容</h5>
                      <div className="bg-dark-bg-secondary rounded-lg p-3 border border-gray-600">
                        <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-64">
                          {version1.content}
                        </pre>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {version1.content.length} 字符
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">标签</h5>
                      <div className="flex flex-wrap gap-2">
                        {version1.tags && version1.tags.length > 0 ? (
                          version1.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 rounded text-xs bg-gray-600/50 text-gray-300 border border-gray-500"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">无标签</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 版本2 */}
                  <div className="space-y-4">
                    <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-neon-green mb-2">
                        版本 {formatVersionDisplay(version2.version)}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {formatDate(version2.created_at)}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">描述</h5>
                      <div className="bg-dark-bg-secondary rounded-lg p-3 border border-gray-600">
                        <p className="text-gray-300 text-sm">
                          {version2.description || '无描述'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">内容</h5>
                      <div className="bg-dark-bg-secondary rounded-lg p-3 border border-gray-600">
                        <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap overflow-auto max-h-64">
                          {version2.content}
                        </pre>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {version2.content.length} 字符 
                        <span className={`ml-2 ${
                          version2.content.length > version1.content.length 
                            ? 'text-neon-green' 
                            : version2.content.length < version1.content.length 
                            ? 'text-neon-red' 
                            : 'text-gray-400'
                        }`}>
                          ({getContentDiff(version1.content, version2.content)})
                        </span>
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-2">标签</h5>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {version2.tags && version2.tags.length > 0 ? (
                            version2.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className={`px-2 py-1 rounded text-xs border ${
                                  tagsDiff.added.includes(tag)
                                    ? 'bg-neon-green/20 text-neon-green border-neon-green/30'
                                    : 'bg-gray-600/50 text-gray-300 border-gray-500'
                                }`}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">无标签</span>
                          )}
                        </div>
                        
                        {/* 显示删除的标签 */}
                        {tagsDiff.removed.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {tagsDiff.removed.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 rounded text-xs bg-neon-red/20 text-neon-red border-neon-red/30 line-through"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 变更摘要 */}
                <div className="mt-6 p-4 bg-dark-bg-secondary/50 rounded-lg border border-gray-600">
                  <h5 className="text-sm font-medium text-gray-400 mb-3">变更摘要</h5>
                  <div className="space-y-2 text-sm">
                    {version1.description !== version2.description && (
                      <div className="text-neon-orange">
                        • 描述已更改
                      </div>
                    )}
                    {version1.content !== version2.content && (
                      <div className="text-neon-orange">
                        • 内容已更改 ({getContentDiff(version1.content, version2.content)})
                      </div>
                    )}
                    {version1.category !== version2.category && (
                      <div className="text-neon-orange">
                        • 分类从 "{version1.category}" 更改为 "{version2.category}"
                      </div>
                    )}
                    {tagsDiff.added.length > 0 && (
                      <div className="text-neon-green">
                        • 新增标签: {tagsDiff.added.join(', ')}
                      </div>
                    )}
                    {tagsDiff.removed.length > 0 && (
                      <div className="text-neon-red">
                        • 删除标签: {tagsDiff.removed.join(', ')}
                      </div>
                    )}
                    {version1.description === version2.description &&
                     version1.content === version2.content &&
                     version1.category === version2.category &&
                     tagsDiff.added.length === 0 &&
                     tagsDiff.removed.length === 0 && (
                      <div className="text-gray-400">
                        • 无明显变更
                      </div>
                    )}
                    {/* 媒体文件版本管理说明 */}
                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
                      <div className="text-yellow-400 font-medium">📝 注意</div>
                      <div className="text-yellow-300/80 mt-1">
                        媒体文件不参与版本管理，此比较不包含媒体文件的变更
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default VersionComparison;