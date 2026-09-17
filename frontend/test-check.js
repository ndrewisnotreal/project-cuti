import assert from 'node:assert';
import {
  sicutiState,
  calculateWorkingDays,
  getUserBalance,
  createLeaveRequest,
  canUserApprove,
  approveLeaveRequest,
  rejectLeaveRequest,
  login,
  currentUser,
  activeRole
} from './src/service/sicutiService.js';

console.log('Testing SiCuti Service Logic...');

// 1. Test Login
const loginFail = login('wrong@inalum.co.id', 'wrong');
assert.strictEqual(loginFail.success, false, 'Should fail with invalid credentials');

const loginUser = login('user@inalum.co.id', 'password123');
assert.strictEqual(loginUser.success, true, 'User login should succeed');
assert.strictEqual(activeRole.value, 'user', 'Role should be user');

// 2. Test Working Days Calculation
// 2026-09-14 is Monday, 2026-09-15 is Tuesday, 2026-09-16 is Wednesday (Maulid Nabi - Holiday in mock data!)
const days = calculateWorkingDays('2026-09-14', '2026-09-16');
// 14th (Mon, work), 15th (Tue, work), 16th (Wed, Holiday H014) => 2 working days
assert.strictEqual(days, 2, 'Should exclude public holiday Maulid Nabi');

// 3. Test Balance
const bal = getUserBalance('USR001');
assert.strictEqual(bal.annualQuota, 12, 'Annual quota should be 12');
assert.ok(bal.remaining >= 0, 'Remaining should be >= 0');

// 4. Test Leave Creation
const initialCount = sicutiState.leaveRequests.length;
const newReq = createLeaveRequest({
  userId: 'USR001',
  leaveTypeId: 'LT001',
  startDate: '2026-10-05',
  endDate: '2026-10-06',
  totalDays: 2,
  reason: 'Test Cuti',
  status: 'submitted'
});
assert.strictEqual(sicutiState.leaveRequests.length, initialCount + 1, 'Request count should increase');
assert.strictEqual(newReq.status, 'submitted', 'Status should be submitted');

// 5. Test Multi-Level Approval Flow
// Switch to approver 1
const loginApprover1 = login('approver1@inalum.co.id', 'password123');
assert.strictEqual(loginApprover1.success, true, 'Approver 1 login should succeed');
assert.strictEqual(canUserApprove(newReq, currentUser.value), true, 'Approver 1 should be allowed to approve Level 1');

// Approver 2 should NOT be allowed yet (Level 1 pending)
const loginApprover2 = login('approver2@inalum.co.id', 'password123');
assert.strictEqual(canUserApprove(newReq, currentUser.value), false, 'Approver 2 cannot approve before Level 1');

// Back to Approver 1 to approve Level 1
login('approver1@inalum.co.id', 'password123');
const afterLevel1 = approveLeaveRequest(newReq.id, 'Disetujui test Level 1', 'Approver 1');
assert.strictEqual(afterLevel1.status, 'pending_validation', 'Status should be pending_validation waiting for Level 2');
assert.strictEqual(afterLevel1.approvalRecords.length, 1, 'Should have 1 approval record');
assert.strictEqual(afterLevel1.approvalRecords[0].level, 1, 'First record should be Level 1');

// Approver 1 cannot approve again (duplicate prevention)
assert.strictEqual(canUserApprove(newReq, currentUser.value), false, 'Approver 1 cannot approve again');
approveLeaveRequest(newReq.id, 'Spam approve', 'Approver 1');
assert.strictEqual(afterLevel1.approvalRecords.length, 1, 'Should prevent duplicate approval by same approver');

// Approver 2 now can approve Level 2
login('approver2@inalum.co.id', 'password123');
assert.strictEqual(canUserApprove(newReq, currentUser.value), true, 'Approver 2 now can approve Level 2');
const afterLevel2 = approveLeaveRequest(newReq.id, 'Disetujui final Level 2', 'Approver 2');
assert.strictEqual(afterLevel2.status, 'approved', 'Status should be approved after Level 2');
assert.strictEqual(afterLevel2.approvalRecords.length, 2, 'Should have 2 approval records');
assert.strictEqual(afterLevel2.approvalRecords[1].level, 2, 'Second record should be Level 2');

