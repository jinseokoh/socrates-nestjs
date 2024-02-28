import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { AlertsController } from 'src/domain/alerts/alerts.controller';
import { AlertsService } from 'src/domain/alerts/alerts.service';
import { AlertSchema } from 'src/domain/alerts/entities/alert.schema';
import { S3Module } from 'src/services/aws/s3.module';
// import { AlertsGateway } from 'src/domain/alerts/alerts.gateway';
// removed alert gateway as we exploit SSE instead of websocket
@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: 'Alert',
        schema: AlertSchema,
        options: {
          tableName: 'alert', // e.g. local_alert_table
        },
      },
    ]),
    S3Module,
  ],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
