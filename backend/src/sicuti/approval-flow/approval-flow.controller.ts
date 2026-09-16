import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { AssignFlowUsersDto, UpsertFlowDto } from './dto/approval-flow.dto';
import { ApprovalFlowService } from './approval-flow.service';

@ApiTags('sicuti/approval-flow')
@ApiProtected()
@Controller('sicuti/approval-flow')
export class ApprovalFlowController {
  constructor(private readonly svc: ApprovalFlowService) {}

  @Get()
  @ApiOperation({ summary: 'List alur approval' })
  @ApiOkResponse({ description: 'Daftar alur' })
  @ApiStandardErrorResponses()
  async findAll() {
    return ok(await this.svc.findAll());
  }

  @Post()
  @ApiOperation({ summary: 'Tambah / update alur approval' })
  @ApiOkResponse({ description: 'Alur disimpan' })
  @ApiStandardErrorResponses()
  async upsert(@Body() dto: UpsertFlowDto) {
    return ok(await this.svc.upsert(dto));
  }

  @Put('users')
  @ApiOperation({ summary: 'Set user pada alur tertentu' })
  @ApiOkResponse({ description: 'User diassign' })
  @ApiStandardErrorResponses()
  async assignUsers(@Body() dto: AssignFlowUsersDto) {
    await this.svc.assignUsers(dto);
    return ok({ id_flow: dto.id_flow });
  }
}
