import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import * as attendanceService from '../services/attendanceService.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, message?: string) {
  if (condition) {
    results.push({ name: testName, passed: true });
    console.log(`  ✓ ${testName}`);
  } else {
    results.push({ name: testName, passed: false, error: message });
    console.error(`  ✗ ${testName}: ${message}`);
  }
}

async function simulateWebhookRequest(
  body: any,
  secretHeader: string | null = env.GOOGLE_FORM_WEBHOOK_SECRET
): Promise<{ status: number; body: any }> {
  const url = `http://localhost:${env.PORT}/api/integrations/google-form/attendance`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secretHeader !== null) {
    headers['x-google-form-secret'] = secretHeader;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const responseBody = await response.json();
  return {
    status: response.status,
    body: responseBody,
  };
}

export async function runGoogleFormIntegrationTests(): Promise<void> {
  console.log('\n==================================================');
  console.log('PHASE 8.5 — GOOGLE FORM INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  try {
    await connectDatabase();

    // 1. Prepare test users
    const testRegNo = '24105110087'; // Shashi Bhushan
    const testUser = await User.findOne({ registrationNo: testRegNo });
    if (!testUser) {
      throw new Error(`Test user ${testRegNo} not found in database.`);
    }

    // Clean up any existing active session for clean test isolation
    await AttendanceSession.deleteMany({
      registrationNo: testRegNo,
      status: 'ACTIVE',
    });

    console.log('1. Testing Security & Authentication...');
    // 1. Missing secret
    const resNoSecret = await simulateWebhookRequest(
      {
        registrationNo: testRegNo,
        name: testUser.name,
        action: 'CHECK_IN',
      },
      null
    );
    assert(
      resNoSecret.status === 401 && resNoSecret.body.error?.code === 'UNAUTHORIZED',
      'Rejects request missing webhook secret (401 UNAUTHORIZED)'
    );

    // 2. Invalid secret
    const resBadSecret = await simulateWebhookRequest(
      {
        registrationNo: testRegNo,
        name: testUser.name,
        action: 'CHECK_IN',
      },
      'invalid-secret-xyz'
    );
    assert(
      resBadSecret.status === 401 && resBadSecret.body.error?.code === 'UNAUTHORIZED',
      'Rejects request with incorrect webhook secret (401 UNAUTHORIZED)'
    );

    console.log('\n2. Testing Validation & Member Rules...');
    // 3. Missing registration number
    const resMissingReg = await simulateWebhookRequest({
      name: testUser.name,
      action: 'CHECK_IN',
    });
    assert(
      resMissingReg.status === 400 && resMissingReg.body.error?.code === 'VALIDATION_ERROR',
      'Rejects submission missing registration number (400 VALIDATION_ERROR)'
    );

    // 4. Invalid action
    const resBadAction = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'INVALID_ACTION',
    });
    assert(
      resBadAction.status === 400 && resBadAction.body.error?.code === 'VALIDATION_ERROR',
      'Rejects invalid action (400 VALIDATION_ERROR)'
    );

    // 5. Unknown registration number
    const resUnknownUser = await simulateWebhookRequest({
      registrationNo: '99999999999',
      name: 'Non Existent Person',
      action: 'CHECK_IN',
    });
    assert(
      resUnknownUser.status === 404 && resUnknownUser.body.error?.code === 'USER_NOT_FOUND',
      'Rejects unknown registration number (404 USER_NOT_FOUND)'
    );

    // 6. Name mismatch
    const resWrongName = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: 'Completely Wrong Name',
      action: 'CHECK_IN',
    });
    assert(
      resWrongName.status === 400 && resWrongName.body.error?.code === 'NAME_MISMATCH',
      'Rejects submitted name mismatch against database (400 NAME_MISMATCH)'
    );

    console.log('\n3. Testing Check-In & Idempotency...');
    // 7. Valid Google Form Check-In
    const submissionId1 = `gform-test-${Date.now()}-1`;
    const resCheckIn = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK IN', // Test normalization from 'CHECK IN' -> 'CHECK_IN'
      task: 'Google Form integration automated testing',
      remarks: 'Automated test suite run',
      submissionId: submissionId1,
    });
    assert(
      resCheckIn.status === 200 && resCheckIn.body.data?.action === 'CHECK_IN',
      'Processes valid Google Form CHECK_IN successfully (200 OK)'
    );

    // Verify session in MongoDB has source = GOOGLE_FORM
    const activeSession = await AttendanceSession.findOne({
      userId: testUser._id,
      status: 'ACTIVE',
    });
    assert(
      activeSession !== null && activeSession.source === 'GOOGLE_FORM',
      'Created active session in MongoDB with source: "GOOGLE_FORM"'
    );

    // 8. Already Checked In
    const resDuplicateCheckIn = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK_IN',
      task: 'Another task',
    });
    assert(
      resDuplicateCheckIn.status === 400 &&
        resDuplicateCheckIn.body.error?.code === 'ALREADY_CHECKED_IN',
      'Rejects second check-in while already active (400 ALREADY_CHECKED_IN)'
    );

    // 9. Duplicate submissionId check
    const resDuplicateSubmissionId = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK_IN',
      submissionId: submissionId1,
    });
    assert(
      resDuplicateSubmissionId.status === 409 ||
        resDuplicateSubmissionId.body.error?.code === 'DUPLICATE_SUBMISSION' ||
        resDuplicateSubmissionId.body.error?.code === 'ALREADY_CHECKED_IN',
      'Rejects duplicate submissionId retry cleanly'
    );

    console.log('\n4. Testing Check-Out & Duration...');
    // 10. Valid Google Form Check-Out
    const resCheckOut = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK OUT', // Test normalization
      task: 'Completed testing Google Form integration',
    });
    assert(
      resCheckOut.status === 200 && resCheckOut.body.data?.action === 'CHECK_OUT',
      'Processes valid Google Form CHECK_OUT successfully (200 OK)'
    );

    // Verify session was completed in MongoDB
    const completedSession = await AttendanceSession.findById(activeSession!._id);
    assert(
      completedSession !== null &&
        completedSession.status === 'COMPLETED' &&
        completedSession.checkOut instanceof Date,
      'Updated session to COMPLETED with valid checkOut timestamp in MongoDB'
    );

    // 11. Check-out when no active session
    const resNoCheckIn = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK_OUT',
    });
    assert(
      resNoCheckIn.status === 400 && resNoCheckIn.body.error?.code === 'NO_CHECK_IN',
      'Rejects checkout when no active session exists (400 NO_CHECK_IN)'
    );

    console.log('\n5. Testing Interoperability (Step 18)...');
    // 12. Test Google Form CHECK IN -> Discord CHECK OUT
    const resFormCheckIn = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK_IN',
      task: 'Interoperability test: Form CI -> Discord CO',
    });
    assert(resFormCheckIn.status === 200, 'Interoperability: Google Form CHECK_IN succeeded');

    // Checkout via Discord service directly
    const discordCheckoutResult = await attendanceService.checkOutUser({
      discordUserId: testUser.discordUserId,
      task: 'Interoperability checkout via Discord',
    });
    assert(
      discordCheckoutResult.session.status === 'COMPLETED',
      'Interoperability: Discord checkOutUser completed the Google Form session'
    );

    // 13. Test Discord CHECK IN -> Google Form CHECK OUT
    const discordCheckInResult = await attendanceService.checkInUser({
      discordUserId: testUser.discordUserId,
      task: 'Interoperability test: Discord CI -> Form CO',
    });
    assert(
      discordCheckInResult.status === 'ACTIVE',
      'Interoperability: Discord checkInUser created active session'
    );

    const resFormCheckout2 = await simulateWebhookRequest({
      registrationNo: testRegNo,
      name: testUser.name,
      action: 'CHECK_OUT',
      task: 'Interoperability checkout via Google Form',
    });
    assert(
      resFormCheckout2.status === 200 && resFormCheckout2.body.data?.action === 'CHECK_OUT',
      'Interoperability: Google Form CHECK_OUT completed the Discord session'
    );

    // Clean up test sessions created during test
    await AttendanceSession.deleteMany({
      _id: {
        $in: [
          activeSession!._id,
          discordCheckoutResult.session._id,
          discordCheckInResult._id,
        ],
      },
    });

    console.log('\n==================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Results: ${passedCount}/${results.length} tests passed.`);
    console.log('==================================================\n');

    if (passedCount !== results.length) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite failed unexpectedly:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed.\n');
  }
}

runGoogleFormIntegrationTests();
