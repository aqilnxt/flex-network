
Application
Talent application
meetings
Meeting
Meeting information
consents
Parental Consent
Simulated consent record
contracts
Contract
Contract/agreement information
payments
Payment
Simulated payment/escrow state
works
Work
Work execution state
ratings
Rating
Two-way rating
work_history
Work History
Verified work record
notifications
Notification
In-app notifications
reports
Report
User/admin reports
audit_logs
Audit Log / Admin
Important state-changing actions

Ownership Principle
Setiap module memiliki ownership terhadap data yang menjadi responsibility-nya.
Contoh:
Opportunity Module
        ↓
opportunities
opportunity_skills
opportunity_interests

Module lain tidak boleh melakukan direct database manipulation terhadap internal data module tersebut.
Communication antar module dilakukan melalui:
Public Module Interface
Application Service
Domain/Application Contract

sesuai Module Boundary Rules pada TDD Point 23-24.

A.4 - Authentication & Profile Boundary
Supabase Auth merupakan source of truth untuk authentication identity.
auth.users
     │
     │ 1:1
     ▼
profiles
     │
     ├── talent_profiles
     │
     └── hirer_profiles

profiles
Berisi data profile yang aman digunakan sebagai identity/public profile baseline.
Contoh data:
id
role
full_name
bio
location
avatar_url
status
created_at
updated_at

profile_private
Berisi data yang tidak boleh menjadi public profile secara default.
Contoh:
profile_id
email
phone
created_at
updated_at

Alasan pemisahan:
Public Profile
        ≠
Private Account Information

RLS bekerja pada level row, bukan sebagai mekanisme utama untuk menyembunyikan kolom tertentu. Karena itu data sensitif tidak sebaiknya hanya "disembunyikan" melalui frontend/API response.

A.5 - Talent Profile
profiles
    │
    │ 1:0..1
    ▼
talent_profiles

Talent profile memiliki:
profile_id
school_name
grade_level
cv_url
portfolio_url
birth_date
is_minor
created_at
updated_at

Minor Rule
is_minor bukan field yang boleh dipercaya dari client.
Secara business logic:
birth_date
    ↓
Server-side age calculation
    ↓
Minor / Adult determination

Dengan demikian:
Client
   ❌
set is_minor = true/false

Server
   ✅
determines minor status

Ini penting karena consent requirement merupakan business/security decision.

A.6 - Hirer Profile
profiles
    │
    │ 1:0..1
    ▼
hirer_profiles

Data:
profile_id
company_name
industry
company_description
website_url
created_at
updated_at

Hirer profile digunakan oleh:
Opportunity
Public Profile
Application Review
Contract
Admin


A.7 - Skills & Interests
Master data:
skills
interests

Talent relationship:
talent_profiles
      │
      ├── talent_skills
      │        │
      │        └── skills
      │
      └── talent_interests
               │
               └── interests

Opportunity relationship:
opportunities
      │
      ├── opportunity_skills
      │        │
      │        └── skills
      │
      └── opportunity_interests
               │
               └── interests

Relationship:
Talent ↔ Skills
Talent ↔ Interests

Opportunity ↔ Skills
Opportunity ↔ Interests

menggunakan many-to-many junction tables.

A.8 - Opportunity Entity
Core entity:
opportunities

Conceptual fields:
id
hirer_id
title
description
opportunity_type
location
work_mode
start_date
end_date
working_hours
duration
compensation
compensation_type
requirements
responsibilities
max_talent
application_deadline
requires_consent
cv_requirement
portfolio_requirement
interview_requirement
meeting_method
other_terms
status
created_at
updated_at

Moderation Metadata
Database design juga mendukung moderation:
submitted_for_review_at
published_at
closed_at

moderated_by
moderated_at
moderation_notes


A.9 - Opportunity Relationship
profiles
   │
   │ 1:M
   ▼
opportunities
   │
   ├── 1:M opportunity_skills
   │        │
   │        └── skills
   │
   └── 1:M opportunity_interests
            │
            └── interests

Opportunity dimiliki oleh:
hirer_id

