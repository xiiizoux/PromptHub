import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  BookmarkIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  FilmIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  Squares2X2Icon as Squares2X2SolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  PhotoIcon as PhotoSolidIcon,
  FilmIcon as FilmSolidIcon,
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
      href: '/chat',
      label: '对话',
      icon: ChatBubbleLeftRightIcon,
      activeIcon: ChatBubbleLeftRightSolidIcon,
    },
    {
      href: '/image',
      label: '图像',
      icon: PhotoIcon,
      activeIcon: PhotoSolidIcon,
    },
    {
      href: '/video',
      label: '视频',
      icon: FilmIcon,
      activeIcon: FilmSolidIcon,
    },
    {
      href: '/bookmarks',
      label: '收藏',
      icon: BookmarkIcon,
      activeIcon: BookmarkSolidIcon,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-50 md:hidden" role="navigation" data-testid="mobile-navigation">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = item.href === '/' 
            ? router.pathname === item.href 
            : router.pathname.startsWith(item.href);
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