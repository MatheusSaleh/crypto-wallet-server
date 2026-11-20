import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { MarketService } from './market.service';

@Controller('market')
@ApiTags('market')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Public()
  @Get('ticker')
  @ApiOperation({ summary: 'Cotações de moedas e criptomoedas em BRL (cache de 60s)' })
  getTicker() {
    return this.marketService.getTicker();
  }
}
