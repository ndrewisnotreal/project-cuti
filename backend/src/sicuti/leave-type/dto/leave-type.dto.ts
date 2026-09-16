import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertLeaveTypeDto {
  @ApiPropertyOptional({ example: 'LT001' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  kd_leave_type?: string;

  @ApiProperty({ example: 'CT' })
  @IsString()
  @MaxLength(10)
  code!: string;

  @ApiProperty({ example: 'Cuti Tahunan' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nm_leave_type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  uses_quota?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requires_document?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class DeleteLeaveTypeDto {
  @ApiProperty({ example: 'LT001' })
  @IsString()
  kd_leave_type!: string;
}
