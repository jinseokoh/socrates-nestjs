import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * refine 의 like query 에 대응하기 위한 decorator
 */
export const SortQuery = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const queries = request.query;

    if (queries['sortBy']) {
      const [key, order] = queries['sortBy'].split(':');
      return {
        key: key,
        val: order,
      };
    }

    return null;
  },
);
