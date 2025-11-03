/**
 * Context Engineering 权限管理系统
 * 
 * 上下文功能已完全私有化：只有提示词创建者可以访问和管理上下文功能
 * 移除了协作者和公开用户的上下文访问权限，简化权限模型并提高数据安全性
 */

export interface ContextPermission {
  // 基础权限
  canView: boolean;
  canUse: boolean;
  
  // 管理权限 
  canEditPrompt: boolean;
  canEditRules: boolean;
  canManageVersions: boolean;
  
  // 分析权限
  canViewAnalytics: boolean;
  canExportData: boolean;
  canCreateExperiments: boolean;
  
  // 上下文权限
  canViewMyContext: boolean;
  canManageMyContext: boolean;
  canApplyPersonalRules: boolean;
}

export type PromptOwnership = 'owned' | 'public' | 'shared' | 'private';

export interface ContextAccessLevel {
  ownership: PromptOwnership;
  userId: string;
  promptId: string;
  promptOwnerId: string;
  isCollaborator?: boolean;
  permissions: ContextPermission;
}

/**
 * 核心权限计算函数
 * 
 * 上下文功能私有化：只有创建者可以访问上下文功能
 * isCollaborator 和 promptIsPublic 参数仅用于非上下文权限的判断（如提示词查看、编辑等）
 */
export function calculateContextPermissions(
  userId: string,
  promptOwnerId: string,
  promptIsPublic: boolean,
  isCollaborator: boolean = false,
): ContextPermission {
  
  const isOwner = userId === promptOwnerId;
  
  if (isOwner) {
    // 自有提示词：完全权限（包括上下文功能）
    return {
      canView: true,
      canUse: true,
      canEditPrompt: true,
      canEditRules: true,
      canManageVersions: true,
      canViewAnalytics: true,
      canExportData: true,
      canCreateExperiments: true,
      canViewMyContext: true,
      canManageMyContext: true,
      canApplyPersonalRules: true,
    };
  }
  
  // 非创建者：上下文功能完全不可访问
  // 其他权限（查看、使用提示词本身）仍根据 isCollaborator 和 promptIsPublic 判断
  const basePermissions: ContextPermission = {
    canView: promptIsPublic || isCollaborator,
    canUse: promptIsPublic || isCollaborator,
    canEditPrompt: isCollaborator,
    canEditRules: false,
    canManageVersions: isCollaborator,
    canViewAnalytics: false,
    canExportData: false,
    canCreateExperiments: false,
    // 上下文权限：完全私有化，仅创建者可访问，不受 isCollaborator 和 promptIsPublic 影响
    canViewMyContext: false,
    canManageMyContext: false,
    canApplyPersonalRules: false,
  };
  
  return basePermissions;
}

/**
 * 获取用户对特定提示词的访问级别
 * 
 * 上下文功能私有化：上下文相关功能仅对创建者开放
 * ownership 字段仍保留完整定义以兼容其他功能（提示词本身的查看、编辑等），
 * 但上下文权限计算已完全独立，不受 'shared' 和 'public' 影响
 */
export function getContextAccessLevel(
  userId: string,
  promptId: string,
  promptOwnerId: string,
  promptIsPublic: boolean,
  isCollaborator: boolean = false,
): ContextAccessLevel {
  
  const isOwner = userId === promptOwnerId;
  
  // ownership 字段用于其他功能（提示词查看、编辑等），不影响上下文权限
  let ownership: PromptOwnership;
  if (isOwner) {
    ownership = 'owned';
  } else if (isCollaborator) {
    ownership = 'shared'; // 用于提示词编辑权限，不影响上下文权限
  } else if (promptIsPublic) {
    ownership = 'public'; // 用于提示词查看权限，不影响上下文权限
  } else {
    ownership = 'private';
  }
  
  return {
    ownership,
    userId,
    promptId,
    promptOwnerId,
    isCollaborator,
    permissions: calculateContextPermissions(userId, promptOwnerId, promptIsPublic, isCollaborator),
  };
}

/**
 * 数据归属规则
 */
export interface DataOwnership {
  // 用户在任何提示词上产生的交互数据都归用户所有
  userInteractionData: 'user_owned';
  
