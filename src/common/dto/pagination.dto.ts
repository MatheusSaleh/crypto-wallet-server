import { IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer"


export class PaginationDto {

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page = 1

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit = 10
}