import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/RegisterDto';
import { LoginDto } from './dto/LoginDto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Public()
    @Post('register')
    register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    @Public()
    @Post('login')
    login(@Body() data: LoginDto) {
        return this.authService.login(data);
    }

    @Public()
    @Post('refresh')
    refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }
}
