import { Body, Controller, Post } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('withdraw')
export class WithdrawController {

    constructor(private withdrawService: WithdrawService) {}

    @Post()
    withdraw(
        @CurrentUser() user,
        @Body() data: WithdrawDto
    ){
        return this.withdrawService.withdraw(user.userId, data);
    }
}
