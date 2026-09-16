import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

import { DepartmentService } from './department/department.service';
import { DepartmentController } from './department/department.controller';

import { LeaveTypeService } from './leave-type/leave-type.service';
import { LeaveTypeController } from './leave-type/leave-type.controller';

import { LeavePolicyService } from './leave-policy/leave-policy.service';
import { LeavePolicyController } from './leave-policy/leave-policy.controller';

import { HolidayService } from './holiday/holiday.service';
import { HolidayController } from './holiday/holiday.controller';

import { ApprovalFlowService } from './approval-flow/approval-flow.service';
import { ApprovalFlowController } from './approval-flow/approval-flow.controller';

import { LeaveBalanceService } from './leave-balance/leave-balance.service';
import { LeaveBalanceController } from './leave-balance/leave-balance.controller';

import { LeaveRequestService } from './leave-request/leave-request.service';
import { LeaveRequestController } from './leave-request/leave-request.controller';

import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification/notification.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    DepartmentService,
    LeaveTypeService,
    LeavePolicyService,
    HolidayService,
    ApprovalFlowService,
    LeaveBalanceService,
    LeaveRequestService,
    NotificationService,
  ],
  controllers: [
    DepartmentController,
    LeaveTypeController,
    LeavePolicyController,
    HolidayController,
    ApprovalFlowController,
    LeaveBalanceController,
    LeaveRequestController,
    NotificationController,
  ],
  exports: [
    DepartmentService,
    LeaveTypeService,
    LeavePolicyService,
    HolidayService,
    ApprovalFlowService,
    LeaveBalanceService,
    LeaveRequestService,
    NotificationService,
  ],
})
export class SicutiModule {}
