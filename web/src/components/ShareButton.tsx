import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShareIcon, 
  LinkIcon,
  ClipboardDocumentIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

interface ShareOption {
  name: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 通用的剪贴板复制函数，支持浏览器兼容性
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      // 优先使用现代的 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  };

  // 分享选项配置
  const shareOptions: ShareOption[] = [
    {
      name: '复制链接',
      icon: <LinkIcon className="h-5 w-5" />,
      action: async () => {
        const success = await copyTextToClipboard(url);
        if (success) {
          toast.success('链接已复制到剪贴板！');
        } else {
          toast.error('复制失败，请手动复制链接');
        }
        setIsOpen(false);
      },
      color: 'text-gray-600 hover:text-gray-800'
    },
    {
      name: 'Twitter/X',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
      color: 'text-black hover:text-gray-700'
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      action: () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
      color: 'text-blue-600 hover:text-blue-700'
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      action: () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
      color: 'text-blue-700 hover:text-blue-800'
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
        window.open(whatsappUrl, '_blank');
        setIsOpen(false);
      },
      color: 'text-green-600 hover:text-green-700'
    },
    {
      name: '微博',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.31 8.17c-.36.06-.6.29-.53.65.06.36.4.6.76.53 1.64-.27 3.29.7 3.68 2.17.09.36.44.58.8.49.36-.09.58-.44.49-.8-.59-2.27-2.77-3.75-5.2-3.04zm1.62-2.6C9.27 5.86 7.09 6.35 5.42 7.93c-.36.34-.37.91-.03 1.27.34.36.91.37 1.27.03 1.23-1.16 2.87-1.53 4.24-1.23.36.08.71-.15.79-.51.08-.36-.15-.71-.51-.79-.24-.05-.49-.08-.75-.13zm8.97 7.32c-.6-1.11-1.56-1.85-2.68-2.09-.36-.08-.71.15-.79.51-.08.36.15.71.51.79.71.15 1.33.62 1.71 1.33.38.71.38 1.49 0 2.2-.6 1.11-1.56 1.85-2.68 2.09-.36.08-.59.43-.51.79.08.36.43.59.79.51 1.64-.35 3.05-1.43 3.93-3.05.88-1.62.88-3.46 0-5.08z"/>
        </svg>
      ),
      action: () => {
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        window.open(weiboUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
      color: 'text-red-600 hover:text-red-700'
    }
  ];

  // 计算按钮位置
  const updateButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8, // 按钮下方8px
        right: window.innerWidth - rect.right // 右对齐
      });
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 监听窗口大小变化，更新位置
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        updateButtonPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      updateButtonPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-3 glass rounded-xl border border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan/50 hover:text-white transition-colors ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="分享这个提示词"
      >
        <ShareIcon className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed w-48 glass rounded-xl border border-gray-700/50 shadow-xl z-[100]"
            style={{
              top: buttonPosition.top,
              right: buttonPosition.right,
            }}
          >
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-gray-700/30">
                <span className="text-sm font-medium text-white">分享到</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              
              {shareOptions.map((option, index) => (
                <motion.button
                  key={option.name}
                  onClick={option.action}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${option.color} hover:bg-white/10`}
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {option.icon}
                  <span className="text-sm">{option.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareButton;
