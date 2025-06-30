import React from 'react';
import { 
  SIMPLE_PERMISSIONS, 
  SIMPLE_PERMISSION_DETAILS, 
  SimplePermissionType 
} from '@/lib/permissions';

interface PermissionPreviewProps {
  selectedPermission: SimplePermissionType;
  collaborators?: string[];
  className?: string;
}

export const PermissionPreview: React.FC<PermissionPreviewProps> = ({
  selectedPermission,
  collaborators = [],
  className = '',
}) => {
  const details = SIMPLE_PERMISSION_DETAILS[selectedPermission];
  
  if (!details) {
    return null;
  }

  return (
    <div className={`bg-dark-bg-secondary/50 border border-neon-cyan/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{details.icon}</span>
        <div>
          <h4 className="text-sm font-medium text-gray-300">{details.title}</h4>
          <p className="text-xs text-gray-400">{details.description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">谁可以查看：</span>
          <div className="flex gap-1">
            {details.viewUsers.map((user, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
              >
                {user}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">谁可以编辑：</span>
          <div className="flex gap-1 flex-wrap">
            {selectedPermission === SIMPLE_PERMISSIONS.TEAM_EDIT ? (
              <>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                  创建者
                </span>
                {collaborators.length > 0 ? (
                  collaborators.map((collaborator, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                    >
                      {collaborator}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                    未设置协作者
                  </span>
                )}
              </>
            ) : (
              details.editUsers.map((user, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                >
                  {user}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionPreview;