FLEX NETWORK — API SPECIFICATION
Version: 1.2
Status: FINAL & LOCKED 🔒
Base URL: /api
Backend: Next.js Route Handlers + Server Actions
Authentication: Supabase Auth
Database: Supabase PostgreSQL
Authorization: RBAC + Resource Ownership + RLS
Validation: Zod
Primary Contract: REST API
MVP Scope: Simulated Contract, Simulated Payment, Simulated Parental Consent

0. DOCUMENT ALIGNMENT
API Specification ini menjadi kontrak backend untuk implementation dan harus sinkron dengan:
BRD Final
SRS Final
TDD Point 19–43
TDD Appendix A — Database ERD & Supabase Schema
ITechnoCup Guidebook requirements
Prioritas keputusan:
SRS Final
   ↓
BRD Final
   ↓
TDD Final
   ↓
API Specification
   ↓
Implementation

API Specification ini menggunakan status dan field yang telah ditetapkan pada Appendix A v1.1.

1. API CONVENTIONS
1.1 Response Format
Success Response
{
  "success": true,
  "data": {}
}

List Response
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "details": {}
  }
}


1.2 HTTP Status Codes
Code
Meaning
200
Request berhasil
201
Resource berhasil dibuat
204
Request berhasil tanpa response body
400
Bad Request
401
Authentication diperlukan/tidak valid
403
User tidak memiliki permission
404
Resource tidak ditemukan
409
Conflict / business rule conflict
422
Validation error
429
Rate limited
500
Internal server error
503
Service unavailable


1.3 Authentication
Endpoint yang tidak ditandai PUBLIC membutuhkan:
Authorization: Bearer <supabase_access_token>

Authentication dilakukan melalui Supabase Auth.
Role diambil dari:
profiles.role

Role:
TALENT
HIRER
ADMIN


1.4 Role Legend
Symbol
Role
🌐
Public
🔐
Authenticated user
🎓
Talent
💼
Hirer
🛡️
Admin


1.5 Pagination
Default:
page  = 1
limit = 20
max   = 100

Supported query parameters:
page
limit
sort
order

sort harus menggunakan whitelist field yang telah ditentukan endpoint.
User tidak boleh memasukkan arbitrary SQL field.

2. CANONICAL STATUS
2.1 User
ACTIVE
SUSPENDED
DEACTIVATED

2.2 Opportunity
DRAFT
PENDING_REVIEW
PUBLISHED
CLOSED

Lifecycle:
DRAFT
   ↓
PENDING_REVIEW
   ↓
PUBLISHED
   ↓
CLOSED


2.3 Application
APPLIED
UNDER_REVIEW
SELECTED
REJECTED

Lifecycle utama:
APPLIED
   ↓
UNDER_REVIEW
   ├──→ SELECTED
   └──→ REJECTED

WITHDRAWN bukan status MVP.

2.4 Meeting
SCHEDULED
COMPLETED
CANCELLED


2.5 Consent
NOT_REQUIRED
PENDING
APPROVED
REJECTED


2.6 Contract
DRAFT
PENDING_AGREEMENT
ACTIVE
COMPLETED
TERMINATED

Lifecycle:
DRAFT
   ↓
PENDING_AGREEMENT
   ↓
ACTIVE
   ├──→ COMPLETED
   └──→ TERMINATED


2.7 Payment
PENDING
SIMULATED_PAID
RELEASED

Lifecycle:
PENDING
   ↓
SIMULATED_PAID
   ↓
RELEASED

SIMULATED_PAID adalah canonical database status untuk kondisi funds held/simulated escrow.

2.8 Work
NOT_STARTED
IN_PROGRESS
COMPLETED


2.9 Work History
PENDING
VERIFIED
REJECTED


2.10 Report
SUBMITTED
UNDER_REVIEW
RESOLVED
REJECTED


3. ERROR CODES
Canonical machine-readable error codes:
AUTH_REQUIRED
AUTH_INVALID

FORBIDDEN
VALIDATION_ERROR
NOT_FOUND

DUPLICATE_APPLICATION
OPPORTUNITY_NOT_PUBLISHED
OPPORTUNITY_CLOSED
INVALID_OPPORTUNITY_STATE

INVALID_APPLICATION_STATE

INVALID_MEETING_STATE

INVALID_CONSENT_STATE
CONSENT_REQUIRED
CONSENT_PENDING
CONSENT_REJECTED

INVALID_CONTRACT_STATE
CONTRACT_BLOCKED_BY_MEETING
CONTRACT_BLOCKED_BY_CONSENT
CONTRACT_ALREADY_ACTIVE

INVALID_PAYMENT_STATE
PAYMENT_NOT_HELD
PAYMENT_NOT_RELEASED

INVALID_WORK_STATE
WORK_NOT_COMPLETED

RATING_ALREADY_EXISTS

REPORT_ALREADY_EXISTS

RATE_LIMITED

INTERNAL_ERROR
SERVICE_UNAVAILABLE


4. AUTH MODULE
4.1 Register
POST /api/auth/register

Auth: 🌐 PUBLIC
Request
{
  "email": "andi@example.com",
  "password": "securepassword",
  "role": "TALENT",
  "fullName": "Andi"
}

Rules
role hanya TALENT atau HIRER.
ADMIN tidak dapat melakukan self-registration.
Email harus valid.
Email harus unique.
Password mengikuti minimum security policy.
profiles dibuat setelah authentication identity berhasil.
Role Talent membuat talent_profiles.
Role Hirer membuat hirer_profiles.
Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "andi@example.com"
    },
    "role": "TALENT"
  }
}


4.2 Login
POST /api/auth/login

Auth: 🌐 PUBLIC
Request
{
  "email": "andi@example.com",
  "password": "securepassword"
}

Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "andi@example.com",
      "role": "TALENT",
      "fullName": "Andi"
    }
  }
}

Authentication session dikelola oleh Supabase Auth.

4.3 Logout
POST /api/auth/logout

Auth: 🔐 AUTH
Response
{
  "success": true,
  "data": null
}


4.4 Get Session
GET /api/auth/session

Auth: 🔐 AUTH
Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "andi@example.com",
    "role": "TALENT",
    "fullName": "Andi",
    "status": "ACTIVE"
  }
}


5. PROFILE MODULE
5.1 Get Own Profile
GET /api/profile