Ownership menjadi dasar authorization untuk:
Update
Submit for Review
Close
View Private Information


A.10 - Opportunity State
Canonical state:
DRAFT
   ↓
PENDING_REVIEW
   ↓
PUBLISHED
   ↓
CLOSED

Meaning
DRAFT
    Opportunity sedang dibuat/edit.

PENDING_REVIEW
    Hirer telah mengajukan opportunity untuk publikasi.

PUBLISHED
    Opportunity tersedia untuk Talent.

CLOSED
    Opportunity tidak menerima application baru.

Important Rule
Hirer tidak langsung mengubah:
DRAFT → PUBLISHED

Flow normal:
DRAFT
   ↓
PENDING_REVIEW
   ↓
Admin Approval
   ↓
PUBLISHED

Business transition divalidasi oleh Application/Domain layer.
Database constraint tidak dianggap sebagai pengganti state machine.

A.11 - Application Entity
Core entity:
applications

Fields:
id
talent_id
opportunity_id
message
status
applied_at
reviewed_at
selected_at
rejected_at
created_at
updated_at

Structural constraint:
UNIQUE(talent_id, opportunity_id)

Artinya:
1 Talent
+
1 Opportunity
=
1 Application

Constraint ini merupakan database-level defense terhadap duplicate application.

A.12 - Application State
Canonical MVP state:
APPLIED
     ↓
UNDER_REVIEW
     ↓
SELECTED

atau:
UNDER_REVIEW
     ↓
REJECTED

Canonical rejected path:
APPLIED
    ↓
REJECTED

Business rules menentukan transition yang valid.
Contoh:
APPLIED → UNDER_REVIEW     ✅
UNDER_REVIEW → SELECTED    ✅
UNDER_REVIEW → REJECTED    ✅
APPLIED → REJECTED         ✅
REJECTED → SELECTED        ❌
SELECTED → APPLIED         ❌

WITHDRAWN bukan canonical MVP state karena tidak termasuk state final SRS.

A.13 - Meeting Entity
Relationship:
applications
      │
      │ 1:0..1
      ▼
meetings

Fields:
id
application_id
meeting_date
meeting_time
meeting_link
meeting_method
notes
status
completed_at
created_at
updated_at

Structural constraint:
UNIQUE(application_id)

Artinya:
1 Application
=
maximum 1 Meeting


A.14 - Meeting State
Canonical:
SCHEDULED
    ↓
COMPLETED

Alternative:
SCHEDULED
    ↓
CANCELLED

Meeting memiliki role penting dalam contract eligibility.
Application SELECTED
        +
Meeting COMPLETED
        ↓
Contract eligibility


A.15 - Parental Consent
Relationship:
applications
      │
      │ 1:0..1
      ▼
consents

Consent fields secara konseptual:
id
application_id
talent_id
opportunity_id
consent_required
required_reason
status
requested_at
approved_at
rejected_at
created_at
updated_at

Privacy Rule
MVP tidak menyimpan guardian identity/contact information sebagai requirement database utama.
Tidak ada:
KTP
KK
Akta
Guardian account
Guardian password
Guardian phone
Guardian email

Consent merupakan:
Simulated Consent Declaration

bukan independent Guardian verification.

A.16 - Consent Requirement
Consent diperlukan jika salah satu kondisi terpenuhi:
opportunity.requires_consent = true
OR
Talent is minor

Flow:
Meeting COMPLETED
       ↓
System checks consent requirement
       ↓
Consent Required?
   ┌───┴───┐
   NO      YES
   │        │
   ▼        ▼
Contract  PENDING
            ↓
        Declaration
            ↓
      APPROVED / REJECTED


A.17 - Consent State
Canonical:
NOT_REQUIRED
PENDING
APPROVED
REJECTED

Contract eligibility:
Consent NOT_REQUIRED
        OR
Consent APPROVED

Contract harus diblokir ketika:
Consent PENDING
Consent REJECTED
Consent missing while required


A.18 - Contract Entity
Relationship:
applications
      │
      │ 1:0..1
      ▼
