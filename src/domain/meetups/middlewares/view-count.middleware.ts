import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MeetupsService } from 'src/domain/meetups/meetups.service';

@Injectable()
export class ViewCountMiddleware implements NestMiddleware {
  constructor(private readonly meetupsService: MeetupsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const id = req.params['0'];
    const count = await this.meetupsService.increaseViewCount(id);
    // this.redisClient.emit('sse.auction_viewed', {
    //   auctionId: id,
    //   viewCount: count,
    // });
    next();
  }
}
