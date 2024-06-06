// src/core/httpcache.interceptor.ts
import { CACHE_KEY_METADATA, CacheInterceptor } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
const TAG_KEY_PREFIX = 'meso:';

// ref) https://dev.to/secmohammed/nestjs-caching-globally-neatly-1e17
@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  _extractCacheTagsToRemove(uri: string): string[] {
    const baseUri = uri.split('?')[0];
    const entity = baseUri.split('/')[2];
    if (entity === 'users') {
      if (uri.includes('connection')) {
        //? reaction 추가했으면 connection 갱신해야지
        return [TAG_KEY_PREFIX + 'connections'];
      }
      if (uri.includes('meetup')) {
        if (uri.includes('join')) {
          //? meetup 신청자 리스트 갱신되면 meetup 바뀌어야지
          //? meetup 신청 수락하면 chat 갱신까지
          return [TAG_KEY_PREFIX + 'meetups', TAG_KEY_PREFIX + 'chats'];
        }
        return [TAG_KEY_PREFIX + 'meetups'];
      }
      return [];
    }
    return [TAG_KEY_PREFIX + entity];
  }

  async _saveCacheTags(uri: string) {
    const baseUri = uri.split('?')[0];
    const entity = baseUri.split('/')[2];
    const tag = TAG_KEY_PREFIX + entity;
    const redisClient = this.cacheManager.store.getClient();
    await redisClient.sadd(tag, uri);
  }

  async _invalidateCacheTags(tag: string) {
    const redisClient = this.cacheManager.store.getClient();
    const keys = await redisClient.smembers(tag);
    const pipeline = redisClient.pipeline();
    keys.forEach((key: string) => {
      pipeline.del(key);
    });

    pipeline.del(tag); // 태그 자체도 삭제
    await pipeline.exec();
  }

  //! 캐쉬 여부 결정 override
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const requestUrl = httpAdapter.getRequestUrl(request);

    // caching 제외 처리 #1
    const excludePaths = ['/v1/version', '/v1/counts'];
    if (isGetRequest && excludePaths.includes(requestUrl)) {
      return undefined;
    }
    // caching 제외 처리 #2; to simplify logic, exclude all users routes
    if (isGetRequest && requestUrl.startsWith('/v1/users')) {
      return undefined;
    }

    //! POST, PUT, PATCH, DELETE 처리
    if (!isGetRequest) {
      const cacheTags = this._extractCacheTagsToRemove(requestUrl);
      if (cacheTags.length > 0) {
        setTimeout(async () => {
          for (const tag of cacheTags) {
            await this._invalidateCacheTags(tag);
          }
        }, 0);
      }
      return undefined;
    }

    //! GET 처리
    setTimeout(async () => {
      await this._saveCacheTags(requestUrl);
    }, 0);
    return requestUrl;
  }

  //! 캐쉬 override
  // todo. remove this.
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    console.log('~~ caching interceptor ~~');

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';

    if (!isGetRequest) {
      const allKeys = this.reflector.getAllAndMerge(CACHE_KEY_METADATA, [
        context.getHandler(),
      ]);

      console.log('allKeys => ', allKeys);

      //? await this.cacheManager.reset(); 무조건 cacheStore 비우기
    }
    // 기존 캐싱 처리
    return super.intercept(context, next);
  }
}