contracts

Contract juga menyimpan relationship langsung ke:
opportunity
talent
hirer

Fields:
id
application_id
opportunity_id
talent_id
hirer_id
contract_number
role_title
description
responsibilities
duration
location
compensation
terms_conditions
status

proposed_at
proposed_by

talent_agreed
hirer_agreed
talent_agreed_at
hirer_agreed_at

activated_at
completed_at

terminated_at
decline_reason

created_at
updated_at


A.19 - Contract State
Canonical:
DRAFT
    ↓
PENDING_AGREEMENT
    ↓
ACTIVE
    ↓
COMPLETED

Alternative:
PENDING_AGREEMENT
    ↓
TERMINATED

Contract Eligibility
Contract hanya dapat dibuat jika:
Application = SELECTED
AND
Meeting = COMPLETED
AND
(
  Consent = NOT_REQUIRED
  OR
  Consent = APPROVED
)


A.20 - Contract Agreement
Agreement menggunakan simulated agreement.
Tidak ada:
Digital signature
External e-signature provider
Cryptographic signature

Agreement state:
Talent agrees
Hirer agrees

Contract ACTIVE hanya jika:
talent_agreed = true
AND
hirer_agreed = true

Side effects:
Contract ACTIVE
      ↓
Payment PENDING
      +
Work NOT_STARTED


A.21 - Payment Entity
Relationship:
contracts
    │
    │ 1:0..1
    ▼
payments

Fields:
id
contract_id
amount
currency
status
held_at
released_at
held_by
released_by
created_at
updated_at

Financial representation:
amount = INTEGER
currency = IDR

Contoh:
Rp1.500.000
↓
1500000


A.22 - Payment State
Canonical MVP:
PENDING
    ↓
SIMULATED_PAID
    ↓
RELEASED

Meaning:
PENDING
    Payment belum disimulasikan.

SIMULATED_PAID
    Dana dianggap telah ditahan secara simulasi.

RELEASED
    Dana dianggap telah dicairkan secara simulasi.

Tidak ada real payment gateway pada MVP.

A.23 - Payment Release Rule
Payment hanya dapat menjadi:
RELEASED

jika:
Payment = SIMULATED_PAID
AND
Work = COMPLETED
AND
Hirer Confirmed = true

Database design menyimpan state dan relationship.
Business validation dilakukan pada server/Application layer.

A.24 - Work Entity
Relationship:
contracts
    │
    │ 1:0..1
    ▼
works

Fields:
id
contract_id
status
started_at
completed_at
hirer_confirmed
hirer_confirmed_at
confirmed_by
notes
created_at
updated_at


A.25 - Work State
Canonical:
NOT_STARTED
      ↓
IN_PROGRESS
      ↓
COMPLETED

Rules:
NOT_STARTED → IN_PROGRESS ✅
IN_PROGRESS → COMPLETED ✅
NOT_STARTED → COMPLETED ❌


A.26 - Work Completion & Confirmation
Flow:
Talent
  ↓
Work IN_PROGRESS
  ↓
Work COMPLETED
  ↓
Hirer Confirmation
  ↓
Verified Work History
  ↓
Payment RELEASED
  ↓
Contract COMPLETED

Hirer confirmation merupakan verification event.

A.27 - Rating Entity
Relationship:
works
   │
   │ 1:M
   ▼
ratings

Rating memiliki:
work_id
contract_id
rater_id
ratee_id
rating_type
score
review_text
created_at

Two-way rating:
TALENT_RATES_HIRER
HIRER_RATES_TALENT

Structural uniqueness:
UNIQUE(work_id, rater_id, rating_type)


A.28 - Rating Eligibility
Rating dapat dibuat setelah:
Work = COMPLETED

Rater harus merupakan salah satu pihak pada contract:
Talent
OR
Hirer

Rating score:
1-5

Rating tidak menjadi prerequisite untuk:
Payment Release

dan tidak menjadi prerequisite untuk:
Work History Verification

Rating merupakan bagian dari trust system setelah pekerjaan selesai.