Auth: 🔐 AUTH
Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "TALENT",
    "fullName": "Andi",
    "email": "andi@example.com",
    "phone": "+628123456789",
    "bio": "Frontend developer student.",
    "location": "Jakarta",
    "avatarUrl": "https://...",
    "status": "ACTIVE",
    "talentProfile": {
      "schoolName": "SMK Negeri 1",
      "gradeLevel": "XI",
      "cvUrl": "https://...",
      "portfolioUrl": "https://...",
      "birthDate": "2008-05-15",
      "isMinor": true,
      "skills": [],
      "interests": []
    }
  }
}


5.2 Update Own Profile
PATCH /api/profile

Auth: 🔐 AUTH
User hanya dapat mengubah data miliknya.
Tidak dapat mengubah:
id
role
status

Example
{
  "fullName": "Andi Pratama",
  "phone": "+628123456789",
  "bio": "Frontend developer student.",
  "location": "Jakarta"
}


5.3 Get Public Profile
GET /api/profiles/:id

Auth: 🔐 AUTH
Public profile tidak boleh mengembalikan data sensitif seperti:
email
phone
birth_date

Talent profile dapat menampilkan:
full_name
bio
location
skills
interests
portfolio_url
rating summary
verified work history

Hirer profile dapat menampilkan:
full_name
company_name
industry
company_description
website_url
public opportunity history


5.4 Add Talent Skill
POST /api/profile/skills

Auth: 🎓 TALENT
Request
{
  "skillId": "uuid",
  "proficiency": "BEGINNER"
}


5.5 Remove Talent Skill
DELETE /api/profile/skills/:skillId

Auth: 🎓 TALENT
Response
204 No Content


5.6 Add Talent Interest
POST /api/profile/interests

Auth: 🎓 TALENT
Request
{
  "interestId": "uuid"
}


5.7 Remove Talent Interest
DELETE /api/profile/interests/:interestId

Auth: 🎓 TALENT
Response
204 No Content


5.8 Get Skills
GET /api/skills

Auth: 🔐 AUTH

5.9 Get Interests
GET /api/interests

Auth: 🔐 AUTH

6. OPPORTUNITY MODULE
6.1 List Opportunities
GET /api/opportunities

Auth: 🌐 PUBLIC untuk opportunity PUBLISHED
Query:
search
status
type
workMode
location
skillId
interestId
compensationType
sort
order
page
limit

Rules:
Public/Talent hanya mendapatkan PUBLISHED.
Hirer dapat melihat opportunity miliknya.
Admin dapat melihat semua status melalui admin endpoint.

6.2 Create Opportunity
POST /api/opportunities

Auth: 💼 HIRER
Request
{
  "title": "Frontend Developer Intern",
  "description": "Membantu mengembangkan website perusahaan.",
  "opportunityType": "INTERNSHIP",
  "location": "Jakarta",
  "workMode": "REMOTE",
  "startDate": "2026-09-15",
  "endDate": "2026-12-15",
  "workingHours": "20 jam/minggu",
  "duration": "3 bulan",
  "compensation": "Rp1.500.000",
  "compensationType": "PAID",
  "requirements": "Menguasai dasar HTML dan CSS.",
  "responsibilities": "Membantu pengembangan frontend.",
  "maxTalent": 2,
  "applicationDeadline": "2026-09-01T23:59:00Z",
  "requiresConsent": false,
  "cvRequirement": "OPTIONAL",
  "portfolioRequirement": "REQUIRED",
  "interviewRequirement": true,
  "meetingMethod": "External Link",
  "otherTerms": "Jam kerja fleksibel.",
  "skillIds": ["uuid"],
  "interestIds": ["uuid"]
}

Initial State
DRAFT


6.3 Get Opportunity Detail
GET /api/opportunities/:id

Auth:
PUBLIC → PUBLISHED
HIRER → Own opportunity
ADMIN → All opportunity

Response memuat:
basic opportunity information
hirer
skills
interests
requirements
responsibilities
application requirements
meeting method
status
timestamps


6.4 Update Opportunity
PATCH /api/opportunities/:id

Auth: 💼 HIRER own / 🛡️ ADMIN
Hirer tidak boleh mengubah opportunity milik user lain.

6.5 Submit Opportunity for Review
POST /api/opportunities/:id/submit-review

Auth: 💼 HIRER own
State
DRAFT → PENDING_REVIEW

Rules
Required fields harus lengkap.
applicationDeadline wajib ada.
Deadline harus valid.
Opportunity belum boleh CLOSED.
Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING_REVIEW"
  }
}


6.6 Close Opportunity
POST /api/opportunities/:id/close

Auth: 💼 HIRER own / 🛡️ ADMIN
State
PUBLISHED → CLOSED

Application baru tidak dapat dibuat setelah CLOSED.

6.7 Delete Opportunity
DELETE /api/opportunities/:id

Auth:
HIRER → DRAFT only
ADMIN → according to moderation policy

Untuk data yang sudah digunakan business workflow, deletion harus mempertimbangkan referential integrity.

7. APPLICATION MODULE
7.1 List Own Applications
GET /api/applications

Auth: 🎓 TALENT
Query:
status
page
limit
sort
order

Talent hanya mendapatkan application miliknya.

7.2 List Opportunity Applications
GET /api/applications?opportunityId=:id

Auth: 💼 HIRER
Hanya application dari opportunity milik Hirer.

7.3 Apply
POST /api/applications

Auth: 🎓 TALENT
Request
{
  "opportunityId": "uuid",
  "message": "Saya tertarik dengan opportunity ini."
}

Requirements
Opportunity = PUBLISHED
Application deadline belum lewat
No duplicate application
Talent authenticated
Talent authorized

Initial State
APPLIED

Database protection:
UNIQUE(talent_id, opportunity_id)

Side Effect
Create Application
↓
Create Notification
↓
Notify Hirer
↓
Audit


7.4 Get Application Detail
GET /api/applications/:id

Auth:
Talent owner
Hirer owning related opportunity
Admin


7.5 Move Application to Review
POST /api/applications/:id/review

Auth: 💼 HIRER
State
APPLIED → UNDER_REVIEW


7.6 Select Application
POST /api/applications/:id/select

Auth: 💼 HIRER
State
UNDER_REVIEW → SELECTED

Side Effects
Update application
↓
Notification Talent
↓
Audit log