  // 用户的个人规则和偏好完全归用户所有
  personalRules: 'user_owned';
  personalPreferences: 'user_owned';
  
  // 提示词本体和内置规则归作者所有
  promptContent: 'author_owned';
  promptRules: 'author_owned';
  
  // 使用统计的分级归属
  usageStatistics: {
    personalStats: 'user_owned';      // 个人使用统计
    aggregatedStats: 'author_owned';  // 匿名化聚合统计
  };
}

/**
 * 功能可见性控制
 */
export function getFeatureVisibility(accessLevel: ContextAccessLevel): {
  showPersonalAnalytics: boolean;
  showPromptManagement: boolean;
  showAdvancedTools: boolean;
  showExperiments: boolean;
  showMyContext: boolean;
} {
  const { permissions, ownership } = accessLevel;
  
  return {
    // 个人分析：在任何有权使用的提示词上都可以查看自己的使用分析
    showPersonalAnalytics: permissions.canUse,
    
    // 提示词管理：仅限自有或协作提示词
    showPromptManagement: permissions.canEditPrompt,
    
    // 高级工具：区分自有工具 vs 个人使用工具
    showAdvancedTools: permissions.canUse, // 个人规则工具对所有可用提示词开放
    
    // 实验功能：仅限自有提示词
    showExperiments: permissions.canCreateExperiments,
    
    // 我的上下文：仅创建者可访问（已私有化）
    showMyContext: permissions.canViewMyContext,
  };
}

/**
 * 数据范围限制
 */
export function getDataScope(accessLevel: ContextAccessLevel): {
  analyticsScope: 'personal' | 'full' | 'none';
  rulesScope: 'personal' | 'prompt' | 'both' | 'none';
  experimentsScope: 'personal' | 'prompt' | 'none';
} {
  const { permissions, ownership } = accessLevel;
  
  return {
    // 分析数据范围
    analyticsScope: ownership === 'owned' ? 'full' : 
                   permissions.canUse ? 'personal' : 'none',
    
    // 规则管理范围（上下文已私有化，只有创建者可访问）
    rulesScope: ownership === 'owned' ? 'both' : 'none',
    
    // 实验范围（上下文已私有化，只有创建者可访问）
    experimentsScope: ownership === 'owned' ? 'prompt' : 'none',
  };
}

/**
 * 权限检查中间件
 */
export function requirePermission(
  accessLevel: ContextAccessLevel,
  requiredPermission: keyof ContextPermission,
): boolean {
  return accessLevel.permissions[requiredPermission];
}

/**
 * 权限描述生成器（用于UI提示）
 * 
 * 上下文功能私有化：只显示创建者权限，非创建者无法访问上下文功能
 */
export function getPermissionDescription(accessLevel: ContextAccessLevel): {
  title: string;
  description: string;
  limitations: string[];
} {
  const { ownership, permissions } = accessLevel;
  
  // 上下文功能：只有创建者可以访问
  if (permissions.canViewMyContext) {
    return {
      title: '完全控制权限',
      description: '这是您创建的提示词，您拥有完全的管理和分析权限，包括上下文功能',
      limitations: [],
    };
  }
  
  // 非创建者：上下文功能完全不可访问
  // 根据其他权限显示不同的描述（提示词编辑、查看等）
  switch (ownership) {
    case 'shared':
      return {
        title: '协作编辑权限', 
        description: '您被授权协作编辑此提示词，可进行内容修改',
        limitations: [
          '无法访问上下文功能（仅创建者可访问）',
          '无法修改Context Engineering规则',
          '无法查看完整使用分析',
        ],
      };
      
    case 'public':
      return {
        title: '个人使用权限',
        description: '您可以使用此公开提示词，但无法访问上下文功能',
        limitations: [
          '无法访问上下文功能（仅创建者可访问）',
          '无法修改提示词内容或规则', 
          '无法创建提示词级别的实验',
        ],
      };
      
    default:
      return {
        title: '无访问权限',
        description: '您无权访问此私有提示词',
        limitations: ['无任何操作权限'],
      };
  }
}