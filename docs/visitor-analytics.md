# BBB visitor analytics (privacy-conscious)

The public website records pseudonymous visit events in Supabase `public.page_visits`. It does not include a dashboard; authorized project maintainers can query aggregate results when needed.

## Fields

- `visitor_id`: SHA-256 hash of a randomly generated browser identifier in local storage. It is **pseudonymous**, not proof of a unique human.
- `page`: top-level page name, unchanged from the original tracker.
- `visited_at`: Supabase server timestamp.
- `session_id`: random per-tab session UUID, rotated after 30 minutes of inactivity.
- `page_detail`: only named project tabs (`ideas`, `simulators`, `hands-on`) when the Projects page is open.
- `visit_source`: broad referrer class, not the original URL or domain.
- `device_class`: coarse responsive viewport bracket, not a physical device identification.
- `navigation_kind`: `entry`, `reload`, or `in_app`.

The tracker does **not** request device location, store IP addresses, capture precise coordinates, persist full URL parameters, record clicks on individual project items, collect user-agent strings, or use fingerprinting. Geographic location cannot be inferred reliably from these records. Existing records retain null values for added fields.

## Interpretation

Counts reflect browser identifiers, not known people. Two browsers can belong to the same person and storage clearing creates a new identifier. A page view does not prove a reader saw specific content. Multiple events in a short interval may come from navigation, reloads, or development testing. The source category `direct` means no recognized referrer, not necessarily typed URL traffic.

## Example read-only analysis (Eastern Time)

```sql
SELECT page, page_detail, COUNT(*) AS page_views,
       COUNT(DISTINCT visitor_id) AS browser_ids,
       COUNT(DISTINCT session_id) AS recorded_sessions
FROM public.page_visits
WHERE visited_at >= ('2026-11-16 00:00'::timestamp AT TIME ZONE 'America/New_York')
  AND visited_at < ('2026-11-17 00:00'::timestamp AT TIME ZONE 'America/New_York')
GROUP BY page, page_detail
ORDER BY page_views DESC;
```

Only project administrators with database access should inspect raw pseudonymous IDs. Keep public-facing reporting aggregate, and avoid asserting visitor identities from browsing patterns. Review data retention and disclosure policies before expanding tracking. Location analytics would require a separately reviewed implementation with coarse estimates and no retained IP addresses.
