import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMenuDto {
  @ApiProperty({ example: 'MN0001' })
  @IsString()
  kd_menu!: string;

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
}