7.7 Reject Application
POST /api/applications/:id/reject

Auth: 💼 HIRER
State
UNDER_REVIEW → REJECTED

Request
{
  "reason": "Posisi sudah terpenuhi."
}


8. MATCHING MODULE
8.1 Recommendations
GET /api/matching/recommendations
Auth: 🎓 TALENT
Endpoint mengembalikan rekomendasi opportunity berdasarkan rule-based weighted matching.
Matching Input
Sistem menggunakan:
Talent Skills
Talent Interests
Opportunity Required Skills
Opportunity Relevant Interests
Matching Calculation
Skill Match
Skill Match =
(Matched Skills / Required Skills) × 100
Apabila opportunity tidak memiliki required skills:
Skill Match = 100
Interest Match
Interest Match =
(Matched Interests / Relevant Interests) × 100
Apabila opportunity tidak memiliki relevant interests:
Interest Match = 100
Final Match Score
Final Match Score =
(Skill Match × 0.70) +
(Interest Match × 0.30)
Matching Weight
Skill Match    = 70%
Interest Match = 30%
Score Range
0–100
Nilai dapat berupa decimal.
Match Classification
Score
Classification
80.00–100.00
STRONG_MATCH
60.00–79.99
GOOD_MATCH
30.00–59.99
WEAK_MATCH
0.00–29.99
NO_MATCH

