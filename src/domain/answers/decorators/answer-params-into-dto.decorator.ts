import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AnswerParamsIntoDto = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    // coming from parameters
    const articleId = +request.params.articleId;
    const parentId =
      request.params.answerId != null ? +request.params.answerId : null;

    return Object.assign(request.body, {
      userId: userId,
      articleId: articleId,
      parentId: parentId,
    });
  },
);
