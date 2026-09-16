import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { JwtPayload } from '../../auth/jwt.strategy';
import { NotificationService } from './notification.service';

interface AuthReq {
  user?: JwtPayload;
}

@ApiTags('sicuti/notification')
@ApiProtected()
@Controller('sicuti/notification')
export class NotificationController {
  constructor(private readonly svc: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Notifikasi untuk user (3-branch: requester / approver / admin)' })
  @ApiQuery({ name: 'uid', required: false })
  @ApiOkResponse({ description: 'Daftar notifikasi' })
  @ApiStandardErrorResponses()
  async getForUser(@Req() req: AuthReq, @Query('uid') uid?: string) {
    const targetUid = uid || req.user?.sub || '';
    return ok(await this.svc.getForUser(targetUid));
  }
}