Classification ditentukan oleh server berdasarkan finalMatchScore.
Response
{
  "success": true,
  "data": [
    {
      "opportunity": {
        "id": "uuid",
        "title": "Frontend Developer Intern"
      },
      "matchedSkills": [
        "HTML",
        "CSS",
        "React"
      ],
      "matchedInterests": [
        "Web Development"
      ],
      "skillMatchScore": 80.00,
      "interestMatchScore": 66.67,
      "finalMatchScore": 76.00,
      "matchStrength": "GOOD_MATCH"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
Server-Side Calculation
Perhitungan harus dilakukan pada server/application layer:
Talent Skills
      +
Talent Interests
      +
Opportunity Required Skills
      +
Opportunity Relevant Interests
      ↓
Matching Service
      ↓
Skill Match
      ↓
Interest Match
      ↓
Weighted Final Match Score
      ↓
Match Classification
      ↓
API Response
      ↓
Frontend
Frontend tidak boleh menjadi sumber kebenaran untuk:
skillMatchScore
interestMatchScore
finalMatchScore
matchStrength
Deterministic Rule
Untuk input TALENT dan opportunity yang sama, sistem harus menghasilkan score dan classification yang konsisten selama weight dan rule matching tidak berubah.
Recommendation Constraint
Matching hanya digunakan sebagai:
Recommendation / Decision Support
Matching tidak boleh:
Mengubah application menjadi SELECTED.
Membuat hiring decision otomatis.
Membuat contract otomatis.
Menggantikan review HIRER.

8.2 Specific Match Score
GET /api/matching/score?opportunityId=:id
Auth: 🎓 TALENT
Endpoint mengembalikan detail perhitungan matching untuk satu opportunity.
Response
{
  "success": true,
  "data": {
    "opportunityId": "uuid",
    "matchedSkills": [
      "HTML",
      "CSS"
    ],
    "matchedInterests": [
      "Web Development"
    ],
    "skillMatchScore": 80.00,
    "interestMatchScore": 66.67,
    "finalMatchScore": 76.00,
    "matchStrength": "GOOD_MATCH",
    "weights": {
      "skill": 0.70,
      "interest": 0.30
    }
  }
}

9. MEETING MODULE
9.1 List Meetings
GET /api/meetings

Auth: 🔐 AUTH
Talent hanya mendapatkan meeting terkait application miliknya.
Hirer hanya mendapatkan meeting terkait opportunity miliknya.

9.2 Schedule Meeting
POST /api/meetings

Auth: 💼 HIRER
Request
{
  "applicationId": "uuid",
  "meetingDate": "2026-08-20",
  "meetingTime": "14:00",
  "meetingLink": "https://meet.google.com/example",
  "meetingMethod": "Google Meet",
  "notes": "Interview via video call."
}

Rules
Application = SELECTED

State
SCHEDULED

Database:
UNIQUE(application_id)


9.3 Get Meeting Detail
GET /api/meetings/:id

Auth: 🔐 involved parties / 🛡️ ADMIN

9.4 Update Meeting
PATCH /api/meetings/:id

Auth: 💼 HIRER
Valid only while:
SCHEDULED


9.5 Complete Meeting
POST /api/meetings/:id/complete

Auth: 💼 HIRER
State
SCHEDULED → COMPLETED

Critical Rule
Contract tidak dapat dibuat sebelum:
Meeting = COMPLETED


9.6 Cancel Meeting
POST /api/meetings/:id/cancel

Auth: 💼 HIRER
State
SCHEDULED → CANCELLED


10. PARENTAL CONSENT MODULE
10.1 Consent Requirement
Consent required apabila:
opportunity.requires_consent = true
OR
talent_profiles.is_minor = true
Evaluasi consent dilakukan server-side.
Client tidak boleh menentukan sendiri apakah consent required.
Privacy Rules
Consent hanya diproses untuk application yang memenuhi kondisi.
Server menentukan required berdasarkan business rules.
MVP menggunakan simulated consent declaration.
MVP tidak menyediakan independent Guardian Account.
MVP tidak menyediakan Guardian Dashboard.
MVP tidak menyediakan independent Guardian Authentication.
Sistem tidak meminta atau menyimpan dokumen identitas wali seperti KTP, KK, atau dokumen identitas lainnya.
API hanya menerima data minimum yang diperlukan untuk membuat simulated consent record.

10.2 Get Consent
GET /api/parental-consents?applicationId=
Auth:
Talent owner
Hirer owner
Admin
Response — Consent Required
{
  "success": true,
  "data": {
    "required": true,
    "status": "PENDING"
  }
}
Response — Consent Not Required
{
  "success": true,
  "data": {
    "required": false,
    "status": "NOT_REQUIRED"
  }
}
Authorization Rules
TALENT hanya dapat melihat consent yang berkaitan dengan application miliknya.
HIRER hanya dapat melihat consent yang berkaitan dengan opportunity miliknya.
ADMIN dapat melihat consent sesuai kewenangan administratif.
User tidak dapat mengakses consent milik resource di luar kewenangannya.

10.3 Create Consent
POST /api/parental-consents
Auth: 🎓 TALENT
Request
{
  "applicationId": "uuid"
}
Required Conditions
Application = SELECTED
Meeting = COMPLETED
Consent required = TRUE
Consent belum ada
TALENT merupakan owner dari application
Initial State
PENDING
Server Processing
Server melakukan:
Request
   ↓
Authentication
   ↓
Role Check
   ↓
Application Ownership Check
   ↓
Application State Check
   ↓
Meeting State Check
   ↓
Consent Requirement Check
   ↓
Create Consent
Server menentukan dan menyimpan metadata consent sesuai schema database.
Data Minimization
Request tidak menerima:
guardianName
guardianContact
Guardian account ID
Guardian authentication credential
Identity document
KTP / KK / Akta
Sensitive guardian information lainnya
Consent hanya digunakan sebagai simulated declaration dalam MVP.

10.4 Approve Consent
POST /api/parental-consents//approve
Auth: 🎓 TALENT dalam simulated consent flow
State
PENDING → APPROVED
Rules
Consent harus berstatus PENDING.
TALENT harus memiliki ownership terhadap consent/application.
Server harus memverifikasi bahwa consent memang required.
Client tidak dapat mengubah status secara langsung melalui PATCH atau field status.
Server Action
Set:
consent_status = APPROVED
approved_at = NOW()
Side Effects
Notification dapat dibuat.
Audit log dapat dibuat.
Contract dapat dilanjutkan apabila seluruh requirement lain telah terpenuhi.

10.5 Reject Consent
POST /api/parental-consents//reject
Auth: 🎓 TALENT dalam simulated consent flow
State
PENDING → REJECTED
Rules
Consent harus berstatus PENDING.
TALENT harus memiliki ownership terhadap consent/application.
Contract tetap blocked.
Side Effects
Notification dapat dibuat.
Audit log dapat dibuat.
Contract tidak dapat diaktifkan selama consent required masih REJECTED.

10.6 Contract Blocking Rule
Apabila:
Consent Required = TRUE
AND
Consent Status = REJECTED
maka:
Contract Activation
        ↓
BLOCKED
Apabila:
Consent Required = TRUE
AND
Consent Status = APPROVED
maka proses contract dapat dilanjutkan apabila:
Application = SELECTED
AND
Meeting = COMPLETED
AND
Talent Agreement = TRUE
AND
Hirer Agreement = TRUE

10.7 Consent Security & Privacy
Consent harus mengikuti:
Server-side authorization.
Resource ownership validation.
Business rule validation.
Database-level protection sesuai arsitektur.
Data minimization.
Sensitive data protection.
Consent tidak boleh digunakan sebagai mekanisme untuk membuat Guardian menjadi independent platform user.

11. CONTRACT MODULE
11.1 List Contracts
GET /api/contracts

Auth: 🔐 AUTH
Rules:
Talent → own contract
Hirer → own opportunity contract
Admin → all

11.2 Create Contract
POST /api/contracts

Auth: 💼 HIRER
Request
{
  "applicationId": "uuid",
  "roleTitle": "Frontend Developer Intern",
  "description": "Mengerjakan pengembangan frontend.",
  "responsibilities": "Implement UI dan melakukan testing.",
  "duration": "3 bulan",
  "location": "Remote",
  "compensation": "Rp1.500.000",
  "termsConditions": "..."
}

Required Conditions
Application = SELECTED
Meeting = COMPLETED
Consent = APPROVED
        OR
Consent = NOT_REQUIRED

Initial State
DRAFT


11.3 Get Contract Detail
GET /api/contracts/:id

Auth: 🔐 involved parties / 🛡️ ADMIN

11.4 Update Contract
PATCH /api/contracts/:id

Auth: 💼 HIRER
Only:
DRAFT

dapat diedit secara normal.

11.5 Propose Contract
POST /api/contracts/:id/propose

Auth: 💼 HIRER
State
DRAFT → PENDING_AGREEMENT

Side Effects
Set proposed_at
Set proposed_by
Create notification
Create audit log


11.6 Agree Contract
POST /api/contracts/:id/agree

Auth: 🎓 TALENT / 💼 HIRER involved party
Rules
User hanya dapat melakukan agreement untuk dirinya sendiri.
Saat:
talent_agreed = TRUE
AND
hirer_agreed = TRUE

maka:
PENDING_AGREEMENT → ACTIVE

Side Effects
Create Payment
status = PENDING

Create Work
status = NOT_STARTED

Create Notification

Create Audit Log


11.7 Decline Contract
POST /api/contracts/:id/decline

Auth: 🎓 TALENT / 💼 HIRER
State
PENDING_AGREEMENT → TERMINATED

Store:
declined_at
declined_by
decline_reason


12. PAYMENT MODULE
12.1 Get Payment
GET /api/payments?contractId=:id

Auth: 🔐 involved parties / 🛡️ ADMIN

12.2 Get Payment Detail
GET /api/payments/:id

Auth: 🔐 involved parties / 🛡️ ADMIN

12.3 Simulate Payment
POST /api/payments/:id/simulate-paid

Auth: 💼 HIRER
State
PENDING → SIMULATED_PAID

Alias yang tidak menjadi canonical route:
/api/payments/:id/hold

Canonical endpoint:
/api/payments/:id/simulate-paid

Rules
Contract harus ACTIVE.
Tidak ada uang nyata.
Set held_at.
Set held_by.
Notification dibuat.

12.4 Release Payment
POST /api/payments/:id/release

Auth: 💼 HIRER
Required:
Payment = SIMULATED_PAID
Work = COMPLETED
Work.hirer_confirmed = TRUE

State
SIMULATED_PAID → RELEASED

Side effects:
Set released_at
Set released_by
Create notification
Create audit log


13. WORK MODULE
13.1 Get Work
GET /api/works?contractId=:id

Auth: 🔐 involved parties / 🛡️ ADMIN

13.2 Update Work Status
PATCH /api/works/:id/status

Auth: 🎓 TALENT
Request
{
  "status": "IN_PROGRESS",
  "notes": "Mulai mengerjakan task."
}

Valid transitions:
NOT_STARTED → IN_PROGRESS
IN_PROGRESS → COMPLETED

Saat:
IN_PROGRESS → COMPLETED

server membuat atau memperbarui:
work_history
verification_status = PENDING

dan mengirim notification ke Hirer.

13.3 Confirm Work Completion
POST /api/works/:id/confirm

Auth: 💼 HIRER
Required:
Work = COMPLETED

Set:
hirer_confirmed = TRUE
hirer_confirmed_at = NOW()
confirmed_by = auth.uid()

Side effects:
Work History → VERIFIED

Jika Payment = SIMULATED_PAID
    ↓
Payment → RELEASED

Jika business flow completed
    ↓
Contract → COMPLETED

Notification
Audit Log


14. RATING MODULE
14.1 Get Ratings
GET /api/ratings?contractId=:id

Auth: 🔐 involved parties / 🛡️ ADMIN

14.2 Submit Rating
POST /api/ratings

Auth: 🔐 involved party
Request
{
  "workId": "uuid",
  "contractId": "uuid",
  "rateeId": "uuid",
  "ratingType": "TALENT_RATES_HIRER",
  "score": 5,
  "reviewText": "Hirer sangat profesional."
}

Rules
Rater harus Talent atau Hirer yang terlibat dalam contract.
rateeId harus merupakan pihak lain.
Work harus COMPLETED.
Rating belum pernah diberikan oleh rater untuk work tersebut.
Score:
1–5

Database protection:
UNIQUE(work_id, rater_id, rating_type)

Rating Types
TALENT_RATES_HIRER
HIRER_RATES_TALENT


14.3 Get Rating Detail
GET /api/ratings/:id

Auth: 🔐 involved parties / 🛡️ ADMIN

15. WORK HISTORY MODULE
15.1 Get Own Work History
GET /api/work-history

Auth: 🎓 TALENT
Query:
verificationStatus
page
limit


15.2 Get Work History Detail
GET /api/work-history/:id

Auth:
Talent owner
Authenticated user if VERIFIED
Admin


15.3 Get Public Talent Work History
GET /api/profiles/:id/work-history

Auth: 🔐 AUTH
Rules:
verification_status = VERIFIED

only.

15.4 Work History Lifecycle
Work Completed
      ↓
PENDING
      ↓
Hirer Confirms
      ↓
VERIFIED

Admin dapat melakukan:
VERIFIED → REJECTED
REJECTED → VERIFIED

berdasarkan moderation/verification action.

16. NOTIFICATION MODULE
16.1 List Notifications
GET /api/notifications

Auth: 🔐 AUTH
Query:
isRead
page
limit


16.2 Mark Read
PATCH /api/notifications/:id/read

Auth: 🔐 AUTH owner

16.3 Mark All Read
POST /api/notifications/read-all

Auth: 🔐 AUTH

16.4 Unread Count
GET /api/notifications/unread-count

Auth: 🔐 AUTH

16.5 Notification Types
APPLICATION_RECEIVED
APPLICATION_UNDER_REVIEW
APPLICATION_SELECTED
APPLICATION_REJECTED

MEETING_SCHEDULED
MEETING_UPDATED
MEETING_COMPLETED
MEETING_CANCELLED

CONSENT_REQUESTED
CONSENT_APPROVED
CONSENT_REJECTED

CONTRACT_CREATED
CONTRACT_PROPOSED
CONTRACT_AGREED
CONTRACT_ACTIVATED
CONTRACT_DECLINED

PAYMENT_HELD
PAYMENT_RELEASED

WORK_STARTED
WORK_COMPLETED
WORK_CONFIRMED

RATING_RECEIVED

REPORT_SUBMITTED
REPORT_RESOLVED

SYSTEM

Notifications dibuat oleh server-side business process.
Frontend tidak membuat notification secara langsung.

17. REPORT MODULE
17.1 Get Own Reports
GET /api/reports

Auth: 🔐 AUTH

17.2 Create Report
POST /api/reports

Auth: 🔐 AUTH
Request
{
  "reportedUserId": "uuid",
  "reportedOpportunityId": "uuid",
  "reportedApplicationId": "uuid",
  "reason": "FAKE_OPPORTUNITY",
  "description": "Opportunity ini tidak valid."
}

Minimal salah satu wajib ada:
reportedUserId
reportedOpportunityId
reportedApplicationId

Initial state:
SUBMITTED

Side effects:
Notification Admin
Audit Log


17.3 Get Report Detail
GET /api/reports/:id

Auth:
Reporter
Admin


18. ADMIN MODULE
18.1 Dashboard
GET /api/admin/dashboard

Auth: 🛡️ ADMIN
Example:
{
  "success": true,
  "data": {
    "totalTalents": 520,
    "totalHirers": 55,
    "totalOpportunities": 210,
    "publishedOpportunities": 120,
    "pendingReviewOpportunities": 10,
    "closedOpportunities": 50,
    "totalApplications": 300,
    "totalContracts": 80,
    "activeContracts": 20,
    "completedContracts": 120,
    "verifiedWorkHistories": 120,
    "pendingReports": 8
  }
}


18.2 List Users
GET /api/admin/users

Auth: 🛡️ ADMIN
Query:
role
status
search
page
limit


18.3 Suspend User
POST /api/admin/users/:id/suspend

Auth: 🛡️ ADMIN
Request
{
  "reason": "Pelanggaran platform."
}

State:
ACTIVE → SUSPENDED


18.4 Reactivate User
POST /api/admin/users/:id/reactivate

Auth: 🛡️ ADMIN
State:
SUSPENDED → ACTIVE


18.5 List Opportunities
GET /api/admin/opportunities

Auth: 🛡️ ADMIN
Query:
status
search
page
limit


18.6 Moderate Opportunity
POST /api/admin/opportunities/:id/moderate

Auth: 🛡️ ADMIN
Request
{
  "action": "APPROVE_PUBLISH",
  "reason": "Opportunity memenuhi ketentuan."
}

Actions:
APPROVE_PUBLISH
REQUEST_CHANGES
CLOSE
DELETE

Transitions:
PENDING_REVIEW → PUBLISHED
PENDING_REVIEW → DRAFT
PUBLISHED → CLOSED

Set moderation metadata:
moderated_by
moderated_at
moderation_notes


18.7 List Reports
GET /api/admin/reports

Auth: 🛡️ ADMIN

18.8 Resolve Report
POST /api/admin/reports/:id/resolve

Auth: 🛡️ ADMIN
Request
{
  "action": "RESOLVE",
  "adminNotes": "Opportunity terbukti melanggar ketentuan.",
  "takeAction": "REMOVE_OPPORTUNITY"
}

Resolution:
RESOLVE
REJECT

Additional action:
NONE
WARN_USER
SUSPEND_USER
REMOVE_OPPORTUNITY


18.9 Audit Logs
GET /api/admin/audit-logs

Auth: 🛡️ ADMIN
Query:
actorId
actorType
action
resourceType
resourceId
startDate
endDate
page
limit

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "actorId": "uuid",
      "actorType": "ADMIN",
      "action": "USER_SUSPENDED",
      "resourceType": "PROFILE",
      "resourceId": "uuid",
      "metadata": {},
      "createdAt": "2026-09-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}


18.10 Verify Work History
POST /api/admin/work-history/:id/verify

Auth: 🛡️ ADMIN
Set:
verification_status = VERIFIED
verified_at
verified_by
verification_notes


18.11 Unverify Work History
POST /api/admin/work-history/:id/unverify

Auth: 🛡️ ADMIN
Set:
verification_status = REJECTED
REJECTED_by
verification_notes


19. HEALTH MODULE
19.1 Health
GET /api/health

Auth: 🌐 PUBLIC
Healthy
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-01T10:00:00Z"
  }
}

Unhealthy
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable."
  }
}

