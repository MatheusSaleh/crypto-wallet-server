import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class DepositDto {

    @IsString()
    @ApiProperty()
    userId: string;

    @IsString()
    @ApiProperty()
    token: string;

    @IsString()
    @ApiProperty()
    amount: string;

    @IsString()
    @ApiProperty()
    idempotencyKey: string;
    
}