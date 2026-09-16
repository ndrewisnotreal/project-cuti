import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ example: 'Dashboard' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nm_menu!: string;

  @ApiPropertyOptional({ example: '/dashboard' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  link_menu?: string;

  @ApiPropertyOptional({ example: 'pi pi-home' })
  @IsOptional()
  @IsString()
  icon_menu?: string;

  @ApiPropertyOptional({ enum: ['A', 'N'], example: 'A' })
  @IsOptional()
  @IsIn(['A', 'N'])
  status?: string;

  @ApiPropertyOptional({
    example: 'MN_MAIN',
    description: 'Default MN_MAIN; diabaikan jika as_header=true',
  })
  @IsOptional()
  @IsString()
  kd_parent?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Buat sebagai header section root (kd_parent null, level 1)',
  })
  @IsOptional()
  @IsBoolean()
  as_header?: boolean;
}
