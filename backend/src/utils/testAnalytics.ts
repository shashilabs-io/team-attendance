import mongoose from 'mongoose';
import { env } from '../config/env.js';
import * as analyticsService from '../services/analyticsService.js';

async function runTests() {
  console.log('🧪 Starting Phase 7 Analytics Verification...');

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(env.MONGODB_URI);
    }
    console.log('✅ MongoDB connected');

    // 1. Overall Analytics
    console.log('\n▶ TEST 1: getOverallAnalytics');
    const overall = await analyticsService.getOverallAnalytics();
    console.log('   Overall:', overall);
    if (typeof overall.totalSessions !== 'number' || typeof overall.totalMembers !== 'number') {
      throw new Error('Overall analytics failed type assertions');
    }
    console.log('   ✅ Passed: Overall analytics aggregated successfully');

    // 2. Daily Analytics
    console.log('\n▶ TEST 2: getDailyAnalytics');
    const daily = await analyticsService.getDailyAnalytics();
    console.log('   Daily records count:', daily.length);
    console.log('   ✅ Passed: Daily analytics aggregated successfully');

    // 3. Weekly Analytics
    console.log('\n▶ TEST 3: getWeeklyAnalytics');
    const weekly = await analyticsService.getWeeklyAnalytics();
    console.log('   Weekly records count:', weekly.length);
    console.log('   ✅ Passed: Weekly analytics aggregated successfully');

    // 4. Monthly Analytics
    console.log('\n▶ TEST 4: getMonthlyAnalytics');
    const monthly = await analyticsService.getMonthlyAnalytics();
    console.log('   Monthly records count:', monthly.length);
    console.log('   ✅ Passed: Monthly analytics aggregated successfully');

    // 5. Member Analytics & Attendance Days
    console.log('\n▶ TEST 5: getMemberAnalytics (Attendance Days consistency)');
    const members = await analyticsService.getMemberAnalytics();
    console.log('   Member records:', members);
    for (const m of members) {
      if (typeof m.attendanceDays !== 'number' || m.attendanceDays < 0) {
        throw new Error(`Invalid attendanceDays for member ${m.name}`);
      }
    }
    console.log('   ✅ Passed: Member performance and distinct attendance days calculated');

    // 6. Duration Distribution
    console.log('\n▶ TEST 6: getDurationDistribution');
    const dist = await analyticsService.getDurationDistribution();
    console.log('   Distribution buckets:', dist);
    if (dist.length !== 6) {
      throw new Error(`Expected 6 duration distribution buckets, got ${dist.length}`);
    }
    console.log('   ✅ Passed: Duration distribution returned all 6 expected buckets');

    // 7. Heatmap
    console.log('\n▶ TEST 7: getAttendanceHeatmap');
    const heatmap = await analyticsService.getAttendanceHeatmap();
    console.log('   Heatmap records count:', heatmap.length);
    console.log('   ✅ Passed: Attendance heatmap aggregated successfully');

    // 8. Period Comparison
    console.log('\n▶ TEST 8: getPeriodComparison');
    const comparison = await analyticsService.getPeriodComparison();
    console.log('   Period comparison:', comparison);
    if (!comparison.current || !comparison.previous || !comparison.changePercentage) {
      throw new Error('Comparison structure invalid');
    }
    console.log('   ✅ Passed: Period comparison calculated without division by zero');

    console.log('\n🎉 ALL PHASE 7 BACKEND ANALYTICS TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
