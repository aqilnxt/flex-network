# Spec: Work History Pages

## Purpose
Expose verified work history to public profiles and provide a private dashboard for talents to manage their records.

## Scope
- `/work-history`: Private dashboard for logged-in Talents.
- `/profiles/[id]/work-history`: Publicly accessible verified history.

## Data Schema (work_history table)
- `id`, `talent_id`, `hirer_id`, `opportunity_id`, `work_id`
- `title`, `description`, `compensation`, `started_at`, `ended_at`
- `status`: PENDING, VERIFIED, REJECTED
- `verified_at`, `verified_by`

## Design Decisions
1. **Public Privacy**: Public view (`/profiles/[id]/work-history`) MUST ONLY show `status = 'VERIFIED'`. Hirer info is HIDDEN.
2. **Access Control**:
   - Private view requires `requireUser('TALENT')`.
   - Public view is open to `anon`.
3. **RLS Policy**: Add `SELECT` for `anon`/`authenticated` where `status = 'VERIFIED'`.

## Implementation Details
- **Queries**: 
  - `listByTalentId`: All records for owner.
  - `listVerifiedByTalentId`: Verified records only, selected fields.
- **UI**: 
  - List of cards.
  - Fields: Title, Duration (started_at - ended_at), Compensation, Status Badge, Verified Date.

## Verification
- Talent sees all own history.
- Public/Anonymous sees only VERIFIED history.
- Hirer ID not leaked in public query.
