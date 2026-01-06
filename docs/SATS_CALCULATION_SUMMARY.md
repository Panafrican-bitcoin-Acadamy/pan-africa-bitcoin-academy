# Total Sats Calculation - Chapters & Assignments

## 📊 Current Reward Structure

### 📘 Chapter Completion Rewards
- **Reward per Chapter**: 100 sats
- **Total Chapters**: 20
- **Total from Chapters**: **2,000 sats**

### 📝 Assignment Rewards
- **Total Active Assignments**: 14
- **Reward Structure**: Varies by assignment (capped at 200 sats maximum per assignment)

#### Assignment Breakdown:
1. **Chapter 1**: "What Is Money to Me?" - **50 sats**
2. **Chapter 2**: Money Under Pressure - **75 sats**
3. **Chapter 3**: Inflation Reality Check - **75 sats**
4. **Chapter 4**: "What Broke?" - **75 sats**
5. **Chapter 5**: Whitepaper Sentence Decode - **100 sats**
6. **Chapter 6**: First Wallet Proof - **200 sats**
7. **Chapter 7**: Understanding a Block - **100 sats**
8. **Chapter 8**: Create & Validate Bitcoin Addresses - **100 sats**
9. **Chapter 10**: Protect Your Future Self - **100 sats**
10. **Chapter 11**: Threat Model - **100 sats**
11. **Chapter 12**: Explorer Scavenger Hunt - **200 sats**
12. **Chapter 13**: The Halving Timeline Puzzle - **150 sats**
13. **Chapter 18**: Script Recognition - **100 sats**
14. **Chapter 20**: Code or State - **100 sats**

- **Total from Assignments**: **1,525 sats**

## 💎 Total Sats from Chapters & Assignments

```
📘 Chapters:     2,000 sats
📝 Assignments:  1,525 sats
─────────────────────────────
💎 TOTAL:        3,525 sats
```

## 💵 Estimated USD Value
*(Based on ~$60,000/BTC, 1 BTC = 100M sats)*

- **Chapters**: $1.20
- **Assignments**: $0.92
- **Total**: **$2.12**

## 📋 Important Notes

1. **Chapter Rewards**: 
   - Awarded automatically when a chapter is marked as completed
   - Fixed at 100 sats per chapter (as per `src/app/api/chapters/mark-completed/route.ts`)

2. **Assignment Rewards**:
   - Awarded only when assignment is marked as correct (by auto-grading or instructor review)
   - Each assignment has its own `reward_sats` value stored in the database
   - Maximum reward per assignment is capped at 200 sats (as per `src/app/api/assignments/submit/route.ts`)

3. **Additional Rewards** (Not included in this calculation):
   - **Achievements**: Up to 2,000 sats (bonus rewards for milestones)
   - **Blog Posts**: 2,000 sats per approved post (unlimited potential)

4. **Total Potential** (including achievements):
   - Core (Chapters + Assignments): 3,525 sats
   - Achievements: 2,000 sats
   - **Total with Achievements**: **5,525 sats**
   - Plus unlimited blog post rewards

## 🔄 How to Recalculate

Run the calculation script:
```bash
node scripts/calculate-total-sats.js
```

This script:
- Fetches all active assignments from the database
- Calculates total rewards based on current `reward_sats` values
- Accounts for the 200 sats cap per assignment
- Provides a detailed breakdown

## 📅 Last Updated
Generated automatically from database on: $(date)


