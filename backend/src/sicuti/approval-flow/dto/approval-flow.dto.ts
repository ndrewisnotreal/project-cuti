import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertFlowDto {
  @ApiPropertyOptional({ example: 'AF002' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_flow?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  level!: number;

  @ApiProperty({ example: 'Staff IT Verifikasi' })
  @IsString()
  @MaxLength(200)
  nm_flow!: string;

  @ApiPropertyOptional({ example: 'staff_it' })
  @IsOptional()
  @IsString()
  assigned_role?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @ApiPropertyOptional({ description: 'List uid_user_system' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  users?: string[];
}

export class AssignFlowUsersDto {
  @ApiProperty({ example: 'AF002' })
  @IsString()
  id_flow!: string;

  @ApiProperty({ description: 'List uid_user_system' })
  @IsArray()
  @IsString({ each: true })
  users!: string[];
}
