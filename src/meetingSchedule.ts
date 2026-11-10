// Calculate the next Monday club meeting in Bedford's local time, not the viewer's timezone.
// On Mondays, keep today's date until the 3:30 PM meeting ends.
export const upcomingMondayLabel = (now = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day')))
  const daysToMonday = (8 - date.getUTCDay()) % 7
  const mondayMeetingEnded = daysToMonday === 0 &&
    (part('hour') > 15 || (part('hour') === 15 && part('minute') >= 30))
  date.setUTCDate(date.getUTCDate() + (mondayMeetingEnded ? 7 : daysToMonday))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(date)
}

