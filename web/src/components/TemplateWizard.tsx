import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, LightBulbIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FillableField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  placeholder: string;
  options?: string[];
  required: boolean;
  hint: string;
  example?: string;
}

interface TemplateWizardProps {
  template: {
    id: string;
    name: string;
    description: string;
    framework: string;
    fields: FillableField[];
  };
  onComplete: (filledPrompt: string) => void;
  onCancel: () => void;
}

export const TemplateWizard: React.FC<TemplateWizardProps> = ({
  template,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentField = template.fields[currentStep];
  const isLastStep = currentStep === template.fields.length - 1;
  const canProceed = currentField ? 
    (!currentField.required || values[currentField.key]?.trim()) : false;

  const handleNext = () => {
    if (canProceed) {
      if (isLastStep) {
        const filledPrompt = fillTemplate(template.framework, values);
        onComplete(filledPrompt);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // 清除错误
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const fillTemplate = (framework: string, values: Record<string, string>): string => {
    let result = framework;
    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / template.fields.length) * 100;
  };

  if (!currentField) {
    return null;
  }

  return (
    <div className="template-wizard max-w-2xl mx-auto">
      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            步骤 {currentStep + 1} / {template.fields.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(getProgressPercentage())}% 完成
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-neon-cyan h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* 模板信息 */}
      <div className="glass rounded-2xl p-6 mb-6 border border-neon-cyan/20">
        <h2 className="text-xl font-semibold text-white mb-2">{template.name}</h2>
        <p className="text-gray-300">{template.description}</p>
      </div>

      {/* 当前字段 */}
      <div className="glass rounded-2xl p-6 mb-6 border border-neon-purple/20">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-neon-purple rounded-full flex items-center justify-center mr-3 mt-1">
            <span className="text-white text-sm font-semibold">{currentStep + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              {currentField.label}
              {currentField.required && <span className="text-neon-red ml-1">*</span>}
            </h3>
            
            {/* 字段提示 */}
            {currentField.hint && (
              <div className="flex items-start p-3 bg-blue-500/10 rounded-lg mb-4">
                <LightBulbIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-300">{currentField.hint}</p>
              </div>
            )}

            {/* 输入字段 */}
            {currentField.type === 'text' && (
              <input
                type="text"
                value={values[currentField.key] || ''}
                onChange={(e) => handleFieldChange(currentField.key, e.target.value)}
                placeholder={currentField.placeholder}
                className="input-primary w-full"
                autoFocus
              />
            )}

            {currentField.type === 'textarea' && (
              <textarea
                value={values[currentField.key] || ''}
                onChange={(e) => handleFieldChange(currentField.key, e.target.value)}
                placeholder={currentField.placeholder}
                rows={4}
                className="input-primary w-full"
                autoFocus
              />
            )}

            {currentField.type === 'select' && currentField.options && (
              <select
                value={values[currentField.key] || ''}
                onChange={(e) => handleFieldChange(currentField.key, e.target.value)}
                className="input-primary w-full"
                autoFocus
              >
                <option value="">{currentField.placeholder}</option>
                {currentField.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}

            {/* 示例 */}
            {currentField.example && (
              <div className="mt-3 p-3 bg-gray-500/10 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">示例：</p>
                <p className="text-sm text-gray-300 italic">{currentField.example}</p>
              </div>
            )}

            {/* 错误信息 */}
            {errors[currentField.key] && (
              <div className="flex items-center mt-2 text-neon-red">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{errors[currentField.key]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 预览区域 */}
      {Object.keys(values).length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6 border border-neon-green/20">
          <h4 className="text-lg font-semibold text-white mb-3">实时预览</h4>
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {fillTemplate(template.framework, values)}
            </pre>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <button
          onClick={currentStep === 0 ? onCancel : handleBack}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          {currentStep === 0 ? '取消' : '上一步'}
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center
            ${canProceed 
              ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-neon hover:shadow-neon-lg' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLastStep ? '完成创建' : '下一步'}
          <ChevronRightIcon className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
}; 