import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { JwtPayload } from '../../auth/jwt.strategy';
import {
  ApproveLeaveRequestDto, CancelLeaveRequestDto,
  CreateLeaveRequestDto, ListLeaveRequestDto,
} from './dto/leave-request.dto';
import { LeaveRequestService } from './leave-request.service';

interface AuthReq {
  user?: JwtPayload;
}

@ApiTags('sicuti/leave-request')
@ApiProtected()
@Controller('sicuti/leave-request')
export class LeaveRequestController {
  constructor(private readonly svc: LeaveRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List pengajuan cuti' })
  @ApiQuery({ name: 'uid_user_system', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'kd_dept', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: 'Daftar pengajuan' })
  @ApiStandardErrorResponses()
  async findAll(@Req() req: AuthReq, @Query() q: ListLeaveRequestDto) {
    const filter = { ...q };
    // Non-admin default to own requests
    if (!filter.uid_user_system && !['RS001', 'RS002', 'admin_sit', 'admin_sis'].includes(req.user?.role || '')) {
      filter.uid_user_system = req.user?.sub;
    }
    return ok(await this.svc.findAll(filter));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pengajuan' })
  @ApiOkResponse({ description: 'Detail pengajuan' })
  @ApiStandardErrorResponses()
  async findOne(@Param('id') id: string) {
    return ok(await this.svc.findOne(id));
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Riwayat approval' })
  @ApiOkResponse({ description: 'Riwayat approval' })
  @ApiStandardErrorResponses()
  async history(@Param('id') id: string) {
    return ok(await this.svc.getApprovalHistory(id));
  }

  @Post()
  @ApiOperation({ summary: 'Buat pengajuan cuti' })
  @ApiOkResponse({ description: 'Pengajuan dibuat' })
  @ApiStandardErrorResponses()
  async create(@Req() req: AuthReq, @Body() dto: CreateLeaveRequestDto) {
    const payload = {
      ...dto,
      uid_user_system: dto.uid_user_system || req.user?.sub || '',
    };
    return ok(await this.svc.create(payload as any));
  }

  @Post('approve')
  @ApiOperation({ summary: 'Approve / reject / return pengajuan' })
  @ApiOkResponse({ description: 'Aksi approval berhasil' })
  @ApiStandardErrorResponses()
  async approve(@Req() req: AuthReq, @Body() dto: ApproveLeaveRequestDto) {
    const payload = {
      ...dto,
      approver_id: dto.approver_id || req.user?.sub || '',
    };
    return ok(await this.svc.approve(payload));
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Batalkan pengajuan' })
  @ApiOkResponse({ description: 'Pengajuan dibatalkan' })
  @ApiStandardErrorResponses()
  async cancel(@Req() req: AuthReq, @Body() dto: CancelLeaveRequestDto) {
    const payload = {
      ...dto,
      uid_user_system: dto.uid_user_system || req.user?.sub || '',
    };
    return ok(await this.svc.cancel(payload));
  }
}
