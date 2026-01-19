# Rearrange Cohort 1 Sessions

## Quick Method: Browser Console

While logged into the admin panel, open the browser console (F12) and run:

```javascript
fetch('/api/admin/cohorts/rearrange-sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    cohortName: 'Cohort 1',
    startDate: '2026-01-19'
  })
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.error('Error:', data.error);
    alert('Error: ' + data.error);
  } else {
    console.log('Success:', data);
    alert(`Success! ${data.sessionsUpdated} sessions rearranged.\nStart: ${data.startDate}\nEnd: ${data.endDate}`);
    location.reload();
  }
})
.catch(err => {
  console.error('Error:', err);
  alert('Error: ' + err.message);
});
```

## What This Does

- Finds "Cohort 1" by name
- Gets all sessions ordered by session_number
- Sets Session 1 to January 19, 2026
- Spaces subsequent sessions 1 day apart
- Skips Sundays automatically
- Updates all sessions in the database

## Example Schedule

- Session 1: Jan 19, 2026 (Monday)
- Session 2: Jan 20, 2026 (Tuesday)
- Session 3: Jan 21, 2026 (Wednesday)
- Session 4: Jan 22, 2026 (Thursday)
- Session 5: Jan 23, 2026 (Friday)
- Session 6: Jan 24, 2026 (Saturday)
- Session 7: Jan 26, 2026 (Monday) - skipped Sunday Jan 25
- And so on...

