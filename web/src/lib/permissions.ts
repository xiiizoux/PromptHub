import { PromptDetails, User, PermissionCheck } from '@/types';

/**
 * 权限管理工具函数
 */

// 检查编辑权限
export const checkEditPermission = (prompt: PromptDetails, user: User | null): PermissionCheck => {
  if (!user) {
    return {
      canEdit: false,
      reason: 'no_permission',
      message: '请先登录',
    };
  }

  // 1. 用户是提示词的创建者（优先检查数据库字段）
  if (prompt.created_by === user.id || 
      prompt.user_id === user.id ||
      prompt.author === user.username || 
      prompt.author === user.display_name) {
    return {
      canEdit: true,
      reason: 'owner',
      message: '您是此提示词的创建者',
    };
  }

  // 2. 管理员权限
  if (user.role === 'admin') {
    return {
      canEdit: true,
      reason: 'admin',
      message: '管理员权限',
    };
  }

  // 3. 贡献者权限（仅限公开且允许协作的提示词）
  if (user.role === 'contributor' && prompt.is_public === true && prompt.allow_collaboration === true) {
    return {
      canEdit: true,
      reason: 'contributor',
      message: '贡献者可以编辑公开的协作提示词',
    };
  }

  // 4. 协作者权限
  if (prompt.collaborators && prompt.collaborators.length > 0) {
    // 检查用户的多种标识是否在协作者列表中
    const userIdentifiers = [
      user.username,
      user.display_name,
      user.email?.split('@')[0],
    ].filter(Boolean); // 过滤掉空值

    const isCollaborator = userIdentifiers.some(identifier =>
      identifier && prompt.collaborators?.includes(identifier) || false,
    );

    if (isCollaborator) {
      return {
        canEdit: true,
        reason: 'collaborator',
        message: '您被授权为协作者',
      };
    }
  }

  // 5. 默认：无权限
  return {
    canEdit: false,
    reason: 'no_permission',
    message: '您没有编辑此提示词的权限',
  };
};

// 检查查看权限
export const checkViewPermission = (prompt: PromptDetails, user: User | null): boolean => {
  // 公开提示词所有人都可以查看
  if (prompt.is_public === true) {
    return true;
  }

  // 未登录用户不能查看私有提示词
  if (!user) {
    return false;
  }

  // 创建者可以查看自己的提示词
  if (prompt.created_by === user.id || 
      prompt.user_id === user.id ||
      prompt.author === user.username || 
      prompt.author === user.display_name) {
    return true;
  }

  // 管理员可以查看所有提示词
  if (user.role === 'admin') {
    return true;
  }

  // 协作者可以查看
  if (prompt.collaborators && prompt.collaborators.includes(user.username || '')) {
    return true;
  }

  return false;
};

// 检查删除权限
export const checkDeletePermission = (prompt: PromptDetails, user: User | null): PermissionCheck => {
  if (!user) {
    return {
      canEdit: false,
      reason: 'no_permission',
      message: '请先登录',
    };
  }

  // 只有创建者和管理员可以删除
  if (prompt.created_by === user.id || 
      prompt.user_id === user.id ||
      prompt.author === user.username || 
      prompt.author === user.display_name) {
    return {
      canEdit: true,
      reason: 'owner',
      message: '您是此提示词的创建者',
    };
  }

  if (user.role === 'admin') {
    return {
      canEdit: true,
      reason: 'admin',
      message: '管理员权限',
    };
  }

  return {
    canEdit: false,
    reason: 'no_permission',
    message: '只有创建者和管理员可以删除提示词',
  };
};

// 检查字段编辑权限
export const checkFieldPermission = (
  field: string, 
  permissionCheck: PermissionCheck | null,
): boolean => {
  if (!permissionCheck?.canEdit) {
    return false;
  }

  switch (field) {
    case 'author':
      // 作者信息不允许修改（永久锁定）
      return false;
    
    case 'is_public':
    case 'allow_collaboration':
    case 'edit_permission':
      // 贡献者不能修改可见性和权限设置
      return permissionCheck.reason !== 'contributor';
    
    case 'name':
      // 名称通常不允许修改，或者只有管理员可以修改
      return permissionCheck.reason === 'admin';
    
    default:
      // 其他字段，有编辑权限就可以修改
      return true;
  }
};

// 获取权限级别描述
export const getPermissionDescription = (reason: PermissionCheck['reason']): string => {
  switch (reason) {
    case 'owner':
      return '创建者';
    case 'admin':
      return '管理员';
    case 'contributor':
      return '贡献者';
    case 'collaborator':
      return '协作者';
    case 'no_permission':
    default:
      return '无权限';
  }
};

// 获取权限级别颜色
export const getPermissionColor = (reason: PermissionCheck['reason']): string => {
  switch (reason) {
    case 'owner':
      return 'text-green-600 bg-green-100';
    case 'admin':
      return 'text-purple-600 bg-purple-100';
    case 'contributor':
      return 'text-blue-600 bg-blue-100';
    case 'collaborator':
      return 'text-orange-600 bg-orange-100';
    case 'no_permission':
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// 检查是否可以管理协作者
export const canManageCollaborators = (prompt: PromptDetails, user: User | null): boolean => {
  if (!user) return false;
  
  // 只有创建者和管理员可以管理协作者
  return (prompt.created_by === user.id || 
          prompt.user_id === user.id ||
          prompt.author === user.username || 
          prompt.author === user.display_name) ||
         (user.role === 'admin');
};

// 检查是否可以查看审计日志
export const canViewAuditLogs = (prompt: PromptDetails, user: User | null): boolean => {
  if (!user) return false;
  
  // 1. 检查是否为创建者
  const isOwner = prompt.created_by === user.id || 
                  prompt.user_id === user.id ||
                  prompt.author === user.username || 
                  prompt.author === user.display_name;
                  
  // 2. 检查是否为管理员
  const isAdmin = user.role === 'admin';
  
  // 3. 检查是否为协作者
  const isCollaborator = prompt.collaborators && prompt.collaborators.includes(user.username || '');
  
  // 创建者、管理员和协作者可以查看审计日志
  return isOwner || isAdmin || !!isCollaborator;
};

// 权限常量
export const PERMISSION_LEVELS = {
  OWNER_ONLY: 'owner_only',
  COLLABORATORS: 'collaborators',
  PUBLIC: 'public',
} as const;

export const COLLABORATOR_PERMISSIONS = {
  EDIT: 'edit',
  REVIEW: 'review',
  ADMIN: 'admin',
} as const;

// 权限级别描述
export const PERMISSION_LEVEL_DESCRIPTIONS = {
  [PERMISSION_LEVELS.OWNER_ONLY]: '仅创建者可编辑',
  [PERMISSION_LEVELS.COLLABORATORS]: '协作者可编辑',
  [PERMISSION_LEVELS.PUBLIC]: '公开编辑',
};

export const COLLABORATOR_PERMISSION_DESCRIPTIONS = {
  [COLLABORATOR_PERMISSIONS.EDIT]: '可以编辑内容',
  [COLLABORATOR_PERMISSIONS.REVIEW]: '可以查看和评论',
  [COLLABORATOR_PERMISSIONS.ADMIN]: '可以管理协作者',
}; 