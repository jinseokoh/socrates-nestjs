import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CommentParamsIntoDto = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    // coming from parameters
    const articleId = +request.params.articleId;
    const parentId =
      request.params.commentId != null ? +request.params.commentId : null;

    return Object.assign(request.body, {
      userId: userId,
      articleId: articleId,
      parentId: parentId,
    });
  },
);
