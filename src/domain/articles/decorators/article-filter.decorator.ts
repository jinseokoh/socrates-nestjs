import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * refine 의 like query 에 대응하기 위한 decorator
 */
export const ArticleFilter = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const queries = request.query;
    const filter = {};

    if (queries['search_like']) {
      return {
        ...filter,
        search: queries['search_like'],
      };
    }

    if (queries['id_in']) {
      return {
        ...filter,
        filter: { id: `$in:${queries['id_in']}` },
      };
    }

    return { ...filter };
  },
);
