import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAllMenuItemDto {
  @IsString()
  kd_menu!: string;

  @IsOptional()
  @IsString()
  nm_menu?: string;

  @IsOptional()
  @IsString()
  link_menu?: string | null;

  @IsOptional()
  @IsString()
  icon_menu?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  kd_parent?: string | null;

  @IsOptional()
  @IsNumber()
  depth?: number;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsNumber()
  urut?: number;

  @IsOptional()
  @IsNumber()
  urut_global?: number;
}

/** Contoh: Buffer.from(JSON.stringify([{kd_menu:'MN0001',urut:1}])).toString('base64') */
const MENU_REORDER_B64_EXAMPLE = 'W3sia2RfbWVudSI6Ik1OMDAwMSIsInVydXQiOjF9XQ==';

export class UpdateAllMenuDto {
  @ApiProperty({
    description:
      'Base64 JSON array item reorder, mis. [{"kd_menu":"MN0001","urut":1}]',
    example: MENU_REORDER_B64_EXAMPLE,
  })
  @IsString()
  menu!: string;
}

export class DeleteMenuDto {
  @ApiProperty({ example: 'MN0001' })
  @IsString()
  kd_menu!: string;
}
