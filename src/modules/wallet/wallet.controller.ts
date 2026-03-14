import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('wallet')
@ApiTags('wallet')
export class WalletController {


    constructor(private walletService: WalletService) {}

    @Get('balance')
    @ApiOperation({summary: 'Visualizar Saldo'})
    public getBalance(@CurrentUser() user: any): Promise<WalletBalanceResponseDto[]> {
        return this.walletService.getBalance(user.userId);
    }
}
