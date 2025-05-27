/**
 * 错误码枚举
 */
export enum ErrorCode {
  InvalidParams = 1,
  MethodNotFound = 2,
  ResourceNotFound = 3,
  InternalError = 4,
  AuthenticationError = 5
}

/**
 * 自定义错误类
 */
export class PromptServerError extends Error {
  code: number;
  
  constructor(message: string, code: ErrorCode) {
    super(message);
    this.code = code;
    this.name = 'PromptServerError';
  }
}