A.29 - Work History Entity
Relationship:
contracts
    │
    │ 1:0..1
    ▼
work_history

Fields:
id
contract_id
talent_id
opportunity_id
title
description
duration
compensation
verification_status
verified_at
verified_by
verification_notes
created_at
updated_at


A.30 - Work History Lifecycle
Canonical flow:
Work COMPLETED
      ↓
Work History PENDING
      ↓
Hirer Confirmation
      ↓
Work History VERIFIED

VERIFIED berarti:
Work completed
+
Hirer confirmed completion

Talent tidak boleh melakukan:
PENDING → VERIFIED

sendiri.
Admin dapat melakukan verification override untuk kasus moderation/dispute sesuai authorization policy.

A.31 - Notification Entity
Relationship:
profiles
    │
    │ 1:M
    ▼
notifications

Fields:
id
user_id
type
title
message
link
is_read
created_at

Notification merupakan:
Non-critical side effect

Kegagalan notification tidak membatalkan core business transaction.

A.32 - Report Entity
Relationship:
profiles
    │
    │ 1:M
    ▼
reports

Target report dapat berupa:
User
Opportunity
Application

Minimal satu target harus ada.
State:
SUBMITTED
   ↓
UNDER_REVIEW
   ↓
RESOLVED

atau:
UNDER_REVIEW
   ↓
REJECTED


A.33 - Audit Log Entity
Fields:
id
actor_id
actor_type
action
resource_type
resource_id
metadata
created_at

Actor type:
USER
ADMIN
SYSTEM

Audit log digunakan untuk important state-changing actions.
Contoh:
USER
Application submitted

ADMIN
User suspended

ADMIN
Opportunity moderated

SYSTEM
Opportunity auto-closed

Audit log bersifat append-oriented.
User biasa tidak memiliki permission untuk:
UPDATE
DELETE

audit records.

A.34 - Complete Relationship Map
AUTH.USERS
    │
    ▼
PROFILES
    │
    ├───────────────► PROFILE_PRIVATE
    │
    ├───────────────► TALENT_PROFILES
    │                       │
    │                       ├──► TALENT_SKILLS ──► SKILLS
    │                       │
    │                       └──► TALENT_INTERESTS ──► INTERESTS
    │
    ├───────────────► HIRER_PROFILES
    │
    ├───────────────► OPPORTUNITIES
    │                       │
    │                       ├──► OPPORTUNITY_SKILLS ──► SKILLS
    │                       │
    │                       └──► OPPORTUNITY_INTERESTS ──► INTERESTS
    │
    ├───────────────► APPLICATIONS
    │                       │
    │                       ├──► MEETINGS
    │                       │
    │                       ├──► CONSENTS
    │                       │
    │                       └──► CONTRACTS
    │                                  │
    │                                  ├──► PAYMENTS
    │                                  │
    │                                  ├──► WORKS
    │                                  │       │
    │                                  │       └──► RATINGS
    │                                  │
    │                                  └──► WORK_HISTORY
    │
    ├───────────────► NOTIFICATIONS
    │
    ├───────────────► REPORTS
    │
    └───────────────► AUDIT_LOGS


A.35 - Canonical Status Mapping
Domain
Canonical Database State
Notes
User
ACTIVE
Active account
User
SUSPENDED
Admin restriction
User
DEACTIVATED
Deactivated account
Opportunity
DRAFT
Draft
Opportunity
PENDING_REVIEW
Submitted for moderation
Opportunity
PUBLISHED
Public/available
Opportunity
CLOSED
Closed
Application
APPLIED
Submitted
Application
UNDER_REVIEW
Being reviewed
Application
SELECTED
Selected
Application
REJECTED
Rejected
Meeting
SCHEDULED
Scheduled
Meeting
COMPLETED
Completed
Meeting
CANCELLED
Cancelled
Consent
NOT_REQUIRED
No consent needed
Consent
PENDING
Awaiting declaration
Consent
APPROVED
Approved
Consent
REJECTED
Rejected
Contract
DRAFT
Being prepared
Contract
PENDING_AGREEMENT
Awaiting both parties
Contract
ACTIVE
Both parties agreed
Contract
COMPLETED
Finished
Contract
TERMINATED
Ended without completion
Payment
PENDING
Awaiting simulation
Payment
SIMULATED_PAID
Simulated held
Payment
RELEASED
Simulated release
Work
NOT_STARTED
Not started
Work
IN_PROGRESS
Work ongoing
Work
COMPLETED
Talent completed
Work History
PENDING
Awaiting verification
Work History
VERIFIED
Hirer verified
Work History
REJECTED
Verification rejected/revoked
Report
SUBMITTED
New report
Report
UNDER_REVIEW
Being reviewed
Report
RESOLVED
Resolved
Report
REJECTED
Report rejected