Response:
503

Health endpoint tidak boleh mengembalikan:
database credentials
environment variables
SQL errors
stack traces
service role key


20. SERVER ACTIONS
Server Actions dipakai untuk form-based operations dari UI.
Semua Server Actions mengikuti:
Server Action
      ↓
Authentication
      ↓
Authorization
      ↓
Validation
      ↓
Application Service
      ↓
Domain Rules
      ↓
Repository
      ↓
Supabase


20.1 Auth
register(formData: FormData)
login(formData: FormData)
logout()


20.2 Profile
updateProfile(formData: FormData)
addSkill(formData: FormData)
removeSkill(skillId: string)
addInterest(formData: FormData)
removeInterest(interestId: string)


20.3 Opportunity
createOpportunity(formData: FormData)
updateOpportunity(id: string, formData: FormData)
submitOpportunityForReview(id: string)
closeOpportunity(id: string)


20.4 Application
applyToOpportunity(formData: FormData)
reviewApplication(id: string)
selectApplication(id: string)
rejectApplication(id: string, formData: FormData)


20.5 Matching
Tidak membutuhkan dedicated Server Action untuk MVP karena recommendation merupakan read operation.

20.6 Meeting
scheduleMeeting(formData: FormData)
updateMeeting(id: string, formData: FormData)
completeMeeting(id: string)
cancelMeeting(id: string, formData: FormData)


