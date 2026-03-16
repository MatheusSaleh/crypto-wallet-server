import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { DepositDto } from './dto/deposit.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('webhooks')
@ApiTags('webhooks')
@ApiBearerAuth('access-token')
export class WebhooksController {

    constructor(private webHooksService: WebhooksService) {}

    @Post('deposit')
    @ApiOperation({ summary: 'Depositar'})
    deposit(@Body() data: DepositDto) {
        return this.webHooksService.deposit(data);
    }
}
