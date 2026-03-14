import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { DepositDto } from './dto/deposit.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('webhooks')
@ApiTags('webhooks')
export class WebhooksController {

    constructor(private webHooksService: WebhooksService) {}

    @Post('deposit')
    @ApiOperation({ summary: 'Depositar'})
    deposit(@Body() data: DepositDto) {
        return this.webHooksService.deposit(data);
    }
}
