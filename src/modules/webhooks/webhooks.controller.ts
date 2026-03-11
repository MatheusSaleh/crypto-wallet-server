import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { DepositDto } from './dto/deposit.dto';

@Controller('webhooks')
export class WebhooksController {

    constructor(private webHooksService: WebhooksService) {}

    @Post('deposit')
    deposit(@Body() data: DepositDto) {
        return this.webHooksService.deposit(data);
    }
}
