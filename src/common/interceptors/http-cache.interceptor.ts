// src/core/httpcache.interceptor.ts
import { CACHE_KEY_METADATA, CacheInterceptor } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { Observable } from 'rxjs';

// ref) https://hwasurr.io/nestjs/caching/
@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  //! 캐쉬 여부 결정 override
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const excludePaths = ['/v1/users/mine'];
    if (
      !isGetRequest ||
      (isGetRequest &&
        excludePaths.includes(httpAdapter.getRequestUrl(request)))
    ) {
      return undefined;
    }
    return httpAdapter.getRequestUrl(request);
  }

  //! 캐쉬 override
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    console.log('~~ intercept ~~');

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const excludePaths = ['/v1/users'];
    const isStartsWithAuth = request.originalUrl.startsWith('/v1/users');

    if (!isGetRequest) {
      if (!isStartsWithAuth) {
        console.log('it starts with auth');
      }
      const allKeys = this.reflector.getAllAndMerge(CACHE_KEY_METADATA, [
        context.getHandler(),
      ]);

      console.log('allKeys => ', allKeys);

      const cacheKeys = allKeys.length > 0 ? allKeys : [request.originalUrl];

      console.log('cacheKeys => ', cacheKeys);

      // 캐시 무효화 처리
      return next.handle().pipe(
        tap(() => {
          this._clearCaches(cacheKeys);
        }),
      );

      //? await this.cacheManager.reset(); 무조건 cacheStore 비우기
    }
    // 기존 캐싱 처리
    return super.intercept(context, next);
  }

  /**
   * @param cacheKeys 삭제할 캐시 키 목록
   */
  private async _clearCaches(cacheKeys: string[]): Promise<void> {
    const client = await this.cacheManager.store.getClient();
    const _keys = await Promise.all(
      cacheKeys.map(async (cacheKey) => {
        return await client.keys(`*${cacheKey}*`);
      }),
    );
    await Promise.all(
      _keys.flat().map(async (key) => {
        await client.del(key);
      }),
    );
  }
}
