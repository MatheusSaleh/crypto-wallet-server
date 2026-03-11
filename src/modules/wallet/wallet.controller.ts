import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto';

@Controller('wallet')
export class WalletController {


    constructor(private walletService: WalletService) {}

    @Get('balance')
    public getBalance(@CurrentUser() user: any): Promise<WalletBalanceResponseDto[]> {
        return this.walletService.getBalance(user.userId);
    }
}
