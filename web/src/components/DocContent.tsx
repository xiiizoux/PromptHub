import React from 'react';
import { motion } from 'framer-motion';

interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const DocSection: React.FC<DocSectionProps> = ({ 
  title, 
  children, 
  className = '',
  delay = 0, 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={`bg-dark-bg-secondary/30 backdrop-blur-md rounded-2xl border border-dark-border/50 shadow-2xl overflow-hidden hover:border-neon-cyan/30 transition-all duration-500 ${className}`}
    >
      <div className="p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-dark-text-primary mb-6 bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

interface DocContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DocContent: React.FC<DocContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`prose prose-invert prose-lg max-w-none ${className}`}>
      {children}
    </div>
  );
};

interface DocGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export const DocGrid: React.FC<DocGridProps> = ({ children, cols = 2, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-6 ${className}`}>
      {children}
    </div>
  );
};

interface DocCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: 'cyan' | 'purple' | 'pink' | 'green' | 'yellow';
  children?: React.ReactNode;
  className?: string;
}

export const DocCard: React.FC<DocCardProps> = ({ 
  title, 
  description, 
  icon, 
  color = 'cyan',
  children,
  className = '', 
}) => {
  const colorClasses = {
    cyan: 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/30 text-neon-cyan',
    purple: 'from-neon-purple/20 to-neon-purple/5 border-neon-purple/30 text-neon-purple',
    pink: 'from-neon-pink/20 to-neon-pink/5 border-neon-pink/30 text-neon-pink',
    green: 'from-neon-green/20 to-neon-green/5 border-neon-green/30 text-neon-green',
    yellow: 'from-neon-yellow/20 to-neon-yellow/5 border-neon-yellow/30 text-neon-yellow',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm rounded-xl p-6 hover:shadow-neon-sm transition-all duration-300 ${className}`}>
      {icon && (
        <div className="flex items-center mb-4">
          <div className="mr-3">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-dark-text-primary">{title}</h3>
        </div>
      )}
      {!icon && (
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">{title}</h3>
      )}
      <p className="text-dark-text-secondary text-sm leading-relaxed mb-4">
        {description}
      </p>
      {children}
    </div>
  );
};

interface DocCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export const DocCodeBlock: React.FC<DocCodeBlockProps> = ({ 
  code, 
  language = 'text',
  title,
  className = '', 
}) => {
  return (
    <div className={`bg-dark-bg-primary/50 border border-dark-border/50 rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="bg-dark-bg-secondary/50 px-4 py-2 border-b border-dark-border/50">
          <span className="text-sm font-medium text-neon-cyan">{title}</span>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-dark-text-secondary font-mono whitespace-pre-wrap">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

interface DocListProps {
  items: Array<{
    title: string;
    description: string;
    href?: string;
  }>;
  className?: string;
}

export const DocList: React.FC<DocListProps> = ({ items, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start space-x-3 group">
          <div className="flex-shrink-0 w-2 h-2 bg-neon-cyan rounded-full mt-2 group-hover:shadow-neon-sm transition-all duration-300"></div>
          <div className="flex-1">
            {item.href ? (
              <a 
                href={item.href}
                className="text-dark-text-secondary hover:text-neon-cyan transition-colors duration-300 group-hover:translate-x-1 transform inline-block"
              >
                <span className="font-medium">{item.title}</span>
                {item.description && (
                  <span className="text-sm text-dark-text-tertiary ml-2">
                    - {item.description}
                  </span>
                )}
              </a>
            ) : (
              <div>
                <span className="font-medium text-dark-text-secondary">{item.title}</span>
                {item.description && (
                  <span className="text-sm text-dark-text-tertiary ml-2">
                    - {item.description}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface DocHighlightProps {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  className?: string;
}

export const DocHighlight: React.FC<DocHighlightProps> = ({ 
  children, 
  type = 'info',
  className = '', 
}) => {
  const typeClasses = {
    info: 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan',
    warning: 'border-neon-yellow/50 bg-neon-yellow/10 text-neon-yellow',
    success: 'border-neon-green/50 bg-neon-green/10 text-neon-green',
    error: 'border-neon-red/50 bg-neon-red/10 text-neon-red',
  };

  return (
    <div className={`border-l-4 ${typeClasses[type]} backdrop-blur-sm rounded-r-xl p-6 ${className}`}>
      {children}
    </div>
  );
}; 