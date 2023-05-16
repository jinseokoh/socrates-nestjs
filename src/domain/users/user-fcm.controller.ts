import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UsersService } from 'src/domain/users/users.service';
import { FcmTokenDto } from 'src/domain/users/dto/fcm-token.dto';
import { FcmService } from 'src/services/fcm/fcm.service';
import { FcmTopicDto } from 'src/domain/users/dto/fcm-topic.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserFcmController {
  constructor(
    private readonly fcmService: FcmService,
    private readonly usersService: UsersService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? topic 으로 FCM 발송
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'topic 으로 FCM 발송' })
  @Post('fcm')
  async sendToTopic(@Body() dto: FcmTopicDto): Promise<any> {
    await this.fcmService.sendToTopic(dto.topic, {
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
    });
  }

  //?-------------------------------------------------------------------------//
  //? token 으로 FCM 발송
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'token 으로 FCM 발송' })
  @Post(':userId/fcm')
  async sendToTokens(
    @Param('userId') userId: number,
    @Body() dto: FcmTokenDto,
  ): Promise<any> {
    const user = await this.usersService.findById(userId, ['profile']);
    await this.fcmService.sendToToken(user.pushToken, {
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
    });
  }
}