Canonical Rule
REJECTED adalah satu-satunya canonical database state untuk Work History yang verification-nya ditolak atau dicabut.
UNVERIFIED tidak digunakan sebagai canonical database status.

A.36 - Structural Constraints
Database layer enforces structural integrity such as:
Primary Keys
Foreign Keys
Unique Constraints
Not Null
Check Constraints
Indexes

Core uniqueness rules
1 Talent + 1 Opportunity
    → 1 Application

1 Application
    → maximum 1 Meeting

1 Application
    → maximum 1 Consent

1 Application
    → maximum 1 Contract

1 Contract
    → maximum 1 Payment

1 Contract
    → maximum 1 Work

1 Contract
    → maximum 1 Work History

1 Work + 1 Rater + 1 Rating Type
    → maximum 1 Rating


A.37 - Business Rule vs Database Responsibility
Concern
Primary Responsibility
Primary key
Database
Foreign key
Database
Duplicate application
Database + Application
Required field
Database + Validation
Score 1-5
Database + Validation
Role authorization
Server + RLS
Resource ownership
Server + RLS
Application transition
Domain/Application
Meeting transition
Domain/Application
Consent eligibility
Domain/Application
Contract eligibility
Domain/Application
Payment release eligibility
Domain/Application
Work state transition
Domain/Application
Rating eligibility
Domain/Application
Notification trigger
Application/Business Event
Audit creation
Application/System
Public/private response shaping
API/Application
Sensitive data exposure
Server/API + DB access policy

Important Principle
Database constraint
        ≠
Business logic

Database menjaga integrity.
Application/Domain menjaga business rules.

A.38 - RLS Architecture
RLS merupakan defense-in-depth layer.
Conceptual flow:
Client Request
      ↓
Authentication
      ↓
Authorization
      ↓
Application/Domain Rule
      ↓
Repository
      ↓
Supabase/PostgreSQL
      ↓
RLS
      ↓
Database

RLS tidak menggantikan:
Authentication
Authorization
Business Rules
State Machine

Supabase sendiri merekomendasikan RLS sebagai lapisan proteksi row-level dan menekankan bahwa table yang terekspos melalui API perlu dilindungi dengan RLS/grants yang sesuai.

A.39 - Sensitive Data Boundary
Data berikut diperlakukan sebagai restricted/private:
Email
Phone
Birth Date
Consent metadata
Internal Admin Notes
Audit Metadata
Moderation Notes
Internal Security Information

Public profile tidak otomatis berarti:
SELECT *
FROM profiles

Public response harus dibentuk oleh API/Application layer atau access-controlled database object yang hanya mengekspos field yang diperbolehkan.
Jika memakai SECURITY DEFINER function untuk access control, function harus diamankan dengan explicit search_path dan tidak ditempatkan sebagai exposed API function secara sembarangan.

A.40 - Database Security Principles
Kita lock:
1. RLS enabled on exposed application tables.
2. Ownership checks are enforced server-side.
3. Service role is server-only.
4. Sensitive data is minimized.
5. Public profile data is explicitly selected.
6. Audit records are append-oriented.
7. Database constraints protect structural integrity.
8. Business state transitions remain server/domain responsibility.
9. Raw SQL migrations are version-controlled.
10. Production schema changes happen through reviewed migrations.