20.7 Consent
createConsent(formData: FormData)
approveConsent(id: string, formData: FormData)
rejectConsent(id: string, formData: FormData)


20.8 Contract
createContract(formData: FormData)
updateContract(id: string, formData: FormData)
proposeContract(id: string)
agreeToContract(id: string)
declineContract(id: string, formData: FormData)


20.9 Payment
simulatePaymentPaid(id: string)
releasePayment(id: string)


20.10 Work
updateWorkStatus(id: string, formData: FormData)
confirmWorkCompletion(id: string)


20.11 Rating
submitRating(formData: FormData)


20.12 Notification
markNotificationRead(id: string)
markAllNotificationsRead()


20.13 Report
createReport(formData: FormData)


20.14 Admin
suspendUser(id: string, formData: FormData)
reactivateUser(id: string)
moderateOpportunity(id: string, formData: FormData)
resolveReport(id: string, formData: FormData)
verifyWorkHistory(id: string, formData: FormData)
unverifyWorkHistory(id: string, formData: FormData)


21. SERVER ACTION RESPONSE CONTRACT
Semua Server Actions menggunakan typed result:
export type ActionResult<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

Server Action tidak boleh mengembalikan raw exception ke client.

22. VALIDATION SCHEMAS
Validation menggunakan Zod.
Semua input dari client harus divalidasi server-side sebelum diproses.

22.1 Register
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TALENT", "HIRER"]),
  fullName: z.string().min(2).max(100),
});

22.2 Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

22.3 Create Opportunity
const createOpportunitySchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20),
  opportunityType: z.enum([
    "INTERNSHIP",
    "PKL",
    "CONTRACT",
    "FREELANCE",
    "TEMPORARY_WORK",
    "DAILY_WORK",
    "EVENT_WORK",
    "PART_TIME",
  ]),
  location: z.string().optional(),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]).default("ONSITE"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workingHours: z.string().optional(),
  duration: z.string().optional(),
  compensation: z.string().optional(),
  compensationType: z
    .enum(["PAID", "UNPAID", "NEGOTIABLE"])
    .default("NEGOTIABLE"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  maxTalent: z.number().int().min(1).default(1),
  applicationDeadline: z.string().datetime(),
  requiresConsent: z.boolean().default(false),
  cvRequirement: z
    .enum(["REQUIRED", "OPTIONAL", "NOT_REQUIRED"])
    .default("OPTIONAL"),
  portfolioRequirement: z
    .enum(["REQUIRED", "OPTIONAL", "NOT_REQUIRED"])
    .default("OPTIONAL"),
  interviewRequirement: z.boolean().default(false),
  meetingMethod: z.string().optional(),
  otherTerms: z.string().optional(),
  skillIds: z.array(z.string().uuid()).default([]),
  interestIds: z.array(z.string().uuid()).default([]),
});

22.4 Application
const createApplicationSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().max(1000).optional(),
});

22.5 Meeting
const createMeetingSchema = z.object({
  applicationId: z.string().uuid(),
  meetingDate: z.string(),
  meetingTime: z.string(),
  meetingLink: z.string().url().optional(),
  meetingMethod: z.string().default("External Link"),
  notes: z.string().optional(),
});

22.6 Consent
Consent menggunakan simulated consent declaration dan menerapkan prinsip data minimization.
const createConsentSchema = z.object({
  applicationId: z.string().uuid(),
});
Consent Validation Rules
Schema hanya memvalidasi data input dasar.
Business validation tetap dilakukan server-side:
Application = SELECTED
        +
Meeting = COMPLETED
        +
