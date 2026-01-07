/**
 * Script to calculate total sats students can earn from chapters and assignments
 * Run with: node scripts/calculate-total-sats.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
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
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Constants from the codebase
const CHAPTER_REWARD_SATS = 100; // From mark-completed route
const MAX_ASSIGNMENT_REWARD = 200; // Cap from submit route
const TOTAL_CHAPTERS = 20; // From various files

async function calculateTotalSats() {
  try {
    console.log('📊 Calculating Total Sats Rewards from Chapters and Assignments\n');
    console.log('=' .repeat(60));
    
    // Calculate chapter rewards
    const chapterRewards = TOTAL_CHAPTERS * CHAPTER_REWARD_SATS;
    console.log(`\n📘 Chapter Completion Rewards:`);
    console.log(`   - Total Chapters: ${TOTAL_CHAPTERS}`);
    console.log(`   - Reward per Chapter: ${CHAPTER_REWARD_SATS} sats`);
    console.log(`   - Total from Chapters: ${chapterRewards.toLocaleString()} sats`);
    
    // Fetch all active assignments
    console.log(`\n🛠️  Fetching assignments from database...`);
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title, chapter_number, reward_sats, status')
      .eq('status', 'active')
      .order('chapter_number', { ascending: true });
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      process.exit(1);
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('⚠️  No active assignments found in database');
      console.log(`\n📊 Total Sats from Chapters Only: ${chapterRewards.toLocaleString()} sats`);
      return;
    }
    
    console.log(`   ✅ Found ${assignments.length} active assignments\n`);
    
    // Calculate assignment rewards
    let totalAssignmentRewards = 0;
    const assignmentBreakdown = [];
    
    assignments.forEach(assignment => {
      // Cap at 200 sats as per the code
      const rewardAmount = Math.min(assignment.reward_sats || 200, MAX_ASSIGNMENT_REWARD);
      totalAssignmentRewards += rewardAmount;
      
      assignmentBreakdown.push({
        chapter: assignment.chapter_number,
        title: assignment.title,
        reward: assignment.reward_sats || 200,
        capped: rewardAmount,
      });
    });
    
    console.log(`📝 Assignment Rewards Breakdown:`);
    console.log(`   - Total Active Assignments: ${assignments.length}`);
    assignmentBreakdown.forEach(a => {
      const cappedNote = a.reward > MAX_ASSIGNMENT_REWARD ? ` (capped at ${MAX_ASSIGNMENT_REWARD})` : '';
      console.log(`   - Chapter ${a.chapter}: ${a.title.substring(0, 50)}${a.title.length > 50 ? '...' : ''}`);
      console.log(`     Reward: ${a.capped} sats${cappedNote}`);
    });
    
    console.log(`\n   - Total from Assignments: ${totalAssignmentRewards.toLocaleString()} sats`);
    
    // Calculate grand total
    const grandTotal = chapterRewards + totalAssignmentRewards;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n💰 TOTAL SATS REWARDS SUMMARY:`);
    console.log(`   📘 Chapters (${TOTAL_CHAPTERS} × ${CHAPTER_REWARD_SATS}): ${chapterRewards.toLocaleString()} sats`);
    console.log(`   📝 Assignments (${assignments.length} assignments): ${totalAssignmentRewards.toLocaleString()} sats`);
    console.log(`   ${'─'.repeat(50)}`);
    console.log(`   💎 GRAND TOTAL: ${grandTotal.toLocaleString()} sats`);
    console.log(`\n${'='.repeat(60)}`);
    
    // Convert to USD estimate (rough estimate: 1 BTC = $60,000, 1 BTC = 100M sats)
    const satsToUSD = (sats) => {
      const btcPrice = 60000; // Rough estimate
      return (sats / 100000000) * btcPrice;
    };
    
    console.log(`\n💵 Estimated USD Value (at ~$60,000/BTC):`);
    console.log(`   - Chapters: $${satsToUSD(chapterRewards).toFixed(2)}`);
    console.log(`   - Assignments: $${satsToUSD(totalAssignmentRewards).toFixed(2)}`);
    console.log(`   - Total: $${satsToUSD(grandTotal).toFixed(2)}`);
    
    console.log(`\n✨ Calculation complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

calculateTotalSats();



