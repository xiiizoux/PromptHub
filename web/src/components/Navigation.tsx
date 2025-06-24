import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  BookmarkIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  Squares2X2Icon as Squares2X2SolidIcon,
} from '@heroicons/react/24/solid';

const Navigation: React.FC = () => {
  const router = useRouter();

  const navItems = [
    {
      href: '/',
      label: '首页',
      icon: HomeIcon,
      activeIcon: HomeSolidIcon,
    },
    {
      href: '/prompts',
      label: '提示词',
      icon: Squares2X2Icon,
      activeIcon: Squares2X2SolidIcon,
    },
    {
      href: '/bookmarks',
      label: '收藏',
      icon: BookmarkIcon,
      activeIcon: BookmarkSolidIcon,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-neon-cyan' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation; 