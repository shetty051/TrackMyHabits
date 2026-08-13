import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReminderCronService } from './reminder-cron.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ReminderCronService],
})
export class AppModule {}
