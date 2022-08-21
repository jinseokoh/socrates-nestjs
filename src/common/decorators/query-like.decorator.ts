import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * refine 의 like query 에 대응하기 위한 decorator
 */
export const LikeQuery = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const queries = request.query;

    if (queries['username_like']) {
      return {
        key: 'username',
        val: queries['username_like'],
      };
    }

    if (queries['email_like']) {
      return {
        key: 'email',
        val: queries['email_like'],
      };
    }

    return null;
  },
);
