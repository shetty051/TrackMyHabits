import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReminderCronService } from './reminder-cron.service';
import { DayRolloverCronService } from './day-rollover-cron.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ReminderCronService, DayRolloverCronService],
})
export class AppModule {}
