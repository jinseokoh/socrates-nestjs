// src/core/httpcache.interceptor.ts
import { CACHE_KEY_METADATA, CacheInterceptor } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { Observable } from 'rxjs';

// ref) https://dev.to/secmohammed/nestjs-caching-globally-neatly-1e17
@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected cachedRoutes = new Map();

  //! 캐쉬 여부 결정 override
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const excludePaths = ['/v1/users/mine'];
    if (
      isGetRequest &&
      excludePaths.includes(httpAdapter.getRequestUrl(request))
    ) {
      return undefined;
    }

    if (!isGetRequest) {
      setTimeout(async () => {
        for (const values of this.cachedRoutes.values()) {
          for (const value of values) {
            await this.cacheManager.del(value);
          }
        }
      }, 0);
      return undefined;
    }

    // to always get the base url of the incoming get request url.
    const key = httpAdapter.getRequestUrl(request).split('?')[0];
    if (
      this.cachedRoutes.has(key) &&
      !this.cachedRoutes.get(key).includes(httpAdapter.getRequestUrl(request))
    ) {
      this.cachedRoutes.set(key, [
        ...this.cachedRoutes.get(key),
        httpAdapter.getRequestUrl(request),
      ]);
      return httpAdapter.getRequestUrl(request);
    }
    this.cachedRoutes.set(key, [httpAdapter.getRequestUrl(request)]);
    return httpAdapter.getRequestUrl(request);
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
