import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { DeleteLeaveTypeDto, UpsertLeaveTypeDto } from './dto/leave-type.dto';
import { LeaveTypeService } from './leave-type.service';

@ApiTags('sicuti/leave-type')
@ApiProtected()
@Controller('sicuti/leave-type')
export class LeaveTypeController {
  constructor(private readonly svc: LeaveTypeService) {}

  @Get()
  @ApiOperation({ summary: 'List jenis cuti' })
  @ApiQuery({ name: 'all', required: false })
  @ApiOkResponse({ description: 'Daftar jenis cuti' })
  @ApiStandardErrorResponses()
  async findAll(@Query('all') all?: string) {
    return ok(await this.svc.findAll(all !== 'true'));
  }

  @Post()
  @ApiOperation({ summary: 'Tambah / update jenis cuti' })
  @ApiOkResponse({ description: 'Jenis cuti disimpan' })
  @ApiStandardErrorResponses()
  async upsert(@Body() dto: UpsertLeaveTypeDto) {
    return ok(await this.svc.upsert(dto));
  }

  @Delete()
  @ApiOperation({ summary: 'Hapus jenis cuti (soft-delete)' })
  @ApiOkResponse({ description: 'Jenis cuti dihapus' })
  @ApiStandardErrorResponses()
  async remove(@Body() dto: DeleteLeaveTypeDto) {
    await this.svc.remove(dto);
    return ok({ kd_leave_type: dto.kd_leave_type });
  }
}