A.41 - Migration Ownership
Database changes dibuat melalui:
Feature Branch
      ↓
Migration File
      ↓
Review
      ↓
Test
      ↓
Merge
      ↓
Deployment

Example:
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_indexes.sql
    ├── 003_rls_policies.sql
    └── 004_triggers.sql

Raw SQL tidak menjadi bagian utama dari TDD Appendix ini.

A.42 - Seed Data Structure
Untuk development dan ITechnoCup demo:
Users
├── 500+ Talents
├── 50+ Hirers
└── 1+ Admin

Skills
└── 30+ skills

Interests
└── 20+ interests

Opportunities
└── 200+

Applications
└── 300+

Meetings
└── 100+

Contracts
└── 80+

Payments
└── representative simulated states

Works
└── representative lifecycle states

Ratings
└── two-way rating examples

Work History
└── 120+ VERIFIED examples

Notifications
└── representative event examples

Reports
└── representative moderation scenarios

Seed data harus:
Deterministic
Reproducible
Non-sensitive
Development-safe
Competition-safe

Production seed tidak boleh menggunakan data personal nyata.

A.43 - Demo Dataset Distribution
Untuk competition demo, dataset dapat memperlihatkan seluruh canonical lifecycle berikut.
Opportunity
DRAFT
PENDING_REVIEW
PUBLISHED
CLOSED
Application
APPLIED
UNDER_REVIEW
SELECTED
REJECTED
Meeting
SCHEDULED
COMPLETED
CANCELLED
Consent
NOT_REQUIRED
PENDING
APPROVED
REJECTED
Contract
DRAFT
PENDING_AGREEMENT
ACTIVE
COMPLETED
TERMINATED
Payment
PENDING
SIMULATED_PAID
RELEASED
Work
NOT_STARTED
IN_PROGRESS
COMPLETED
Work History
PENDING
VERIFIED
REJECTED
Report
SUBMITTED
UNDER_REVIEW
RESOLVED
REJECTED
Demo Dataset Principle
Dataset demo harus:
menggunakan canonical status yang sama dengan SRS dan API Specification;
menggunakan state transition yang valid;
tidak memperkenalkan status tambahan di luar canonical state;
tetap deterministic dan reproducible;
tidak menggunakan data personal nyata.
Dengan demikian, seluruh demo dataset menggunakan single status vocabulary yang konsisten antara:
SRS
 ↓
API Specification
 ↓
TDD Appendix A
 ↓
Database
 ↓
Frontend
 ↓
Testing

A.44 - Database → API Alignment
Database design harus mendukung API Specification v1.2.
Authentication
Supabase Auth
↓
profiles

Profile
profiles
profile_private
talent_profiles
hirer_profiles
talent_skills
talent_interests

Opportunity
opportunities
opportunity_skills
opportunity_interests

Application
applications

Meeting
meetings

Consent
consents

Contract
contracts

Payment
payments

Work
works

Rating
ratings

Work History
work_history

Notification
notifications

Reporting/Admin
reports
audit_logs


A.45 - Database → Module Ownership
Profile Module
├── profiles
├── profile_private
├── talent_profiles
├── hirer_profiles
├── skills
├── interests
├── talent_skills
└── talent_interests

Opportunity Module
├── opportunities
├── opportunity_skills
└── opportunity_interests

Application Module
└── applications

Meeting Module
└── meetings

Parental Consent Module
└── consents

Contract Module
└── contracts

Payment Module
└── payments

Work Module
└── works

Rating / Work History Module
├── ratings
└── work_history

Notification Module
└── notifications

Report Module
└── reports

Admin / Audit Module
└── audit_logs


A.46 - Database Dependency Direction
Conceptual dependency:
Supabase Auth
      ↓
Profiles
      ↓
Talent / Hirer Profile
      ↓
Opportunity
      ↓
Application
      ↓
Meeting
      ↓
Consent
      ↓
Contract
      ↓
Payment + Work
      ↓
Rating + Work History

Supporting systems:
Notification
Report
Audit Log

dapat terhubung melalui business events tanpa menjadi owner business state module lain.

