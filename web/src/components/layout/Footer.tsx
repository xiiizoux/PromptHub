import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container-tight mx-auto py-8">
        <div className="md:flex md:justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div className="ml-2 flex items-baseline">
                <span 
                  className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
                    letterSpacing: '0.02em',
                    fontWeight: '700'
                  }}
                >
                  Prompt
                </span>
                <span 
                  className="text-xl font-light text-gray-600 ml-0.5"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
                    letterSpacing: '0.03em',
                    fontWeight: '300'
                  }}
                >
                  Hub
                </span>
              </div>
            </Link>
            <p className="mt-3 text-gray-600 text-sm max-w-md">
              一个用于管理和分享AI提示词的现代化平台，帮助您充分发挥AI模型的潜力。
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase">产品</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/prompts" className="text-gray-600 hover:text-primary-600 text-sm">
                    浏览提示词
                  </Link>
                </li>
                <li>
                  <Link href="/prompts/create" className="text-gray-600 hover:text-primary-600 text-sm">
                    创建提示词
                  </Link>
                </li>
                <li>
                  <Link href="/analytics" className="text-gray-600 hover:text-primary-600 text-sm">
                    性能分析
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase">资源</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/docs" className="text-gray-600 hover:text-primary-600 text-sm">
                    文档
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api" className="text-gray-600 hover:text-primary-600 text-sm">
                    API参考
                  </Link>
                </li>
                <li>
                  <Link href="/docs/templates" className="text-gray-600 hover:text-primary-600 text-sm">
                    提示词模板
                  </Link>
                </li>
                <li>
                  <Link href="/docs/examples-library" className="text-gray-600 hover:text-primary-600 text-sm">
                    应用示例
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase">关于</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/about" className="text-gray-600 hover:text-primary-600 text-sm">
                    关于我们
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/xiiizoux/PromptHub" className="text-gray-600 hover:text-primary-600 text-sm" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-primary-600 text-sm">
                    联系我们
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <hr className="my-6 border-gray-200 sm:mx-auto" />
        
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center">
            © {new Date().getFullYear()} Prompt Hub. 保留所有权利。
          </span>
          <div className="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
            <a href="#" className="text-gray-500 hover:text-primary-600">
              <span className="sr-only">Twitter</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-600">
              <span className="sr-only">GitHub</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
