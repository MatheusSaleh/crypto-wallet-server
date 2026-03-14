import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class WithdrawDto {

    @IsString()
    @ApiProperty()
    token: string;

    @IsNumber()
    @ApiProperty()
    amount: number;
}