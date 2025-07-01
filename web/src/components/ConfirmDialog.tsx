import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          
          {/* 对话框 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-2xl border border-gray-600/50 shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              {/* 图标和标题 */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 p-2 bg-yellow-500/20 rounded-full mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {title}
                </h3>
              </div>

              {/* 消息内容 */}
              <div className="mb-6">
                <p className="text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* 按钮组 */}
              <div className="flex space-x-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    confirmVariant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-neon-cyan hover:bg-neon-cyan-dark text-dark-bg-primary'
                  }`}
                >
                  {confirmText}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 用于未保存更改确认的专用组件
 */
export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  context = 'page',
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  context?: 'page' | 'form' | 'editor';
}) {
  const contextMessages = {
    page: '您有未保存的更改，确定要离开此页面吗？',
    form: '表单内容尚未保存，确定要离开吗？',
    editor: '编辑器内容尚未保存，确定要离开吗？',
  };

  return (
    <ConfirmDialog
      open={open}
      title="未保存的更改"
      message={contextMessages[context]}
      confirmText="离开"
      cancelText="留在此页"
      confirmVariant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}