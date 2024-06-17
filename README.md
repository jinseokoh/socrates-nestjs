<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Preparation

### Firebase 콘솔

Firebase Admin SDK account key 는 Firebase 프로젝트 설정 페이지에서 생성후 다운로드 할 수 있다. 이 프로젝트와 연결된 Firebase 프로젝트의 이름은 MeetSocrates 이며, 해당 키파일은 fb-admin.account-key.json 이란 이름으로 이 프로젝트 root 에 위치한다. 이로서, 모든 Firebase Admin 의 기능을 수행할 수 있다.

- fb-admin.account-key.json 파일은 이 NestJS 프로젝트 뿐만아니라, 아래의 프로젝트에서도 사용한다. (FB admin 기능을 사용하므로)
  - Functions 카카오 사용자 인증을 위해 활성화 [관련프로젝트](https://github.com/jinseokoh/socrates-firebase-functions)
- [Firebase Console](https://console.firebase.google.com/project/meetsocrates-fd76c)
- Authentication 에서 Google, Apple 을 활성화

### Google Cloud 콘솔

생성된 Firebase 프로젝트는 Google Cloud 콘솔에서도 access 가 가능하며, Google Maps 와 같이 필요한 API 서비스의 추가설정이 필요하다. 앱 프로젝트이므로, 안드로이드와 iOS 각각 설정이 필요하며, 현재 활성화시킨 서비스는 아래와 같다.

- API > Maps SDK for Android
- API > Maps SDK for Android
- Google Maps Platform > Credentials [API키 발급](https://console.cloud.google.com/google/maps-apis/credentials)
  - 해당 키 사용은 application 에서.

## Installation

```bash
# install dependencies
$ npm install

# generate migration
$ npm run migration:generate -- {name}

# run migration
$ npm run migration:run
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## DynamoDB

expires

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## EC2 Commands to execute

```
pm2 kill
pm2 start dist/main.js
pm2 monit
```

## URLs

- API - [localhost:3001](http://localhost:3001/)
- API Documentation - [localhost:3001/docs](http://localhost:3001/docs)
- Admin Pannel - [localhost:3001/admin](http://localhost:3001/admin)

## License

Nest is [MIT licensed](LICENSE).

## Apple

Q) The Support URL provided in App Store Connect, https://mesoapp.kr, does not direct to a website with information users can use to ask questions and request support.

A) https://mesoapp.kr now has a popup action button on the bottom right corner for users to ask questions and request support.

Q) Why does your app require user's date of birth and gender information upon registration?

A) Since the main purpose of this service is to provide opportunities to meet users, we are using mobile phone authentication services in Korea for the following two main reasons. Name and gender information are included in the basic information required by the mobile phone authentication service in Korea. In addition, self-identification is not required to see the existing information, and it is necessary to post or write to participate in earnest.