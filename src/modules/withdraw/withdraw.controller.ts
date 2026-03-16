import { Body, Controller, Post } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WithdrawDto } from './dto/withdraw.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('withdraw')
@ApiTags('withdraw')
@ApiBearerAuth('access-token')
export class WithdrawController {

    constructor(private withdrawService: WithdrawService) {}

    @Post()
    @ApiOperation({summary: 'Realizar Saque'})
    withdraw(
        @CurrentUser() user,
        @Body() data: WithdrawDto
    ){
        return this.withdrawService.withdraw(user.userId, data);
    }
}
