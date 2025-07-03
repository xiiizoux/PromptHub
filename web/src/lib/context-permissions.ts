/**
 * Context Engineering 权限管理系统
 * 
 * 清晰定义用户对自有提示词vs他人公开提示词的不同权限级别
 * 确保数据归属和功能访问的合理性
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
 */
export function calculateContextPermissions(
  userId: string,
  promptOwnerId: string,
  promptIsPublic: boolean,
  isCollaborator: boolean = false
): ContextPermission {
  
  const isOwner = userId === promptOwnerId;
  
  if (isOwner) {
    // 自有提示词：完全权限
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
      canApplyPersonalRules: true
    };
  }
  
  if (isCollaborator) {
    // 协作者：部分管理权限 + 完整个人上下文权限
    return {
      canView: true,
      canUse: true,
      canEditPrompt: true,
      canEditRules: false, // 协作者不能修改CE规则
      canManageVersions: true,
      canViewAnalytics: false, // 不能查看完整分析
      canExportData: false,
      canCreateExperiments: false,
      canViewMyContext: true,
      canManageMyContext: true,
      canApplyPersonalRules: true
    };
  }
  
  if (promptIsPublic) {
    // 他人公开提示词：使用权限 + 个人上下文权限
    return {
      canView: true,
      canUse: true,
      canEditPrompt: false,
      canEditRules: false,
      canManageVersions: false,
      canViewAnalytics: false,
      canExportData: false,
      canCreateExperiments: false,
      canViewMyContext: true, // 可以查看自己的使用上下文
      canManageMyContext: true, // 可以管理自己的上下文数据
      canApplyPersonalRules: true // 可以应用个人规则
    };
  }
  
  // 私有提示词：无权限
  return {
    canView: false,
    canUse: false,
    canEditPrompt: false,
    canEditRules: false,
    canManageVersions: false,
    canViewAnalytics: false,
    canExportData: false,
    canCreateExperiments: false,
    canViewMyContext: false,
    canManageMyContext: false,
    canApplyPersonalRules: false
  };
}

/**
 * 获取用户对特定提示词的访问级别
 */
export function getContextAccessLevel(
  userId: string,
  promptId: string,
  promptOwnerId: string,
  promptIsPublic: boolean,
  isCollaborator: boolean = false
): ContextAccessLevel {
  
  let ownership: PromptOwnership;
  if (userId === promptOwnerId) {
    ownership = 'owned';
  } else if (isCollaborator) {
    ownership = 'shared';
  } else if (promptIsPublic) {
    ownership = 'public';
  } else {
    ownership = 'private';
  }
  
  return {
    ownership,
    userId,
    promptId,
    promptOwnerId,
    isCollaborator,
    permissions: calculateContextPermissions(userId, promptOwnerId, promptIsPublic, isCollaborator)
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
    
    // 我的上下文：对所有可用提示词开放
    showMyContext: permissions.canViewMyContext
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
    
    // 规则管理范围  
    rulesScope: ownership === 'owned' ? 'both' :
               permissions.canApplyPersonalRules ? 'personal' : 'none',
    
    // 实验范围
    experimentsScope: ownership === 'owned' ? 'prompt' :
                     permissions.canApplyPersonalRules ? 'personal' : 'none'
  };
}

/**
 * 权限检查中间件
 */
export function requirePermission(
  accessLevel: ContextAccessLevel,
  requiredPermission: keyof ContextPermission
): boolean {
  return accessLevel.permissions[requiredPermission];
}

/**
 * 权限描述生成器（用于UI提示）
 */
export function getPermissionDescription(accessLevel: ContextAccessLevel): {
  title: string;
  description: string;
  limitations: string[];
} {
  const { ownership } = accessLevel;
  
  switch (ownership) {
    case 'owned':
      return {
        title: '完全控制权限',
        description: '这是您创建的提示词，您拥有完全的管理和分析权限',
        limitations: []
      };
      
    case 'shared':
      return {
        title: '协作编辑权限', 
        description: '您被授权协作编辑此提示词，可进行内容修改',
        limitations: ['无法修改Context Engineering规则', '无法查看完整使用分析']
      };
      
    case 'public':
      return {
        title: '个人使用权限',
        description: '您可以使用此公开提示词，并管理自己的个人上下文',
        limitations: [
          '无法修改提示词内容或规则', 
          '只能查看自己的使用数据',
          '无法创建提示词级别的实验'
        ]
      };
      
    default:
      return {
        title: '无访问权限',
        description: '您无权访问此私有提示词',
        limitations: ['无任何操作权限']
      };
  }
}