import { RedisService } from './../../services/redis/redis.service';
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
  //! Map
  protected cacheTags = new Map();

  //! 캐쉬 여부 결정 override
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const requestUrl = httpAdapter.getRequestUrl(request);

    //? cache 안하는 paths 처리
    const excludePaths = [
      '/v1/version',
      '/v1/counts',
      '/v1/users/mine',
      // '/v1/users/bust',
    ];
    if (isGetRequest && excludePaths.includes(requestUrl)) {
      return undefined;
    }

    //? redis cache client 접근
    const cacheClient = this.cacheManager.store.getClient();

    //! POST, PUT, PATCH, DELETE 처리
    if (!isGetRequest) {
      setTimeout(async () => {
        for (const values of this.cacheTags.values()) {
          for (const value of values) {
            await this.cacheManager.del(value);
          }
        }
      }, 0);
      return undefined;
    }

    //! GET 처리
    const key = requestUrl.split('?')[0];
    if (
      this.cacheTags.has(key) &&
      !this.cacheTags.get(key).includes(requestUrl)
    ) {
      this.cacheTags.set(key, [...this.cacheTags.get(key), requestUrl]);
      return requestUrl;
    }
    this.cacheTags.set(key, [requestUrl]);
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


/v1/users
/v1/users/{userId}
/v1/users/{userId}/username
/v1/users/{userId}/password
/v1/users/{userId}/profile
/v1/users/{userId}/avatar
/v1/users/{userId}/upload-url
/v1/users/{userId}/purchase
/v1/users/bust
/v1/users/{userId}/categories
/v1/users/{userId}/categories/{slug}
/v1/users/{userId}/connections-reported/{connectionId}
/v1/users/{userId}/connections/{connectionId}
/v1/users/{senderId}/friendships/{recipientId}
/v1/users/{userId}/impressions - users:userId
/v1/users/{userId}/languages - users:userId
/v1/users/{userId}/meetups-liked/{meetupId} - users:userId, meetups
/v1/users/{userId}/meetups-reported/{meetupId} - users:userId, meetups
/v1/users/{askingUserId}/joins/{askedUserId}/meetups/{meetupId}
/v1/users/{senderId}/pleas/{recipientId}
/v1/users/{key}/otp
/v1/users/{key}/change
/v1/users/{key}/otp/{otp}
/v1/users/{userId}/users-hated/{otherId} - users:userId
/v1/users/{userId}/reports/{otherId} - users:userId
/v1/users/{userId}/reports/{otherId} - users:userId
/v1/users/{userId}/flags - users:userId







function checkPattern(url) {
  const patterns = [
    /^\/v1\/users\/(\d+)$/,
    /^\/v1\/users\/(\d+)\/[a-z\-]+$/,
    /^\/v1\/users\/(\d+)\/categories\/([a-zA-Z]+)$/,
    /^\/v1\/users\/(\d+)\/connections-reported\/(\d+)$/
  ];
    for (let i = 0; i < patterns.length; i++) {
      const match = url.match(patterns[i]);
      if (match) {
        const userId = match[1];
        return 
      }
    }
    console.log('The URL does not match any of the predefined patterns.');
}

function extractCacheTags(requestUrl: string): string[] {

  const baseUrl = requestUrl.split('?')[0];
  const keys = baseUrl.split('/');

  if (keys[2] === 'users') {
    const match = baseUrl.match(/^\/v1\/users\/(\d+)$/);
    if (match) {

    }
      return []
    }
    if (baseUrl.includes('connections') || baseUrl.includes('reactions')) {
      return ['connections'];
    }
    if (baseUrl.includes('connections')) {
      return ['connections'];
    }
    if (baseUrl.includes('joins')) {
      return ['users', 'meetups'];
    }

    return [`users:${keys[3]}`];
  } else {
    //? 다른 경우는 간단히 2번째 key (ex. entity 명)
    return [keys[2]];
  }

  return [];
}

// function setCacheWithTags(key, value, tags) {
//   client.set(key, value, (err) => {
//     if (err) throw err;
//     tags.forEach((tag) => {
//       client.sadd(`tag:${tag}`, key, (err) => {
//         if (err) throw err;
//       });
//     });
//   });
// }
