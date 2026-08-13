import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DayRolloverCronService } from './day-rollover-cron.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dayRolloverCronService: DayRolloverCronService,
  ) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  @Post('api/cron/rollover')
  async triggerRollover() {
    const result = await this.dayRolloverCronService.runDayRolloverProcess();
    return {
      success: true,
      message: 'Day rollover and freeze consumption process executed successfully.',
      ...result,
    };
  }
}