A.47 - Core Business Relationship
Canonical business chain:
Talent
   ↓
Application
   ↓
Selected
   ↓
Meeting Completed
   ↓
Consent if required
   ↓
Contract
   ↓
Both Agree
   ↓
Contract Active
   ↓
Payment Pending
   ↓
Simulated Paid
   ↓
Work
   ↓
Work Completed
   ↓
Hirer Confirms
   ↓
Payment Released
   ↓
Verified Work History
   ↓
Rating


A.48 - Database Integrity Principles
Kita lock:
1. PostgreSQL is the persistent source of truth.
2. Foreign keys protect relationship integrity.
3. Unique constraints protect duplicate-sensitive operations.
4. Check constraints protect simple structural invariants.
5. RLS protects row-level access.
6. Sensitive data is separated or access-controlled explicitly.
7. Business state transitions remain application/domain responsibility.
8. Database schema changes are version-controlled through migrations.
9. Seed data is reproducible and non-sensitive.
10. Production changes require reviewed migrations.

A.49 - MVP vs Future
MVP 🔒
✅ Supabase PostgreSQL
✅ Supabase Auth
✅ Relational schema
✅ Canonical status enums
✅ Foreign keys
✅ Unique constraints
✅ Basic check constraints
✅ RLS
✅ Indexed ownership columns
✅ Simulated payment
✅ Simulated consent
✅ Two-way rating
✅ Verified Work History
✅ Audit Log
✅ Migration-based schema management
✅ Seed data
Future 🔜
🔜 Advanced database partitioning
🔜 Read replicas
🔜 Advanced search indexes
🔜 Specialized analytics storage
🔜 Advanced archival strategy
🔜 Data warehouse
🔜 Multi-region database

A.50 - FINAL DECISION
Database Architecture: Flex Network menggunakan Supabase PostgreSQL sebagai persistent source of truth.
Authentication: Supabase Auth menjadi source of truth untuk authentication identity.
Profile Boundary: Public profile information dipisahkan secara konseptual dari private account information.
Ownership: Setiap database entity memiliki module owner yang jelas.
Opportunity: Opportunity menggunakan lifecycle DRAFT → PENDING_REVIEW → PUBLISHED → CLOSED.
Application: Application menggunakan canonical MVP state APPLIED → UNDER_REVIEW → SELECTED / REJECTED.
Meeting: Meeting menggunakan SCHEDULED → COMPLETED / CANCELLED.
Consent: Consent menggunakan NOT_REQUIRED / PENDING / APPROVED / REJECTED dan diproses setelah Meeting Completed ketika diperlukan.
Contract: Contract menggunakan DRAFT → PENDING_AGREEMENT → ACTIVE → COMPLETED / TERMINATED.
Payment: Payment menggunakan PENDING → SIMULATED_PAID → RELEASED.
Work: Work menggunakan NOT_STARTED → IN_PROGRESS → COMPLETED.
Rating: Rating bersifat two-way dan dapat dibuat setelah Work COMPLETED oleh pihak yang terlibat.
Work History: Work History dibuat PENDING dan menjadi VERIFIED setelah Hirer confirmation.
Security: RLS digunakan sebagai defense-in-depth bersama authentication, authorization, ownership checks, dan server-side business rules.
Privacy: Consent dan private profile data menggunakan data minimization dan tidak dirancang sebagai public information.
Integrity: Foreign keys, unique constraints, not-null constraints, check constraints, dan indexes digunakan untuk structural integrity.
Business Logic: Database constraints tidak menggantikan Domain/Application business rules.
Implementation: Raw SQL schema, indexes, RLS, triggers, dan migrations berada di repository, bukan sebagai raw implementation dump di TDD.
Migration: Semua production schema changes dilakukan melalui version-controlled migrations.
Seed: Development dan competition menggunakan reproducible, deterministic, non-sensitive seed data.
Architecture Alignment: Appendix A menjadi database design reference untuk API Specification v1.2 dan Modular Monolith architecture.
APPENDIX A - LOCKED 🔒