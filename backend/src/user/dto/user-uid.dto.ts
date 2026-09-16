import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UserUidDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000002',
    description: 'UID user target',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  uid_user_system!: string;
}
