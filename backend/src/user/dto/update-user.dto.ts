import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000002',
    description: 'UID user yang diupdate',
  })
  @IsString()
  uid_user_system!: string;

  @ApiPropertyOptional({ example: 'jdoe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({ example: 'jdoe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  nama?: string;

  @ApiPropertyOptional({ example: 'R0002' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  kd_role?: string;

  /** Kosong / tidak dikirim = password tidak diubah. */
  @ApiPropertyOptional({
    example: '',
    description: 'Kosong / tidak dikirim = password tidak diubah',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;

  @ApiPropertyOptional({
    enum: ['A', 'N'],
    example: 'A',
    description: 'A=aktif, N=nonaktif',
  })
  @IsOptional()
  @IsIn(['A', 'N'])
  status?: string;
}

export class DeleteUserDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000002',
  })
  @IsString()
  uid_user_system!: string;
}