Consent Required = TRUE
        +
No Existing Consent
        +
User Owns Application
        ↓
Create PENDING Consent
Prohibited Fields
Schema tidak boleh menerima:
guardianName
guardianContact
guardianEmail
guardianAccountId
identityDocument
identityNumber
MVP tidak menyimpan informasi sensitif wali yang tidak diperlukan.

22.7 Contract
const createContractSchema = z.object({
  applicationId: z.string().uuid(),
  roleTitle: z.string().min(3).max(150),
  description: z.string().optional(),
  responsibilities: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  compensation: z.string().optional(),
  termsConditions: z.string().optional(),
});

22.8 Rating
const createRatingSchema = z.object({
  workId: z.string().uuid(),
  contractId: z.string().uuid(),
  rateeId: z.string().uuid(),
  ratingType: z.enum([
    "TALENT_RATES_HIRER",
    "HIRER_RATES_TALENT",
  ]),
  score: z.number().int().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
});

22.9 Report
const createReportSchema = z
  .object({
    reportedUserId: z.string().uuid().optional(),
    reportedOpportunityId: z.string().uuid().optional(),
    reportedApplicationId: z.string().uuid().optional(),
    reason: z.string().min(3),
    description: z.string().max(2000).optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.reportedUserId ||
        data.reportedOpportunityId ||
        data.reportedApplicationId
      ),
    {
      message: "Minimal satu target report harus diisi.",
    }
  );

22.10 Validation Security Principle
Semua validation mengikuti:
Client Input
     ↓
Zod Validation
     ↓
Authentication
     ↓
Authorization
     ↓
Resource Ownership
     ↓
Business Rules
     ↓
Database
Zod hanya melakukan input validation.
Zod tidak boleh dipercaya sebagai pengganti:
Authentication
Authorization
Resource Ownership
Business Rule Validation
RLS


23. BUSINESS FLOW → API MAPPING
Bagian matching menggunakan flow berikut:
DISCOVER
   ↓
GET /api/opportunities
   ↓
GET /api/matching/recommendations
   ↓
GET /api/matching/score?opportunityId=:id
Matching process:
Talent Skills
      +
Talent Interests
      +
Opportunity Required Skills
      +
Opportunity Relevant Interests
      ↓
Skill Match
      ↓
Interest Match
      ↓
Weighted Final Match Score
      ↓
Match Classification
      ↓
Recommendation
Application flow tetap:
APPLY
   ↓
POST /api/applications
   ↓
APPLIED
Matching tidak mengubah status application.

24. CRITICAL BUSINESS RULES
24.1 Application
Talent authenticated
+
Opportunity PUBLISHED
+
Deadline belum lewat
+
No duplicate
=
Application allowed

24.2 Matching
Skill Match
Skill Match =
(Matched Skills / Required Skills) × 100
Jika required skills kosong:
Skill Match = 100
Interest Match
Interest Match =
(Matched Interests / Relevant Interests) × 100
Jika relevant interests kosong:
Interest Match = 100
Final Score
Final Match Score =
(Skill Match × 0.70) +
(Interest Match × 0.30)
Classification
80.00–100.00 → STRONG_MATCH
60.00–79.99  → GOOD_MATCH
30.00–59.99  → WEAK_MATCH
0.00–29.99   → NO_MATCH
Matching Rules
Server-side calculation
        ↓
Deterministic result
        ↓
Recommendation / Decision Support
Matching:
bukan automatic hiring.
Hanya HIRER yang dapat menentukan:
UNDER_REVIEW
      ↓
SELECTED
berdasarkan application workflow yang berlaku.

24.3 Meeting
Application SELECTED
=
Meeting can be scheduled

24.4 Consent
Meeting COMPLETED
+
Consent required
=
Consent must exist

24.5 Contract
Application SELECTED
+
Meeting COMPLETED
+
Consent APPROVED or NOT_REQUIRED
=
Contract creation allowed

24.6 Contract Activation
Talent agreed
+
Hirer agreed
=
Contract ACTIVE

24.7 Payment
Contract ACTIVE
=
Payment PENDING
PENDING
→
SIMULATED_PAID
SIMULATED_PAID
+
Work COMPLETED
+
Hirer confirmed
=
RELEASED

24.8 Work
NOT_STARTED
→
IN_PROGRESS
→
COMPLETED

24.9 Work History
Work COMPLETED
→
PENDING
→
Hirer Confirm
→
VERIFIED

24.10 Rating
Work COMPLETED
+
User is involved party
+
Rating does not already exist
=
Rating allowed

API MATCHING DECISION — FINAL
Matching Type: Rule-Based Weighted Matching
Skill Weight: 70%
Interest Weight: 30%
Final Score: (Skill Match × 0.70) + (Interest Match × 0.30)
Score Range: 0–100
Classification: STRONG_MATCH, GOOD_MATCH, WEAK_MATCH, NO_MATCH
Calculation: Server-side
Deterministic: Yes
Purpose: Recommendation / Decision Support
Automatic Hiring: Not allowed
Frontend Source of Truth: No
Backend Source of Truth: Yes
API MATCHING MODULE — LOCKED 🔒

25. IDEMPOTENCY & DUPLICATE PROTECTION
Critical duplicate operations harus dicegah.
Application
UNIQUE(talent_id, opportunity_id)

Meeting
UNIQUE(application_id)

Consent
UNIQUE(application_id)

Contract
UNIQUE(application_id)

Payment
UNIQUE(contract_id)

Work
UNIQUE(contract_id)

Work History
UNIQUE(contract_id)

Rating
UNIQUE(work_id, rater_id, rating_type)

Future external integrations dapat menggunakan idempotency key.

26. AUTHORIZATION MODEL
Server harus melakukan:
Authentication
↓
Role Check
↓
Resource Ownership
↓
Business Rule
↓
RLS

Contoh:
Hirer A
   ↓
POST /api/applications/123/select
   ↓
Check authenticated
   ↓
Check role = HIRER
   ↓
Check application belongs to Hirer's opportunity
   ↓
Check application state
   ↓
Execute

Client tidak boleh menentukan sendiri:
role
payment state
contract state
consent state
verification state
admin privilege


