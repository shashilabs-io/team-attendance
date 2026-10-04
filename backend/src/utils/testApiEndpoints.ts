import { env } from '../config/env.js';

const BASE_URL = `http://localhost:${env.PORT}`;

interface ApiResponse<T = any> {
  status: number;
  data: T;
}

async function request(path: string): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}${path}`);
  const json = await res.json();
  return {
    status: res.status,
    data: json,
  };
}

export async function runApiTests(): Promise<void> {
  console.log('🧪 Starting Phase 4 Dashboard REST API Verification...\n');

  try {
    // 1. GET /api/health
    console.log('▶ TEST 1: GET /api/health');
    const health = await request('/api/health');
    if (health.status === 200 && health.data.success === true && health.data.database === 'connected') {
      console.log('   ✅ Passed: Health check is healthy and connected to database');
    } else {
      throw new Error(`TEST 1 Failed: ${JSON.stringify(health.data)}`);
    }

    // 2. GET /api/users
    console.log('▶ TEST 2: GET /api/users');
    const usersRes = await request('/api/users');
    if (usersRes.status === 200 && usersRes.data.success === true && Array.isArray(usersRes.data.data)) {
      console.log(`   ✅ Passed: Found ${usersRes.data.data.length} registered team members`);
    } else {
      throw new Error(`TEST 2 Failed: ${JSON.stringify(usersRes.data)}`);
    }

    const firstUser = usersRes.data.data[0];
    if (!firstUser) {
      throw new Error('No team members found in database to test single user endpoints');
    }

    // 3. GET /api/users/:id
    console.log(`▶ TEST 3: GET /api/users/${firstUser.id}`);
    const userRes = await request(`/api/users/${firstUser.id}`);
    if (userRes.status === 200 && userRes.data.success === true && userRes.data.data.name === firstUser.name) {
      console.log(`   ✅ Passed: Retrieved member '${userRes.data.data.name}' with registrationNo: ${userRes.data.data.registrationNo}`);
    } else {
      throw new Error(`TEST 3 Failed: ${JSON.stringify(userRes.data)}`);
    }

    // 4. GET /api/users/:id/status
    console.log(`▶ TEST 4: GET /api/users/${firstUser.id}/status`);
    const statusRes = await request(`/api/users/${firstUser.id}/status`);
    if (
      statusRes.status === 200 &&
      statusRes.data.success === true &&
      (statusRes.data.data.status === 'ACTIVE' || statusRes.data.data.status === 'OFFLINE')
    ) {
      console.log(`   ✅ Passed: User status returned '${statusRes.data.data.status}'`);
    } else {
      throw new Error(`TEST 4 Failed: ${JSON.stringify(statusRes.data)}`);
    }

    // 5. GET /api/attendance (paginated)
    console.log('▶ TEST 5: GET /api/attendance');
    const attRes = await request('/api/attendance?page=1&limit=10');
    if (
      attRes.status === 200 &&
      attRes.data.success === true &&
      Array.isArray(attRes.data.data) &&
      attRes.data.pagination &&
      attRes.data.pagination.page === 1
    ) {
      console.log(`   ✅ Passed: Paginated attendance retrieved (total records: ${attRes.data.pagination.total})`);
    } else {
      throw new Error(`TEST 5 Failed: ${JSON.stringify(attRes.data)}`);
    }

    // 6. GET /api/attendance/active
    console.log('▶ TEST 6: GET /api/attendance/active');
    const activeRes = await request('/api/attendance/active');
    if (activeRes.status === 200 && activeRes.data.success === true && Array.isArray(activeRes.data.data)) {
      console.log(`   ✅ Passed: Currently active members returned (${activeRes.data.data.length} active)`);
    } else {
      throw new Error(`TEST 6 Failed: ${JSON.stringify(activeRes.data)}`);
    }

    // 7. GET /api/attendance/today
    console.log('▶ TEST 7: GET /api/attendance/today');
    const todayRes = await request('/api/attendance/today');
    if (todayRes.status === 200 && todayRes.data.success === true && Array.isArray(todayRes.data.data)) {
      console.log(`   ✅ Passed: Today's sessions in IST returned (${todayRes.data.data.length} sessions)`);
    } else {
      throw new Error(`TEST 7 Failed: ${JSON.stringify(todayRes.data)}`);
    }

    // 8. GET /api/attendance/summary
    console.log('▶ TEST 8: GET /api/attendance/summary');
    const summaryRes = await request('/api/attendance/summary');
    if (
      summaryRes.status === 200 &&
      summaryRes.data.success === true &&
      typeof summaryRes.data.data.totalMembers === 'number' &&
      typeof summaryRes.data.data.activeNow === 'number' &&
      typeof summaryRes.data.data.checkedInToday === 'number'
    ) {
      console.log('   ✅ Passed: Dashboard summary metrics:', summaryRes.data.data);
    } else {
      throw new Error(`TEST 8 Failed: ${JSON.stringify(summaryRes.data)}`);
    }

    // 9. GET /api/attendance/stats/daily
    console.log('▶ TEST 9: GET /api/attendance/stats/daily');
    const dailyStats = await request('/api/attendance/stats/daily');
    if (dailyStats.status === 200 && dailyStats.data.success === true && Array.isArray(dailyStats.data.data)) {
      console.log(`   ✅ Passed: Daily aggregated stats returned (${dailyStats.data.data.length} days)`);
    } else {
      throw new Error(`TEST 9 Failed: ${JSON.stringify(dailyStats.data)}`);
    }

    // 10. GET /api/attendance/stats/members
    console.log('▶ TEST 10: GET /api/attendance/stats/members');
    const memberStats = await request('/api/attendance/stats/members');
    if (memberStats.status === 200 && memberStats.data.success === true && Array.isArray(memberStats.data.data)) {
      console.log(`   ✅ Passed: Member leaderboard stats returned (${memberStats.data.data.length} members)`);
    } else {
      throw new Error(`TEST 10 Failed: ${JSON.stringify(memberStats.data)}`);
    }

    // 11. GET /api/attendance/events
    console.log('▶ TEST 11: GET /api/attendance/events');
    const eventsRes = await request('/api/attendance/events?page=1&limit=5');
    if (
      eventsRes.status === 200 &&
      eventsRes.data.success === true &&
      Array.isArray(eventsRes.data.data) &&
      eventsRes.data.pagination
    ) {
      console.log(`   ✅ Passed: Audit events retrieved (total events: ${eventsRes.data.pagination.total})`);
    } else {
      throw new Error(`TEST 11 Failed: ${JSON.stringify(eventsRes.data)}`);
    }

    // 12. Invalid pagination returns 400
    console.log('▶ TEST 12: Invalid pagination (page=0) returns HTTP 400');
    const invalidPage = await request('/api/attendance?page=0');
    if (invalidPage.status === 400 && invalidPage.data.success === false && invalidPage.data.error?.code === 'VALIDATION_ERROR') {
      console.log('   ✅ Passed: Validation rejected page=0 with 400');
    } else {
      throw new Error(`TEST 12 Failed: Expected 400, got ${invalidPage.status}`);
    }

    // 13. Invalid status returns 400
    console.log('▶ TEST 13: Invalid status filter returns HTTP 400');
    const invalidStatus = await request('/api/attendance?status=INVALID_STATUS');
    if (invalidStatus.status === 400 && invalidStatus.data.success === false && invalidStatus.data.error?.code === 'VALIDATION_ERROR') {
      console.log('   ✅ Passed: Validation rejected invalid status with 400');
    } else {
      throw new Error(`TEST 13 Failed: Expected 400, got ${invalidStatus.status}`);
    }

    // 14. Invalid date returns 400
    console.log('▶ TEST 14: Invalid date format returns HTTP 400');
    const invalidDate = await request('/api/attendance?startDate=not-a-date');
    if (invalidDate.status === 400 && invalidDate.data.success === false && invalidDate.data.error?.code === 'VALIDATION_ERROR') {
      console.log('   ✅ Passed: Validation rejected invalid date with 400');
    } else {
      throw new Error(`TEST 14 Failed: Expected 400, got ${invalidDate.status}`);
    }

    // 15. Unknown route returns 404
    console.log('▶ TEST 15: Unknown route returns HTTP 404 ROUTE_NOT_FOUND');
    const notFound = await request('/api/unknown-route-12345');
    if (notFound.status === 404 && notFound.data.success === false && notFound.data.error?.code === 'ROUTE_NOT_FOUND') {
      console.log('   ✅ Passed: 404 returned ROUTE_NOT_FOUND format');
    } else {
      throw new Error(`TEST 15 Failed: Expected 404, got ${notFound.status}`);
    }

    console.log('\n🎉 ALL 15 DASHBOARD REST API TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ API test verification failed:', error);
    process.exitCode = 1;
  }
}

if (
  process.argv[1]?.endsWith('testApiEndpoints.ts') ||
  process.argv[1]?.endsWith('testApiEndpoints.js')
) {
  runApiTests();
}
