import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @ApiPropertyOptional({ example: 'H016' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_holiday?: string;

  @ApiProperty({ example: '2026-12-26' })
  @IsDateString()
  holiday_date!: string;

  @ApiProperty({ example: 'Cuti Bersama Natal' })
  @IsString()
  @MaxLength(200)
  nm_holiday!: string;

  @ApiPropertyOptional({ example: 'collective', enum: ['national', 'collective'] })
  @IsOptional()
  @IsIn(['national', 'collective'])
  type?: string;
}

export class DeleteHolidayDto {
  @ApiProperty({ example: 'H016' })
  @IsString()
  id_holiday!: string;
}
