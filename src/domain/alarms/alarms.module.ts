import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { AlarmsController } from 'src/domain/alarms/alarms.controller';
import { AlarmsService } from 'src/domain/alarms/alarms.service';
import { AlarmSchema } from 'src/domain/alarms/entities/alarm.schema';
import { S3Module } from 'src/services/aws/s3.module';
// import { AlarmsGateway } from 'src/domain/alarms/alarms.gateway';
// removed alarm gateway as we exploit SSE instead of websocket

//! With correct module configuration, the local dynamoDB is populated automatically
//! as soon as executing any creation method.
@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: 'Alarm',
        schema: AlarmSchema,
        options: {
          tableName: 'alarm', // e.g. local_alarm_table
        },
      },
    ]),
    S3Module,
  ],
  providers: [AlarmsService],
  controllers: [AlarmsController],
  exports: [AlarmsService],
})
export class AlarmsModule {}
