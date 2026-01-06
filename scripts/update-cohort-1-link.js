/**
 * Script to update all sessions for Cohort 1 with the video call link
 * Run with: node scripts/update-cohort-1-link.js
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
  }
}

loadEnvFile();

// If variables weren't loaded, try reading directly from file
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Extract NEXT_PUBLIC_SUPABASE_URL
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\n]+)["']?/);
    if (urlMatch) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = urlMatch[1];
    }
  }
  
  // Extract SUPABASE_SERVICE_ROLE_KEY
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const keyMatch = content.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\n]+)["']?/);
    if (keyMatch) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = keyMatch[1];
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try different possible names for the service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.SUPABASE_SERVICE_KEY ||
                           process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL is set in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service role key');
  console.error('Please ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
  console.error('This key is required for admin operations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const VIDEO_CALL_LINK = 'https://meet.google.com/obi-ecor-ebi';
const COHORT_NAME = 'Cohort 1';

async function updateCohortSessions() {
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

    // Get count of sessions before update
    const { count: sessionCount } = await supabase
      .from('cohort_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('cohort_id', cohort.id);

    console.log(`📅 Found ${sessionCount || 0} sessions for ${COHORT_NAME}`);

    // Update all sessions for this cohort with link and duration
    console.log(`🔄 Updating all sessions with link: ${VIDEO_CALL_LINK} and duration: 60 minutes...`);
    
    const { data: updatedSessions, error: updateError } = await supabase
      .from('cohort_sessions')
      .update({ 
        link: VIDEO_CALL_LINK,
        duration_minutes: 60 
      })
      .eq('cohort_id', cohort.id)
      .select('id, session_number, session_date, duration_minutes');

    if (updateError) {
      console.error('❌ Error updating sessions:', updateError);
      process.exit(1);
    }

    console.log(`✅ Successfully updated ${updatedSessions?.length || 0} sessions for ${COHORT_NAME}`);
    console.log(`\n📋 Updated sessions:`);
    updatedSessions?.forEach(session => {
      console.log(`   - Session ${session.session_number} (${session.session_date}) - ${session.duration_minutes} min`);
    });

    console.log(`\n✨ All sessions for ${COHORT_NAME} now have:`);
    console.log(`   - Video call link: ${VIDEO_CALL_LINK}`);
    console.log(`   - Duration: 60 minutes`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateCohortSessions();

