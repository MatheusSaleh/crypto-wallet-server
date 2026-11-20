import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  getMe(@CurrentUser() user) {
    return this.usersService.getMe(user.userId);
  }
}