27. SECURITY RULES
27.1 Never Trust Client
Semua input client dianggap untrusted.
27.2 Validation
Semua request divalidasi server-side menggunakan Zod atau equivalent.
27.3 RLS
RLS menjadi defense-in-depth pada database.
27.4 Sensitive Data
API tidak boleh mengembalikan data personal yang tidak diperlukan.
27.5 Service Role
SUPABASE_SERVICE_ROLE_KEY hanya boleh digunakan server-side.
27.6 Error Security
Internal errors tidak boleh diekspos.
Jangan mengirim:
SQL query
stack trace
database credentials
service role key
internal paths


28. NOTIFICATION & AUDIT SIDE EFFECTS
Business actions penting menghasilkan side effect dari server.
Contoh:
Application Submitted
    ├── Database Change
    ├── Notification
    └── Audit Log

Application Selected
    ├── Database Change
    ├── Notification
    └── Audit Log

Contract Activated
    ├── Contract Update
    ├── Payment Create
    ├── Work Create
    ├── Notification
    └── Audit Log

Work Confirmed
    ├── Work Update
    ├── Work History Verification
    ├── Payment Release
    ├── Contract Completion
    ├── Notification
    └── Audit Log

Notification failure tidak boleh membatalkan core transaction jika business operation sudah berhasil dan notification merupakan side effect non-critical.

29. API → MODULE BOUNDARY
Route Handler tidak boleh langsung mengakses internal repository module lain.
Correct:
Route Handler
     ↓
Application Service
     ↓
Domain
     ↓
Repository

Module-to-module:
Module A
   ↓
Module B Public Interface

Bukan:
Module A
   ↓
Module B Internal Repository


30. ERROR HANDLING FLOW
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Application Service
   ↓
Domain Rule
   ↓
Repository
   ↓
Database

Jika error:
Domain Error
   ↓
Application Error Mapping
   ↓
API Error Handler
   ↓
Standard Error Response

Example:
{
  "success": false,
  "error": {
    "code": "CONTRACT_BLOCKED_BY_MEETING",
    "message": "Contract tidak dapat dibuat sebelum meeting selesai."
  }
}


31. API HEALTH & OBSERVABILITY
Setiap critical request harus dapat ditelusuri dengan:
requestId
correlationId

Structured log minimal dapat memiliki:
{
  "level": "INFO",
  "event": "application.selected",
  "requestId": "req_123",
  "actorId": "uuid",
  "resourceId": "uuid",
  "timestamp": "2026-09-01T10:00:00Z"
}

Jangan log:
password
access token
refresh token
service role key
guardian sensitive data
private user content


32. ENDPOINT SUMMARY
Module
Endpoint Count
Auth
4
Profile
9
Opportunity
7
Application
7
Matching
2
Meeting
6
Consent
5
Contract
7
Payment
4
Work
3
Rating
3
Work History
3
Notification
4
Report
3
Admin
11
Health
1
TOTAL
79

Server Actions melengkapi endpoint tersebut untuk form-based UI operations.

33. API IMPLEMENTATION STRUCTURE
Recommended route structure:
app/
└── api/
    ├── auth/
    │   ├── register/
    │   ├── login/
    │   ├── logout/
    │   └── session/
    │
    ├── profile/
    │   ├── route.ts
    │   ├── skills/
    │   └── interests/
    │
    ├── profiles/
    │   └── [id]/
    │
    ├── skills/
    ├── interests/
    │
    ├── opportunities/
    │   └── [id]/
    │
    ├── applications/
    │   └── [id]/
    │
    ├── matching/
    │
    ├── meetings/
    │   └── [id]/
    │
    ├── parental-consents/
    │   └── [id]/
    │
    ├── contracts/
    │   └── [id]/
    │
    ├── payments/
    │   └── [id]/
    │
    ├── works/
    │   └── [id]/
    │
    ├── ratings/
    │   └── [id]/
    │
    ├── work-history/
    │   └── [id]/
    │
    ├── notifications/
    │   └── [id]/
    │
    ├── reports/
    │   └── [id]/
    │
    ├── admin/
    │   ├── dashboard/
    │   ├── users/
    │   ├── opportunities/
    │   ├── reports/
    │   ├── audit-logs/
    │   └── work-history/
    │
    └── health/


34. API SPECIFICATION — FINAL DECISION
API Architecture: REST API menjadi primary backend contract.
Server Actions: Digunakan untuk form-based UI operations dan selalu memanggil application/module layer.
Base Path: /api.
Authentication: Supabase Auth.
Authorization: Server-side authentication, RBAC, ownership checks, business rules, dan RLS.
Response Contract: Semua response menggunakan struktur { success, data } atau { success, error }.
Pagination: Default 20 dan maximum 100 untuk collection endpoints.
Validation: Semua input divalidasi server-side menggunakan Zod.
Opportunity: DRAFT → PENDING_REVIEW → PUBLISHED → CLOSED.
Application: APPLIED → UNDER_REVIEW → SELECTED / REJECTED.
Meeting: SCHEDULED → COMPLETED / CANCELLED.
Consent: Consent dievaluasi server-side berdasarkan opportunity requirement atau Talent minor status dan diproses setelah Meeting Completed sebelum Contract.
Contract: DRAFT → PENDING_AGREEMENT → ACTIVE → COMPLETED / TERMINATED.
Payment: PENDING → SIMULATED_PAID → RELEASED.
Work: NOT_STARTED → IN_PROGRESS → COMPLETED.
Verification: Hirer confirmation digunakan untuk memverifikasi Work History dan memungkinkan Payment Release.
Rating: Two-way rating tersedia setelah Work COMPLETED.
Notifications: In-app dan dipicu oleh server-side business events.
Audit: Important state-changing operations dicatat dalam audit log.
Admin: Admin memiliki moderation, report handling, user management, audit access, dan work-history verification override.
Security: Client tidak dipercaya; authorization dan business rules selalu diverifikasi di server.
Idempotency: Database constraints + state validation digunakan sebagai protection MVP.
Observability: Request/correlation identifiers dan structured logging digunakan untuk critical operations.
MVP Constraints: Tidak ada real payment gateway, tidak ada guardian account, tidak ada internal video meeting system, dan tidak ada AI/ML black-box matching.
Database Alignment: API contract harus tetap konsisten dengan TDD Appendix A — Database ERD & Supabase Schema v1.1.
API SPECIFICATION v1.2 — LOCKED 🔒
END OF API SPECIFICATION