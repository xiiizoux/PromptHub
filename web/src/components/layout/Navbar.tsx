import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: '首页', href: '/' },
  { name: '浏览提示词', href: '/prompts' },
  { name: '创建提示词', href: '/create' },
  { name: '性能分析', href: '/analytics' },
  { name: '文档', href: '/docs' },
];

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 判断当前路径是否活跃
  const isActive = (path: string) => {
    // 在服务器端渲染时，无法判断路径
    if (!mounted || typeof window === 'undefined') {
      return false;
    }
    
    const currentPath = window.location.pathname;
    if (path === '/') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  // 创建Ref来跟踪菜单元素
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const userButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // 点击页面其他位置关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 只有当点击元素不在菜单内且不是菜单按钮时才关闭菜单
      if (
        userMenuOpen &&
        userMenuRef.current && 
        userButtonRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="container-tight mx-auto flex items-center justify-between py-4" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="flex items-center -m-1.5 p-1.5">
            <span className="sr-only">Prompt Hub</span>
            <div className="flex items-center">
              <div className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: '64px', height: '64px' }}>
                <img src="/logo.png" alt="Logo" className="h-16 w-16 object-cover" />
              </div>
              <img src="/webname.png" alt="Prompt Hub" className="ml-3 h-12 w-auto" />
            </div>
          </Link>
        </div>
        
        {/* 移动端菜单按钮 */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">打开主菜单</span>
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
        
        {/* 桌面端菜单 */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-lg font-semibold leading-6 transition-all duration-300 ease-in-out ${
                isActive(item.href)
                  ? 'text-primary-600 border-b-2 border-primary-600 scale-105'
                  : 'text-gray-700 hover:text-primary-600 hover:scale-110 hover:border-b-2 hover:border-primary-300'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end space-x-4">
          {user ? (
            <div className="relative">
              <button
                ref={userButtonRef}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <UserCircleIcon className="h-6 w-6 mr-1" />
                <span>{user.display_name || user.email.split('@')[0]}</span>
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </button>
              
              {userMenuOpen && (
                <div ref={userMenuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    个人资料
                  </Link>
                  <Link href="/profile/api-keys" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    API密钥管理
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setUserMenuOpen(false);
                      if (typeof window !== 'undefined') {
                        window.location.href = '/';
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/register" className="text-sm font-semibold leading-6 text-primary-600 hover:text-primary-700">
                注册
              </Link>
              <Link href="/auth/login" className="text-sm font-semibold leading-6 text-gray-900">
                登录 <span aria-hidden="true">&rarr;</span>
              </Link>
            </>
          )}
        </div>
      </nav>
      
      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-2 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-lg font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-600 scale-102 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600 hover:translate-x-1'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  个人资料
                </Link>
                <Link
                  href="/profile/api-keys"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  API密钥管理
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                    if (typeof window !== 'undefined') {
                      window.location.href = '/';
                    }
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="block rounded-md px-3 py-2 text-base font-medium text-primary-600 hover:bg-gray-50 hover:text-primary-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  注册
                </Link>
                <Link
                  href="/auth/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