// 6. Test Date Formatting and Demo Switcher
import {
  formatDate,
  formatDateTime,
  DEMO_PERSONAS,
  switchPersona,
  hasPermission,
  togglePermission,
  grantAllPermissions,
  revokeAllPermissions,
  resetPermissions,
  approveRoleChangeRequest,
  rejectRoleChangeRequest,
  createRoleChangeRequest
} from './src/service/sicutiService.js';
assert.strictEqual(formatDate('2026-09-14'), '14 Sep 2026', 'formatDate should format correctly');
assert.ok(DEMO_PERSONAS.length >= 4, 'Demo personas should be configured');
switchPersona('ADM001');
assert.strictEqual(currentUser.value.id, 'ADM001', 'Persona switch should update currentUser');
assert.strictEqual(activeRole.value, 'admin', 'Persona switch should update activeRole');

// 7. Test Permission System & Role Requests
assert.strictEqual(hasPermission('user', 'pengajuan_cuti', 'submit'), true, 'User should have submit permission');
assert.strictEqual(hasPermission('user', 'master_data', 'manage_employees'), false, 'User should not have manage_employees permission');
assert.strictEqual(hasPermission('admin', 'master_data', 'manage_employees'), true, 'Admin should have manage_employees permission');

// Approval persona default permission check: NO personal leave by default
assert.strictEqual(hasPermission('approval', 'pengajuan_cuti', 'submit'), false, 'Approval should NOT have personal leave submit by default');
assert.strictEqual(hasPermission('approval', 'dokumen_saldo', 'view_balance'), false, 'Approval should NOT have view_balance by default');

// Approver gets personal leave only when admin toggles permission
togglePermission('approval', 'pengajuan_cuti', 'submit', true);
assert.strictEqual(hasPermission('approval', 'pengajuan_cuti', 'submit'), true, 'Approval now has submit permission after admin toggle');

togglePermission('user', 'master_data', 'manage_employees', true);
assert.strictEqual(hasPermission('user', 'master_data', 'manage_employees'), true, 'User should now have manage_employees after toggle');
resetPermissions();
assert.strictEqual(hasPermission('user', 'master_data', 'manage_employees'), false, 'Reset should restore default user permission');
assert.strictEqual(hasPermission('approval', 'pengajuan_cuti', 'submit'), false, 'Reset should restore approval without personal leave submit permission');

// Test Role Change Request
const reqRole = createRoleChangeRequest({
  userId: 'USR001',
  currentRole: 'user',
  requestedRole: 'approval',
  reason: 'Promosi jabatan'
});
assert.strictEqual(reqRole.status, 'pending', 'New role request should be pending');
const approvedRole = approveRoleChangeRequest(reqRole.id, 'Disetujui manajemen', 'Admin SIT');
assert.strictEqual(approvedRole, true, 'Role request approval should succeed');
assert.strictEqual(sicutiState.users.find(u => u.id === 'USR001').role, 'approval', 'User role should change to approval');
// 8. Test Draft Creation & Editing
const draftReq = createLeaveRequest({
  userId: 'USR001',
  leaveTypeId: 'LT001',
  startDate: '2026-11-02',
  endDate: '2026-11-03',
  totalDays: 2,
  reason: 'Draft liburan keluarga',
  status: 'draft'
});
assert.strictEqual(draftReq.status, 'draft', 'Status should be draft');

// Edit draft
import { updateLeaveRequest } from './src/service/sicutiService.js';
const updatedDraft = updateLeaveRequest(draftReq.id, {
  reason: 'Draft liburan keluarga (revisi)',
  totalDays: 3,
  endDate: '2026-11-04'
});
assert.strictEqual(updatedDraft.reason, 'Draft liburan keluarga (revisi)', 'Draft reason should be updated');
assert.strictEqual(updatedDraft.totalDays, 3, 'Draft totalDays should be updated');
assert.strictEqual(updatedDraft.status, 'draft', 'Draft status should remain draft after edit');

// Submit edited draft
const submittedReq = updateLeaveRequest(draftReq.id, { status: 'submitted' });
assert.strictEqual(submittedReq.status, 'submitted', 'Draft status should become submitted');


console.log('ALL ASSERTIONS PASSED! Self-check completed successfully.');
