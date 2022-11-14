import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const BidParamsIntoDto = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    // coming from parameters
    const auctionId = +request.params.auctionId;

    return Object.assign(request.body, {
      userId: userId,
      auctionId: auctionId,
    });
  },
);
