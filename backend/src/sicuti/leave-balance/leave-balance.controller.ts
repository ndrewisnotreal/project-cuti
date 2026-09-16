import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { JwtPayload } from '../../auth/jwt.strategy';
import { UpsertBalanceDto } from './dto/leave-balance.dto';
import { LeaveBalanceService } from './leave-balance.service';

interface AuthReq {
  user?: JwtPayload;
}

@ApiTags('sicuti/leave-balance')
@ApiProtected()
@Controller('sicuti/leave-balance')
export class LeaveBalanceController {
  constructor(private readonly svc: LeaveBalanceService) {}

  @Get('me')
  @ApiOperation({ summary: 'Saldo cuti user sendiri' })
  @ApiQuery({ name: 'uid', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiOkResponse({ description: 'Saldo cuti user' })
  @ApiStandardErrorResponses()
  async getForUser(@Req() req: AuthReq, @Query('uid') uid?: string, @Query('year') year?: string) {
    const targetUid = uid || req.user?.sub || '';
    return ok(await this.svc.getForUser(targetUid, year ? Number(year) : undefined));
  }

  @Get()
  @ApiOperation({ summary: 'Semua saldo cuti (admin)' })
  @ApiQuery({ name: 'year', required: false })
  @ApiOkResponse({ description: 'Semua saldo' })
  @ApiStandardErrorResponses()
  async getAll(@Query('year') year?: string) {
    return ok(await this.svc.getAll(year ? Number(year) : undefined));
  }

  @Post()
  @ApiOperation({ summary: 'Tambah / update saldo cuti' })
  @ApiOkResponse({ description: 'Saldo disimpan' })
  @ApiStandardErrorResponses()
  async upsert(@Body() dto: UpsertBalanceDto) {
    return ok(await this.svc.upsert(dto));
  }
}
