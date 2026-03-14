import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/RegisterDto';
import { LoginDto } from './dto/LoginDto';
import { Public } from './decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Cadastrar usuário'})
    public register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Fazer Login'})
    public login(@Body() data: LoginDto) {
        return this.authService.login(data);
    }

    @Public()
    @Post('refresh')
    @ApiOperation({ summary: 'Atualizar Token'})
    public refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }
}
