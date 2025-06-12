import React from 'react';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-dark-bg-primary ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {title && (
              <h1 className="text-3xl font-bold text-white mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-400">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* 主要内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardLayout; 