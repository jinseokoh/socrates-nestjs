import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NextFunction, Request, Response } from 'express';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ContentsService } from 'src/domain/contents/contents.service';

@Injectable()
export class ViewCountMiddleware implements NestMiddleware {
  constructor(
    private readonly contentsService: ContentsService,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const id = +req.params['0'];

    if (id > 0) {
      const count = await this.contentsService.increaseViewCount(+id);
      this.redisClient.emit('sse.content_viewed', {
        contentId: id,
        viewCount: count,
      });
    }
    next();
  }
}
