/**
 * Script to rearrange all sessions for Cohort 1
 * Starting from January 19, 2026, with 1 day difference, skipping Sundays
 * 
 * Usage: node scripts/rearrange-cohort-1-sessions.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }
      // Match KEY="value" or KEY=value (handle quoted values)
      const match = line.match(/^([^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } else {
    console.warn('⚠️  .env.local file not found. Using system environment variables.');
  }
}

// Load environment variables
loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const COHORT_NAME = 'Cohort 1';
const START_DATE = '2026-01-19'; // January 19, 2026

async function rearrangeSessions() {
  try {
    console.log(`🔍 Finding cohort: ${COHORT_NAME}...`);
    
    // Find the cohort by name
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('id, name')
      .eq('name', COHORT_NAME)
      .maybeSingle();

    if (cohortError) {
      console.error('❌ Error fetching cohort:', cohortError);
      process.exit(1);
    }

    if (!cohort) {
      console.error(`❌ Cohort "${COHORT_NAME}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found cohort: ${cohort.name} (ID: ${cohort.id})`);

    // Get all sessions for this cohort, ordered by session_number
    const { data: sessions, error: sessionsError } = await supabase
      .from('cohort_sessions')
      .select('id, session_number, session_date')
      .eq('cohort_id', cohort.id)
      .order('session_number', { ascending: true });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      process.exit(1);
    }

    if (!sessions || sessions.length === 0) {
      console.error(`❌ No sessions found for ${COHORT_NAME}`);
      process.exit(1);
    }

    console.log(`📅 Found ${sessions.length} sessions for ${COHORT_NAME}`);
    console.log(`\n📋 Current sessions:`);
    sessions.forEach(session => {
      const date = new Date(session.session_date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      console.log(`   - Session ${session.session_number}: ${session.session_date} (${dayName})`);
    });

    // Calculate new dates
    console.log(`\n🔄 Calculating new dates starting from ${START_DATE}...`);
    const sessionUpdates = [];
    let currentDate = new Date(START_DATE);
    
    // If start date is Sunday, move to Monday
    if (currentDate.getDay() === 0) {
      console.log(`   ⚠️  Start date is Sunday, moving to Monday...`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const session of sessions) {
      // Skip Sundays
      while (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const dateString = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      sessionUpdates.push({
        id: session.id,
        session_number: session.session_number,
        session_date: dateString,
        dayName: dayName,
      });

      // Move to next day for next session
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n📅 New session schedule:`);
    sessionUpdates.forEach(update => {
      console.log(`   - Session ${update.session_number}: ${update.session_date} (${update.dayName})`);
    });

    // Confirm before updating
    console.log(`\n⚠️  This will update ${sessionUpdates.length} sessions.`);
    console.log(`Press Ctrl+C to cancel, or wait 3 seconds to continue...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update all sessions
    console.log(`\n🔄 Updating sessions...`);
    const updatePromises = sessionUpdates.map((update) =>
      supabase
        .from('cohort_sessions')
        .update({ session_date: update.session_date })
        .eq('id', update.id)
    );

    const results = await Promise.allSettled(updatePromises);
    
    // Check for failures
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      console.error(`\n❌ Failed to update ${failures.length} session(s):`);
      failures.forEach((failure, index) => {
        console.error(`   - ${failure.reason}`);
      });
      process.exit(1);
    }

    // Check for update errors
    const updateErrors = results
      .map((result, index) => {
        if (result.status === 'fulfilled' && result.value.error) {
          return { index, error: result.value.error };
        }
        return null;
      })
      .filter(Boolean);

    if (updateErrors.length > 0) {
      console.error(`\n❌ Update errors:`);
      updateErrors.forEach((e) => {
        console.error(`   - Session ${sessionUpdates[e.index].session_number}: ${e.error.message}`);
      });
      process.exit(1);
    }

    console.log(`\n✅ Successfully rearranged ${sessionUpdates.length} sessions for ${COHORT_NAME}`);
    console.log(`   Start date: ${START_DATE}`);
    console.log(`   End date: ${sessionUpdates[sessionUpdates.length - 1].session_date}`);
    console.log(`\n✨ All sessions have been updated!`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
rearrangeSessions();

