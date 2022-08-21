import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentRefreshToken = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.user.refreshToken;
  },
);
