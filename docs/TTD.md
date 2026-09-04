TECHNICAL DESIGN DOCUMENT (TDD)
Flex Network
Document Status: Final Technical Design Baseline
Version: 1.0
Architecture: Next.js Full-Stack Modular Monolith
Database & Authentication: Supabase
Hosting: Vercel
Repository: GitHub

1. Frontend
1.1 Technology
Flex Network menggunakan Next.js sebagai framework utama aplikasi.
Next.js digunakan untuk membangun antarmuka pengguna sekaligus mendukung kebutuhan server-side application dalam satu application codebase.
1.2 Architecture Approach
Frontend merupakan bagian dari Next.js Full-Stack / Modular Monolith, sehingga frontend dan backend tidak dipisahkan menjadi repository atau aplikasi yang berbeda.
Next.js Application
├── Frontend UI
├── Server-side Logic
└── API / Backend Logic

1.3 Future Development
Advanced frontend optimization
Component library yang lebih terstruktur
Performance optimization
Progressive Web App jika diperlukan

2. Backend
2.1 Technology
Backend menggunakan Next.js Full-Stack.
Kita tidak membuat backend Express.js terpisah untuk MVP.
Next.js
├── Frontend
├── Server-side Logic
└── API / Backend

2.2 Architecture
Backend mengikuti pendekatan Modular Monolith.
Modul sistem dapat dipisahkan berdasarkan domain:
Authentication
Profile
Opportunity
Application
Matching
Meeting
Contract
Payment
Rating
Parental Consent
Admin
Report

Setiap modul tetap berada dalam satu aplikasi Next.js.
2.3 Future Development
Apabila scale meningkat, modul tertentu dapat dipisahkan menjadi service tersendiri berdasarkan kebutuhan aktual.
Microservices tidak digunakan pada MVP.


3. Database
3.1 Technology
Database menggunakan Supabase PostgreSQL.
Supabase digunakan sebagai managed backend service yang menyediakan PostgreSQL serta layanan terkait lainnya.
3.2 Database Approach
Data utama sistem disimpan secara relational menggunakan PostgreSQL.
Entity utama mencakup:
User / Profile
Opportunity
Application
Meeting
Contract
Payment
Work
Rating
Parental Consent
Work History
Report
Notification
Audit Log
Database menggunakan pendekatan relational dengan:
Primary Key
Foreign Key
Unique Constraint
Not Null
Check Constraint
Row Level Security (RLS)
Database menjadi persistent source of truth untuk data aplikasi.
3.3 MVP Database Strategy
Untuk MVP, database sudah mencakup baseline berikut:
- Relational PostgreSQL schema
- Basic indexing
- Query optimization
- Pagination
- Connection management
- Database constraints
- Backup and recovery strategy
- RLS untuk protected data
Index dan query optimization diterapkan berdasarkan actual query pattern, bukan secara berlebihan.
Pagination digunakan untuk collection yang berpotensi memiliki jumlah data besar.
Backup dan recovery disiapkan sesuai kebutuhan MVP dan infrastructure yang digunakan.
3.4 Future Development
Advanced database capability dapat diperkenalkan ketika workload meningkat:
- Advanced caching
- Read replicas
- Database partitioning
- Advanced database scaling
- Sharding
- Advanced backup and recovery capability
Pengembangan tersebut hanya dilakukan apabila kebutuhan berdasarkan traffic, data growth, reliability, atau performance sudah membenarkannya.

4. Authentication
4.1 Technology
Authentication menggunakan Supabase Auth.
Authentication tidak dibuat dari awal menggunakan sistem authentication custom.
4.2 Roles
Sistem memiliki tiga role utama:
Talent
Hirer
Admin
Role digunakan bersama Role-Based Access Control (RBAC).
Flow:
User Login
    ↓
Authentication
    ↓
Check Role
    ├── Talent → Talent Permissions
    ├── Hirer  → Hirer Permissions
    └── Admin  → Admin Permissions
4.3 Authorization
Authorization harus dilakukan pada server-side.
Menyembunyikan menu berdasarkan role pada frontend saja tidak dianggap sebagai security mechanism.
Authorization dilakukan melalui kombinasi:
Authentication
+
Role Check
+
Resource Ownership
+
Business Rules
+
Database RLS
Client tidak dipercaya sebagai sumber keputusan authorization.
4.4 Parental Consent Boundary
Flex Network MVP tidak menyediakan Guardian sebagai platform role atau Guardian account.
Parental consent menggunakan:
Simulated Consent Declaration
Flow:
Application SELECTED
        ↓
Meeting COMPLETED
        ↓
Consent Required?
   ├── No → Contract
   └── Yes
          ↓
       Consent PENDING
          ↓
   Talent Declaration
          ↓
   Server-side Validation
          ↓
       APPROVED
          ↓
       Contract
MVP tidak melakukan independent guardian authentication atau identity verification.
Data guardian yang tidak diperlukan untuk proses tersebut tidak disimpan.
4.5 Future Development
Security capability dapat dikembangkan lebih lanjut sesuai kebutuhan:
- Advanced identity verification
- Multi-factor authentication
- Optional Guardian authentication
- Additional security controls
Guardian authentication bersifat future optional capability dan bukan bagian dari baseline MVP.

5. Hosting
5.1 Platform
Hosting utama Flex Network menggunakan Vercel.
Pemilihan ini sesuai dengan penggunaan Next.js dan kebutuhan deployment aplikasi full-stack dalam satu platform.
5.2 Application Deployment
Karena Next.js digunakan sebagai full-stack application:
Next.js
    ↓
Vercel
    ↓
Production Application
Frontend dan backend tidak perlu dideploy ke hosting yang berbeda.
5.3 Preview & Validation Environment
Setiap Pull Request dapat menghasilkan Vercel Preview Deployment.
Flow:
Feature Branch
      ↓
Pull Request
      ↓
CI Checks
      ↓
Vercel Preview
      ↓
Smoke Test / Validation
Preview Deployment digunakan sebagai environment validasi sebelum production.
Dedicated staging environment terpisah dapat diperkenalkan jika kebutuhan project berkembang.
5.4 Production Deployment
Production deployment mengikuti controlled release flow:
Pull Request
      ↓
Lint
      ↓
Type Check
      ↓
Unit / Integration Test
      ↓
Build
      ↓
Preview Verification
      ↓
Production Deployment
      ↓
Health Check
      ↓
Monitoring
Deployment production tidak dilakukan langsung dari local machine developer.
5.5 Rollback
Jika deployment bermasalah:
Production
    ↓
Issue Detected
    ↓
Rollback
    ↓
Previous Stable Deployment
    ↓
Health Check
    ↓
Monitoring
Vercel previous stable deployment dapat digunakan untuk rollback.
Database migration tetap harus dievaluasi secara terpisah karena rollback application tidak otomatis membalikkan perubahan database.
5.6 Alternative
Netlify dapat digunakan sebagai alternatif apabila terdapat kebutuhan khusus atau kendala pada deployment Vercel.
Namun baseline MVP tetap menggunakan:
Next.js + Vercel
5.7 Future Development
Advanced deployment capability dapat dikembangkan sesuai kebutuhan:
- Dedicated staging infrastructure
- Advanced deployment strategies
- Canary deployment
- Automated rollback
- Advanced deployment observability
- Advanced performance optimization
Sedangkan:
CI
Preview Deployment
Basic Monitoring
Health Check
Rollback Capability
sudah termasuk dalam MVP baseline.


6. Portfolio Upload
6.1 MVP Approach
Untuk MVP, CV dan portfolio tidak di-upload langsung ke sistem.
Talent dapat menyimpan link eksternal menuju CV atau portfolio mereka.
Contoh:
CV:
https://example.com/cv

Portfolio:
https://example.com/portfolio

6.2 Reason
Pendekatan link-based mengurangi kompleksitas:
File storage
Upload processing
File validation
Storage management
6.3 Future Development
Integrated portfolio
File upload
Supabase Storage
CV document generation
Portfolio builder

7. Notification
7.1 MVP
Flex Network menggunakan in-app notification sebagai mekanisme utama notification.
Notification digunakan untuk event penting seperti:
Application received
Application selected
Meeting scheduled
Contract created
Contract accepted
Payment status changed
Work completed
Rating received

7.2 Technology
Notification dapat menggunakan mekanisme internal aplikasi dengan dukungan Supabase Realtime apabila diperlukan untuk update secara real-time.
7.3 Future Development
Email notification
Push notification
SMS/WhatsApp notification
Notification preference
Notification queue/background processing

8. Matching
8.1 MVP Approach
Flex Network menggunakan Rule-Based Weighted Matching untuk membantu mempertemukan TALENT dengan opportunity yang sesuai berdasarkan skill dan interest.
Matching dilakukan secara deterministic dan server-side sehingga hasil yang diberikan konsisten untuk input TALENT dan opportunity yang sama selama rule dan configuration weight tidak berubah.
Input utama matching:
Talent Skills
Talent Interests
Opportunity Required Skills
Opportunity Relevant Interests
Flow:
Talent
├── Skills
└── Interests
        ↓
Matching Service
        ↓
Opportunity
├── Required Skills
└── Relevant Interests
        ↓
Skill Match
        +
Interest Match
        ↓
Weighted Final Match Score
        ↓
Match Classification
        ↓
Recommendation

Matching hanya berfungsi sebagai Recommendation / Decision Support dan tidak melakukan automatic hiring.

8.2 Skill Matching
Skill matching membandingkan skill yang dimiliki TALENT dengan required skills pada opportunity.
Formula:
Skill Match = (Matched Skills / Required Skills) × 100
Contoh:
Talent Skills:
HTML
CSS
JavaScript


Required Skills:
HTML
CSS
React


Matched Skills = 2
Required Skills = 3


Skill Match
= (2 / 3) × 100
= 66.67

Apabila opportunity tidak memiliki required skills:
Skill Match = 100
Hal tersebut mencegah pembagian dengan nol dan memastikan opportunity yang tidak menentukan required skill tidak memperoleh penalti hanya karena requirement kosong.

8.3 Interest Matching
Interest matching membandingkan interest TALENT dengan relevant interests pada opportunity.
Formula:
Interest Match = (Matched Interests / Relevant Interests) × 100
Contoh:
Talent Interests:
Web Development
UI/UX
Technology


Relevant Interests:
Web Development
Graphic Design
Technology


Matched Interests = 2
Relevant Interests = 3


Interest Match
= (2 / 3) × 100
= 66.67

Apabila opportunity tidak memiliki relevant interests:
Interest Match = 100
Hal tersebut mencegah pembagian dengan nol dan memastikan opportunity yang tidak menentukan relevant interest tidak memperoleh penalti hanya karena requirement kosong.

8.4 Weighted Match Score
Final Match Score dihitung menggunakan weighted scoring.
Formula:
Final Match Score = (Skill Match × 0.70) + (Interest Match × 0.30)
Weight:
Component
Weight
Skill Match
70%
Interest Match
30%

Final Match Score berada pada rentang:
0-100
Contoh:
Skill Match    = 80
Interest Match = 66.67


Final Match Score
= (80 × 0.70) + (66.67 × 0.30)
= 56 + 20.001
= 76.001
≈ 76.00

Hasil:
Final Match Score = 76.00

8.5 Match Classification
Sistem mengelompokkan Final Match Score menjadi classification berikut:
Score
Classification
80-100
STRONG_MATCH
60-79
GOOD_MATCH
30-59
WEAK_MATCH
0-29
NO_MATCH

Classification ditentukan oleh server berdasarkan Final Match Score.
Contoh:
Final Match Score = 76.00


76.00
↓
60-79
↓
GOOD_MATCH


8.6 Recommendation Only
Matching tidak melakukan hiring secara otomatis.
Matching:
Tidak dapat mengubah application menjadi SELECTED.
Tidak dapat membuat application secara otomatis.
Tidak dapat membuat contract secara otomatis.
Tidak dapat menggantikan proses review oleh HIRER.
Tidak dapat menentukan keputusan akhir recruitment.
Matching hanya menyediakan:
Recommendation / Decision Support
Keputusan akhir application dan selection tetap berada pada HIRER sesuai business rules sistem.

8.7 Server-Side Calculation
Perhitungan matching harus dilakukan pada server/application layer.
Frontend tidak boleh menjadi sumber kebenaran untuk:
Skill Match
Interest Match
Final Match Score
Match Classification
Flow:
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

Server harus mengambil data yang digunakan dalam perhitungan dari sumber data yang tervalidasi dan tidak mempercayai nilai score yang dikirim oleh client.

8.8 Deterministic Matching
Matching harus bersifat deterministic.
Untuk input TALENT dan opportunity yang sama:
Input yang sama → Score yang sama → Classification yang sama
selama:
Matching rule tidak berubah.
Weight tidak berubah.
Required skill definition tidak berubah.
Relevant interest definition tidak berubah.
Perubahan terhadap formula atau weight harus diperlakukan sebagai perubahan business rule dan harus melalui proses review yang sesuai.

8.9 Matching Security Boundary
Matching mengikuti security flow:
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Resource / Profile Access Check
   ↓
Validated Input / Trusted Data
   ↓
Matching Service
   ↓
Final Match Score
   ↓
Classification
   ↓
Response

Client tidak boleh menentukan sendiri:
Final Match Score
Match Classification
Matching Weight
Required Skill Set
Opportunity Interest Requirement

8.10 AI / ML Boundary
AI/ML tidak digunakan untuk matching pada MVP.
Matching MVP menggunakan:
Rule-Based Weighted Matching
Pendekatan ini dipilih agar:
Deterministic
Explainable
Testable
Sederhana untuk MVP
Sesuai dengan batasan pengembangan sistem
Advanced capability seperti:
Advanced Recommendation Engine
AI-assisted Matching
Machine Learning
Behavioral-based Matching
Personalized Recommendation
merupakan Future Development dan tidak menjadi bagian dari baseline MVP.

8.11 Matching Module Boundary
Matching Module bertanggung jawab terhadap:
Mengambil data skill TALENT yang relevan.
Mengambil data interest TALENT yang relevan.
Mengambil required skills opportunity.
Mengambil relevant interests opportunity.
Menghitung Skill Match.
Menghitung Interest Match.
Menghitung Final Match Score.
Menentukan Match Classification.
Menyediakan recommendation result.
Matching Module tidak bertanggung jawab terhadap:
Application creation.
Application review.
Application selection.
Contract creation.
Hiring decision.
Payment processing.
Module lain berkomunikasi dengan Matching Module melalui interface/application service yang telah ditentukan sesuai Modular Monolith architecture.

8.12 Performance Consideration
Matching harus menggunakan query dan data retrieval yang efisien.
Implementation harus memperhatikan:
Pagination pada recommendation list.
Bounded query.
Efficient relationship lookup.
Tidak mengambil data yang tidak diperlukan.
Tidak melakukan perhitungan redundant secara berlebihan.
Optimization dilakukan berdasarkan actual workload dan bottleneck yang terukur.

8.13 MVP vs Future
MVP 🔒
Rule-Based Weighted Matching
Skill Weight 70%
Interest Weight 30%
Final Match Score 0-100
Match Classification
Server-side calculation
Deterministic result
Recommendation / Decision Support
No automatic hiring
No AI/ML black-box matching
Future 🔜
Advanced Recommendation Engine
AI-assisted Matching
Machine Learning
Behavioral-based Matching
Personalized Recommendation
Advanced ranking strategy

8.14 Final Decision
Matching Type: Rule-Based Weighted Matching
Skill Weight: 70%
Interest Weight: 30%
Skill Match: (Matched Skills / Required Skills) × 100
Interest Match: (Matched Interests / Relevant Interests) × 100
Final Match Score: (Skill Match × 0.70) + (Interest Match × 0.30)
Score Range: 0-100
Classification: STRONG_MATCH, GOOD_MATCH, WEAK_MATCH, NO_MATCH
Calculation: Server-side
Behavior: Deterministic
Purpose: Recommendation / Decision Support
Automatic Hiring: Tidak diperbolehkan
AI/ML: Tidak digunakan pada MVP


9. Meeting
9.1 MVP Approach
Flex Network menyediakan meeting scheduling.
Meeting memiliki informasi seperti:
Meeting
├── Date
├── Time
├── Meeting Link
└── Status
Meeting menggunakan external meeting platform melalui link.
9.2 Meeting Status
Status MVP:
SCHEDULED
   ↓
COMPLETED
atau:
SCHEDULED
   ↓
CANCELLED
Meeting harus mencapai:
COMPLETED
sebelum proses contract dapat dilanjutkan.
9.3 Meeting → Contract Boundary
Meeting tidak secara otomatis membuat contract.
Flow:
Meeting Scheduled
       ↓
Meeting Completed
       ↓
Eligibility Check
       ↓
Consent Required?
  ├── No → Contract Process
  └── Yes → Consent Process
Jika consent diperlukan:
Meeting Completed
       ↓
Consent PENDING
       ↓
Consent APPROVED
       ↓
Contract Process
9.4 In-Platform Video Call
Tidak termasuk MVP.
SRS menetapkan in-platform video call sebagai out of scope.
9.5 Future Development
Meeting capability dapat dikembangkan menjadi:
Integrated video conference
Meeting reminder
Calendar integration
Automated scheduling
POINT 9 - LOCKED 🔒
10. Contract
10.1 MVP Approach
Flex Network menggunakan simulated digital contract.
Contract bukan legal e-signature system dan tidak menggunakan digital signature provider pada MVP.
Agreement dilakukan melalui simulated agreement flow di dalam aplikasi.
10.2 Contract Creator
Contract dibuat oleh Hirer setelah seluruh eligibility requirement terpenuhi.
Baseline flow:
Application SELECTED
       ↓
Meeting COMPLETED
       ↓
Consent Required?
  ├── No → Contract Creation
  └── Yes
         ↓
      Consent PENDING
         ↓
      Consent APPROVED
         ↓
      Contract Creation
Setelah contract dibuat:
Contract DRAFT
       ↓
PENDING_AGREEMENT
       ↓
Talent Agreement
       ↓
Hirer Agreement
       ↓
ACTIVE
Kedua pihak harus menyetujui contract sebelum status menjadi ACTIVE.
10.3 Contract Status
Canonical contract status:
DRAFT
  ↓
PENDING_AGREEMENT
  ↓
ACTIVE
  ↓
COMPLETED
Alternative termination:
PENDING_AGREEMENT
       ↓
TERMINATED
atau:
ACTIVE
  ↓
TERMINATED
PENDING_AGREEMENT digunakan untuk menggantikan terminology lama PENDING_ACCEPTANCE.
TERMINATED digunakan untuk menggambarkan contract yang dihentikan setelah proses dimulai.
10.4 Business Rule
Contract tidak dapat dibuat sebelum:
Application = SELECTED
+
Meeting = COMPLETED
Jika parental consent diperlukan:
Application = SELECTED
+
Meeting = COMPLETED
+
Consent = APPROVED
       ↓
Contract Creation Allowed
Contract tidak boleh menjadi ACTIVE sebelum:
Talent Agreement = TRUE
+
Hirer Agreement = TRUE
10.5 Contract Agreement
Simulated agreement menggunakan server-side business logic untuk memvalidasi:
Authenticated User
Role
Contract Eligibility
Current Contract State
Agreement Permission
Client tidak dapat mengubah contract status secara langsung tanpa melalui authorized business flow.
10.6 Future Development
Contract capability dapat dikembangkan menjadi:
PDF contract generation
Digital signature
Contract templates
Contract versioning
Legal document verification
Advanced contract lifecycle management


11. Payment
11.1 MVP Approach
Payment menggunakan Simulated Payment / Simulated Escrow.
Tidak ada uang sungguhan yang berpindah melalui sistem.
Payment pada MVP hanya digunakan untuk mensimulasikan alur:
Payment Created
→ Payment Status
→ Work Completion
→ Hirer Confirmation
→ Payment Release
11.2 Payment Flow
Contract ACTIVE
     ↓
Payment Created
     ↓
PENDING
     ↓
SIMULATED_PAID
     ↓
Work COMPLETED
     ↓
Hirer Confirms
     ↓
RELEASED
SIMULATED_PAID merepresentasikan kondisi simulasi dana yang dianggap telah dibayarkan/ditahan dalam alur escrow demo.
11.3 Payment Gateway
MVP tidak menggunakan:
Midtrans
Xendit
Stripe
QRIS
Bank API
Real payment gateway dan real escrow berada di luar scope MVP.
11.4 Future Development
Real payment gateway
Real escrow/payment provider
Refund
Payment dispute
Payout/withdrawal
Transaction reconciliation
Webhook-based payment confirmation

12. Parental Consent
12.1 MVP Approach
Parental Consent menggunakan simulated consent declaration.
Consent hanya diperlukan apabila sebuah opportunity menentukan bahwa parental consent dibutuhkan.
Application SELECTED
       ↓
Meeting COMPLETED
       ↓
Consent Required?
  ├── No → Continue to Contract
  └── Yes
         ↓
      Consent PENDING
12.2 Timing
Consent dilakukan setelah Meeting Completed dan sebelum Contract dibuat.
Flow:
Apply
 ↓
SELECTED
 ↓
Meeting Scheduled
 ↓
Meeting COMPLETED
 ↓
Consent Required?
 ├── No → Contract
 └── Yes
        ↓
     Consent PENDING
        ↓
  Talent Consent Declaration
        ↓
     APPROVED
        ↓
     Contract
12.3 Consent Status
Canonical consent status:
PENDING
  ├── APPROVED
  └── REJECTED
NOT_REQUIRED dapat digunakan ketika system menyimpan consent record untuk workflow yang tidak membutuhkan approval.
12.4 Consent Declaration
MVP menggunakan simulated consent declaration.
Talent menyatakan bahwa izin wali telah diperoleh melalui flow aplikasi.
System menyimpan metadata declaration yang diperlukan untuk auditability.
MVP tidak menganggap proses tersebut sebagai independent guardian verification atau legal digital signature.
12.5 Parent / Guardian Account
Parent/Guardian tidak menjadi role platform pada MVP.
Role platform tetap:
Talent
Hirer
Admin
MVP tidak menyediakan independent guardian login.
12.6 Data Protection
MVP tidak mengumpulkan atau menyimpan dokumen identitas wali yang tidak diperlukan.
Data consent dibatasi pada metadata operasional dan audit yang diperlukan.
Contoh metadata:
consent_required
required_reason
status
declared_at
declared_ip
declared_user_agent
rejection_reason
12.7 Authorization
Consent approval tidak dilakukan melalui perubahan status bebas dari client.
Flow:
Client
↓
Server Action / Application Service
↓
Authentication
↓
Authorization
↓
Consent State Validation
↓
Record Declaration
↓
Update Consent
↓
Audit Log
Database RLS menjadi defense-in-depth.
12.8 Future Development
Guardian Account
Guardian authentication
Independent consent verification
Guardian notification
Consent withdrawal
Identity verification

13. Admin
13.1 Role
Admin berfungsi sebagai system moderator dan supervisor.
13.2 MVP Functions
Admin dapat:
User Moderation
Opportunity Moderation
Report Management
Basic Verification / Status Management
Audit Review
13.3 User Moderation
Admin dapat:
View User
Suspend User
Reactivate User
User status:
ACTIVE
SUSPENDED
DEACTIVATED
13.4 Report Management
Flow:
User
↓
Submit Report
↓
Admin Review
↓
Resolve / Reject
Canonical report status:
SUBMITTED
    ↓
UNDER_REVIEW
    ├── RESOLVED
    └── REJECTED
13.5 Authorization
Admin routes harus dilindungi menggunakan:
Authentication
+
RBAC
+
Server-side Authorization
+
Resource / Permission Checks
Frontend role visibility tidak dianggap sebagai security mechanism.
13.6 Audit Log
Admin actions yang penting harus menghasilkan audit record.
Contoh:
User suspended
User reactivated
Opportunity moderated
Report resolved
Report rejected
Verification status changed
Audit log minimal mencatat:
actor
action
resource_type
resource_id
timestamp
metadata
13.7 Future Development
Advanced moderation
Fraud detection
KYC / identity verification
Appeal system
Advanced analytics
Automated moderation assistance

14. Git & Repository
14.1 Repository
Flex Network menggunakan single Git repository.
GitHub
└── flex-network
Frontend dan backend berada dalam repository yang sama karena menggunakan Next.js Full-Stack / Modular Monolith.
14.2 Branch Strategy
Menggunakan workflow sederhana:
main
 ↑
Pull Request
 ↑
feature/*
fix/*
refactor/*
chore/*
Contoh:
feature/auth
feature/matching
feature/contract
feature/admin
main merupakan protected branch.
14.3 Pull Request
Developer tidak melakukan direct push ke main untuk perubahan normal.
Workflow:
Feature Branch
     ↓
Commit
     ↓
Pull Request
     ↓
CI Checks
     ↓
Code Review
     ↓
Merge
Untuk perubahan penting, minimal satu anggota tim lain melakukan review.
14.4 Commit Convention
Menggunakan Conventional Commits:
feat:
fix:
refactor:
docs:
chore:
Contoh:
feat: add talent registration
fix: prevent contract before meeting completion
docs: update technical design
14.5 Environment Variables
Secret tidak disimpan dalam repository.
.env.local
digunakan untuk local development dan harus masuk .gitignore.
Repository menyediakan:
.env.example
tanpa value rahasia.
Privileged secrets seperti:
SUPABASE_SERVICE_ROLE_KEY
hanya digunakan server-side.
14.6 CI/CD
Repository menggunakan CI pipeline untuk memverifikasi perubahan.
Minimum checks:
Lint
Type Check
Unit Tests
Integration Tests
Build
Jika critical check gagal:
Merge Blocked
Pull Request dapat menghasilkan preview deployment untuk validasi sebelum production.
14.7 Future Development
Advanced branch automation
Automated release/versioning
Advanced security scanning
Canary deployment
More advanced deployment automation
Basic Git workflow, CI, Pull Request, preview deployment, dan protected main sudah termasuk MVP.

15. Team & Development Responsibility
15.1 Team Structure
Tim terdiri dari 3 anggota.
Pembagian responsibility:
Developer / Technical Lead
       │
       ├── Core Development
       ├── Architecture
       ├── Backend
       └── Database
UI/UX & Frontend Support
       │
       ├── UI Design
       ├── Design System
       └── Frontend Support
Product / Documentation / QA
       │
       ├── Requirements
       ├── Documentation
       ├── Testing
       └── QA
Pembagian ini bersifat responsibility, bukan batasan bahwa setiap anggota hanya boleh mengerjakan satu bidang.
Semua anggota tetap dapat berkontribusi pada area lain sesuai kebutuhan project.
15.2 Development Workflow
Task
↓
Assigned
↓
Feature Branch
↓
Development
↓
Testing
↓
Pull Request
↓
CI Checks
↓
Code Review
↓
Merge
↓
Done
15.3 Definition of Done
Task dianggap selesai apabila:
☑ Feature implemented
☑ Acceptance criteria satisfied
☑ Tested
☑ No known critical bug
☑ Code reviewed
☑ CI checks passed
☑ Merged to main
Untuk fitur UI:
☑ Responsive
☑ Sesuai design
☑ Basic accessibility requirements satisfied
15.4 Ownership Principle
Ownership digunakan untuk memastikan accountability.
Namun:
Ownership ≠ exclusive control
Team tetap mengikuti:
Shared Repository
Code Review
Documentation
Knowledge Sharing
untuk mengurangi dependency terhadap satu orang.
15.5 Future Development
Apabila platform berkembang, role khusus dapat ditambahkan:
Frontend Engineer
Backend Engineer
UI/UX Designer
QA Engineer
DevOps Engineer
Product Manager
Security Engineer

16. Hosting & Deployment
16.1 Deployment Architecture
Flex Network menggunakan deployment architecture berikut:
Developer
    ↓
GitHub Repository
    ↓
CI Checks
    ↓
Vercel Preview / Verification
    ↓
Vercel Production
    ↓
Next.js Application
    ↓
Supabase
Next.js menangani frontend dan server-side application dalam satu deployment.
16.2 Production Environment
Production application tersedia melalui public URL.
Deployment harus diuji sebelum submission untuk memastikan seluruh core flow dapat diakses.
Core flow yang harus diverifikasi mencakup:
Registration / Login
Profile
Opportunity
Application
Selection
Meeting
Consent if required
Contract
Simulated Payment
Work Completion
Rating
Admin Moderation
16.3 Environment Variables
Production secrets disimpan sebagai environment variables pada platform deployment.
Secrets:
❌ Tidak disimpan di Git repository
❌ Tidak di-hardcode di source code
Environment-specific configuration dipisahkan antara development, preview/testing, dan production.
16.4 Deployment Flow
Code
  ↓
GitHub
  ↓
CI Checks
  ↓
Vercel Preview
  ↓
Smoke Test / Validation
  ↓
Production Deployment
  ↓
Health Check
  ↓
Monitoring
  ↓
Submission / Production Use
Production deployment tidak dilakukan langsung dari local machine developer.
16.5 Rollback
Jika production deployment mengalami masalah:
Production
    ↓
Issue Detected
    ↓
Rollback
    ↓
Previous Stable Deployment
    ↓
Health Check
    ↓
Monitoring
Rollback application dilakukan menggunakan previous stable deployment pada platform deployment.
Database migration harus dievaluasi secara terpisah karena rollback application tidak otomatis membalikkan perubahan database.
16.6 MVP Deployment Baseline
MVP mencakup:
- Production deployment
- Vercel Preview Deployment
- Basic CI/CD pipeline
- Health Check
- Smoke Test
- Basic Monitoring
- Rollback capability
- Environment variable management
Preview deployment digunakan sebagai validation environment sebelum production.
16.7 Future Development
Advanced deployment capability dapat dikembangkan menjadi:
- Dedicated staging infrastructure
- Canary deployment
- Advanced automated rollback
- Advanced infrastructure scaling
- Advanced deployment observability
POINT 16 - LOCKED 🔒

17. Testing & Quality Assurance
17.1 Testing Strategy
Testing Flex Network menggunakan beberapa level:
Unit Testing
      ↓
Integration Testing
      ↓
API / Server Action Testing
      ↓
RLS / Security Testing
      ↓
End-to-End Testing
      ↓
Manual Testing
      ↓
Acceptance Testing
Testing dilakukan sepanjang development lifecycle, bukan hanya sebelum deployment.
17.2 Unit Testing
Unit testing digunakan untuk critical business logic seperti:
- Matching
- Application state transition
- Contract validation
- Payment state transition
- Parental consent validation
- Rating eligibility
- Permission rules
Contoh state validation:
APPLIED → SELECTED ✅
REJECTED → SELECTED ❌
17.3 Integration Testing
Integration testing digunakan untuk memastikan komponen bekerja bersama.
Contoh:
Next.js
   ↓
Supabase Auth
   ↓
Application / Business Logic
   ↓
Data Access
   ↓
PostgreSQL
Integration testing juga mencakup interaksi antara module, repository, dan database sesuai kebutuhan.
17.4 API & Server Action Testing
Critical backend entrypoints harus diuji.
Contoh:
Route Handler
    ↓
Authentication
    ↓
Validation
    ↓
Business Logic
    ↓
Database
Server Action juga diuji sebagai backend entrypoint yang memiliki:
Authentication
Authorization
Validation
Business Rules
Data Mutation
17.5 End-to-End Testing
Core E2E flow:
Register
   ↓
Login
   ↓
Profile
   ↓
Opportunity
   ↓
Application
   ↓
Selection
   ↓
Meeting
   ↓
Meeting Completed
   ↓
Consent if required
   ↓
Contract
   ↓
Simulated Payment
   ↓
Work Completion
   ↓
Rating
   ↓
Verified Work History
E2E diprioritaskan pada critical user journeys, bukan seluruh kemungkinan kombinasi.
17.6 Manual Testing
Testing dilakukan pada:
Desktop
Tablet
Mobile
Serta pada role:
Talent
Hirer
Admin
Negative scenarios juga diuji.
Contoh:
Closed Opportunity
        ↓
Cannot Apply
Meeting Not Completed
        ↓
Cannot Create Contract
Consent Not Approved
        ↓
Contract Flow Blocked
Unauthorized User
        ↓
Action Rejected
17.7 Acceptance Testing
Acceptance Testing menggunakan Acceptance Criteria yang telah ditentukan dalam SRS.
Acceptance Criteria mencakup:
AC-01 Registration & Login
AC-02 Profile
AC-03 Opportunity
AC-04 Matching & Apply
AC-05 Selection & Meeting
AC-06 Contract & Simulated Payment
AC-07 Work Completion
AC-08 Rating & Work History
AC-09 Parental Consent
AC-10 Admin Moderation
AC-11 Error Handling
AC-12 Responsive UI
17.8 Bug Severity
Gunakan:
CRITICAL
HIGH
MEDIUM
LOW
Prioritas perbaikan:
CRITICAL
   ↓
HIGH
   ↓
MEDIUM
   ↓
LOW
17.9 CI Quality Gate
Setiap Pull Request harus melewati minimum checks:
Lint
Type Check
Unit Tests
Integration Tests
Build
Jika critical check gagal:
Merge Blocked
17.10 Security & RLS Testing
Security testing mencakup:
Authentication bypass
Authorization bypass
IDOR
Input validation
RLS policy
Sensitive data exposure
Rate limiting
Session handling
RLS testing harus membuktikan baik:
Allowed Access
maupun:
Denied Access
17.11 Regression Testing
Setiap bug penting yang telah diperbaiki harus memiliki regression test yang sesuai.
Flow:
Bug
 ↓
Fix
 ↓
Regression Test
 ↓
Future Prevention
17.12 Test Environment
Automated testing tidak dijalankan terhadap production database.
Environment testing menggunakan:
Development
Preview / Testing
Production
Production digunakan hanya untuk verification/smoke test setelah deployment.
17.13 Test Coverage
Coverage digunakan sebagai indikator kualitas, bukan satu-satunya ukuran.
Prioritas coverage:
Critical Business Logic
State Transitions
Authorization
Consent
Payment
Security-sensitive Operations
Tidak ada target global 100% coverage untuk seluruh codebase.
17.14 Future Development
Advanced testing capability dapat dikembangkan menjadi:
- Advanced load testing
- Stress testing pada traffic besar
- Mutation testing
- Chaos testing
- Advanced automated security scanning
- Large-scale performance testing
POINT 17 - LOCKED 🔒

18. Future Development & Scalability Roadmap
18.1 Purpose
MVP Flex Network difokuskan pada core functionality dan kebutuhan lomba.
Fitur yang membutuhkan kompleksitas tinggi atau integrasi eksternal dapat dikembangkan setelah MVP.
Roadmap tidak boleh mengubah MVP baseline yang sudah ditetapkan.
18.2 Feature Roadmap
Area
MVP
Future
Notification
In-app
Email / Push / Additional Channels
Payment
Simulated
Real Payment Gateway
Contract
Simulated
PDF + Digital Signature
Parental Consent
Simulated Declaration
Optional Guardian Account / Verification
Matching
Rule-based
Advanced / AI-assisted
Meeting
External Link
In-platform Video
Portfolio
External Link
Integrated Portfolio
Admin
Basic Moderation
Advanced Moderation
Analytics
Basic First-party Analytics
Advanced Analytics
Testing
Unit + Integration + Security/RLS + Critical E2E
Advanced Automation
Deployment
Vercel + Preview + CI/CD Baseline
Advanced Deployment Strategy
Monitoring
Basic Monitoring
Advanced Observability
Database
PostgreSQL + Basic Optimization
Advanced Scaling

18.3 Scalability Strategy
MVP menggunakan:
Next.js
+
Supabase
+
Vercel
dengan architecture Modular Monolith.
Jika kebutuhan meningkat:
MVP
  ↓
Product Expansion
  ↓
Performance Optimization
  ↓
Selective Service Separation
  ↓
Large-scale Infrastructure
Microservices tidak digunakan hanya karena "bisa".
Pemisahan service dilakukan hanya apabila terdapat kebutuhan nyata dari:
Traffic
Performance
Data Volume
Reliability
Domain Complexity
18.4 Scalability Priorities
Phase 1 - MVP
Fokus:
- Core functionality
- Competition requirements
- Stable deployment
- Basic testing
- Basic monitoring
- Basic CI/CD
- Database integrity
Phase 2 - Product Expansion
Fokus:
- Real payment
- Email notification
- Optional Guardian system
- Advanced matching
- Portfolio storage
- Advanced analytics
Phase 3 - Scale
Fokus:
- Advanced caching
- Background workers
- Advanced database optimization
- Advanced monitoring
- Advanced CI/CD
- Security hardening
- Infrastructure scaling
- Selective service extraction
18.5 Future Development Principles
Flex Network menggunakan pendekatan incremental scaling.
Sistem tidak melakukan premature optimization dan tidak membangun infrastructure yang terlalu kompleks sebelum dibutuhkan.
Tujuannya adalah:
Membangun MVP yang sederhana untuk dikembangkan sekarang, tetapi tetap memiliki struktur yang memungkinkan pengembangan dan scaling di masa depan.
POINT 18 - LOCKED 🔒

TECHNICAL ARCHITECTURE SUMMARY
Sebagai rangkuman dari keputusan architecture:
                        USER
                           │
                           ▼
                    ┌─────────────┐
                    │   Vercel    │
                    └──────┬──────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │     Next.js      │
                 │                  │
                 │    Frontend      │
                 │       +          │
                 │ Server-side/API  │
                 │                  │
                 │ Modular Monolith │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │     Supabase     │
                 │                  │
                 │ Authentication   │
                 │       +          │
                 │   PostgreSQL     │
                 │       +          │
                 │       RLS        │
                 └──────────────────┘
                          │
                          ▼
                    Application Data
Core Technology Stack
Frontend       → Next.js
Backend        → Next.js Full-Stack
Architecture   → Modular Monolith
Database       → Supabase PostgreSQL
Authentication → Supabase Auth
Hosting        → Vercel
Repository     → GitHub
Portfolio      → External Links
Matching       → Rule-based
Payment        → Simulated
Contract       → Simulated
Consent        → Simulated Declaration
Testing        → Unit + Integration + Security/RLS + E2E + Manual + Acceptance
MVP Principle
Keep the architecture simple enough for a 3-person team and a limited competition timeline, while maintaining clear modular boundaries so the system can be expanded when Flex Network is scaled in the future.
POINT 18 SUMMARY - LOCKED 🔒

POINT 20 - MODULE ARCHITECTURE
20.1 Module Architecture Overview
Flex Network menggunakan Modular Monolith.
Setiap business capability dipisahkan menjadi module berdasarkan responsibility dan ownership.
Seluruh module masih berjalan dalam satu application, tetapi internal implementation setiap module tetap terisolasi.
Module Structure
Flex Network Application
│
├── Authentication Module
├── Profile Module
├── Opportunity Module
├── Application Module
├── Matching Module
├── Meeting Module
├── Parental Consent Module
├── Contract Module
├── Payment Module
├── Work Module
├── Rating Module
├── Work History Module
├── Notification Module
├── Report Module
├── Admin Module
├── Audit Log Module
├── Search & Discovery Module
└── Health / Observability


20.2 Module Dependency & Boundary
Setiap module memiliki:
Responsibility.
Public interface.
Domain rules.
Repository/data access.
Input/output contract.
Module tidak boleh mengakses internal implementation module lain secara bebas.
Correct:
Application Module
      ↓
Meeting Public Interface
      ↓
Meeting Module

Incorrect:
Application Module
      ↓
Meeting Internal Repository

Dependency Principle
Dependency harus mengarah melalui public contract.
Tujuan:
Low coupling.
High cohesion.
Testability.
Maintainability.
Selective extraction di masa depan.

20.3 Authentication Module
Responsibility
Authentication Module menangani:
Registration.
Login.
Logout.
Session.
Authentication identity integration.
External Dependency
Authentication Module
        ↓
Supabase Auth
        ↓
auth.users

Rules
Self-registration hanya TALENT dan HIRER.
ADMIN tidak dapat self-register.
Authentication identity berasal dari Supabase Auth.
Role application berasal dari profiles.role.
Non-Responsibility
Authentication Module tidak menentukan:
Business ownership.
Opportunity selection.
Contract eligibility.
Payment release.
Work verification.

20.4 Profile Module
Responsibility
Profile Module menangani:
User profile.
Private profile information.
Talent profile.
Hirer profile.
Skills.
Interests.
Talent-skill relationship.
Talent-interest relationship.
Owned Data
profiles
profile_private
talent_profiles
hirer_profiles
skills
interests
talent_skills
talent_interests

Rules
User hanya dapat mengubah profile miliknya.
Public profile tidak boleh mengekspos private information.
is_minor tidak boleh dipercaya dari client.
Minor status ditentukan server-side berdasarkan birth_date.
Skill dan interest relationship harus dimiliki oleh Talent terkait.

20.5 Opportunity Module
Responsibility
Opportunity Module menangani:
Opportunity creation.
Opportunity update.
Opportunity detail.
Opportunity submission.
Opportunity lifecycle.
Opportunity moderation metadata.
Opportunity-skill relationship.
Opportunity-interest relationship.
Owned Data
opportunities
opportunity_skills
opportunity_interests

Lifecycle
DRAFT
  ↓
PENDING_REVIEW
  ↓
PUBLISHED
  ↓
CLOSED

Rules
Only HIRER can create opportunity.
HIRER hanya dapat mengelola opportunity miliknya.
Publish membutuhkan moderation.
Closed opportunity tidak menerima application baru.

20.6 Application Module
Responsibility
Application Module menangani:
Submit application.
Application retrieval.
Application review.
Selection.
Rejection.
Application lifecycle.
Owned Data
applications

Lifecycle
APPLIED
    ↓
UNDER_REVIEW
    ├──→ SELECTED
    └──→ REJECTED

Rules
Hanya TALENT yang dapat apply.
Opportunity harus PUBLISHED.
Deadline harus belum lewat.
Duplicate application harus dicegah.
HIRER hanya dapat memproses application pada opportunity miliknya.
Structural Protection
UNIQUE(talent_id, opportunity_id)


20.7 Matching Module
Responsibility
Matching Module menangani:
Skill matching.
Interest matching.
Weighted scoring.
Match classification.
Recommendation.
Input
Talent Skills
Talent Interests
Opportunity Required Skills
Opportunity Relevant Interests

Formula
Skill Match
= (Matched Skills / Required Skills) × 100

Interest Match
= (Matched Interests / Relevant Interests) × 100

Final Match Score
= (Skill Match × 0.70)
+ (Interest Match × 0.30)

Classification
80-100 → STRONG_MATCH
60-79  → GOOD_MATCH
30-59  → WEAK_MATCH
0-29   → NO_MATCH

Edge Cases
Required Skills = 0
→ Skill Match = 100

Relevant Interests = 0
→ Interest Match = 100

Rules
Calculation dilakukan server-side.
Deterministic.
Tidak ada AI/ML black-box.
Matching tidak melakukan automatic hiring.
Matching tidak mengubah application state.
Matching tidak membuat contract.

20.8 Meeting Module
Responsibility
Meeting Module menangani:
Schedule meeting.
Get meeting.
Update meeting.
Complete meeting.
Cancel meeting.
Owned Data
meetings

Lifecycle
SCHEDULED
    ├──→ COMPLETED
    └──→ CANCELLED

Rules
Meeting hanya dapat dibuat untuk SELECTED application.
Satu application maksimal memiliki satu meeting pada MVP.
Hanya pihak yang berwenang dapat mengubah meeting.
Meeting Completed menjadi prerequisite contract.
Structural Protection
UNIQUE(application_id)


20.9 Parental Consent Module
Responsibility
Parental Consent Module menangani:
Consent requirement evaluation.
Simulated consent record.
Consent status.
Consent approval.
Consent rejection.
Owned Data
consents

Consent Requirement
Opportunity requires consent
        OR
Talent is minor

Lifecycle
NOT_REQUIRED

atau:
PENDING
   ↓
APPROVED / REJECTED

MVP Boundary
Tidak memiliki:
Guardian role.
Guardian account.
Guardian dashboard.
Guardian authentication.
Identity document upload.
Consent merupakan:
Simulated Consent Declaration
Privacy Principle
Data guardian harus diminimalkan dan hanya disimpan apabila benar-benar diperlukan oleh implementation yang telah disepakati.

20.10 Contract Module
Responsibility
Contract Module menangani:
Contract creation.
Contract editing.
Contract proposal.
Agreement.
Contract activation.
Contract completion.
Contract termination.
Owned Data
contracts

Eligibility
Application = SELECTED
        +
Meeting = COMPLETED
        +
Consent = APPROVED
OR
Consent = NOT_REQUIRED

Lifecycle
DRAFT
   ↓
PENDING_AGREEMENT
   ↓
ACTIVE
   ├──→ COMPLETED
   └──→ TERMINATED

Agreement
Talent Agreement
+
Hirer Agreement
=
Contract ACTIVE

Side Effects on Activation
Contract ACTIVE
      ↓
Payment PENDING
+
Work NOT_STARTED


20.11 Payment Module
Responsibility
Payment Module menangani simulated payment state.
Owned Data
payments

Lifecycle
PENDING
   ↓
SIMULATED_PAID
   ↓
RELEASED

Rules
Tidak ada uang nyata.
Tidak ada payment gateway.
Payment hanya dapat digunakan untuk contract valid.
SIMULATED_PAID merepresentasikan simulated held state.
Release hanya dapat terjadi setelah completion conditions terpenuhi.
Client tidak dapat menentukan payment state.
Release Condition
Payment = SIMULATED_PAID
AND
Work = COMPLETED
AND
Hirer Confirmed = TRUE


20.12 Work Module
Responsibility
Work Module menangani:
Work creation.
Work state.
Work progress.
Work completion.
Hirer completion confirmation.
Owned Data
works

Lifecycle
NOT_STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED

Rules
Work dibuat saat Contract ACTIVE.
Talent mengubah progress.
Hirer melakukan completion confirmation.
Work tidak boleh diubah menjadi COMPLETED melalui state transition yang invalid.

20.13 Rating Module
Responsibility
Rating Module menangani:
Two-way rating.
Score.
Review content.
Rating retrieval.
Owned Data
ratings

Rating Types
TALENT_RATES_HIRER
HIRER_RATES_TALENT

Rules
Rating hanya dapat diberikan:
Work COMPLETED
+
Completion Confirmed
+
Rater is Involved Party

Structural Protection
UNIQUE(work_id, rater_id, rating_type)

Rating Independence
Rating tidak menjadi prerequisite untuk:
Payment Release.
Work History Verification.

20.14 Work History Module
Responsibility
Work History Module menangani:
Experience record.
Verification state.
Public work history visibility.
Verification override coordination.
Owned Data
work_history

Lifecycle
PENDING
   ↓
VERIFIED

Alternative administrative outcome:
VERIFIED
   ↓
REJECTED

Verification Rule
Normal verification:
Work COMPLETED
      ↓
Hirer Confirmed
      ↓
Work History VERIFIED

Talent tidak dapat melakukan verification terhadap dirinya sendiri.
ADMIN dapat melakukan verification override sesuai authorization.

20.15 Notification Module
Responsibility
Notification Module menangani:
Notification creation.
Notification retrieval.
Read/unread state.
Unread count.
Mark read.
Mark all read.
Owned Data
notifications

Principle
Notification adalah:
Non-critical side effect
Notification tidak boleh menentukan business state.
Contoh:
Application Selected
      ↓
Application State Changed
      ↓
Create Notification

Jika notification gagal:
Core Business Transaction
→ remains successful

apabila notification memang bersifat non-critical.

20.16 Report Module
Responsibility
Report Module menangani:
Create report.
Get own report.
Report detail.
Report lifecycle.
Admin report review interface.
Owned Data
reports

Report Targets
Minimal salah satu:
User.
Opportunity.
Application.
Lifecycle
SUBMITTED
   ↓
UNDER_REVIEW
   ├──→ RESOLVED
   └──→ REJECTED

Rules
Reporter dapat melihat report miliknya.
ADMIN dapat melihat report sesuai authorization.
Administrative resolution dicatat melalui Audit Log.

20.17 Admin Module
Responsibility
Admin Module menangani administrative operations:
User management.
Opportunity moderation.
Report handling.
Verification.
Administrative dashboard.
Audit access.
Rules
ADMIN bukan bypass untuk seluruh business architecture.
Administrative action tetap harus:
Authentication
    ↓
Admin Authorization
    ↓
Business Rule / Moderation Policy
    ↓
Action
    ↓
Audit Log

Example
Admin
 ↓
Suspend User
 ↓
Update User State
 ↓
Audit Log
 ↓
Notification if required


20.18 Audit Log Module
Responsibility
Audit Log Module menangani immutable/append-oriented record untuk important operations.
Owned Data
audit_logs

Data
actor_id;
actor_type;
action;
resource_type;
resource_id;
metadata;
created_at.
Actor Type
USER
ADMIN
SYSTEM

Rules
User biasa tidak memiliki permission untuk:
UPDATE audit log;
DELETE audit log.
Audit digunakan untuk:
Security.
Accountability.
Troubleshooting.
Administrative investigation.

20.19 Search & Discovery Module
Responsibility
Search & Discovery menangani:
Opportunity discovery.
Search.
Filtering.
Sorting.
Recommendation retrieval.
MVP Scope
MVP berfokus pada:
Text search.
Basic filters.
Matching-based recommendation.
Supported Opportunity Discovery
Filter dapat mencakup:
Opportunity Type.
Location.
Work Mode.
Duration.
Compensation Type.
Required Skill.
Relevant Interest.
Out of Scope
MVP tidak membutuhkan:
Semantic search.
Advanced ranking engine.
AI recommendation engine.
Complex personalization.

20.20 Portfolio & CV Module
Responsibility
Portfolio & CV functionality berada dalam Profile capability.
MVP menggunakan:
Portfolio URL.
CV URL.
MVP Exclusion
MVP tidak membutuhkan:
Direct file upload.
Portfolio builder.
CV generator.
Document management system.
Dengan demikian, module boundary tidak memerlukan dedicated storage subsystem hanya untuk portfolio/CV pada MVP.

20.21 Reporting & Analytics Module
Reporting & Analytics digunakan untuk aggregate system information.
MVP Scope
Contoh:
Total users.
Total TALENT.
Total HIRER.
Total opportunities.
Published opportunities.
Applications.
Contracts.
Completed work.
Verified Work History.
Pending reports.
Out of Scope
MVP tidak membutuhkan:
Advanced trend analysis.
Business intelligence platform.
Advanced recommendation analytics.
Predictive analytics.
Reporting harus menggunakan aggregate/read model tanpa mengambil alih ownership business data module lain.

20.22 Health & Observability Module
Health/Observability bertanggung jawab terhadap:
Health endpoint.
Structured logging.
Request ID.
Correlation ID.
Critical operation traceability.
Health Endpoint
GET /api/health

Health response tidak boleh mengembalikan:
database credentials;
environment variables;
stack trace;
SQL errors;
service role key.
Logging
Tidak boleh log:
password;
access token;
refresh token;
service role key;
sensitive consent data;
private user content.

20.23 Cross-Module Communication
Module berkomunikasi melalui public contract.
Example - Application Selected
Application Module
      ↓
Application State = SELECTED
      ↓
Notification Module
      ↓
Create Notification

Example - Contract Activated
Contract Module
      ↓
Contract ACTIVE
      ↓
Payment Module → Create PENDING
      ↓
Work Module → Create NOT_STARTED
      ↓
Notification Module
      ↓
Audit Log Module

Example - Work Confirmed
Work Module
      ↓
Work Confirmed
      ↓
Work History Module → VERIFIED
      ↓
Payment Module → RELEASED
      ↓
Contract Module → COMPLETED
      ↓
Notification Module
      ↓
Audit Log Module

Cross-module communication tidak dilakukan melalui internal repository access.

20.24 Module Dependency Rules
Allowed
Presentation
    ↓
Module Public Interface
    ↓
Application Service

Module A
    ↓
Module B Public Interface

Not Allowed
Module A
    ↓
Module B Internal Repository

UI
    ↓
Direct Database Mutation

Client
    ↓
Direct Business State Mutation


20.25 Module Ownership Matrix
Module
Primary Responsibility
Owned Data
Authentication
Authentication identity
Supabase Auth / auth.users
Profile
User & profile data
profiles, profile_private, talent_profiles, hirer_profiles
Matching
Matching calculation
Derived/read logic
Opportunity
Opportunity lifecycle
opportunities, opportunity_skills, opportunity_interests
Application
Application lifecycle
applications
Meeting
Meeting lifecycle
meetings
Parental Consent
Simulated consent
consents
Contract
Contract lifecycle
contracts
Payment
Simulated payment
payments
Work
Work lifecycle
works
Rating
Two-way rating
ratings
Work History
Experience verification
work_history
Notification
In-app notification
notifications
Report
User reports
reports
Admin
Administrative operations
Administrative access over owned resources
Audit Log
Audit records
audit_logs
Search & Discovery
Search/filter/read composition
Derived/read logic
Health & Observability
Health/logging/traceability
Operational telemetry


20.26 Module Event / Side Effect Principles
Business action merupakan primary operation.
Side effect:
Primary Business Action
      ↓
State Change
      ├── Notification
      └── Audit

Side effect tidak boleh menjadi source of truth.
Contoh:
Contract ACTIVE
      ↓
Payment PENDING
Work NOT_STARTED
Notification
Audit

Business state berada pada owner module masing-masing.

20.27 Module Security Rules
Setiap module harus menerapkan:
Authentication awareness.
Role authorization.
Resource ownership.
Input validation.
Business rule validation.
Repository boundary.
RLS defense-in-depth.
Sensitive data harus hanya dapat diakses melalui authorized path.

20.28 Module Testing Boundary
Setiap module harus dapat diuji secara terisolasi pada level:
Unit.
Integration.
Security/RLS sesuai kebutuhan.
Critical end-to-end flow.
Contoh
Application Module:
Valid Application
→ SELECTED ✅

Invalid State
→ Error ✅

Different Hirer
→ Forbidden ✅

Duplicate Application
→ Conflict ✅

Contract Module:
Selected + Meeting Completed
+ Consent Approved
→ Contract Created ✅

Meeting Not Completed
→ Blocked ✅

Consent Rejected
→ Blocked ✅


20.29 Module Evolution & Selective Extraction
Modular Monolith merupakan baseline MVP.
Apabila suatu module memiliki kebutuhan infrastructure terpisah yang terukur, module dapat diekstraksi melalui:
Module Boundary
      ↓
Public Contract
      ↓
Independent Deployment

Tidak ada kewajiban untuk membuat microservices selama MVP.
Selective extraction dapat dipertimbangkan apabila terdapat:
Scaling need.
Independent deployment need.
Infrastructure specialization.
Operational isolation.

20.30 Final Module Architecture Decision
Flex Network menggunakan Modular Monolith.
Setiap business capability memiliki module boundary dan module owner yang jelas.
Module tidak boleh mengakses internal repository module lain secara bebas.
Communication antar-module menggunakan public interface atau application contract.
Authentication menggunakan Supabase Auth.
Profile Module memiliki ownership terhadap profile dan skill/interest data.
Opportunity Module memiliki ownership terhadap opportunity data.
Application Module memiliki ownership terhadap application lifecycle.
Meeting Module memiliki ownership terhadap meeting lifecycle.
Parental Consent Module hanya menyediakan simulated consent declaration tanpa Guardian platform role.
Contract Module mengelola contract lifecycle dan agreement.
Payment Module hanya mengelola simulated payment.
Work Module mengelola work lifecycle dan completion confirmation.
Rating Module mengelola two-way rating.
Work History Module mengelola verified work experience.
Notification Module merupakan non-critical side-effect module.
Report Module menangani reporting lifecycle.
Admin Module menangani administrative operations sesuai authorization.
Audit Log Module mencatat important state-changing operations secara append-oriented.
Search & Discovery berfokus pada basic search/filter dan recommendation retrieval pada MVP.
Portfolio/CV menggunakan URL pada MVP dan tidak membutuhkan document storage subsystem khusus.
Reporting & Analytics menggunakan aggregate/read operations dan tidak mengambil alih ownership data module lain.
Health & Observability menyediakan health endpoint dan structured operational logging.
Tidak ada microservices requirement pada MVP.
Selective service extraction hanya dilakukan apabila terdapat measurable technical requirement.

21 - DATABASE ARCHITECTURE
21.1 - Architecture Approach
Database architecture mengikuti prinsip:
Application
     ↓
Application / Domain Logic
     ↓
Data Access Layer
     ↓
Database
Database tidak menjadi tempat business logic utama.
Business logic tetap berada pada Application / Domain Layer, sedangkan database bertanggung jawab terhadap persistence dan integrity.

21.2 - Database Responsibility
Database bertanggung jawab terhadap:
Data Persistence
Data Integrity
Relationships
Constraints
Transactions
Querying
Business rules tetap berada pada application/domain layer.
Database constraints digunakan sebagai defense-in-depth untuk menjaga integritas data.

21.3 - Relational Database
Untuk core transactional data digunakan relational database karena membutuhkan:
Structured Data
Relationships
Transactions
Consistency
Constraints
Referential Integrity
Flex Network menggunakan:
Supabase PostgreSQL
sebagai primary transactional database.

21.4 - Data Ownership
Setiap module memiliki ownership terhadap data yang menjadi tanggung jawabnya.
Contoh:
Identity
 → User / Profile Data

Opportunity
 → Opportunity Data

Application
 → Application Data

Meeting
 → Meeting Data

Contract
 → Contract Data

Payment
 → Payment Data

Consent
 → Consent Data
Module lain tidak boleh melakukan direct database manipulation terhadap data milik module lain tanpa melalui boundary yang telah ditentukan.

21.5 - Schema Design
Schema dirancang berdasarkan:
Domain
Relationship
Access Pattern
Integrity Requirement
Security Requirement
bukan hanya berdasarkan tampilan UI.

21.6 - Normalization
Data dinormalisasi untuk mengurangi:
Duplication
Inconsistency
Update Anomaly
Denormalization hanya dilakukan apabila terdapat alasan performance yang terukur.

21.7 - Primary Key
Setiap entity utama memiliki identifier yang unik.
Contoh:
Profile
Opportunity
Application
Contract
Rating
Payment
Work
masing-masing memiliki identity yang dapat direferensikan secara konsisten.

21.8 - Foreign Key
Relasi antar entity menggunakan foreign key ketika membutuhkan referential integrity.
Foreign key digunakan untuk memastikan hubungan antar entity tetap valid.

21.9 - Referential Integrity
Database harus mencegah:
Orphan Records
Invalid References
Broken Relationships
jika constraint tersebut memang diperlukan oleh domain.

21.10 - Constraints
Gunakan constraint untuk menjaga data integrity.
Contoh:
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
CHECK
Database constraints menjadi lapisan perlindungan terakhir terhadap invalid data.

21.11 - Unique Constraints
Data yang memang harus unik harus memiliki unique constraint.
Contoh:
User Email
Talent + Opportunity Application
One Application + One Meeting
One Application + One Contract
One Contract + One Payment
One Contract + One Work
Unique constraint digunakan berdasarkan business requirement.

21.12 - Nullability
Field harus nullable hanya jika secara domain memang diperbolehkan tidak memiliki value.
Required data menggunakan NOT NULL.

21.13 - Transaction
Operation yang membutuhkan atomicity harus menggunakan transaction.
Operation A
    +
Operation B
    ↓
Transaction
Jika salah satu gagal, perubahan dapat di-rollback sesuai kebutuhan.

21.14 - ACID
Transactional operations memanfaatkan prinsip:
Atomicity
Consistency
Isolation
Durability

21.15 - Transaction Boundary
Transaction boundary ditentukan pada application/service layer berdasarkan business operation.
Contoh:
Business Operation
       ↓
Application Service
       ↓
Transaction
       ↓
Multiple Data Mutations

21.16 - Concurrency
System harus mempertimbangkan kemungkinan beberapa request mengubah data yang sama secara bersamaan.
Critical state transitions harus dilindungi melalui:
Business Validation
+
Database Constraints
+
Transactional / Atomic Operations

21.17 - Data Consistency
Consistency dijaga melalui kombinasi:
Application Validation
+
Business Rules
+
Database Constraints
+
Transactions

21.18 - Soft Delete
Soft delete digunakan hanya untuk entity yang memang membutuhkan preservation/history.
Tidak semua data harus menggunakan soft delete.
Untuk data yang memiliki privacy/deletion requirement, deletion atau anonymization mengikuti business dan privacy rules.

21.19 - Audit Data
Perubahan penting dapat memiliki audit information sesuai kebutuhan entity.
Audit trail utama menggunakan:
Audit Log
├── Actor
├── Action
├── Resource
├── Timestamp
└── Metadata
Informasi seperti created_at dan updated_at tetap digunakan pada entity yang memerlukannya.

21.20 - Timestamp
Timestamp harus konsisten dan memiliki timezone strategy yang jelas.
MVP menggunakan:
UTC timestamps
untuk data yang disimpan di database.

21.21 - Migration
Perubahan schema harus dilakukan melalui migration yang versioned.
Contoh:
Migration 001
Migration 002
Migration 003
...
Migration menjadi bagian dari Git repository.
MVP migration structure:
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_indexes.sql
    ├── 003_rls_policies.sql
    └── 004_updated_at_triggers.sql

21.22 - Production Migration
Migration production harus:
Reviewed
Tested
Versioned
Traceable
Backward-compatible where practical
Destructive change harus dihindari jika masih ada safer migration strategy.

21.23 - Backward Compatibility
Schema change harus mempertimbangkan compatibility terhadap application version yang sedang berjalan.
Perubahan besar harus menggunakan rollout strategy yang aman.

21.24 - Expand & Contract
Untuk perubahan besar:
Expand
   ↓
Deploy Compatible Version
   ↓
Migrate Data
   ↓
Switch Application
   ↓
Contract
digunakan bila diperlukan untuk mengurangi deployment risk.

21.25 - Seed Data
Seed data hanya digunakan untuk:
Development
Testing
Required System Defaults
Competition Demo
Seed data tidak boleh mencampur data dummy dengan production data secara sembarangan.

21.26 - Database Access
Application tidak boleh memberikan akses database secara bebas kepada seluruh module.
Access harus mengikuti:
Ownership
Module Boundary
Authorization
RLS

21.27 - Repository / Data Access
Data access dapat diabstraksikan melalui repository atau mekanisme setara sesuai kebutuhan.
Tujuannya:
Separation
Testability
Maintainability
bukan abstraction untuk abstraction's sake.

21.28 - Query Optimization
Query harus:
Bounded
Efficient
Indexed where appropriate
dan menghindari query yang tidak diperlukan.
Hanya field yang diperlukan yang sebaiknya diambil apabila memungkinkan.

21.29 - N+1 Query
N+1 query harus diidentifikasi dan dihindari ketika menyebabkan performance issue.
Pendekatan dapat menggunakan:
Join
Relational Query
Batch Query
Appropriate Data Fetching
sesuai kebutuhan.

21.30 - Pagination
Dataset besar tidak boleh diambil seluruhnya dalam satu request.
Gunakan:
Pagination
Limit
Cursor
sesuai kebutuhan.
MVP dapat menggunakan offset/page pagination untuk dataset kecil, kemudian beralih ke cursor pagination apabila workload meningkat.

21.31 - Indexing
Index dibuat berdasarkan:
Query Pattern
Filtering
Sorting
Joining
Uniqueness
Index tidak dibuat hanya karena sebuah field tersedia.

21.32 - Over-Indexing
Index berlebihan harus dihindari karena dapat meningkatkan:
Storage
Write Cost
Maintenance Cost

21.33 - Connection Management
Application menggunakan connection management / pooling mechanism yang sesuai dengan:
Next.js Deployment Model
Supabase Architecture
Serverless Workload
Application tidak membuat database connections secara tidak terkendali.

21.34 - Connection Limit
Connection management harus memiliki limit atau mekanisme pengendalian yang sesuai untuk mencegah database overload.
Pengaturan mengikuti kemampuan Supabase dan deployment environment yang digunakan.

21.35 - Backup
MVP memiliki basic database backup strategy.
Untuk environment yang menggunakan Supabase Free Tier:
Scheduled pg_dump
        ↓
Secure Storage Terpisah
Backup tidak disimpan di public repository.

21.36 - Recovery
Backup harus dapat digunakan untuk recovery.
Backup
  ↓
Recovery Environment
  ↓
Restore
  ↓
Integrity Verification
  ↓
Service Recovery

21.37 - Recovery Testing
Recovery procedure perlu diuji secara berkala sesuai risk.
Minimal:
Backup availability
Restore procedure
Schema compatibility
Data integrity
Application connectivity

21.38 - Retention
Backup retention mengikuti:
Business Requirement
Storage Cost
Recovery Requirement
Compliance Requirement
Untuk MVP, retention mengikuti kapasitas dan operational requirements yang telah ditetapkan.

21.39 - Sensitive Data
Sensitive data harus mendapatkan protection yang sesuai.
Contoh:
Encryption / Secure Transport
Access Control
Restricted Access
Restricted Logging
Data Minimization

21.40 - Password Storage
Flex Network tidak menyimpan password authentication secara langsung di application database.
Authentication dan credential handling dikelola oleh:
Supabase Auth
Application tidak membuat custom password storage untuk MVP.

21.41 - Database Credentials
Credential database:
Tidak di-hardcode
Tidak disimpan di repository
Tidak ditulis di source code
Credential dikelola melalui secure configuration / secrets mechanism.

21.42 - Least Privilege
Database access hanya mendapatkan permission yang diperlukan.
Privileged service-role credential hanya digunakan pada server-side operation yang memang membutuhkan privilege tersebut.

21.43 - Production Access
Akses langsung ke production database dibatasi dan diaudit sesuai kebutuhan.
Developer tidak menggunakan production database sebagai playground.

21.44 - SQL Injection
Database interaction harus menggunakan parameterized queries atau database APIs / mechanisms yang aman.
Query tidak boleh dibangun melalui unsafe string concatenation.

21.45 - Data Validation
Validation dilakukan pada application layer, tetapi database constraints tetap digunakan sebagai final integrity protection.
Client Validation
      ↓
Server Validation
      ↓
Business Validation
      ↓
Database Constraints

21.46 - Large Data
Untuk dataset besar, architecture mempertimbangkan:
Indexing
Pagination
Archiving
Partitioning
hanya jika workload memang membutuhkannya.

21.47 - Archiving
Data lama dapat dipindahkan ke archival storage jika retention requirement dan workload membutuhkannya.
Archiving bukan requirement utama MVP.

21.48 - Database Monitoring
Monitor:
Query Latency
Connections
CPU / Resource Usage
Memory / Resource Usage
Storage
Locks
Slow Queries
Database Errors
Monitoring dilakukan menggunakan capability yang tersedia pada Supabase/infrastructure.

21.49 - Slow Query
Slow queries harus dapat diidentifikasi dan dianalisis.
Flow:
Slow Query
   ↓
Identify
   ↓
Analyze
   ↓
Optimize
   ↓
Measure Again

21.50 - Database Availability
Database merupakan critical dependency sehingga availability strategy menjadi bagian dari system reliability.

21.51 - Failure Handling
Application harus menangani database failure tanpa:
Data Corruption
Silent Failure
Uncontrolled Retry
Duplicate Mutation

21.52 - Retry
Retry hanya digunakan untuk error yang memang transient.
Retry harus memiliki:
Limit
Backoff
Timeout
Critical mutation tidak boleh melakukan blind retry.

21.53 - Idempotency
Operation yang berpotensi di-retry harus mempertimbangkan idempotency.
MVP menggunakan:
Unique Constraints
Business Validation
State Transition Checks
Duplicate Detection
Future critical external integrations dapat menggunakan:
Idempotency Key

21.54 - Deadlock
Transaction design harus meminimalkan kemungkinan deadlock.
Jika deadlock terjadi, application harus mampu menangani failure tersebut secara aman.

21.55 - Read / Write Separation
Read/write separation hanya diterapkan ketika workload benar-benar membutuhkannya.

21.56 - Read Replica
Read replica merupakan future scaling option.
Primary
   → Write

Replica
   → Read
Consistency implications harus dipertimbangkan.

21.57 - Partitioning
Partitioning hanya digunakan jika dataset dan query workload telah menunjukkan kebutuhan yang jelas.

21.58 - Sharding
Sharding bukan bagian dari MVP.
Sharding merupakan advanced scaling strategy apabila system berkembang secara signifikan.

21.59 - Database Vendor
Database technology dipilih berdasarkan:
Requirement
Reliability
Team Capability
Performance
Cost
Ecosystem
Untuk MVP, pilihan tersebut adalah:
Supabase PostgreSQL

21.60 - Database Independence
Application architecture tidak boleh terlalu tightly coupled dengan implementation detail database apabila hal tersebut tidak diperlukan.
Repository/Data Access Layer digunakan sebagai boundary untuk membantu separation tersebut.

21.61 - Data Lifecycle
Data mengikuti lifecycle:
Create
  ↓
Use
  ↓
Update
  ↓
Archive
  ↓
Delete
sesuai business dan retention requirements.
Tidak semua entity harus melewati seluruh tahap tersebut.

21.62 - Data Deletion
Deletion harus mempertimbangkan:
Business Rules
Relationships
Audit Requirements
Privacy
Retention
Untuk data pribadi/minor, deletion atau anonymization harus mengikuti privacy requirements yang berlaku.

21.63 - Privacy
Data pribadi hanya disimpan jika dibutuhkan oleh system.

21.64 - Data Minimization
Jangan menyimpan data:
“siapa tahu nanti kepake.”
Data collection harus memiliki purpose yang jelas.
Untuk simulated consent:
No Guardian Identity Document
No Unnecessary Guardian PII
Consent hanya menyimpan metadata yang diperlukan untuk workflow dan auditability.

21.65 - Data Export
Jika diperlukan oleh business/privacy requirement, system harus dapat menyediakan mekanisme export data yang aman.
Export harus melalui:
Authentication
Authorization
Data Filtering
Secure Delivery

21.66 - Data Import
Import data harus melalui:
Validation
Authorization
Integrity Check
Auditability

21.67 - Bulk Operations
Bulk operations harus memiliki:
Validation
Authorization
Transaction Strategy
Performance Consideration
Auditability
sesuai risk.

21.68 - Database Documentation
Database documentation minimal mencakup:
Schema
Relationships
Ownership
Migrations
Important Constraints
RLS
Index Strategy

21.69 - Database Governance
Database changes mengikuti engineering governance:
Design
  ↓
Review
  ↓
Migration
  ↓
Testing
  ↓
Deployment
  ↓
Monitoring

21.70 - FINAL DECISION
Database Architecture: Flex Network menggunakan relational database sebagai primary transactional data store dengan data ownership yang jelas berdasarkan module.
Responsibility: Database bertanggung jawab terhadap persistence, integrity, constraints, relationships, dan transactions, sedangkan business logic tetap berada pada application/domain layer.
Database: Supabase PostgreSQL.
Schema Management: Seluruh perubahan schema dilakukan melalui versioned migration yang disimpan di Git.
Migrations: MVP menggunakan pemisahan initial schema, indexes, RLS policies, dan updated_at triggers sesuai migration strategy yang ditetapkan.
Performance: Database menggunakan indexing, pagination, query optimization, dan connection management berdasarkan workload.
Security: RLS, least privilege, secure credentials, server-side authorization, dan database constraints digunakan sebagai defense-in-depth.
Authentication Credentials: Password authentication dikelola oleh Supabase Auth dan tidak disimpan secara langsung oleh application database.
Backup: MVP menggunakan basic backup/recovery strategy, termasuk scheduled pg_dump untuk environment yang membutuhkannya.
Advanced Scaling: Read replicas, partitioning, dan sharding bukan bagian dari MVP dan hanya diperkenalkan berdasarkan workload yang terukur.
Privacy: Data minimization diterapkan pada seluruh schema, termasuk simulated consent.
Governance: Seluruh perubahan database harus melalui design, review, migration, testing, deployment, dan monitoring.
POINT 21 - LOCKED 🔒

POINT 22 - API ARCHITECTURE
Karena stack yang sudah locked:
Frontend      → Next.js
Backend       → Next.js
Architecture  → Modular Monolith
Database      → Supabase PostgreSQL
Auth          → Supabase Auth
maka API architecture mengikuti stack tersebut.

22.1 - API Architecture Pattern
Kita menggunakan:
REST API sebagai primary backend contract.
Bukan GraphQL untuk MVP.
Next.js backend memiliki dua entrypoint:
1. Route Handlers / REST API
2. Server Actions
Keduanya harus bermuara ke Application / Module Layer yang sama.
Flow:
┌─────────────┐
│   Client    │
│  Next.js UI │
└──────┬──────┘
       │
       ├── HTTP → Route Handler /api/...
       │
       └── Server Action
              │
              ▼
       Application Layer
              │
              ▼
       Domain / Module Layer
              │
              ▼
       Data Access Layer
              │
              ▼
       Supabase PostgreSQL
Prinsip penting:
API / Server Action tidak langsung query database.
Route Handler dan Server Action hanya menjadi entrypoint.
Business logic tetap berada di Application Service / Module Layer.

22.2 - API Base URL
Untuk production:
/api
Contoh:
/api/opportunities
/api/applications
/api/contracts
Karena backend dan frontend berada dalam satu Next.js application, MVP tidak membutuhkan:
api.flexnetwork.com

22.3 - HTTP Methods
Standard REST:
Method
Purpose
GET
Read
POST
Create / Action
PATCH
Partial Update
DELETE
Delete

Contoh:
GET    /api/opportunities
POST   /api/opportunities
GET    /api/opportunities/:id
PATCH  /api/opportunities/:id
DELETE /api/opportunities/:id
DELETE tidak otomatis tersedia untuk semua resource.
Deletion mengikuti data lifecycle dan business rule.

22.4 - API Resources
Resource utama:
/api/auth
/api/profile
/api/profiles/:id
/api/opportunities
/api/applications
/api/meetings
/api/contracts
/api/payments
/api/parental-consents
/api/notifications
/api/ratings
/api/work
/api/work-history
/api/reports
/api/admin
/api/audit-logs
Search/discovery dapat menggunakan:
/api/opportunities
/api/profiles
dengan query/filter parameter tanpa harus membuat dedicated search service pada MVP.
Beberapa endpoint dapat berupa action endpoint apabila operasi bukan CRUD sederhana.

22.5 - Authentication
Authentication menggunakan:
Supabase Auth
Flow:
User
 ↓
Login
 ↓
Supabase Auth
 ↓
Session / Token
 ↓
Next.js
 ↓
Authenticated Request
API tidak membuat sistem password sendiri.

22.6 - Authentication vs Authorization
Authentication:
“Siapa lu?”
Authorization:
“Lu boleh ngapain?”
Contoh:
User A
 ↓
Authenticated ✅
 ↓
PATCH Opportunity B
 ↓
Owner?
 ↓
NO ❌
Request tetap ditolak walaupun user sudah login.

22.7 - API Authorization
Authorization dilakukan di server.
Conceptual flow:
Request
 ↓
Authenticate
 ↓
Identify User
 ↓
Check Role
 ↓
Check Resource Ownership
 ↓
Business Rule
 ↓
Execute
Contoh:
HIRER
 └── Create Opportunity

TALENT
 └── Create Application

ADMIN
 └── Moderation

22.8 - API Layer Responsibility
Route Handler dan Server Action hanya menangani:
Request Extraction
Validation
Authentication
Authorization
Call Application Service
Response / Action Result
HTTP Status / UI Result
Business logic tidak ditaruh penuh di route handler atau server action.
❌ Bad:
POST /api/applications

route.ts
→ validate
→ query database
→ check matching
→ create application
→ create notification
→ create audit
→ ...
✅ Good:
Route Handler / Server Action
     ↓
Application Service
     ↓
Application Module
     ↓
Repository
     ↓
Database

22.9 - Application Service
Contoh:
ApplicationService
dapat memiliki use case:
createApplication()
selectApplication()
rejectApplication()
API memanggil use case tersebut.
Untuk penyelarasan dengan SRS:
accept = select

22.10 - Module Ownership
Setiap resource memiliki module owner.
Profile Module
    ↓
/api/profile

Opportunity Module
    ↓
/api/opportunities

Application Module
    ↓
/api/applications

Meeting Module
    ↓
/api/meetings

Contract Module
    ↓
/api/contracts

Payment Module
    ↓
/api/payments

Parental Consent Module
    ↓
/api/parental-consents

Notification Module
    ↓
/api/notifications

Rating Module
    ↓
/api/ratings

Admin Module
    ↓
/api/admin

Report Module
    ↓
/api/reports

Work History
    ↓
/api/work-history

Audit Log
    ↓
/api/audit-logs
Ini konsisten dengan Modular Monolith.

22.11 - Opportunity API
Candidate endpoints:
GET    /api/opportunities
POST   /api/opportunities
GET    /api/opportunities/:id
PATCH  /api/opportunities/:id
DELETE /api/opportunities/:id
Query:
/api/opportunities?status=PUBLISHED
/api/opportunities?category=DESIGN
Pagination:
/api/opportunities?page=1&limit=20
Opportunity lifecycle:
DRAFT
 ↓
PENDING_REVIEW
 ↓
PUBLISHED
 ↓
CLOSED
Untuk MVP, opportunity dapat dipublikasikan setelah validasi dasar.
Moderation tetap tersedia melalui admin dashboard dan report-based moderation.

22.12 - Application API
GET  /api/applications
POST /api/applications
Specific:
GET   /api/applications/:id
PATCH /api/applications/:id
Action endpoints:
POST /api/applications/:id/review
POST /api/applications/:id/select
POST /api/applications/:id/reject
accept = select.
Action endpoint digunakan karena state transition bukan sekadar update status.

22.13 - Application State Machine
Canonical status:
APPLIED
   │
   ├──→ UNDER_REVIEW
   │
   ├──→ SELECTED
   │
   ├──→ REJECTED
Mapping lama:
PENDING = APPLIED
ACCEPTED = SELECTED
Tidak boleh:
REJECTED → SELECTED
SELECTED → APPLIED
State transition dikontrol oleh application service.

22.14 - Meeting API
GET   /api/meetings
POST  /api/meetings
GET   /api/meetings/:id
PATCH /api/meetings/:id
Action:
POST /api/meetings/:id/cancel
POST /api/meetings/:id/complete
MVP meeting status:
SCHEDULED
 ↓
COMPLETED
atau:
SCHEDULED
 ↓
CANCELLED
Optional future/pre-flow:
PROPOSED
 ↓
SCHEDULED
PROPOSED tidak menjadi mandatory MVP.

22.15 - Contract API
Resource:
GET /api/contracts
POST /api/contracts
GET /api/contracts/:id
PATCH /api/contracts/:id
Action
POST /api/contracts/:id/propose
POST /api/contracts/:id/agree
POST /api/contracts/:id/decline
Create Contract
Contract hanya dapat dibuat apabila seluruh requirement telah terpenuhi:
Application = SELECTED
+
Meeting = COMPLETED
+
Consent = APPROVED
OR
Consent = NOT_REQUIRED
Setelah validasi berhasil, contract dibuat dengan status:
DRAFT
Contract Lifecycle
DRAFT
↓
PENDING_AGREEMENT
↓
ACTIVE
Contract dapat berakhir melalui:
PENDING_AGREEMENT → TERMINATED
atau setelah pekerjaan selesai:
ACTIVE → COMPLETED
Propose Contract
POST /api/contracts/:id/propose
Auth: HIRER
State transition:
DRAFT → PENDING_AGREEMENT
Side effects:
Set proposed_at
Set proposed_by
Create notification
Create audit log
Agree Contract
POST /api/contracts/:id/agree
Auth: TALENT / HIRER involved party
User hanya dapat memberikan agreement untuk dirinya sendiri.
Contract menjadi:
PENDING_AGREEMENT → ACTIVE
apabila:
Talent Agreement = TRUE
AND
Hirer Agreement = TRUE
Saat contract menjadi ACTIVE, sistem membuat:
Payment dengan status PENDING
Work dengan status NOT_STARTED
Notification
Audit Log
Decline Contract
POST /api/contracts/:id/decline
Auth: TALENT / HIRER
State transition:
PENDING_AGREEMENT → TERMINATED
Sistem mencatat:
declined_at
declined_by
decline_reason
Business Validation
POST /api/contracts tidak boleh membuat contract secara bebas.
Server harus melakukan validasi terhadap:
Authentication
Authorization
Application state
Meeting state
Consent requirement
Consent state
Resource ownership
Contract eligibility
Client tidak dapat mengubah contract state secara langsung tanpa melalui authorized business flow.

22.16 - Payment API
Karena payment MVP masih simulated:
GET  /api/payments
POST /api/payments
GET  /api/payments/:id
MVP payment flow:
Contract ACTIVE
 ↓
Payment CREATED
 ↓
PENDING
 ↓
SIMULATED_PAID
 ↓
Work COMPLETED
 ↓
Hirer Confirms
 ↓
RELEASED
SIMULATED_PAID adalah canonical database/API status.
Istilah “held” hanya boleh digunakan sebagai penjelasan UI, bukan sebagai status enum.
Future:
Payment Provider
       ↓
Webhook
       ↓
/api/webhooks/payment
Webhook payment belum masuk MVP.

22.17 - Parental Consent API
Resource
GET /api/parental-consents?applicationId=:id
Auth:
Talent owner
Hirer owner
Admin
Jika consent tidak diperlukan, response dapat menunjukkan:
required = false
status = NOT_REQUIRED
Create Consent
POST /api/parental-consents
Auth: TALENT
Request minimal:
{
  "applicationId": "uuid"
}

Required conditions:
Application = SELECTED
Meeting = COMPLETED
Consent Required = TRUE
Consent belum ada
Initial state:
PENDING
required_reason dapat mencatat alasan operasional seperti:
MINOR
OPPORTUNITY_REQUIRES_CONSENT
Approve Consent
POST /api/parental-consents/:id/approve
Auth: TALENT dalam simulated consent flow
State:
PENDING → APPROVED
Sistem mencatat:
approved_at
Reject Consent
POST /api/parental-consents/:id/reject
Auth: TALENT
State:
PENDING → REJECTED
Contract tetap blocked.
Flow
Application SELECTED
↓
Meeting COMPLETED
↓
Consent Required?
├── No → Contract
└── Yes
    ↓
PENDING
    ↓
Talent Consent Declaration
    ↓
Server Validation
    ↓
APPROVED / REJECTED
    ↓
Contract / Contract Blocked
MVP Constraint
Parent/Guardian tidak memiliki account platform.
Tidak ada independent Guardian authentication.
Tidak ada Guardian role.
Tidak ada independent Guardian verification.
Akses data consent harus ketat.

22.18 - Notification API
GET /api/notifications
PATCH /api/notifications/:id/read
Bulk:
POST /api/notifications/read-all
Notification creation dilakukan oleh server-side business process.
Client tidak boleh bebas membuat notification ke user lain.

22.19 - Rating API
GET  /api/ratings
POST /api/ratings
GET  /api/ratings/:id
Saat POST:
Check Contract
 ↓
Check Work Completed
 ↓
Check Reviewer
 ↓
Check Reviewee
 ↓
Check Eligibility
 ↓
Create Rating
Rating hanya tersedia setelah pekerjaan selesai.

22.20 - Profile API
GET   /api/profile
PATCH /api/profile
Public profile:
GET /api/profiles/:id
Data sensitif tidak boleh ikut dikembalikan ke public response.

22.21 - Admin API
Admin endpoint:
/api/admin/users
/api/admin/opportunities
/api/admin/applications
/api/admin/reports
/api/admin/audit-logs
Semua endpoint admin membutuhkan:
Authenticated
+
ADMIN role

22.22 - Request Validation
Semua input API harus divalidasi server-side.
Contoh:
POST /api/opportunities
Server melakukan:
Schema Validation
 ↓
Business Validation
 ↓
Database
Implementation validation library yang disarankan:
Zod

22.23 - Response Format
Success:
{
  "success": true,
  "data": {}
}
List:
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

22.24 - Error Format
{
  "success": false,
  "error": {
    "code": "APPLICATION_ALREADY_EXISTS",
    "message": "Application already exists."
  }
}
Frontend tidak perlu menebak-nebak response format.

22.25 - HTTP Status Codes
200 OK
201 CREATED
204 NO CONTENT
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
422 UNPROCESSABLE ENTITY
429 TOO MANY REQUESTS
500 INTERNAL SERVER ERROR
503 SERVICE UNAVAILABLE
Contoh:
Not logged in
→ 401

Logged in but not allowed
→ 403

Resource doesn't exist
→ 404

Duplicate application
→ 409

22.26 - Error Code
HTTP status belum cukup.
Contoh:
409
APPLICATION_ALREADY_EXISTS
atau:
403
OPPORTUNITY_ACCESS_DENIED
Error code harus stabil agar frontend dapat menangani error secara deterministic.

22.27 - Pagination
Semua endpoint yang mengembalikan collection wajib mempertimbangkan pagination.
Contoh:
GET /api/opportunities?page=1&limit=20
Default:
limit = 20
Maximum:
limit = 100

22.28 - Filtering
Filtering berdasarkan query parameters.
Contoh:
GET /api/opportunities
    ?status=PUBLISHED
    &category=DESIGN
Backend harus memvalidasi parameter.

22.29 - Sorting
Contoh:
GET /api/opportunities?sort=created_at&order=desc
Sorting field harus whitelist.
Contoh whitelist:
created_at
deadline
title
Jangan izinkan arbitrary field dari user.

22.30 - API Security
Minimum:
Authentication
Authorization
Input Validation
RLS
Rate Limiting
Secure Headers
CORS Policy
Error Sanitization
Karena frontend dan backend berada pada Next.js yang sama, CORS untuk internal calls lebih sederhana, tetapi external-facing endpoint tetap harus memiliki policy yang sesuai.

22.31 - Rate Limiting
Endpoint sensitif harus memiliki rate limit.
Contoh:
Login
Application creation
Password-related actions
Public search
Untuk MVP dapat menggunakan basic/managed rate limiting.

22.32 - Sensitive Information
API response tidak boleh membocorkan:
Password
Service Role Key
Internal Secrets
Sensitive Tokens
Unnecessary Personal Data
Error juga tidak boleh mengembalikan:
PostgreSQL stack trace
SQL query
Internal filesystem path

22.33 - API Logging
Server dapat mencatat:
Request
User ID
Endpoint
Status
Latency
Error
Request ID
Jangan log:
Password
Access Token
Refresh Token
Sensitive Consent Data
Payment Secrets
Service Credentials

22.34 - API Idempotency
Operation tertentu perlu dicegah duplicate.
Contoh:
POST /api/applications
User klik dua kali.
Server harus mencegah duplicate melalui:
Unique Constraint
+
Business Validation
+
State Check
Untuk payment/webhook future:
Idempotency Key
menjadi important.

22.35 - API Transactions
API yang menjalankan multi-step operation dapat menggunakan transaction.
Contoh:
Select Application
     ↓
Update Application
     ↓
Create Required Record
     ↓
Create Audit Log
Jika operasi tersebut harus atomic:
BEGIN
 ↓
Operations
 ↓
COMMIT
Jika gagal:
ROLLBACK
Notification side effect tidak harus memaksa rollback core transaction.

22.36 - API ↔ RLS
Architecture final:
Client
 ↓
API / Server Action
 ↓
Authorization
 ↓
Service
 ↓
Repository
 ↓
Supabase
 ↓
RLS
 ↓
PostgreSQL
RLS adalah last line of defense.

22.37 - API ↔ Supabase
Kita menggunakan Supabase SDK dari server/client sesuai kebutuhan.
Privileged operation:
Service Role
hanya boleh digunakan di:
SERVER
Tidak pernah di:
Browser

22.38 - API Versioning
Untuk MVP:
/api/...
belum perlu:
/api/v1/...
Jika platform berkembang menjadi public API:
/api/v1
/api/v2
bisa diperkenalkan.

22.39 - API Documentation
API harus terdokumentasi.
Minimal:
Endpoint
Method
Authentication
Request
Response
Errors
Authorization
Future dapat menggunakan:
OpenAPI / Swagger
Tetapi dokumentasi endpoint tetap wajib walaupun Swagger belum dibuat.

22.40 - API Testing Strategy
API akan dites pada beberapa level:
Unit Test
Integration Test
API Test
End-to-End Test
Contoh test:
Authenticated?
Correct role?
Opportunity exists?
Opportunity is PUBLISHED?
Deadline / business rule valid?
Already applied?
Create application?
Create notification?
Create audit?

22.41 - API Architecture Diagram
Final:
                        CLIENT
                           │
                           ▼
                    ┌─────────────┐
                    │   Next.js   │
                    │     UI      │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       Route Handlers             Server Actions
              │                         │
              └────────────┬────────────┘
                           ▼
                Authentication
                Authorization
                Validation
                           │
                           ▼
                 ┌─────────────────┐
                 │ Application     │
                 │ / Use Cases     │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Domain Modules  │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Data Access     │
                 │ / Repository    │
                 └────────┬────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Supabase   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
               PostgreSQL        RLS

22.42 - API Principles
Kita lock prinsip:
1. REST API sebagai primary backend contract.
2. Next.js Route Handlers dan Server Actions sebagai entrypoints.
3. Modular Monolith.
4. Server-side Authorization.
5. Supabase Auth.
6. PostgreSQL + RLS.
7. Input Validation.
8. Consistent Response.
9. Consistent Error Format.
10. HTTP Standard.
11. Pagination.
12. Filtering.
13. Controlled Sorting.
14. Rate Limiting.
15. Secure Logging.
16. Transactional Operations.
17. Idempotency where required.
18. No sensitive data exposure.
19. No direct database logic in route handlers/server actions.
20. No premature API versioning.
22.43 - FINAL DECISION
API Architecture: REST API.
Implementation: Next.js API layer dalam Modular Monolith.
Base Path: /api.
Entrypoints: Route Handlers dan Server Actions.
Primary Backend Contract: REST API / Route Handlers.
Authentication: Supabase Auth.
Authorization: Server-side role + resource ownership + business rule checks.
Database Access: Melalui service/use-case dan data-access layer.
Database Security: Supabase RLS sebagai defense-in-depth.
Validation: Server-side schema validation menggunakan library validation yang ditentukan pada implementation stage.
Response: JSON dengan struktur success/data atau success/error yang konsisten.
HTTP: Menggunakan standard HTTP status codes.
Collection: Mendukung pagination dan filtering.
Sorting: Menggunakan whitelist field.
Security: Rate limiting, input validation, secure logging, dan sensitive-data protection.
Business Operations: Complex state transitions menggunakan application service/action endpoint bila diperlukan.
Transactions: Digunakan untuk operasi multi-step yang membutuhkan atomicity.
Idempotency: Digunakan berdasarkan business requirement dan critical external integrations.
Documentation: Setiap endpoint harus memiliki request, response, authorization, dan error documentation.
Versioning: Tidak menggunakan /v1 untuk MVP.
Testing: API akan diuji melalui unit, integration, dan end-to-end testing sesuai kebutuhan.
POINT 22 - LOCKED 🔒

23 - CODEBASE / PROJECT STRUCTURE
23.1 - Repository Strategy
Flex Network menggunakan:
Single Repository / Single Next.js Application
Bukan microservices.
flex-network/
└── satu Next.js application
Frontend dan backend berada dalam repository yang sama karena menggunakan Next.js Full-Stack / Modular Monolith.

23.2 - High-Level Folder Structure
Struktur final MVP:
flex-network/
│
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   ├── opportunities/
│   ├── applications/
│   ├── contracts/
│   ├── admin/
│   └── api/
│
├── modules/
│   ├── auth/
│   ├── profile/
│   ├── opportunity/
│   ├── application/
│   ├── matching/
│   ├── meeting/
│   ├── contract/
│   ├── payment/
│   ├── parental-consent/
│   ├── notification/
│   ├── rating/
│   ├── work-history/
│   ├── search/
│   ├── portfolio/
│   ├── reporting-analytics/
│   ├── report/
│   ├── audit-log/
│   ├── background-jobs/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── forms/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   ├── error-handling/
│   └── utils/
│
├── types/
│
├── config/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
│
└── ...
Ini adalah blueprint struktur.
Detail file per module dapat berkembang saat development.

23.3 - App Directory
app/ bertanggung jawab terhadap:
Routing
Pages
Layouts
API Routes
Loading
Error Boundaries
Business logic tidak diletakkan di app/.

23.4 - Route Handler
Contoh:
app/api/opportunities/route.ts
Tugasnya:
Request
 ↓
Validation
 ↓
Authentication
 ↓
Authorization
 ↓
Call Service
 ↓
Response
Business logic tidak diletakkan penuh di route handler.

23.5 - Module Directory
modules/ adalah jantung Modular Monolith.
Setiap module memiliki ownership terhadap domain/business capability tertentu.

23.6 - Internal Module Structure
Setiap module dapat mengikuti pola:
module/
├── domain/
├── application/
├── infrastructure/
└── index.ts
Contoh:
modules/opportunity/

├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── rules/
│
├── application/
│   ├── services/
│   └── use-cases/
│
├── infrastructure/
│   └── repositories/
│
└── index.ts
Value Objects bersifat optional.
Gunakan hanya jika memang memiliki business meaning yang jelas.

23.7 - Domain Layer
Domain berisi:
Business Concepts
Business Rules
Entities
Value Objects
Domain Logic
Domain tidak boleh bergantung langsung pada:
Next.js UI
React
Supabase SDK
HTTP

23.8 - Application Layer
Application Layer mengatur use case.
Contoh:
CreateOpportunity
UpdateOpportunity
CloseOpportunity
GetOpportunity
Flow:
API / Server Action
 ↓
Use Case
 ↓
Domain
 ↓
Repository

23.9 - Infrastructure Layer
Infrastructure menangani implementasi eksternal.
Contoh:
SupabaseOpportunityRepository
Conceptually:
Application
     ↓
Repository Interface
     ↓
Supabase Repository
     ↓
PostgreSQL

23.10 - Repository Pattern
Repository abstraction digunakan secukupnya.
Tujuan:
Memisahkan business logic dari database implementation.
Repository bukan dibuat hanya demi pattern.

23.11 - Dependency Direction
Rule:
UI
 ↓
API / Server Action
 ↓
Application
 ↓
Domain
Infrastructure berada di luar domain:
Infrastructure
 ↓
implements dependency
Domain tidak boleh:
Domain
 ↓
Supabase SDK

23.12 - Module Dependency
Module boleh berkomunikasi melalui public interface.
Application Module
       ↓
Contract Module Public Interface
Tidak diperbolehkan:
Application Module
       ↓
Contract Module Internal Files
       ↓
Random Repository

23.13 - Public Module Interface
Setiap module memiliki:
index.ts
sebagai public boundary.
Hanya export sesuatu yang memang boleh digunakan module lain.

23.14 - Circular Dependency
Harus dihindari:
Application
 ↓
Contract
 ↓
Application
 ↓
Contract
Jika dua module terlalu tightly coupled, evaluasi domain boundary atau gunakan orchestration pada application layer.

23.15 - Shared Components
components/ hanya untuk UI yang reusable.
Contoh:
components/
├── ui/
├── forms/
└── shared/
Business logic berat tidak dimasukkan ke shared UI.

23.16 - UI vs Domain
Component UI boleh:
Display title
Display status
Display deadline
tetapi tidak boleh:
Direct Supabase Query
Change Contract State
Bypass Authorization

23.17 - Supabase Client Structure
lib/supabase/
├── browser.ts
├── server.ts
└── admin.ts
admin.ts:
SERVER ONLY
Rules:
admin.ts tidak boleh di-import ke Client Component.
admin.ts tidak dipakai untuk flow user normal jika server client + RLS sudah cukup.
SUPABASE_SERVICE_ROLE_KEY tidak boleh terekspos ke browser.

23.18 - Validation
Generic validation utilities:
lib/validation/
Module-specific schemas sebaiknya berada dekat module.
Contoh:
modules/opportunity/
└── application/
    └── schemas/

23.19 - Types
types/ hanya untuk types yang benar-benar shared.
Contoh:
types/
├── api.ts
├── pagination.ts
└── common.ts
Type yang khusus module sebaiknya tetap berada di module tersebut.

23.20 - Database Types
Supabase generated types digunakan sebagai database-level types.
Conceptually:
Database
 ↓
Generated Types
 ↓
Repository
Jangan manually duplicate database schema menjadi type terpisah jika tidak diperlukan.
Recommended:
types/database.types.ts
atau:
supabase/database.types.ts

23.21 - Config
Configuration:
config/
├── app.ts
├── auth.ts
└── constants.ts
Contoh:
MAX_APPLICATIONS
DEFAULT_PAGE_SIZE
Environment secret tetap berada di environment variables.

23.22 - Environment Variables
Conceptually:
.env.local
Contoh:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
Service role:
❌ NEXT_PUBLIC_
Privileged secret tidak boleh terekspos ke client.

23.23 - Supabase Migrations
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_indexes.sql
    ├── 003_rls_policies.sql
    └── 004_updated_at_triggers.sql
Migration menjadi bagian dari Git.

23.24 - Seed Data
Development seed:
supabase/seed/
└── seed.sql
Seed dapat berisi:
Talent
Hirer
Admin
Skills
Interests
Opportunities
Applications
Meetings
Consents
Contracts
Payments
Works
Ratings
Work History
Notifications
Reports
Seed membantu development, testing, dan competition demo.

23.25 - Tests Structure
tests/
├── unit/
├── integration/
└── e2e/
Concept:
Unit
→ Business Logic

Integration
→ Database/API/Module Interaction

E2E
→ User Flow

23.26 - Naming Convention
Files:
kebab-case
Components:
PascalCase
Functions:
camelCase
Examples:
opportunity-service.ts
create-opportunity.ts
OpportunityCard.tsx
createOpportunity()

23.27 - Import Rules
Hindari relative import yang terlalu dalam:
../../../../../../
Gunakan alias:
@/modules/opportunity
@/components/ui
@/lib/supabase

23.28 - Module Boundary Rules
Contoh:
modules/application/
tidak boleh mengakses:
modules/opportunity/infrastructure/repositories/
secara langsung.
Harus melalui:
modules/opportunity/index.ts

23.29 - Business Logic Placement
Logic
Location
UI behavior
Components
HTTP handling
API / Server Action
Use case
Application
Business rule
Domain
DB implementation
Infrastructure
Generic utility
Lib
DB schema
Supabase migrations

Ini wajib dijaga.

23.30 - Example Full Module
Contoh:
modules/opportunity/
│
├── domain/
│   ├── entities/
│   │   └── opportunity.ts
│   ├── rules/
│   │   └── opportunity-rules.ts
│   └── value-objects/
│
├── application/
│   ├── services/
│   │   └── opportunity-service.ts
│   ├── use-cases/
│   │   ├── create-opportunity.ts
│   │   ├── update-opportunity.ts
│   │   └── close-opportunity.ts
│   └── schemas/
│       └── opportunity-schema.ts
│
├── infrastructure/
│   └── repositories/
│       └── supabase-opportunity-repository.ts
│
└── index.ts

23.31 - Example API Connection
POST /api/opportunities
          ↓
route.ts
          ↓
createOpportunity()
          ↓
Opportunity Domain Rules
          ↓
OpportunityRepository
          ↓
Supabase
          ↓
PostgreSQL

23.32 - Example Frontend Connection
OpportunityForm
       ↓
Server Action / API Client
       ↓
Application Service
       ↓
Domain
       ↓
Repository
       ↓
PostgreSQL
Frontend tidak perlu tahu bagaimana database bekerja.

23.33 - API Client
Kita dapat membuat:
lib/api/
atau module-specific API client.
Contoh:
lib/api/client.ts
Tujuannya agar frontend tidak melakukan fetch() secara random di semua component.

23.34 - Server vs Client Components
Next.js:
Gunakan Server Components secara default.
Client Components digunakan jika membutuhkan:
useState
useEffect
Browser APIs
Interactive UI
Jangan menggunakan "use client" di semua file tanpa alasan.

23.35 - Server Actions
Server Actions boleh digunakan untuk operasi internal UI.
Namun:
REST API / Route Handlers tetap menjadi primary backend contract untuk konsistensi MVP.
Server Actions mengikuti:
Server Action
 ↓
Application Service
 ↓
Domain
 ↓
Repository
 ↓
Supabase
Server Action tidak boleh direct database manipulation.
Consistency > hype.

23.36 - File Ownership
Dengan tim 3 orang, module ownership membantu.
Contoh:
Developer A
→ Core Backend / Architecture

Developer B
→ Frontend / UI

Developer C
→ Feature / Integration / Testing
Ownership bukan berarti:
"folder ini milik gue, orang lain dilarang sentuh."
Semua code tetap melalui Git workflow.

23.37 - Code Review
Setiap perubahan significant:
Feature Branch
      ↓
Pull Request
      ↓
Review
      ↓
Merge
Untuk tim 3 orang:
minimal 1 reviewer untuk perubahan penting.

23.38 - Dependency Rule
Domain
❌ Next.js
❌ Supabase SDK
❌ React
❌ HTTP

Application
❌ UI
❌ Direct Browser APIs

Infrastructure
✅ Supabase
Dengan begitu domain tetap portable.

23.39 - Architecture Dependency Diagram
                   ┌─────────────┐
                    │     UI      │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ API / Action│
                    └──────┬──────┘
                           │
                           ▼
                ┌────────────────────┐
                │ Application Layer  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   Domain Layer     │
                └─────────▲──────────┘
                          │
                ┌─────────┴──────────┐
                │ Infrastructure     │
                └─────────┬──────────┘
                          │
                          ▼
                     Supabase

23.40 - Final Project Structure
flex-network/
│
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   ├── opportunities/
│   ├── applications/
│   ├── contracts/
│   ├── admin/
│   └── api/
│
├── modules/
│   ├── auth/
│   ├── profile/
│   ├── opportunity/
│   ├── application/
│   ├── matching/
│   ├── meeting/
│   ├── contract/
│   ├── payment/
│   ├── parental-consent/
│   ├── notification/
│   ├── rating/
│   ├── work-history/
│   ├── search/
│   ├── portfolio/
│   ├── reporting-analytics/
│   ├── report/
│   ├── audit-log/
│   ├── background-jobs/
│   └── admin/
│
├── components/
│   ├── ui/
│   ├── forms/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   ├── error-handling/
│   └── utils/
│
├── types/
├── config/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
├── .env.local
├── package.json
├── tsconfig.json
└── ...

23.41 - Future Scaling
Kalau Flex Network scale up:
MVP
 ↓
Modular Monolith
 ↓
Monitor Bottleneck
 ↓
Optimize Modules
 ↓
Extract Only if Necessary
 ↓
Potential Service
Contoh:
Notification Module
        ↓
Separate Service
hanya jika traffic/complexity mengharuskannya.

23.42 - Anti-Overengineering Rule
Architecture harus cukup kuat untuk berkembang, tetapi tidak boleh membuat MVP lebih kompleks dari kebutuhan.
Jadi kita tidak menggunakan:
❌ Microservices
❌ Kubernetes
❌ Event Bus
❌ Kafka
❌ Redis Cluster
❌ Multiple Databases
❌ GraphQL
untuk MVP tanpa kebutuhan nyata.

23.43 - FINAL DECISION
Repository: Single Next.js repository.
Architecture: Modular Monolith.
Routing: Next.js App Router.
Backend: Next.js API layer dan Server Actions.
Module: Domain-oriented modules.
Application: Use-case/application service layer.
Domain: Business entities dan rules.
Infrastructure: Supabase/database implementation.
UI: Components terpisah dari business logic.
Database: Supabase PostgreSQL.
Authentication: Supabase Auth.
Module Boundary: Public interfaces melalui module exports.
Dependency Direction: UI → API/Server Action → Application → Domain, dengan Infrastructure sebagai implementation boundary.
Testing: Unit, integration, RLS/security, dan E2E sesuai kebutuhan.
Migration: Version-controlled melalui Git.
Environment: Development, Preview/Testing, Production.
Scaling: Evolutionary scaling, bukan premature microservices.
POINT 23 - LOCKED 🔒

24 - COMMUNICATION & SYSTEM FLOW
24.1 - Tujuan
Kita lock bagaimana:
User berinteraksi dengan frontend
Frontend berkomunikasi dengan backend
Backend berkomunikasi dengan module
Module berkomunikasi dengan database
External service masuk ke sistem
Notification dipicu
Audit dicatat
State berubah
Prinsip utama:
Client tidak berkomunikasi langsung dengan business module.
Flow utama:
User
 ↓
Next.js UI
 ↓
API / Server Action
 ↓
Application Layer
 ↓
Domain Module
 ↓
Data Layer
 ↓
Supabase

24.2 - Communication Pattern
Untuk MVP kita gunakan:
Synchronous communication sebagai default.
Contoh:
User
 ↓
POST /api/applications
 ↓
Application Service
 ↓
Database
 ↓
Response
 ↓
Frontend
User mendapatkan hasil langsung.

24.3 - Internal Module Communication
Module tidak boleh melakukan direct database manipulation terhadap module lain.
❌:
Application Module
 ↓
Contract Repository
 ↓
Database
✅:
Application Module
 ↓
Contract Module Public Interface
 ↓
Contract Service
Ownership tetap jelas.

24.4 - Core Business Flow
Canonical flow:
Register
   ↓
Complete Profile
   ↓
Browse Opportunities
   ↓
Matching / Recommendation
   ↓
Apply
   ↓
Application Review
   ↓
Selected / Rejected
   ↓
Meeting
   ↓
Meeting Completed
   ↓
Consent Required?
   ├── No → Contract
   └── Yes → Consent Pending
                ↓
           Talent Consent Declaration
                ↓
             Approved?
                ├── Yes → Contract
                └── No → Blocked
   ↓
Contract
   ↓
PENDING_AGREEMENT
   ↓
Talent + Hirer Agreement
   ↓
ACTIVE
   ↓
Payment
   ↓
SIMULATED_PAID
   ↓
Work
   ↓
Work Completed
   ↓
Hirer Confirms
   ↓
Payment RELEASED
   ↓
Rating
   ↓
Verified Work History

24.5 - Registration Flow
User
 ↓
Register
 ↓
Supabase Auth
 ↓
Create Auth Identity
 ↓
Create Profile
 ↓
Select Role
 ↓
Dashboard
Profile data tidak disimpan sebagai bagian dari authentication identity saja.
Kita pisahkan:
Supabase Auth
+
profiles table

24.6 - Login Flow
User
 ↓
Login Form
 ↓
Supabase Auth
 ↓
Session Created
 ↓
Next.js
 ↓
Authenticated User
 ↓
Dashboard
Jika gagal:
Supabase Auth
 ↓
Error
 ↓
Frontend

24.7 - Profile Completion
User
 ↓
Profile
 ↓
Basic Information
 ↓
Skills
 ↓
Interests
 ↓
Portfolio Link
 ↓
CV Link
 ↓
Profile Completed
Untuk MVP:
CV dan portfolio menggunakan link, bukan file upload internal.

24.8 - Opportunity Creation
Hirer
 ↓
Create Opportunity
 ↓
POST /api/opportunities
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Opportunity Service
 ↓
Domain Rules
 ↓
Repository
 ↓
PostgreSQL

24.9 - Opportunity Publishing
Flow:
DRAFT
 ↓
Validation
 ↓
PENDING_REVIEW
 ↓
PUBLISHED
 ↓
CLOSED
MVP practical note:
Untuk MVP, opportunity dapat dipublikasikan setelah validasi dasar.
Moderation tetap tersedia melalui admin dashboard dan report-based moderation.

24.10 - Opportunity Discovery
Talent
 ↓
Browse Opportunities
 ↓
GET /api/opportunities
 ↓
Filter
 ↓
Matching / Ranking
 ↓
Results

24.11 - Matching Flow
Opportunity
     +
Talent Profile
     ↓
Matching Engine
     ↓
Score / Recommendation
     ↓
Ranked Opportunities
MVP matching factors:
Talent skills
Talent interests
Opportunity required skills
Opportunity category/interest relevance
Future/optional ranking factors:
Location
Availability
Experience
MVP tidak menggunakan AI/ML matching.

24.12 - Application Flow
Opportunity
 ↓
Apply
 ↓
POST /api/applications
 ↓
Authenticate
 ↓
Authorization
 ↓
Validate
 ↓
Check Opportunity
 ↓
Check Duplicate
 ↓
Create Application
 ↓
Notification
 ↓
Response

24.13 - Application State
Canonical:
APPLIED
   │
   ├──→ UNDER_REVIEW
   │
   ├──→ SELECTED
   │
   ├──→ REJECTED

Mapping lama:
PENDING = APPLIED
ACCEPTED = SELECTED
Transition harus melalui business rules.

24.14 - Application Selection
Hirer
 ↓
Application
 ↓
Select
 ↓
Authorization
 ↓
Application Service
 ↓
Validate State
 ↓
Update Application
 ↓
Trigger Next Process
Setelah selected:
Application
 ↓
Meeting Flow

24.15 - Meeting Flow
MVP:
Hirer
 ↓
Schedule Meeting
 ↓
Meeting Module
 ↓
Talent Notification
 ↓
Meeting Scheduled
 ↓
Meeting Conducted
 ↓
Meeting Completed
Status:
SCHEDULED
 ↓
COMPLETED
atau:
SCHEDULED
 ↓
CANCELLED
Optional future/pre-flow:
PROPOSED
 ↓
SCHEDULED
PROPOSED bukan mandatory MVP.

24.16 - Meeting Notification
Ketika meeting dibuat:
Meeting Module
      │
      ├──→ Database
      │
      └──→ Notification Module
                    │
                    ▼
                  Talent
Notification bukan dibuat langsung oleh frontend.

24.17 - Contract Flow
Eligibility:
Application SELECTED
+
Meeting COMPLETED
+
Consent APPROVED jika diperlukan
↓
Contract Creation
↓
Contract DRAFT
↓
PENDING_AGREEMENT
↓
Talent Agrees
↓
Hirer Agrees
↓
Contract ACTIVE

24.18 - Contract State
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
atau:
ACTIVE
 ↓
TERMINATED
Contract MVP menggunakan simulated agreement, bukan digital signature.

24.19 - Parental Consent Flow
Jika talent adalah minor atau opportunity membutuhkan consent:
Meeting COMPLETED
 ↓
System checks consent requirement
 ↓
Consent Required?
 ├── No → Continue to Contract
 └── Yes
       ↓
    Consent PENDING
       ↓
Talent Consent Declaration
       ↓
Server-side Validation
       ↓
APPROVED / REJECTED
MVP constraint:
Parent/Guardian tidak memiliki account platform.
Consent menggunakan simulated flow.

24.20 - Parent / Guardian Communication Boundary
MVP tidak memiliki Guardian account atau direct Guardian communication channel.
Karena itu:
Talent
 ↓
Consent Declaration
 ↓
Server
 ↓
Consent Status
menjadi communication boundary.
Platform tidak mengirimkan data platform Talent secara langsung kepada Guardian melalui account platform.

24.21 - Payment Flow
MVP simulated escrow:
Contract ACTIVE
 ↓
Payment Created
 ↓
PENDING
 ↓
SIMULATED_PAID
 ↓
Work IN_PROGRESS
 ↓
Work COMPLETED
 ↓
Hirer Confirms Completion
 ↓
Payment RELEASED
Tidak ada payment gateway pada MVP.
Future external payment:
Payment Module
 ↓
Payment Provider
 ↓
Webhook
 ↓
Payment Status Updated

24.22 - Rating Flow
Setelah pekerjaan selesai:
Contract
 ↓
Work COMPLETED
 ↓
Rating Eligibility
 ↓
Talent rates Hirer
Hirer rates Talent
 ↓
Rating Created
 ↓
Verified Work History
Tidak boleh rating sebelum memenuhi eligibility.

24.23 - Notification Architecture
Notification module menerima trigger dari business process.
Contoh:
Application Selected
       ↓
Notification Module
       ↓
Create Notification
       ↓
User Notification Center
Untuk MVP:
In-app notification menjadi primary notification.
Email notification:
Future Development

24.24 - Audit Flow
Important action:
User
 ↓
Business Action
 ↓
Domain/Application Service
 ├──→ Database Change
 └──→ Audit Log
Contoh:
Admin suspends user
Audit:
actor
action
target
timestamp
metadata
Actor dapat berupa:
USER
ADMIN
SYSTEM

24.25 - Error Flow
Jika terjadi error:
User
 ↓
Request
 ↓
Validation
 ↓
ERROR
 ↓
Error Handler
 ↓
Standard Error Response
 ↓
Frontend
Frontend mendapatkan:
{
  "success": false,
  "error": {
    "code": "OPPORTUNITY_NOT_FOUND",
    "message": "Opportunity not found."
  }
}

24.26 - Database Failure
Misalnya PostgreSQL unavailable:
API
 ↓
Service
 ↓
Repository
 ↓
Database ❌
 ↓
Error Handler
 ↓
500
Jangan mengembalikan internal database error ke user.

24.27 - External Service Failure
Jika future payment provider down:
Payment Module
 ↓
Payment Provider
 ↓
❌
 ↓
Retry / Failure Handling
Payment tidak boleh langsung dianggap berhasil hanya karena request dikirim.
Future external payment tetap PENDING sampai confirmation tersedia.

24.28 - Communication Boundary
Final boundary:
┌───────────────────────────────────────┐
│              FRONTEND                 │
│ Components / Pages / Client State     │
└──────────────────┬────────────────────┘
                   │
                   │ HTTP / Server Calls
                   ▼
┌───────────────────────────────────────┐
│               BACKEND                 │
│                                       │
│ API → Application → Domain            │
│                                       │
│ Module ↔ Module via Public Interface  │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│                DATA                   │
│ Repository → Supabase → PostgreSQL    │
└───────────────────────────────────────┘

24.29 - Client Responsibility
Frontend boleh:
Display
Input
Interaction
Loading
Error UI
Optimistic UI jika aman
Frontend tidak boleh menjadi source of truth untuk:
Authorization
Payment Status
Contract Status
Application Eligibility
Consent Validity
Rating Eligibility
Work Completion Status

24.30 - Server Responsibility
Server adalah authority untuk:
Authentication Verification
Authorization
Business Rules
State Transitions
Sensitive Operations
Database Mutations
External Service Integration
Audit

24.31 - Source of Truth
Data
Source of Truth
Authentication
Supabase Auth
Profile
PostgreSQL
Opportunity
PostgreSQL
Application
PostgreSQL
Meeting
PostgreSQL
Contract
PostgreSQL
Payment
PostgreSQL simulated status
Consent
PostgreSQL
Notification
PostgreSQL
Rating
PostgreSQL
Work History
PostgreSQL

Future payment:
PostgreSQL
+
Payment Provider Confirmation
Frontend state bukan source of truth.

24.32 - State Synchronization
Contoh:
Application Selected
       ↓
Database Updated
       ↓
Response Returned
       ↓
Frontend Refreshes State
Jangan hanya:
setStatus("SELECTED")
tanpa memastikan server berhasil.

24.33 - Communication Style
Client → Backend
HTTP / API / Server Action
Backend → Database
Repository / Supabase
Module → Module
Internal Service / Public Interface
Backend → External Service
HTTP API / SDK
External Service → Backend
Webhook

24.34 - Synchronous vs Asynchronous
Synchronous
Digunakan untuk:
Create Application
Select Application
Create Meeting
Create Contract
Update Profile
Asynchronous / Background
Digunakan ketika benar-benar diperlukan untuk:
Email
Push Notification
Heavy Matching
Analytics
Report Generation
Payment Processing
Scheduled Tasks
Untuk MVP tidak perlu membangun dedicated queue system hanya demi kompleksitas.

24.35 - Communication Diagram
                   ┌─────────────┐
                    │    USER     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Next.js UI │
                    └──────┬──────┘
                           │
                    HTTP / Server Action
                           │
                           ▼
                    ┌─────────────┐
                    │ API Layer   │
                    └──────┬──────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Application Layer │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Domain Modules    │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Data / Repository │
                 └─────────┬─────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │ PostgreSQL  │
                    └─────────────┘

24.36 - Full Business Flow
REGISTER
   │
   ▼
COMPLETE PROFILE
   │
   ▼
BROWSE / MATCHING
   │
   ▼
APPLY
   │
   ▼
APPLICATION
   │
   ├──→ REJECTED
   │
   └──→ SELECTED
          │
          ▼
       MEETING
          │
          ▼
   MEETING COMPLETED
          │
          ▼
   CONSENT REQUIRED?
      ┌───┴───┐
      │       │
     YES      NO
      │       │
      ▼       │
   CONSENT     │
   PENDING     │
      │        │
   APPROVED    │
      │        │
      └────┬───┘
           ▼
       CONTRACT
           │
           ▼
   PENDING_AGREEMENT
           │
      ┌────┴────┐
      ▼         ▼
 Talent       Hirer
 Agreement    Agreement
      └────┬────┘
           ▼
         ACTIVE
           │
           ▼
     SIMULATED_PAID
           │
           ▼
      WORK COMPLETED
           │
           ▼
      HIRER CONFIRMS
           │
           ▼
      PAYMENT RELEASED
           │
           ▼
          RATING
           │
           ▼
   VERIFIED WORK HISTORY

24.37 - Notification Trigger Map
Event
Recipient
Application submitted
Hirer
Application moved to under review
Talent
Application selected
Talent
Application rejected
Talent
Meeting scheduled
Other party
Meeting changed
Other party
Meeting cancelled
Other party
Contract created
Relevant parties
Contract agreement updated
Relevant parties
Consent requested
Talent
Consent approved
Relevant process participants
Consent rejected
Talent / Relevant Hirer
Payment status changed
Relevant parties
Work completed
Hirer
Rating available
Relevant party

Email notification: future development.

24.38 - Security Principle
Semua communication mengikuti:
Never trust the client.
Client tidak dapat menentukan:
Role
Authorization
Payment State
Contract State
Consent State
Admin Privilege
Server tetap melakukan verification.

24.39 - Idempotency Principle
Operation yang berpotensi dipanggil ulang harus aman.
Contoh:
User clicks Apply twice
Result:
1 Application
bukan:
2 Applications
Unique constraint + business validation menjadi defense.

24.40 - Transaction Principle
Operation critical seperti:
Select Application
Create Contract
Record Payment
Complete Work
jika terdiri dari beberapa database mutations yang harus konsisten, menggunakan transaction sesuai kebutuhan.

24.41 - Communication Principles
Kita lock:
1. Client is not trusted.
2. Server is business authority.
3. Database is persistent source of truth.
4. Module boundaries must be respected.
5. Module-to-module communication uses public interfaces.
6. Synchronous communication is default.
7. Async processing only when justified.
8. External services communicate through controlled integration.
9. Webhooks are server-side.
10. Sensitive operations happen server-side.
11. State transitions are validated.
12. Critical operations must be idempotent.
13. Critical multi-step operations use transactions.
14. Important actions produce audit records.
15. Notification is triggered by business events.

24.42 - Future Development
Future Development:
├── Email Notification
├── Push Notification
├── Advanced Matching Engine
├── Payment Gateway
├── Webhook Processing
├── Advanced Real-time Features
└── Advanced Analytics
Basic background jobs remain part of MVP baseline where required.

24.43 - FINAL DECISION
Communication Pattern: Synchronous by default.
Client → Backend: REST API / controlled server calls / Server Actions.
Backend → Database: Repository/Data Access Layer melalui Supabase.
Module → Module: Public module interfaces/services.
External Service: API/SDK integration.
External → Backend: Webhook untuk future integrations yang relevan.
Business Authority: Server-side.
Persistent Source of Truth: PostgreSQL/Supabase.
Frontend State: Not a source of truth.
Security: Never trust client input.
Critical Operations: Idempotent dan transactional bila diperlukan.
Notification: Triggered by server-side business events.
Audit: Important state-changing actions dicatat.
Async: Hanya digunakan ketika benar-benar dibutuhkan.
Parental Consent: Dilakukan setelah Meeting Completed dan sebelum Contract jika diperlukan.
Consent Model: Talent Consent Declaration, bukan independent Guardian verification.
Payment: Simulated escrow dengan status PENDING → SIMULATED_PAID → RELEASED.
Future: Email, push, advanced matching, payment gateway, webhook, advanced real-time, dan advanced analytics.
POINT 24 - LOCKED 🔒

25 - ERROR HANDLING & RELIABILITY
Point ini membahas:
“Kalau sesuatu gagal, sistem harus ngapain?”

25.1 - Tujuan
System harus tetap predictable ketika terjadi:
Input User Salah
Authentication Gagal
Authorization Ditolak
Database Error
API Timeout
Duplicate Request
External Service Failure
Payment Simulation Failure
Contract Failure
Consent Belum Approved
Notification Failure
Server Error
Prinsip:
Error harus ditangani secara terstruktur, bukan dengan try/catch random di setiap file.

25.2 - Error Classification
Kita bedakan error menjadi:
Client Error
Server Error
Database Error
External Service Error
Business Rule Error
Authentication Error
Authorization Error
Validation Error

25.3 - Validation Error
Contoh:
Title kosong
Description kosong
Deadline invalid
Response:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request.",
    "fields": {
      "title": "Title is required."
    }
  }
}
HTTP:
400 Bad Request

25.4 - Authentication Error
User melakukan request tanpa session valid.
Request
 ↓
Auth Check
 ↓
❌
 ↓
401 Unauthorized
Contoh:
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}

25.5 - Authorization Error
User sudah login tetapi tidak memiliki permission.
Contoh:
Talent
 ↓
Attempt to select application
 ↓
Authorization
 ↓
❌
Response:
403 Forbidden
Perbedaan:
401 = Authentication Missing / Invalid
403 = Authenticated but Not Allowed

25.6 - Resource Not Found
Contoh:
GET /api/opportunities/123
Opportunity tidak ada.
Response:
404 Not Found
{
  "success": false,
  "error": {
    "code": "OPPORTUNITY_NOT_FOUND",
    "message": "Opportunity not found."
  }
}

25.7 - Business Rule Error
Business rule error bukan validation biasa.
Contoh:
Application = REJECTED
 ↓
User attempts SELECT
Request valid secara format tetapi invalid secara business rule.
Response:
409 Conflict
{
  "success": false,
  "error": {
    "code": "INVALID_APPLICATION_STATE",
    "message": "Application cannot be selected in its current state."
  }
}
Canonical application status:
APPLIED
UNDER_REVIEW
SELECTED
REJECTED

25.8 - Duplicate Application
Talent mencoba apply dua kali.
First Request
 ↓
Application Created

Second Request
 ↓
Duplicate Detected
Response:
409 Conflict
Database membantu mencegah duplicate melalui unique constraint.

25.9 - Rate Limiting
User melakukan repeated sensitive requests.
POST /api/applications
POST /api/applications
POST /api/applications
...
Jika threshold tercapai:
429 Too Many Requests
MVP menggunakan basic rate limiting pada endpoint sensitif.

25.10 - Database Error
Flow:
API
 ↓
Application
 ↓
Repository
 ↓
Supabase
 ↓
❌
Server:
Log Internal Error
 ↓
Return Safe Error
User tidak melihat:
PostgreSQL Stack Trace
Supabase Credentials
SQL Query
Internal Architecture

25.11 - Internal Server Error
Unexpected error:
500 Internal Server Error
Response:
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again."
  }
}
Detail asli masuk server logs.

25.12 - Error Response Standard
Semua API mengikuti:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message.",
    "details": {}
  }
}
Success:
{
  "success": true,
  "data": {}
}

25.13 - Error Code Convention
Contoh:
AUTH_REQUIRED
AUTH_INVALID
FORBIDDEN
VALIDATION_ERROR

OPPORTUNITY_NOT_FOUND
APPLICATION_NOT_FOUND
APPLICATION_ALREADY_EXISTS
INVALID_APPLICATION_STATE

MEETING_NOT_FOUND
MEETING_CONFLICT

CONTRACT_NOT_FOUND
INVALID_CONTRACT_STATE
CONTRACT_BLOCKED_BY_MEETING
CONTRACT_BLOCKED_BY_CONSENT

PAYMENT_PENDING
PAYMENT_NOT_RELEASED

CONSENT_REQUIRED
CONSENT_PENDING
CONSENT_REJECTED
Error code harus stabil dan machine-readable.

25.14 - Error Handling Layer
Jangan:
route.ts
 ├── try
 ├── catch
 ├── try
 ├── catch
 └── ...
di seluruh codebase.
Lebih clean:
Request
 ↓
Route / Server Action
 ↓
Application
 ↓
Domain
 ↓
Error
 ↓
Central Error Handler
 ↓
Standard Response / Action Result
Central error handling diterapkan pada:
Route Handlers
Server Actions
Application Service Boundary
Server Action tidak boleh melempar raw error langsung ke UI tanpa handling.

25.15 - Domain Errors
Contoh:
ApplicationCannotBeSelectedError
ContractAlreadyActiveError
ConsentRequiredError
ContractBlockedByConsentError
PaymentCannotBeReleasedError
Application layer menerjemahkannya menjadi API / action error.

25.16 - Error Mapping
Domain Error
     ↓
Application Error
     ↓
HTTP / Action Error
Contoh:
ApplicationAlreadyExists
        ↓
APPLICATION_ALREADY_EXISTS
        ↓
409 Conflict

25.17 - Retry Strategy
Tidak semua error boleh di-retry.
Aman untuk retry:
Temporary Network Error
Temporary External API Failure
Transient Database Failure
Jangan blind retry:
Create Payment
Create Contract
Submit Application
Select Application
Release Payment
karena dapat menghasilkan duplicate operation.

25.18 - Idempotency
MVP idempotency menggunakan:
Unique Constraint
Business Validation
State Transition Check
Duplicate Detection
Contoh:
One Talent
+
One Opportunity
=
One Application
Dijaga dengan:
UNIQUE (talent_id, opportunity_id)
Future:
Idempotency Key
untuk payment / webhook / critical external integrations.

25.19 - Timeout
External request tidak boleh menunggu selamanya.
Request
 ↓
External Service
 ↓
Timeout
 ↓
Failure Handling
Timeout tidak boleh dianggap sebagai success.

25.20 - Payment Failure
MVP menggunakan simulated payment.
Canonical payment status:
PENDING
SIMULATED_PAID
RELEASED
Jika simulasi gagal atau timeout:
Payment Request
 ↓
Failure / Timeout
 ↓
Payment remains PENDING
 ↓
Safe Retry
MVP tidak menambahkan FAILED atau TIMEOUT sebagai payment status database.
Tidak ada uang nyata yang berpindah.
Future real payment provider dapat memperkenalkan state tambahan seperti:
PAID
FAILED
TIMEOUT
REFUNDED
sesuai provider dan business requirement.

25.21 - Webhook Reliability
Future payment provider:
Payment Provider
 ↓
Webhook
 ↓
Backend
Webhook dapat dikirim lebih dari sekali.
Karena itu future webhook harus menggunakan:
Event ID
+
Idempotency
Webhook payment belum masuk MVP.

25.22 - Notification Failure
Notification failure tidak membatalkan core business transaction.
Contoh:
Application Selected
 ↓
Database Updated ✅
 ↓
Notification Failed ❌
Application tetap:
SELECTED
Notification dapat di-retry atau ditandai failed.

25.23 - Critical vs Non-Critical
Critical
Authentication
Authorization
Application State
Contract State
Payment State
Consent State
Work Completion State
Rating Eligibility
Failure harus menghentikan critical operation.
Non-Critical
Notification
Analytics
Logging Enrichment
Recommendation Availability
Failure tidak boleh otomatis membatalkan core transaction.

25.24 - Transaction Boundary
Contoh:
Select Application
      │
      ├── Update Application
      ├── Create Required Record
      └── Audit
Jika seluruh operasi wajib atomic:
BEGIN
 ↓
Operations
 ↓
COMMIT
Jika gagal:
ROLLBACK

25.25 - Partial Failure
Contoh:
Application Selected
 ↓
Notification Failed
Jangan rollback application hanya karena notification gagal.
Pattern:
Core Transaction
      ↓
COMMIT
      ↓
Side Effects
      ↓
Notification

25.26 - Logging
Server harus memiliki structured logging.
Contoh:
{
  "level": "error",
  "event": "application_select_failed",
  "userId": "...",
  "applicationId": "...",
  "errorCode": "...",
  "requestId": "...",
  "timestamp": "..."
}

25.27 - Sensitive Data
Jangan log:
Password
Access Token
Refresh Token
Service Role Key
Payment Credentials
Private Secrets
Guardian Contact Detail
Sensitive Consent Detail

25.28 - Request ID
Setiap request dapat memiliki:
requestId
Flow:
User
 ↓
Request ID
 ↓
API
 ↓
Service
 ↓
Repository
 ↓
Logs
Request ID membantu tracing error dari awal sampai akhir.

25.29 - User-Friendly Error
Backend:
DATABASE_CONNECTION_TIMEOUT
User:
“We're having trouble processing your request. Please try again.”
Developer logs:
DATABASE_CONNECTION_TIMEOUT
Internal technical details dan user-facing messages dipisahkan.

25.30 - Frontend Error State
UI memiliki:
Loading
Success
Error
Empty
Contoh:
Loading...
    ↓
Success → Show Data
atau:
Loading...
    ↓
Error → Retry

25.31 - Retry UX
Jika request gagal sementara:
[ Try Again ]
User tidak perlu refresh seluruh website.

25.32 - Offline / Network Failure
Jika browser kehilangan connection:
Request
 ↓
Network Error
UI:
“Unable to connect. Check your internet connection and try again.”
Jangan menampilkan:
500 Internal Server Error
karena belum tentu server yang bermasalah.

25.33 - Concurrent Update
Contoh:
Hirer A → Select Application
Hirer B → Select Application
secara hampir bersamaan.
Database/business layer harus memastikan hanya valid state transition yang berhasil.

25.34 - State Machine Protection
Canonical:
APPLIED
 ↓
SELECTED
setelah menjadi:
SELECTED
request lain tidak boleh:
SELECTED
 ↓
APPLIED
secara sembarangan.
Invalid transition harus ditolak.

25.35 - Database Constraints
Reliability tidak hanya bergantung pada code.
Database juga memiliki:
Primary Key
Foreign Key
Unique Constraint
Not Null
Check Constraint
Indexes
Contoh:
One Talent
+
One Opportunity
=
One Application
diperkuat dengan unique constraint.

25.36 - Backup & Recovery
System memiliki:
Migration Files
Database Schema
Seed Data
Backup Strategy
Recovery Procedure
Migration disimpan di Git.
Recovery:
Migration
 ↓
Database Schema
 ↓
Seed / Recovery Data
 ↓
Application

25.37 - Environment Isolation
Minimal:
Development
Preview / Testing
Production
Local developer tidak boleh menggunakan production database sebagai playground.
Untuk Supabase:
Development
→ Local Supabase / Development Project

Preview / Testing
→ Test/Preview Project jika diperlukan

Production
→ Production Project
Dedicated staging infrastructure bukan requirement MVP.

25.38 - Deployment Failure
Jika deployment baru bermasalah:
New Deployment
 ↓
Health Check
 ↓
❌
 ↓
Rollback / Previous Stable Version
Jangan memaksa production menggunakan build broken.

25.39 - Health Check
Backend memiliki endpoint:
GET /api/health
Response:
{
  "status": "ok"
}
Tidak boleh mengembalikan:
Database Credential
Service Role Key
Stack Trace
Environment Secret
Sensitive Internal Detail

25.40 - Graceful Degradation
Jika feature non-critical gagal:
Recommendation Unavailable
system tetap dapat:
Browse Opportunities
Satu module failure tidak otomatis mematikan seluruh platform.

25.41 - Reliability Principles
Kita lock:
1. Fail safely.
2. Never expose internal errors.
3. Keep API responses consistent.
4. Validate input.
5. Authenticate every protected request.
6. Authorize every sensitive action.
7. Protect state transitions.
8. Prevent duplicate mutations.
9. Use transactions where necessary.
10. Retry only safe operations.
11. Separate critical and non-critical operations.
12. Log errors structurally.
13. Never log secrets.
14. Use request IDs for tracing.
15. Provide user-friendly error states.
16. Keep environments isolated.
17. Maintain migration-based recovery.
18. Support rollback for failed deployments.

25.42 - Full Failure Flow
                 USER REQUEST
                       │
                       ▼
                 Authentication
                       │
                ┌──────┴──────┐
                │             │
               FAIL          PASS
                │             │
                ▼             ▼
              401          Validation
                              │
                       ┌──────┴──────┐
                       │             │
                      FAIL          PASS
                       │             │
                       ▼             ▼
                      400       Authorization
                                    │
                             ┌──────┴──────┐
                             │             │
                            FAIL          PASS
                             │             │
                             ▼             ▼
                            403        Business Logic
                                           │
                                      ┌────┴────┐
                                      │         │
                                    ERROR     SUCCESS
                                      │         │
                                      ▼         ▼
                                   Handler   Database
                                               │
                                         ┌─────┴─────┐
                                         │           │
                                       FAIL        SUCCESS
                                         │           │
                                         ▼           ▼
                                       500        Response

25.43 - Final Architecture
                  ┌──────────────┐
                   │     USER     │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │   Next.js    │
                   │      UI      │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │ API / Server │
                   │    Action    │
                   └──────┬───────┘
                          ▼
                ┌─────────────────────┐
                │ Application Layer   │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │    Domain Layer     │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │ Infrastructure      │
                └──────────┬──────────┘
                           ▼
                  ┌────────────────┐
                  │    Supabase    │
                  │   PostgreSQL   │
                  └────────────────┘

        ┌─────────────────────────────────┐
        │     CENTRAL ERROR HANDLER       │
        │                                 │
        │ Validation                      │
        │ Auth                            │
        │ Authorization                   │
        │ Business                        │
        │ Database                        │
        │ External Services               │
        └─────────────────────────────────┘

25.44 - FINAL DECISION
Error Handling: Centralized and standardized.
Validation: Before business logic.
Authentication: 401 when authentication is missing/invalid.
Authorization: 403 when permission is insufficient.
Not Found: 404.
Business Conflict: 409.
Rate Limit: 429.
Unexpected Error: 500.
API Response: Consistent success/error structure.
Retry: Only safe/transient operations.
Idempotency: MVP menggunakan unique constraint + business validation; full idempotency key untuk future payment/webhook.
Transaction: Digunakan untuk atomic critical mutations.
Notification Failure: Does not rollback core business transaction.
Logging: Structured + request ID.
Secrets: Never exposed/logged.
Database: Constraints enforce integrity.
Environment: Development, Preview/Testing, Production isolated.
Deployment: Health check + rollback strategy.
Recovery: Migration-based and backup-aware.
Frontend: Loading, success, error, empty states.
Reliability: Graceful degradation for non-critical modules.
Consent Error: Contract creation harus blocked jika consent required belum approved setelah Meeting Completed.
Consent Model: Simulated Consent Declaration oleh Talent; bukan independent Guardian verification.
Payment Error: MVP menggunakan simulated payment. Failure/timeout menjaga status tetap PENDING dan tidak dianggap berhasil.

POINT 26 - OBSERVABILITY & MONITORING
26.1 - Tujuan
Observability digunakan untuk mengetahui kondisi sistem dari tiga aspek utama:
Logs
Metrics
Traces

Secara sederhana:
Logs    → Apa yang terjadi?
Metrics → Seberapa sering / seberapa besar?
Traces  → Request melewati jalur mana saja?


26.2 - Observability Principle
Kita lock:
Application harus dapat memberikan informasi yang cukup untuk mengetahui health, performance, dan failure tanpa harus menebak dari sisi user.

26.3 - Three Pillars
            OBSERVABILITY
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
     LOGS      METRICS     TRACES
       │          │          │
       ▼          ▼          ▼
    Events     Numbers    Request Flow


26.4 - Logging
Logging digunakan untuk mencatat event penting.
Contoh:
User registered
User logged in
Application created
Application selected
Meeting scheduled
Meeting completed
Contract created
Contract activated
Payment held / simulated paid
Payment released
Work completed
Rating submitted
Authorization denied
Database error


26.5 - Log Levels
Kita gunakan:
DEBUG
INFO
WARN
ERROR

DEBUG
Untuk development detail.
DEBUG: matching calculation started

INFO
Event normal.
INFO: application created

WARN
Sesuatu tidak ideal tetapi sistem masih berjalan.
WARN: notification delivery delayed

ERROR
Failure yang perlu diperhatikan.
ERROR: contract activation failed


26.6 - Production Logging
Production tidak perlu spam DEBUG.
Default production:
INFO
WARN
ERROR

DEBUG dapat diaktifkan ketika troubleshooting dengan kontrol yang sesuai.

26.7 - Structured Logging
Jangan hanya:
console.log("something went wrong")

Lebih baik event terstruktur:
{
  "level": "error",
  "event": "application_select_failed",
  "applicationId": "...",
  "actorId": "...",
  "requestId": "...",
  "timestamp": "..."
}

Ini membuat log gampang dicari dan dianalisis.

26.8 - Request ID
Setiap request diberi:
requestId

Flow:
User
 ↓
Request ID: req_123
 ↓
Route Handler / Server Action
 ↓
Application Service
 ↓
Repository
 ↓
Logs

Kalau user melapor:
“Tadi error.”
Developer bisa mencari:
req_123

dan melihat perjalanan request tersebut.
Request ID diterapkan pada:
Route Handlers / API endpoints
Server Actions
Background jobs / scheduled tasks
Audit-related operations


26.9 - Correlation ID
Untuk workflow yang melibatkan beberapa operation:
Application
 ↓
Notification
 ↓
Audit

kita dapat menggunakan correlation ID.
Contoh:
correlationId = application_abc

Sehingga semua event terkait dapat ditemukan bersama.
Untuk background job:
jobId digunakan sebagai identifier utama
correlationId dapat menghubungkan job dengan business entity
actor dapat berupa SYSTEM

Contoh:
{
  "level": "info",
  "event": "opportunity_expired_closed",
  "jobId": "job_123",
  "correlationId": "opportunity_456",
  "actor": "SYSTEM",
  "timestamp": "..."
}


26.10 - Metrics
Metrics berupa angka yang dipantau dari waktu ke waktu.
Contoh:
Requests / minute
Error rate
Response time
Database latency
Login failures
Application submissions
Payment failures
429 rate-limit spikes


26.11 - Core Application Metrics
Untuk MVP kita pantau:
Total requests
Successful requests
Failed requests
HTTP status distribution
Average response time
95th percentile response time


26.12 - Error Rate
Contoh:
1000 requests
20 errors

Error rate:
2%

Kita dapat melihat apakah error meningkat.
Contoh:
1%
 ↓
2%
 ↓
8%

Something is wrong.

26.13 - Latency
Kita ukur:
Request received
        ↓
Processing
        ↓
Response

Contoh:
GET /api/opportunities
→ 120ms

Kemudian:
GET /api/opportunities
→ 3.2s

Itu indikasi performance issue.

26.14 - Percentile
Average saja tidak cukup.
Kita perhatikan:
p50
p95
p99

Contoh:
p50 = 120ms
p95 = 450ms
p99 = 1.2s

Artinya sebagian besar request cepat, tetapi tail latency perlu diperhatikan.

26.15 - Database Monitoring
Supabase/PostgreSQL perlu dipantau untuk:
Query latency
Connection issues
Slow queries
Database errors
Storage
CPU/resource usage

Kita tidak perlu membuat monitoring database sendiri kalau platform sudah menyediakan monitoring yang relevan.

26.16 - Slow Query
Jika:
GET /api/opportunities

tiba-tiba:
4 seconds

kita investigate:
API
 ↓
Service
 ↓
Repository
 ↓
Query
 ↓
Database

Kemungkinan:
Missing index
Bad query
Too much data
N+1 query


26.17 - Authentication Monitoring
Kita monitor event seperti:
Login success
Login failure
Registration
Session failure
Authorization denial

Jika login failure tiba-tiba meningkat, itu bisa mengindikasikan:
bug
service issue
abuse attempt


26.18 - Security Events
Event penting:
Unauthorized access / 401 spike
Forbidden access / 403 spike
Rate limited requests / 429 spike
Repeated failed authentication
Suspicious application submission pattern
Admin action
Account suspension / reactivation
Opportunity moderation action
Report handling action

Event security harus lebih serius dibanding log biasa.

26.19 - Business Metrics
Observability tidak hanya technical.
Kita juga pantau business metrics:
Registered users
Active users
Completed profiles
Opportunities created
Opportunities published
Applications submitted
Applications under review
Applications selected
Meetings scheduled
Meetings completed
Consents approved
Contracts created
Contracts active
Contracts completed
Payments released
Rating activity
Verified work histories created

Ini membantu mengetahui apakah sistem benar-benar digunakan.

26.20 - Funnel Monitoring
Canonical funnel:
Registered Users
      ↓
Completed Profiles
      ↓
Applications Submitted / APPLIED
      ↓
Applications Under Review / UNDER_REVIEW
      ↓
Applications Selected / SELECTED
      ↓
Meetings Scheduled / SCHEDULED
      ↓
Meetings Completed / COMPLETED
      ↓
Consents Approved (if required)
      ↓
Contracts Active / ACTIVE
      ↓
Work Completed
      ↓
Payments Released / RELEASED
      ↓
Ratings Submitted
      ↓
Verified Work History

Jika:
100 applications
 ↓
0 meetings

berarti mungkin ada masalah pada:
Selection flow
Meeting flow
UX
Business rule

Mapping lama:
Accepted = SELECTED


26.21 - Health Check
Endpoint:
GET /api/health

Response:
{
  "status": "ok"
}

Digunakan untuk mengetahui apakah application server hidup.
Health check tidak boleh mengembalikan data sensitif.

26.22 - Readiness vs Liveness
Kalau nantinya diperlukan:
Liveness
Apakah application process masih hidup?
/api/health/live

Readiness
Apakah application siap menerima traffic?
/api/health/ready

Untuk MVP:
satu health endpoint sederhana sudah cukup.
Kita tidak perlu membangun Kubernetes-style infrastructure sebelum ada kebutuhan.

26.23 - External Service Monitoring
External service:
Supabase
Future payment provider
Future email provider
Future notification provider
External meeting platform link

Metric:
Request count
Success rate
Failure rate
Latency
Timeout


26.24 - Payment Monitoring
Payment merupakan critical area.
MVP Payment Monitoring:
Payment created
Payment pending
Payment held / simulated paid
Payment released
Payment failed / transition error
Payment timeout / stuck pending

Future Payment Monitoring:
Real payment provider success/failure
Webhook received
Webhook duplicate
Webhook invalid
Refund/dispute event

Metric MVP:
Simulated payment completion rate
= released payments / active contracts with payment

Ini bukan real financial success rate.

26.25 - Notification Monitoring
Notification adalah non-critical tetapi tetap dipantau.
Notification created
Notification delivered
Notification failed

Jika:
100 notifications
30 failed

perlu investigation.
Tetapi core transaction tetap tidak otomatis rollback.

26.26 - Alerting
Tidak semua log harus membuat alert.
Contoh alert:
Error rate > threshold
Database unavailable
Payment failure spike
API latency spike
Authentication failure spike
429 spike

Jangan:
Every warning
 ↓
ALERT
 ↓
developer gets 500 notifications


26.27 - Alert Severity
Gunakan:
INFO
WARNING
CRITICAL

INFO
Tidak perlu tindakan segera.
WARNING
Perlu diperiksa.
CRITICAL
Butuh tindakan cepat.

26.28 - Example Alert
CRITICAL

API error rate exceeded threshold.

Current: 12%
Normal: < 2%

Affected:
POST /api/applications

Developer langsung tahu:
apa
berapa
di mana


26.29 - Dashboard
Kita bisa punya dashboard monitoring yang memperlihatkan:
┌────────────────────────────────────┐
│ System Health                      │
├────────────────────────────────────┤
│ API Status       ● Healthy         │
│ Database         ● Healthy         │
│ Error Rate       0.8%              │
│ Avg Latency      180ms             │
│ p95 Latency      420ms             │
│ Active Users     124               │
└────────────────────────────────────┘


26.30 - Production Monitoring Stack
Untuk MVP kita tidak perlu membangun monitoring platform sendiri.
Candidate MVP monitoring stack:
Vercel logs / deployment metrics
Supabase dashboard / database metrics
Structured application logs
Error tracking service jika diperlukan

Tool final akan ditentukan pada Infrastructure/Deployment point.

26.31 - Error Tracking
Selain logs, error tracking berguna untuk:
Stack trace
Request context
Frequency
Affected users
Release/version

Jadi developer bisa melihat:
Error X
→ terjadi 134 kali
→ affected 27 users
→ mulai setelah deployment v1.3

Ini jauh lebih berguna daripada sekadar:
500 Internal Server Error


26.32 - Release Monitoring
Setiap deployment harus dapat diidentifikasi.
Contoh:
version: 1.4.0
commit: abc123

Kalau setelah deployment:
Error rate
0.5%
 ↓
8%

kita bisa menghubungkan masalah dengan release tersebut.

26.33 - Deployment → Monitoring
Flow:
Git Push
   ↓
CI/CD
   ↓
Build
   ↓
Deploy
   ↓
Health Check
   ↓
Monitoring
   ↓
Error Rate
   ↓
Decision

Jika bermasalah:
Rollback


26.34 - Privacy
Observability harus mengikuti prinsip:
Monitor system, not people's private content.
Jangan memasukkan ke log:
Password
Access token
Refresh token
Private messages
Sensitive personal information
Payment secrets
Service credentials
Guardian contact detail
Parental consent sensitive detail
Minor personal data yang tidak diperlukan


26.35 - User ID Logging
User ID boleh digunakan untuk debugging bila memang diperlukan, tetapi:
minimum necessary data

Jangan logging seluruh profile user setiap request.
Untuk parental consent, yang boleh dicatat minimal:
consentId
status
opportunityId
applicationId
timestamp
actor/action

Jangan log isi detail persetujuan atau data wali secara berlebihan.

26.36 - Audit vs Logs
Ini penting.
Logs
Untuk:
debugging dan operational monitoring.
Audit Logs
Untuk:
mencatat tindakan penting yang membutuhkan accountability.
Contoh:
Admin suspended user

Itu masuk audit log.
Sedangkan:
API request took 240ms

itu operational log/metric.

26.37 - Monitoring vs Analytics
Jangan dicampur.
Monitoring
Apakah sistem sehat?
Analytics
Bagaimana user menggunakan produk?
Contoh:
Monitoring:
API error rate = 4%

Analytics:
Most users drop at meeting stage

Dua-duanya penting, tapi tujuan berbeda.

26.38 - Reliability SLO
Untuk tahap awal kita tidak perlu menjanjikan SLA enterprise.
SRS target:
Normal operation response time ≤ 3 detik

Internal SLO target:
Availability: ≥ 99%
p95 API latency: < 1s untuk endpoint normal
Error rate: < 2%

Ini target internal, bukan contractual SLA.
Internal SLO lebih ketat dari SRS untuk menjaga kualitas demo dan penilaian.

26.39 - Monitoring Development vs Production
Development:
Detailed logs
Debug enabled
Local inspection

Production:
Structured logs
Error tracking
Metrics
Alerts
Limited sensitive information


26.40 - Observability Flow
                   APPLICATION
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
          LOGS         METRICS       TRACES
            │            │            │
            └────────────┼────────────┘
                         ▼
                 OBSERVABILITY
                    PLATFORM
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
         Dashboard                 Alert
             │                       │
             ▼                       ▼
       Developer / Team          Investigation


26.41 - What We Monitor
Technical
API availability
API latency
Error rate
Database health
Database latency
External service health
Authentication errors
429 rate-limit spikes

Business
User registrations
Profile completion
Applications
Under review
Selected
Meetings
Contracts
Payments
Work completion
Ratings
Verified work history

Security
Unauthorized access
Forbidden access
Authentication failures
Rate limited requests
Admin actions
Suspicious activity


26.42 - What We DON’T Monitor
Kita tidak melakukan:
Logging passwords
Logging tokens
Logging private messages
Logging guardian consent sensitive detail
Collecting unnecessary personal data
Recording every user action forever
Building invasive surveillance


26.43 - Incident Flow
Kalau production bermasalah:
Alert
 ↓
Identify
 ↓
Investigate
 ↓
Contain
 ↓
Fix / Rollback
 ↓
Verify
 ↓
Document

Contoh:
Error rate 10%
 ↓
Find affected endpoint
 ↓
Find deployment
 ↓
Rollback
 ↓
Error rate normal
 ↓
Root cause analysis


26.44 - Root Cause Analysis
Setelah incident penting:
What happened?
Why happened?
What was affected?
How was it fixed?
How do we prevent recurrence?

Jangan cuma:
“udah normal.”
Harus tahu kenapa.

26.45 - Observability Principles
Kita lock:
1. Logs must be structured.
2. Important requests have request IDs.
3. Critical workflows have correlation context.
4. Metrics track system health.
5. Business metrics track product health.
6. Security events are monitored.
7. Critical external services are monitored.
8. Alerts must be actionable.
9. Sensitive information must not be logged.
10. Audit logs are separate from operational logs.
11. Production monitoring is stronger than development monitoring.
12. Deployments are observable.
13. Incidents require investigation.
14. Monitoring should remain proportional to system complexity.


26.46 - MVP vs Future
MVP
Structured application logs
Error logging
Request ID
Basic API metrics
Supabase monitoring
Health endpoint
Error tracking
Basic production alerts
Client-side error boundary logging (optional)

Future
Distributed tracing
Advanced dashboards
Advanced alerting
Business analytics
Advanced performance profiling
Real-time monitoring
Automated incident response
Web Vitals monitoring
Real User Monitoring


26.47 - FINAL DECISION
Observability Model: Logs + Metrics + Traces.
Logging: Structured.
Request Tracking: Request ID.
Workflow Tracking: Correlation context, termasuk Server Actions dan Background Jobs.
Metrics: Availability, latency, errors, database health, external services.
Business Metrics: Registration → Application → Selection → Meeting → Consent → Contract → Payment → Work → Rating → Verified Work History.
Security Monitoring: Authentication, authorization, suspicious activity, admin actions, dan rate-limit spikes.
Health Check: /api/health.
Error Tracking: Dedicated error monitoring.
Alerting: Actionable alerts only.
Privacy: Sensitive information, minor data, dan parental consent detail tidak di-log secara berlebihan.
Audit: Separate dari operational logs.
Deployment: Monitored after release.
Incident: Identify → Investigate → Contain → Fix/Rollback → Verify → Document.
Payment Monitoring: MVP menggunakan simulated escrow metric, bukan real payment gateway metric.
Scaling: Start simple, introduce distributed tracing dan advanced monitoring only when justified.
POINT 26 - LOCKED 🔒
POINT 27 - PERFORMANCE & SCALABILITY
27.1 - Tujuan
Sistem harus:
responsif untuk user
query database efisien
tidak mengambil data berlebihan
mampu menangani concurrent users
punya jalur scaling yang jelas
tetap sederhana selama traffic masih kecil

Prinsip utama:
Optimize based on actual bottlenecks, not assumptions.
27.2 - Performance Layers
Performance kita lihat dari:
User
 ↓
Next.js
 ↓
Application Layer
 ↓
Supabase
 ↓
PostgreSQL
 ↓
External Services

Masalah bisa muncul di layer mana pun.
27.3 - Target Performance MVP
SRS target:
Normal operation response time ≤ 3 detik

Internal engineering target:
p50 < 300ms
p95 < 1s
p99 < 2s

Untuk operasi yang memang membutuhkan external service:
lebih tinggi masih acceptable

Target internal lebih ketat untuk menjaga kualitas demo, penilaian juri, dan stabilitas production.
27.4 - Database First
Karena kita menggunakan Supabase + PostgreSQL, bottleneck yang paling mungkin muncul adalah query database.
Maka:
Database query optimization menjadi prioritas performance.
27.5 - Indexing
Field yang sering digunakan untuk:
WHERE
JOIN
ORDER BY

perlu dipertimbangkan untuk index.
Contoh:
applications.opportunity_id
applications.talent_id
applications.status

opportunities.hirer_id
opportunities.status
opportunities.deadline
opportunities.category / type / location jika sering difilter

meetings.application_id
contracts.application_id
contracts.status
payments.contract_id
consents.application_id / opportunity_id sesuai schema final
ratings.contract_id
notifications.user_id
reports.status

Tapi jangan membuat index untuk semua kolom.
27.6 - Index Trade-off
Index mempercepat read:
SELECT

tetapi memiliki cost:
INSERT
UPDATE
DELETE
Storage

Jadi:
Index berdasarkan query pattern nyata.
27.7 - Query Optimization
Hindari:
SELECT *

kalau hanya membutuhkan:
id
title
status

Lebih baik mengambil field yang diperlukan saja.
27.8 - N+1 Query
Contoh buruk:
Get 100 opportunities
       ↓
100 queries untuk hirer profile

Total:
101 queries

Kita harus menghindari pattern tersebut.
Gunakan:
JOIN
select relational data
batch query
Supabase relational select

sesuai kebutuhan.
27.9 - Pagination
Jangan:
GET /api/opportunities

mengembalikan:
50.000 opportunities

Gunakan pagination.
Contoh:
GET /api/opportunities?page=1&limit=20

27.10 - Limit
Backend harus punya maximum limit.
Misalnya:
default = 20
max = 100

Jadi user tidak bisa meminta:
?limit=999999999

27.11 - Cursor Pagination
Untuk dataset besar, kita dapat menggunakan:
cursor pagination

Flow:
First request
 ↓
20 records
 ↓
nextCursor
 ↓
Next request
 ↓
20 records

Contoh:
GET /api/opportunities?cursor=abc123

Untuk MVP:
Offset pagination masih acceptable untuk dataset kecil.
Ketika data besar:
migrate hot feeds/search ke cursor pagination.
27.12 - Sorting
Sorting harus dilakukan dengan field yang jelas.
Contoh:
created_at
deadline
rating

Jangan melakukan sorting dataset besar di application memory kalau database dapat melakukannya.
27.13 - Filtering
Filtering dilakukan sedini mungkin.
Buruk:
Database
 ↓
10.000 records
 ↓
Next.js
 ↓
filter
 ↓
20 records

Lebih baik:
Next.js
 ↓
Database query with filter
 ↓
20 records

Database mengerjakan filtering.
27.14 - Search
Untuk search opportunity:
title
description
skills
location
category
type
status

MVP search approach:
Filter berdasarkan category/type/status/location/skills
Simple text search menggunakan PostgreSQL query / ILIKE / trigram jika diperlukan
Hindari dedicated search engine untuk MVP

Future:
Full-text search lebih advanced
Ranking/relevance tuning
Dedicated search service jika dibutuhkan

27.15 - Caching
Tidak semua data harus query database setiap kali.
Candidate untuk cache:
Public opportunity data
Static configuration
Reference data
Static assets

Tidak cocok dicache sembarangan:
Session / auth state
Authorization result
Payment state
Contract state
Consent state
Application state
Private user data
Admin moderation state
Notification unread count
Real-time user-specific dashboard data

27.16 - Next.js Caching
Next.js dapat menggunakan caching sesuai jenis data.
Prinsip:
Static / relatively stable
→ cache possible

Highly dynamic / sensitive
→ fetch fresh data

Untuk data user-specific:
no-store
atau dynamic fetch
atau revalidate dengan invalidation yang jelas

Jangan cache halaman dashboard secara agresif.
27.17 - Cache Invalidation
Rule:
Cache invalidation harus dianggap sebagai bagian dari design, bukan tambahan belakangan.
Contoh:
Opportunity updated
 ↓
Old cache
 ↓
must be invalidated/revalidated

Kalau tidak:
Database = SELECTED
Cache = APPLIED

Canonical application status:
APPLIED
UNDER_REVIEW
SELECTED
REJECTED
Mapping lama:
PENDING = APPLIED
ACCEPTED = SELECTED

27.18 - CDN
Static assets:
Images
CSS
JS
Fonts

idealnya dilayani melalui CDN/infrastructure platform.
Next.js deployment platform biasanya membantu bagian ini.
27.19 - Image Optimization
MVP image optimization:
Optimasi static assets
Gunakan next/image jika menampilkan gambar
Lazy load gambar non-critical
Hindari gambar besar di landing page

Portfolio/CV:
Tetap URL-based
Tidak upload file besar di MVP

Jika menampilkan preview image, tetap gunakan optimized dimensions dan lazy loading.
27.20 - Portfolio
Karena sebelumnya kita sepakat CV dan portfolio menggunakan link, ini justru mengurangi beban storage.
Flow:
User
 ↓
Portfolio URL
 ↓
Database

bukan:
User
 ↓
Large file
 ↓
Application server
 ↓
Database

Lebih ringan.
27.21 - Lazy Loading
Data/komponen yang belum diperlukan tidak harus langsung dimuat.
Contoh:
Opportunity detail
 ↓
Main information
 ↓
Additional sections

Heavy component dapat di-load ketika diperlukan.
27.22 - Server vs Client Components
Next.js:
Server Component

digunakan sebagai default ketika interactivity tidak diperlukan.
Client Component

digunakan ketika membutuhkan:
useState
useEffect
browser interaction
event handlers

Prinsip:
Don't make the entire page a Client Component without a reason.
27.23 - Data Fetching
Data yang dibutuhkan server:
Server
 ↓
Supabase
 ↓
Render

Data interactive:
Client
 ↓
API / appropriate data layer

Pemilihan berdasarkan kebutuhan, bukan dogma.
27.24 - Request Deduplication
Jika beberapa component meminta data yang sama:
Component A → opportunity
Component B → opportunity
Component C → opportunity

jangan sampai menghasilkan unnecessary duplicate requests.
Gunakan mekanisme caching/deduplication yang sesuai dengan data-fetching architecture kita.
27.25 - Debouncing
Untuk search:
User types:

F
Fl
Fle
Flex
Flex N
Flex Ne
...

Jangan request database setiap karakter.
Gunakan debounce:
User stops typing
 ↓
wait ~300ms
 ↓
search

27.26 - Rate Limiting
Performance juga berhubungan dengan abuse protection.
Endpoint sensitif:
Login
Search
Application
Meeting
Payment

perlu rate limiting sesuai kebutuhan.
27.27 - Background Jobs
Operation yang tidak harus selesai dalam request:
Send notification
Generate report
Process webhook side effects
Heavy computation
Opportunity expiration
Meeting reminder
Contract deadline check

bisa dipindahkan ke background processing ketika kebutuhan muncul.
Background jobs mengikuti Point 20.19:
Opportunity expiration
Meeting reminder
Contract deadline check
Notification processing
System-generated state changes dengan actor SYSTEM

MVP implementation:
Dapat menggunakan scheduled function / cron / edge function / manual admin trigger jika diperlukan
Tidak langsung membangun dedicated queue infrastructure

27.28 - Timeout
Setiap external request harus punya timeout.
Contoh:
Next.js
 ↓
External Service
 ↓
timeout
 ↓
fallback/error

Tidak boleh:
request hangs forever

27.29 - Concurrency
Misalnya:
100 users
 ↓
same endpoint
 ↓
database

Application harus mampu menangani concurrent request tanpa race condition.
Critical state transitions tetap dilindungi database/business rules.
27.30 - Connection Management
Database connection harus dikelola dengan benar.
Jangan membuat connection baru secara tidak terkendali setiap request.
Next.js + Supabase serverless pattern:
Gunakan Supabase client singleton per context (browser/server/admin)
Hindari membuat client baru secara berlebihan di setiap function
Gunakan connection mechanism/pooler yang direkomendasikan Supabase untuk serverless jika diperlukan
Pastikan service role client hanya berjalan di server-side

27.31 - Database Connection Bottleneck
Jika traffic meningkat:
Users
 ↓
Many requests
 ↓
Database
 ↓
Connection pressure

solusinya dapat berupa:
query optimization
connection pooling
caching
read optimization
architecture scaling

bukan sekadar:
“Tambah server.”
27.32 - Horizontal Scaling
Kalau traffic meningkat:
               ┌── App Instance 1
Users → Router ─┼── App Instance 2
                └── App Instance 3

Application layer dibuat stateless sebisa mungkin.
27.33 - Stateless Application
Jangan menyimpan state penting hanya di memory instance.
Buruk:
User data
 ↓
Server memory

Kemudian server restart:
state hilang

State penting:
Database
Session/Auth infrastructure
External durable storage

27.34 - Supabase Scaling
Supabase menangani bagian database/infrastructure tertentu.
Tetapi aplikasi tetap harus:
efficient queries
proper indexes
pagination
connection management

Jangan menganggap:
“Supabase = unlimited.”
27.35 - Storage Scaling
Jika nanti portfolio upload berubah dari URL menjadi file:
User
 ↓
Object Storage
 ↓
CDN

Jangan menyimpan file besar sebagai database row.
Untuk MVP:
URL-based portfolio tetap menjadi pilihan utama.
27.36 - Performance Budget
Kita bisa menetapkan budget:
API p95 < 1s
Initial page load reasonable for target network
Image size optimized
API payload only required fields

Performance budget membantu mencegah feature creep.
27.37 - Monitoring Performance
Point 26 sudah menyediakan:
Latency
p50
p95
p99

Point 27 menggunakan data tersebut untuk optimization.
Flow:
Monitor
 ↓
Detect bottleneck
 ↓
Profile
 ↓
Optimize
 ↓
Measure again

27.38 - Performance Testing
Sebelum production besar:
Load Test
Stress Test
API Test
Database Query Test

MVP tidak perlu testing dengan jutaan simulated users.
Test realistic expected traffic.
27.39 - Load Testing
Contoh scenario:
100 concurrent users
 ↓
Browse opportunities
 ↓
Search
 ↓
View detail
 ↓
Apply

Kita lihat:
Latency
Error rate
Database load
Throughput

27.40 - Bottleneck Identification
Jika sistem lambat:
Frontend?
   ↓
API?
   ↓
Application logic?
   ↓
Database?
   ↓
External service?

Cari bottleneck dulu.
Jangan asal:
“Tambah Redis.”
27.41 - Optimization Priority
Urutan kita:
1. Correctness
2. Database query optimization
3. API efficiency
4. Payload optimization
5. Rendering optimization
6. Caching
7. Background processing
8. Infrastructure scaling

Jangan optimize sebelum correctness.
27.42 - Avoid Premature Optimization
Kita tidak langsung memakai:
Microservices
Kubernetes
Kafka
Redis untuk semua data
Dedicated search cluster
Complex event-driven architecture

untuk MVP.
Architecture kita tetap:
Modular Monolith
+
Next.js
+
Supabase

27.43 - Scaling Path
Stage 1 - MVP
Next.js
+
Supabase
+
Basic caching
+
Indexes
+
Pagination

Stage 2 - Growth
Better caching
+
Cursor pagination
+
Background jobs
+
Performance monitoring

Stage 3 - High Traffic
Horizontal scaling
+
Dedicated workers
+
Advanced caching
+
Search optimization
+
Read optimization

Stage 4 - Very Large Scale
Baru pertimbangkan:
Dedicated services
Advanced event architecture
Dedicated search infrastructure
Specialized databases

27.44 - Performance Architecture
                    USERS
                       │
                       ▼
                  ┌─────────┐
                  │ Next.js │
                  └────┬────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
          Cached              Dynamic
           Data                 Data
             │                   │
             └─────────┬─────────┘
                       ▼
                Application Layer
                       │
                       ▼
                  Data Layer
                       │
                       ▼
                  PostgreSQL
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Optimized          Indexed
            Query              Data

27.45 - Performance Principles
Kita lock:
1. Optimize based on measurements.
2. Database queries must be efficient.
3. Avoid SELECT * when unnecessary.
4. Use indexes based on query patterns.
5. Use pagination for collections.
6. Limit maximum page size.
7. Avoid N+1 queries.
8. Filter at database level.
9. Cache only appropriate data.
10. Define cache invalidation strategy.
11. Optimize images and static assets.
12. Prefer Server Components where appropriate.
13. Use Client Components only when needed.
14. Debounce user-driven search.
15. Use timeouts for external services.
16. Keep application state durable.
17. Keep application layer as stateless as practical.
18. Test realistic concurrent traffic.
19. Monitor p95/p99 latency.
20. Scale only when actual bottlenecks justify it.

27.46 - MVP vs Future
MVP
PostgreSQL indexing
Efficient queries
Pagination
Query limits
Payload optimization
Basic Next.js caching
Image optimization
Debounced search
API timeout
Basic performance monitoring

Future
Cursor pagination
Advanced caching
Background workers
Dedicated search
Advanced load testing
Horizontal scaling optimization
Distributed performance tracing

27.47 - FINAL DECISION
Architecture: Modular Monolith tetap dipertahankan.
Backend: Next.js.
Database: Supabase PostgreSQL.
Optimization Priority: Correctness → Database → API → Payload → Rendering → Cache → Scaling.
Performance Target: SRS ≤ 3 detik untuk operasi normal, dengan internal target p95 < 1s.
Pagination: Wajib untuk collection besar.
Index: Berdasarkan query pattern, termasuk field relasional utama seperti opportunities.hirer_id, applications.talent_id, dan applications.opportunity_id.
Search: PostgreSQL untuk MVP.
Caching: Selective, bukan global. Tidak untuk auth, authorization, private state, dan business state kritis.
Portfolio: URL-based untuk MVP.
Images: Optimized dan responsive.
Rendering: Server-first pada Next.js.
Client Components: Hanya ketika diperlukan.
Concurrency: Critical state transitions dilindungi.
External Services: Timeout + failure handling.
Connection Management: Supabase client singleton dan serverless-aware connection strategy.
Background Jobs: Mengikuti Point 20.19 dan tidak langsung menggunakan dedicated queue.
Scaling: Bertahap berdasarkan actual traffic.
Premature Optimization: Dihindari.
POINT 27 - LOCKED 🔒
POINT 28 - TESTING STRATEGY
28.1 - Tujuan
Testing bertujuan memastikan:
fitur bekerja sesuai requirement
business rules tidak rusak
authorization tidak bisa dibypass
database/RLS aman
API menghasilkan response yang benar
Server Actions menghasilkan result yang benar
perubahan code tidak merusak fitur lama
deployment tidak membawa regression

Prinsip utama:
Test behavior and business rules, not implementation details.
28.2 - Testing Pyramid
Kita gunakan pendekatan:
                 ┌───────────┐
                  │    E2E    │
                  └─────┬─────┘
                 ┌──────┴──────┐
                 │ Integration │
                 └──────┬──────┘
              ┌─────────┴─────────┐
              │   Unit / Domain   │
              └───────────────────┘

Artinya:
Banyak  → Unit Test
Sedang  → Integration Test
Sedikit → E2E Test

28.3 - Test Layers
Untuk Flex Network:
1. Unit Test
2. Integration Test
3. API Test
4. Server Action Test
5. Database / RLS Test
6. E2E Test
7. Security Test
8. Performance Test

Tidak semua test harus memiliki jumlah yang sama.
28.4 - Unit Test
Unit test menguji logic kecil secara terisolasi.
Contoh:
calculateMatchScore()
validateApplication()
validateContractTransition()
validateConsentRequirement()
calculateRatingEligibility()

Misalnya:
Input:
Talent skills = React, TypeScript
Opportunity skills = React, TypeScript

Expected:
matchScore > 0

28.5 - Apa yang Wajib Unit Test?
Prioritas tinggi:
Business rules
State transitions
Validation logic
Matching algorithm
Permission rules
Consent eligibility
Payment eligibility
Rating eligibility
Calculation logic
Utility functions

Tidak perlu unit test setiap:
getter
simple object mapping
trivial UI wrapper

28.6 - Domain Test
Domain layer harus sangat mudah dites.
Canonical application status:
APPLIED
UNDER_REVIEW
SELECTED
REJECTED

Mapping lama:
PENDING = APPLIED
ACCEPTED = SELECTED

Contoh valid:
Application
APPLIED
 ↓
SELECTED

Invalid:
Application
REJECTED
 ↓
SELECTED

Test:
expect(() => application.select())
  .toThrow(INVALID_APPLICATION_STATE)

28.7 - State Machine Testing
Karena sistem kita punya banyak status:
Application
Meeting
Contract
Payment
Consent
Work

setiap state transition penting harus dites.
Application:
APPLIED → UNDER_REVIEW ✅
APPLIED → SELECTED ✅
APPLIED → REJECTED ✅
UNDER_REVIEW → SELECTED ✅
UNDER_REVIEW → REJECTED ✅
REJECTED → SELECTED ❌
SELECTED → APPLIED ❌

28.8 - Integration Test
Integration test menguji beberapa layer sekaligus.
Contoh:
API / Server Action
 ↓
Application Service
 ↓
Repository
 ↓
Database

Tujuannya memastikan komponen benar-benar bekerja bersama.
28.9 - API & Server Action Testing
Setiap critical backend entrypoint harus punya test.
Backend entrypoints yang dites:
Route Handlers / API endpoints
Server Actions
Application service layer
Repository / data access layer

Route Handler test:
HTTP request
 ↓
Auth
 ↓
Validation
 ↓
Service
 ↓
DB
 ↓
HTTP response

Server Action test:
UI/action invocation
 ↓
Auth/session
 ↓
Validation
 ↓
Service
 ↓
DB
 ↓
Action result / UI state

Contoh critical endpoint:
POST /api/opportunities
GET  /api/opportunities
POST /api/applications
POST /api/applications/:id/select
POST /api/applications/:id/reject
POST /api/meetings
POST /api/meetings/:id/complete
POST /api/contracts
POST /api/contracts/:id/agree
POST /api/payments
POST /api/parental-consents
POST /api/ratings

28.10 - API Success Test
Contoh:
POST /api/applications

Expected:
201 Created

dan:
{
  "success": true,
  "data": {}
}

28.11 - API Validation Test
Invalid request:
POST /api/applications

{
  "opportunityId": ""
}

Expected:
400 Bad Request

28.12 - Authentication Test
Request tanpa session:
POST /api/applications

Expected:
401 Unauthorized

28.13 - Authorization Test
User A mencoba mengubah resource milik User B.
Expected:
403 Forbidden

atau resource tidak terekspos sesuai authorization design.
Ini wajib, karena security bug jauh lebih bahaya daripada UI bug.
28.14 - Database / RLS Testing
Karena kita menggunakan Supabase, kita harus mengetes:
Row Level Security

RLS testing approach:
Gunakan Supabase local / test project
Setup schema dan RLS policies melalui migration
Gunakan anon/user token untuk test sebagai Talent/Hirer
Gunakan service role hanya untuk setup/seed, bukan untuk test authorization normal
Pastikan test membuktikan akses ditolak, bukan hanya akses diterima

Contoh negative test:
Talent A membaca application Talent B → denied
Talent update opportunity milik Hirer → denied
Hirer membaca application dari opportunity Hirer lain → denied
Admin moderation access → allowed with ADMIN role

28.15 - RLS Test Matrix
Contoh:
Role
Resource
Action
Expected
Talent
Own profile
Read
✅
Talent
Own profile
Update
✅
Talent
Other profile private data
Update
❌
Talent
Own application
Read
✅
Talent
Other application
Read
❌
Hirer
Own opportunity
Update
✅
Hirer
Other opportunity
Update
❌
Hirer
Applicant for own opportunity
Read
✅
Hirer
Applicant for other hirer opportunity
Read
❌
Admin
Moderation resource
Manage
✅

Matrix seperti ini harus menjadi bagian testing.
28.16 - Database Constraint Testing
Database juga harus dites.
Contoh:
Duplicate application

Expected:
rejected

Foreign key:
Invalid opportunity_id

Expected:
rejected

State constraint:
Invalid status transition

Expected:
rejected

28.17 - E2E Testing
E2E menguji sistem dari sudut pandang user.
Contoh flow:
Register
 ↓
Complete Profile
 ↓
Browse Opportunity
 ↓
Apply
 ↓
Hirer Selects
 ↓
Meeting
 ↓
Meeting Completed
 ↓
Consent if required
 ↓
Contract
 ↓
Simulated Payment
 ↓
Work Completed
 ↓
Hirer Confirms
 ↓
Payment Released
 ↓
Rating
 ↓
Verified Work History

Test seperti user nyata.
28.18 - Critical E2E Flows
Critical E2E Flows - Revised:
Flow 1 - Registration & Login
Register
 ↓
Role selection
 ↓
Login
 ↓
Dashboard

Flow 2 - Profile Completion
Talent completes profile, skills, interests
Hirer completes profile/company information

Flow 3 - Opportunity Creation & Discovery
Hirer creates opportunity
 ↓
Opportunity published / available
 ↓
Talent browses/searches/filters opportunity

Flow 4 - Matching & Application
Talent sees recommendation/matching
 ↓
Talent applies
 ↓
Application APPLIED

Flow 5 - Selection & Meeting
Hirer reviews application
 ↓
Hirer selects Talent
 ↓
Meeting scheduled
 ↓
Meeting completed

Flow 6 - Parental Consent if required
System checks consent requirement
 ↓
If required, consent pending
 ↓
Simulated guardian approval
 ↓
Consent approved
 ↓
Contract can proceed

Flow 7 - Contract Agreement
Contract created
 ↓
Talent agrees
 ↓
Hirer agrees
 ↓
Contract ACTIVE

Flow 8 - Simulated Payment
Payment created
 ↓
Payment HELD / SIMULATED_PAID
 ↓
Work started

Flow 9 - Work Completion
Work In Progress
 ↓
Work Completed
 ↓
Hirer confirms completion
 ↓
Payment RELEASED

Flow 10 - Rating & Verified Work History
Talent rates Hirer
 ↓
Hirer rates Talent
 ↓
Work History becomes Verified

Flow 11 - Admin Moderation
Admin views users/opportunities/reports
 ↓
Admin performs moderation action

Flow 12 - Error Handling & Responsive UI
Invalid action produces clear error
 ↓
Main flows usable on Desktop, Tablet, Mobile

28.19 - E2E Tidak Perlu Menguji Semua
Jangan membuat:
500 E2E tests

karena E2E lebih lambat dan lebih fragile.
Gunakan E2E untuk:
critical user journeys.
28.20 - Security Testing
Security testing mencakup:
Authentication bypass
Authorization bypass
RLS bypass
Input validation
IDOR
Rate limiting
Session handling
Sensitive data exposure

28.21 - IDOR Test
Contoh:
GET /api/applications/123

User A mencoba membuka application User B.
Expected:
denied

Jangan sampai hanya karena user tahu:
123
124
125

dia bisa melihat semua application.
28.22 - Input Security
Test input:
Empty
Too long
Invalid format
Unexpected type
Malformed data

Contoh:
title = 10.000 karakter

harus ditolak atau dibatasi.
28.23 - XSS Protection
User-generated content seperti:
Profile
Opportunity description
Portfolio description
Review text

harus diperlakukan sebagai untrusted input.
Test:
malicious HTML/script-like input

Expected:
tidak dieksekusi sebagai script

28.24 - SQL Injection
Karena kita menggunakan database API/ORM/query layer, tetap harus memastikan query tidak dibangun menggunakan string concatenation berbahaya.
Test security pada data-access layer.
28.25 - Rate Limit Testing
Test:
Repeated login attempts
Repeated application requests
Repeated sensitive mutation

Expected:
429 Too Many Requests

ketika threshold tercapai.
28.26 - Payment Testing
Payment wajib punya test lebih ketat.
MVP Payment Testing:
Valid flow:
Contract ACTIVE
 ↓
Payment CREATED / PENDING
 ↓
Payment HELD / SIMULATED_PAID
 ↓
Work COMPLETED
 ↓
Hirer confirms completion
 ↓
Payment RELEASED ✅

Invalid flow:
Payment RELEASED before Work COMPLETED ❌
Payment CREATED without ACTIVE Contract ❌
Payment RELEASED without Hirer confirmation ❌
Duplicate payment for same contract ❌

Future Payment Testing:
Real provider success/failure
Webhook received
Duplicate webhook
Invalid webhook
Out-of-order event
Timeout handling

Webhook payment belum mandatory MVP.
28.27 - Contract Testing
Contract state testing:
Valid:
DRAFT → PENDING_AGREEMENT ✅
PENDING_AGREEMENT → ACTIVE ✅
ACTIVE → COMPLETED ✅

Invalid:
DRAFT → ACTIVE ❌
PENDING_AGREEMENT → COMPLETED ❌
COMPLETED → ACTIVE ❌

Eligibility tests:
Contract creation requires Application SELECTED
Contract creation requires Meeting COMPLETED
If consent required, Consent must be APPROVED
Both Talent and Hirer must agree before ACTIVE

Contract MVP menggunakan simulated agreement, bukan digital signature.
28.28 - Parental Consent Testing
Karena ada user minor:
Minor / opportunity requiring consent
 ↓
Consent required

Parental Consent timing tests:
1. Consent not required
   Selected + Meeting Completed → Contract allowed ✅

2. Consent required + approved
   Selected + Meeting Completed + Consent APPROVED → Contract allowed ✅

3. Consent required + pending
   Selected + Meeting Completed + Consent PENDING → Contract blocked ❌

4. Consent required + rejected
   Selected + Meeting Completed + Consent REJECTED → Contract blocked ❌

5. Consent required + missing
   Selected + Meeting Completed + Consent missing → Contract blocked ❌

MVP constraint:
Parent/Guardian tidak memiliki platform account
Consent menggunakan simulated flow
Test tidak perlu login sebagai guardian

28.29 - Notification Testing
Notification bukan core transaction, tetapi tetap dites.
Test:
Notification created
Notification sent
Notification failed
Retry
Duplicate prevention

Jika notification gagal:
Core business operation
        ↓
must remain successful

sesuai keputusan Point 25.
28.30 - Mock External Services
Testing tidak boleh selalu memanggil:
Real payment provider
Real email provider
Real external API

Gunakan mock/stub untuk sebagian besar automated tests.
Contoh:
Application
 ↓
PaymentService
 ↓
MockPaymentProvider

28.31 - Test Data
Gunakan data khusus testing.
Contoh:
test-talent@example.test
test-hirer@example.test
test-admin@example.test

Jangan menggunakan production user.
28.32 - Database Test Isolation
Setiap test harus sebisa mungkin tidak bergantung pada test lain.
Buruk:
Test A
 ↓
mengubah DB

Test B
 ↓
mengharapkan perubahan Test A

Kalau Test A gagal:
Test B ikut gagal

lebih susah debugging.
28.33 - Seed Data
Untuk development/testing kita dapat memiliki:
seed users
seed opportunities
seed applications
seed meetings
seed contracts
seed payments
seed consents
seed ratings

Tujuannya memudahkan reproduksi scenario.
28.34 - Test Environment
Minimal:
Development
Testing/Staging
Production

Automated test tidak dijalankan terhadap production database.
Untuk lomba, minimal:
Local / Development
Production

Staging optional, tetapi secara arsitektur tetap bagus ditulis.
28.35 - CI Testing
Flow:
Git Push
 ↓
CI
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Build
 ↓
E2E / Staging Tests
 ↓
Deploy

28.36 - Pull Request Gate
PR tidak boleh merge jika critical checks gagal.
Contoh:
Type Check failed
Unit Test failed
Build failed

Maka:
Merge blocked

28.37 - Test Coverage
Coverage berguna, tapi:
100% coverage bukan berarti 100% aman.
Contoh:
100% coverage
+
business logic salah
=
still broken

Prioritas:
Critical business logic
Security
State transitions
Payment
Consent
Authorization

28.38 - Coverage Target
Untuk awal:
Domain / critical business logic
→ high coverage

Application services
→ good coverage

Infrastructure
→ integration coverage

UI
→ behavior-focused testing

Kita tidak menetapkan:
semua file wajib 100%

28.39 - Regression Testing
Setiap bug yang ditemukan:
Bug
 ↓
Fix
 ↓
Test added
 ↓
Future regression prevented

Jadi bug yang pernah terjadi menjadi testcase.
28.40 - Testing SDLC
Karena kita menggunakan SDLC, testing tidak hanya dilakukan di akhir.
Planning
 ↓
Requirement
 ↓
Design
 ↓
Implementation
 ↓
Testing
 ↓
Deployment
 ↓
Monitoring
 ↓
Feedback

Testing ikut masuk sepanjang lifecycle.
28.41 - Test During Development
Developer:
Write code
 ↓
Run unit tests
 ↓
Run integration tests
 ↓
Commit

28.42 - Test During Pull Request
PR
 ↓
Lint
 ↓
Type Check
 ↓
Unit
 ↓
Integration
 ↓
Build

Jika critical failure:
PR blocked

28.43 - Test Before Release
Staging / Preview
 ↓
E2E
 ↓
Security checks
 ↓
Smoke test
 ↓
Release

28.44 - Smoke Test
Setelah deployment:
Homepage
 ↓
Login
 ↓
API health
 ↓
Database connectivity

Kalau critical flow gagal:
deployment issue

28.45 - Production Verification
Setelah release:
Deploy
 ↓
Health Check
 ↓
Smoke Test
 ↓
Observe Metrics
 ↓
Confirm

Ini terhubung langsung dengan Point 26.
28.46 - Testing & Observability
Testing:
memastikan sistem seharusnya bekerja.
Observability:
memastikan sistem memang sedang bekerja.
Testing
   +
Observability
   =
Confidence

28.47 - Test Failure Handling
Jika test gagal:
Test failed
 ↓
Identify
 ↓
Fix
 ↓
Run again
 ↓
Pass

Jangan:
Test failed
 ↓
Disable test
 ↓
Merge

28.48 - Flaky Test
Test yang kadang pass, kadang fail tanpa perubahan code disebut flaky test.
Run #1 → PASS
Run #2 → FAIL
Run #3 → PASS

Flaky test harus:
investigate
fix
or remove invalid assumption

Jangan dibiarkan karena akan membuat CI kehilangan kepercayaan.
28.49 - Testing Principles
Kita lock:
1. Test business behavior.
2. Prioritize critical logic.
3. Unit tests should be fast.
4. Integration tests verify component interaction.
5. E2E tests verify critical user journeys.
6. Security tests are mandatory for sensitive flows.
7. RLS must be tested.
8. State transitions must be tested.
9. Payment flows require dedicated tests.
10. Consent rules require dedicated tests.
11. External services should be mocked where appropriate.
12. Tests must use isolated data.
13. Production data must never be used for automated testing.
14. Critical CI checks block merging.
15. Bugs should produce regression tests.
16. Avoid unnecessary 100% coverage goals.
17. Flaky tests must be fixed.
18. Testing occurs throughout the SDLC.
19. Server Actions dan Route Handlers harus sama-sama dites.
20. Consent timing mengikuti flow setelah Meeting Completed dan sebelum Contract.

28.50 - Testing Matrix
Area
Unit
Integration
E2E
Security
Auth
✅
✅
✅
✅
Profile
✅
✅
✅
✅
Opportunity
✅
✅
✅
✅
Application
✅
✅
✅
✅
Matching
✅
✅
Optional
✅
Meeting
✅
✅
✅
✅
Consent
✅
✅
✅
✅
Contract
✅
✅
✅
✅
Payment
✅
✅
✅
✅
Work Completion
✅
✅
✅
✅
Rating
✅
✅
✅
✅
Work History
✅
✅
✅
✅
Notification
✅
✅
Optional
Optional
Admin
✅
✅
✅
✅

28.51 - MVP Testing Stack
Untuk MVP:
TypeScript
      │
      ├── Unit Testing
      │
      ├── Integration Testing
      │
      ├── API Testing
      │
      ├── Server Action Testing
      │
      ├── Supabase/RLS Testing
      │
      └── E2E Testing

Tool spesifik kita lock saat masuk implementation/CI setup supaya tidak asal memilih tool sebelum melihat final project structure.
28.52 - MVP vs Future
MVP
Unit tests
Integration tests
API tests
Server Action tests
RLS/security tests
Critical E2E flows
CI test pipeline
Regression tests
Smoke tests

Future
Advanced load testing
Mutation testing
Contract testing between services
Advanced security scanning
Chaos testing
Large-scale performance testing

28.53 - Acceptance Criteria Traceability
Acceptance Criteria dari SRS harus terhubung ke testing.
AC-01 Registration & Login
→ Auth unit/integration/E2E/security test

AC-02 Profile
→ Profile validation/integration/E2E test

AC-03 Opportunity
→ Opportunity CRUD/publish/discovery/E2E test

AC-04 Matching & Apply
→ Matching unit test + application integration/E2E test

AC-05 Selection & Meeting
→ Application state + meeting flow E2E test

AC-06 Contract & Simulated Payment
→ Contract eligibility/agreement/payment simulated E2E test

AC-07 Work Completion
→ Work state transition + Hirer confirmation test

AC-08 Rating & Work History
→ Rating eligibility + verified work history test

AC-09 Parental Consent
→ Consent required/pending/approved/rejected test

AC-10 Admin Moderation
→ Admin RBAC + moderation E2E/security test

AC-11 Error Handling
→ Validation/business rule/auth/error response test

AC-12 Responsive UI
→ Manual/E2E viewport testing Desktop/Tablet/Mobile

28.54 - FINAL DECISION
Testing Strategy: Testing Pyramid.
Unit: Business logic dan domain rules.
Integration: Interaksi application, repository, dan database.
API: Critical endpoints dan error cases.
Server Actions: Tested sebagai backend entrypoint setara dengan Route Handlers.
Database: Constraints dan RLS.
E2E: Critical user journeys dari registration sampai verified work history.
Security: Authentication, authorization, IDOR, input security, RLS.
Payment: MVP simulated escrow. Webhook payment adalah future.
Contract: Menggunakan PENDING_AGREEMENT, bukan signature.
Consent: Required/pending/approved/rejected setelah Meeting Completed dan sebelum Contract.
External Services: Mock untuk automated tests jika memungkinkan.
CI: Test + lint + type check + build sebagai quality gate.
Regression: Setiap bug penting menghasilkan regression test.
Coverage: Fokus pada risk dan business criticality, bukan angka 100%.
Environment: Testing terpisah dari production.
SDLC: Testing dilakukan sepanjang lifecycle, bukan hanya sebelum deployment.
Acceptance Traceability: AC-01 sampai AC-12 harus terpetakan ke test yang relevan.
29 - CI/CD & DEPLOYMENT PIPELINE
29.1 - Tujuan
Pipeline harus memastikan setiap perubahan code melewati:
Code → Check → Test → Build → Review → Deploy → Verify → Monitor

Tujuannya: mengurangi human error, mencegah code rusak masuk production, membuat deployment konsisten, memudahkan rollback, dan memastikan setiap perubahan dapat dilacak.
29.2 - Prinsip CI/CD
Kita lock:
No direct production deployment from a developer's local machine.
Production deployment harus melalui pipeline.
29.3 - Continuous Integration
CI berarti setiap perubahan yang masuk repository diverifikasi secara otomatis.
Developer
   ↓
git push
   ↓
Pull Request
   ↓
CI
   ↓
Checks

29.4 - Continuous Delivery / Deployment
Setelah code lolos validation:
CI
 ↓
Build
 ↓
Staging
 ↓
Verification
 ↓
Production

Deployment production tetap mengikuti approval/rules repository yang kita tetapkan.
29.5 - Environment Strategy
Minimal kita punya:
Development
Staging / Preview
Production

MVP Environment Strategy
Development
Local Next.js
Supabase local/dev project
.env.local
Preview / Staging
Vercel Preview Deployment untuk setiap PR
Supabase staging/test project
Digunakan untuk smoke test dan critical flow verification
Production
Vercel Production
Supabase production project
Production environment variables
29.6 - Environment Separation
Jangan:
Development → Production Database

Setiap environment harus memiliki configuration/resource yang sesuai.
29.7 - Branch Strategy
main
 │
 ├── feature/...
 ├── fix/...
 ├── refactor/...
 └── chore/...

main menjadi branch utama yang merepresentasikan code yang siap dirilis.
29.8 - Feature Branch & Pull Request
Developer membuat feature branch, coding, commit, push, lalu membuat Pull Request ke main.
PR harus menjelaskan:
What changed?
Why?
How tested?
Any breaking changes?

29.9 - PR Quality Gate
Minimal:
Lint ✅
Type Check ✅
Unit Test ✅
Integration ✅
Build ✅

Jika critical check gagal:
❌ Merge blocked

29.10 - CI Pipeline Flow
Git Push
 ↓
Install Dependencies via Lockfile
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Build

29.11 - Staging Deployment & Verification
Setelah CI sukses, build artifact masuk ke Staging melalui Vercel Preview.
Staging Verification mencakup:
Smoke Test
Critical E2E
Security Checks

MVP E2E Strategy: Automated E2E digunakan jika stabil. Jika belum, critical flow wajib diverifikasi melalui manual smoke test checklist:
Login
Apply
Select
Meeting
Consent
Contract
Payment
Rating
Admin
Responsive

29.12 - Production Deployment & Rollback
Jika staging sukses:
Approval / Release Rule
 ↓
Production

Vercel Rollback Strategy: gunakan previous stable deployment dari Vercel. Rollback dapat dilakukan ke deployment sebelumnya jika release baru bermasalah.
Jika issue berasal dari database migration, rollback application saja tidak cukup; database state harus ikut dievaluasi.
29.13 - Database Migration
Code deployment dan database migration harus diperhatikan bersama.
Supabase Migration Workflow
Migration files disimpan di /supabase/migrations dan menjadi bagian dari Git.
Gunakan pola Expand & Contract untuk menghindari destructive migration langsung.
Jika migration gagal, deployment application harus ditunda/diblokir.
29.14 - Environment Variables & Secrets
Configuration sensitif tidak boleh hardcoded.
MVP Environment Variables
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

Future Environment Variables
PAYMENT_PROVIDER_SECRET
PAYMENT_WEBHOOK_SECRET
EMAIL_API_KEY

Rules:
NEXT_PUBLIC_* → hanya untuk data aman di browser
Service Role Key → wajib server-only

29.15 - Artifact & Traceability
Deployment Traceability: Vercel deployment terhubung ke Git commit.
GitHub commit/PR history menjadi audit trail utama.
Setiap production release minimal dapat ditelusuri melalui:
Commit SHA
+
Vercel Deployment

29.16 - Submission Deployment Readiness (ITechnoCup)
Sebelum submit lomba, production harus diverifikasi:
URL production dapat diakses publik.
GitHub repository sesuai requirements.
README memenuhi ketentuan lomba.
Demo account / seed data tersedia.
Core flow dari register sampai verified work history berjalan.
Tidak ada critical console error pada flow utama.
Halaman responsive di Desktop, Tablet, dan Mobile.
Health check endpoint berfungsi.
29.17 - MVP vs Future
MVP 🔒
Git feature branches
Protected main
Pull Requests
Code review
Basic CI:
- Lint
- Type Check
- Unit
- Build

Preview deployment
Vercel
Manual smoke test checklist
Production deployment
Health check
Rollback capability

Future 🔜
Full automated E2E pipeline
Advanced security scanning
Load testing pipeline
Canary deployment
Automated rollback
Release automation

🔒 29.18 - FINAL DECISION
Branching: Feature branch → Pull Request → protected main.
CI: Lint → Type Check → Unit → Integration → Build.
Staging: Vercel Preview deployment untuk verification & manual smoke test.
Production: Pipeline-driven deployment via Vercel.
Secrets: Environment/secret management, never source code.
Database: Supabase migration workflow, backward-compatible.
Verification: Health check + smoke test + monitoring.
Rollback: Vercel previous deployment + DB state evaluation.
Traceability: GitHub commit + Vercel deployment.
POINT 29 - LOCKED 🔒
POINT 30 - DOCUMENTATION & KNOWLEDGE MANAGEMENT
30.1 - Tujuan
Documentation harus membuat anggota tim dapat memahami:
System
Project Setup
Architecture
Business Rules
API
Database
Deployment
Troubleshooting
Development

tanpa bergantung pada satu orang.
Prinsip:
If knowledge is required to maintain the system, it should exist somewhere accessible to the team.
30.2 - Project README (ITechnoCup Compliance)
Root repository wajib memiliki:
README.md

Untuk memenuhi Guidebook ITechnoCup, README wajib memetakan 5 kriteria berikut secara eksplisit:
Penjelasan Aplikasi - Latar Belakang & Tujuan
Fitur Utama - Keunggulan & Diferensiasi
Teknologi yang Digunakan - Stack & Library
Cara Instalasi - Setup Lokal
Cara Penggunaan - Menjalankan Aplikasi
Bagian teknis seperti:
Architecture
Environment Variables
Testing

dapat menggunakan Bahasa Inggris.
30.3 - Environment Documentation
Sediakan:
.env.example

tanpa actual secret.
MVP .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

Dokumentasi hanya menjelaskan:
NAME
PURPOSE
REQUIRED?
ENVIRONMENT

30.4 - Architecture & Module Documentation
Architecture yang sudah dibahas harus memiliki dokumentasi resmi di:
docs/architecture/

Setiap major module memiliki penjelasan:
Purpose
Responsibilities
Dependencies
Main Entities
Important Business Rules

30.5 - Business Rule & State Documentation
State machine harus menggunakan canonical SRS.
Contoh Application:
APPLIED → SELECTED ✅
REJECTED → SELECTED ❌

Business rules jangan hanya berada di kepala developer.
30.6 - User Journey Documentation
Talent User Journey
Register
 ↓
Profile & Skills
 ↓
Browse / Match
 ↓
Apply (APPLIED)
 ↓
Meeting (COMPLETED)
 ↓
Parental Consent
   └── Jika diperlukan: APPROVED
 ↓
Contract (ACTIVE)
 ↓
Work & Simulated Payment
 ↓
Completion & Rating
 ↓
Verified Work History

30.7 - ADR (Architecture Decision Record)
ADR digunakan untuk mencatat:
Kenapa kita memilih sesuatu.
Core ADRs for Flex Network MVP
ADR-001: Use Modular Monolith over Microservices
ADR-002: Use Supabase PostgreSQL & Auth over Custom Backend
ADR-003: URL-based Portfolio over File Upload (MVP Constraint)
ADR-004: Rule-based Matching over AI/ML (MVP Constraint & Ethical AI)
ADR-005: Simulated Escrow Payment over Real Gateway (MVP Constraint)
ADR-006: Simulated Parental Consent Flow
ADR-007: Next.js Server Actions + Route Handlers Architecture

30.8 - Documentation Update Rule
Kita lock:
Architecture/code changes that invalidate documentation must update the relevant documentation in the same change or PR.
30.9 - MVP vs Future
MVP 🔒
README.md
Guidebook compliant
.env.example
CONTRIBUTING.md
CHANGELOG.md
docs/
├── architecture
├── api
├── database
├── security
├── deployment
└── testing

ADRs

Future 🔜
Advanced API portal
Automated documentation generation
Architecture visualization

🔒 30.10 - FINAL DECISION
Documentation: Version-controlled and treated as part of engineering.
Primary Entry: README.md, mapped to ITechnoCup 5 criteria.
Architecture: Dedicated architecture documentation + ADR.
API/Database: Endpoint behavior, Schema, RLS documented.
Consistency: Relevant docs must be updated alongside architectural/code changes.
Knowledge: Critical decisions cannot exist only in chat or individual memory.
POINT 30 - LOCKED 🔒
POINT 31 - MAINTENANCE, SUPPORT & INCIDENT MANAGEMENT
31.1 - Tujuan
Production is not the end of development; it is the beginning of continuous maintenance.
Maintenance categories:
Corrective → Bug
Preventive → Patch
Adaptive → Environment Change
Perfective → Improvement

31.2 - Support Channels & Bug Report
User harus memiliki jalur resmi:
Report Issue

bukan DM developer.
Minimal bug report:
Title
Steps to Reproduce
Expected vs Actual
Environment
Severity

31.3 - Incident vs Bug & Severity
Bug:
Masalah functionality.
Incident:
Masalah yang berdampak pada reliability, security, data, atau skala besar.
Severity:
SEV-1 → Critical / Outage
SEV-2 → High / Major Feature Broken
SEV-3 → Medium / Limited
SEV-4 → Low / Cosmetic

31.4 - Incident Lifecycle & Mitigation
Lifecycle:
Detection
 ↓
Triage
 ↓
Classification
 ↓
Response
 ↓
Mitigation
 ↓
Resolution
 ↓
Verification
 ↓
Post-Incident Review

Competition Pitching Fallback (SEV-1 During Live Demo)
Jika production down saat presentasi final ITechnoCup:
Jangan panik/fix live di depan juri.
Switch ke pre-recorded video demo atau slide deck screenshot high-res.
Informasikan panitia sesuai Guidebook.
31.5 - Blameless Postmortem
Fokus pada:
System
Process
Controls

bukan menyalahkan individu.
Struktur:
Incident ID
Impact
Timeline
Root Cause
Contributing Factors
Action Items
Owner
Deadline

31.6 - Backup & Restore (Supabase Context)
MVP Backup Strategy - Supabase Free Tier
Automated PITR tidak tersedia di free tier.
Backup strategy wajib berupa script pg_dump via GitHub Actions/cron.
Restore procedure: manual restore via psql atau Supabase SQL Editor ke environment recovery.
31.7 - Privacy & Minor Data Deletion
Mengikuti SRS NFR-09 (Minor Protection):
Jika user minor meminta Account Deletion, PII seperti Nama, Email, Sekolah, dan Link Portfolio wajib di-Hard Delete atau Anonymize segera.
Tidak boleh hanya soft-delete yang masih bisa diakses admin sembarangan.
31.8 - Security Incident Context (MVP)
Karena MVP tidak memakai real payment:
Security incident utama:
Kebocoran PII minor
RLS bypass
Credential leak
Supabase Service Role Key bocor ke GitHub

Jika Service Role Key leak dan menjadi SEV-1:
Revoke key di Supabase Dashboard
 ↓
Generate new key
 ↓
Update Vercel Environment Variables
 ↓
Rotate

🔒 31.9 - FINAL DECISION
Maintenance: Continuous after production.
Incident: Defined lifecycle with Blameless Postmortem.
Pitching Fallback: Offline Demo Kit, yaitu Video/Screenshot, untuk SEV-1 saat final.
Backup: pg_dump script untuk Supabase Free Tier.
Minor Deletion: Hard-delete/anonymize PII minor.
Security: Focus on RLS bypass and Service Role Key leak.
POINT 31 - LOCKED 🔒
POINT 32 - BACKUP, DISASTER RECOVERY & BUSINESS CONTINUITY
32.1 - Tujuan & Konsep
Protect Data
 ↓
Recover System
 ↓
Restore Service
 ↓
Verify Integrity
 ↓
Resume Operation

Backup: Salinan data.
Disaster Recovery: Proses mengembalikan sistem.
Business Continuity: Bagaimana bisnis tetap beroperasi saat sebagian sistem bermasalah.
32.2 - RTO & RPO
RTO (Recovery Time Objective):
Seberapa cepat sistem harus pulih.
RPO (Recovery Point Objective):
Seberapa banyak data yang boleh hilang.
Angka final disesuaikan dengan infrastructure.
32.3 - Database Backup (Supabase Reality)
MVP Backup Strategy
Karena MVP menggunakan Free Tier:
Automated PITR tidak tersedia.
Backup dilakukan melalui:
Scheduled pg_dump Script
 ↓
Secure Storage Terpisah

Jika upgrade ke Pro Tier, baru dapat mengandalkan Supabase Dashboard Automated Backups.
32.4 - Business Continuity Plan (The "Offline" Fallback)
Jika infrastructure seperti Vercel/Supabase mengalami outage total saat hari-H final:
Core Application tidak bisa diakses
 ↓
BCP Trigger
 ↓
Switch ke Offline Demo Kit

Offline Demo Kit:
Pre-recorded Video Demo
Screenshot Deck (PDF)
Localhost Backup

Komunikasi:
Informasikan juri/panitia bahwa ini adalah Infrastructure Outage Contingency.
32.5 - Backup Isolation
Backup file (.sql) JANGAN disimpan di repository publik atau storage yang sama dengan production credentials.
Recommended:
Encrypted Archive
 ↓
Separate Cloud Storage
 ↓
Restricted Access

Contoh storage yang dapat digunakan sesuai kebutuhan:
S3 bucket terpisah
Google Drive pribadi ketua tim

Akses dibatasi kepada Tech Lead.
32.6 - Failure Scenarios & Graceful Degradation
Failure scenarios:
Database Unavailable
Corruption
Accidental Deletion
Bad Deployment
External Service Failure

Graceful Degradation
Notification DOWN
 ↓
Core App Still Works

Search DOWN
 ↓
Existing Workflows Available

🔒 32.7 - FINAL DECISION
Backup: pg_dump script untuk MVP Free Tier.
BCP: Offline Demo Kit sebagai ultimate fallback saat pitch.
Isolation: Encrypted & stored separately from production repository.
Degradation: Critical user workflows receive recovery priority.
POINT 32 - LOCKED 🔒
POINT 33 - DATA LIFECYCLE, PRIVACY & RETENTION
33.1 - Tujuan & Prinsip
Prinsip:
Collect only what is needed, use it only for defined purposes, protect it throughout its lifecycle, and retain it only as long as justified.
Data Classification:
Public
Internal
Confidential
Restricted

33.2 - Regulatory Context (UU PDP)
Flex Network mematuhi prinsip:
UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
Point ini menetapkan bahwa:
Data pelajar SMA/SMK di bawah umur diperlakukan sebagai data yang memerlukan protection khusus.
Pemrosesan data anak dilakukan melalui mekanisme parental consent yang telah ditetapkan.
Hak subjek data mencakup hak mengetahui, menarik persetujuan, dan menghapus data.
33.3 - Simulated Consent Data Minimization
Karena MVP:
TIDAK PUNYA akun Guardian
TIDAK ADA upload dokumen identitas

maka:
Consent record hanya menyimpan metadata operasional:
consent_required
guardian_acknowledged_by
consent_approved_at
consent_status
Dokumen identitas seperti KTP, KK, dan Akta DILARANG di-upload atau disimpan di MVP.
Verifikasi berbasis laporan (Report-based verification) oleh Admin jika ada sengketa.
33.4 - Account Deletion vs Trust System (Right to be Forgotten)
Jika user, terutama minor, meminta penghapusan akun:
PII seperti Nama Asli, Email, Nomor HP, Nama Sekolah, dan Link Portfolio wajib di-Hard Delete atau di-Anonymize segera.
Verified Work History dan Rating tidak dihapus dari database agregat, tetapi di-Anonymize menjadi "Anonymous User".
Rating tetap ada untuk menjaga integritas Trust System Hirer, tetapi tidak bisa ditelusuri balik ke identitas asli Talent.
33.5 - Data Processing Map (Third-Party)
Flex Network - Data Controller.
Vercel - Data Processor, Compute & Edge Logs; memproses IP, Headers, Cookies.
Supabase - Data Processor, Database & Auth; menyimpan PII, Profile, Transactional Data. Region database harus didokumentasikan di Privacy Policy.
GitHub - Data Processor, Source Code; tidak boleh menyimpan PII atau production DB dump.
33.6 - Data Lifecycle Matrix
Profile        → User / Policy
Application    → Policy
Contract       → Retention Policy
Payment        → Retention Policy
Consent        → Restricted / Anonymize
Audit Log      → Long-term Retention

🔒 33.7 - FINAL DECISION
Regulatory: Complies with Indonesia UU PDP (Minor Data Protection).
Consent: No ID uploads in MVP; metadata only.
Deletion: PII hard-deleted/anonymized; Work History anonymized to preserve Trust System.
Processors: Vercel, Supabase, GitHub explicitly defined.
POINT 33 - LOCKED 🔒
POINT 34 - COMPLIANCE & GOVERNANCE
34.1 - Tujuan & Prinsip
Governance memastikan:
Requirement
 ↓
Policy
 ↓
Implementation
 ↓
Verification
 ↓
Evidence
 ↓
Review

Prinsip:
Accountability
Transparency
Traceability
Least Privilege
Risk-based Decision Making

34.2 - ITechnoCup & SDG Compliance Matrix
Orisinalitas & No-Template: Next.js + Supabase custom code. Evidence: GitHub Repo.
Framework Declaration: package.json & README.md.
SDG Alignment (SDG 8 & 9): Verified Work History & Skill Matching. Evidence: BRD & Pitch Deck.
Ethical AI Declaration: MVP tidak menggunakan AI/ML black-box untuk matching, melainkan Rule-Based Matching untuk menghindari bias algoritma dan isu privasi data anak. Evidence: ADR-004.
34.3 - Open Source & Licensing Compliance
Guidebook mewajibkan karya bebas dari pelanggaran hak cipta.
Kebijakan Lisensi
Hanya menggunakan library dengan lisensi permissive:
MIT
Apache 2.0
BSD
ISC

Dilarang menggunakan library copyleft seperti:
GPL
AGPL

yang menurut kebijakan proyek dianggap tidak sesuai dengan kebutuhan distribusi source code.
Aset Visual / Font
Inter → SIL OFL
Lucide → MIT

Dilarang hardcode gambar dari Google Images tanpa hak penggunaan yang jelas.
34.4 - Proportional Governance (3-Person Team)
Separation of Duties & Four-Eyes Principle
Diimplementasikan melalui GitHub Pull Request Workflow.
Developer TIDAK BOLEH merge PR-nya sendiri ke main.
Minimal:
1 anggota tim lain → Approve

Production Access
Hanya Tech Lead yang memiliki credential Vercel/Supabase Production.
Governance Review Board
Digantikan oleh:
Weekly Sync
15 menit

tanpa birokrasi committee.
34.5 - Risk Management & ADR
Risk Register:
Data Breach
Payment Failure
Database Outage
Scope Creep

Keputusan teknis penting dicatat menggunakan:
ADR (Architecture Decision Record)
🔒 34.6 - FINAL DECISION
Compliance: ITechnoCup rules, SDG 8/9, Ethical AI (Rule-based).
Licensing: Strict Permissive (MIT/Apache) only; No GPL.
Governance: Proportional via GitHub PR reviews (Four-eyes principle).
Traceability: Requirements connect to design, implementation, and evidence.
POINT 34 - LOCKED 🔒
POINT 35 - PRODUCT ANALYTICS & METRICS
35.1 - Tujuan & North Star Metric
Analytics digunakan untuk mengukur product value, bukan sekadar mengumpulkan data.
North Star Metric
Successful Opportunity Matches
Technical Definition (MVP)
Sebuah interaksi dianggap Successful Match apabila:
Contract Status = COMPLETED
Work Status = COMPLETED
Payment Status = RELEASED (Simulated)
Rating & Review = EXISTS (Two-way)
Hasil akhir tercatat sebagai Verified Work History
35.2 - MVP Analytics Implementation (Zero Third-Party SaaS)
NO Third-Party Tracking: MVP tidak menggunakan Google Analytics, Mixpanel, atau Meta Pixel.
Alasan: menjaga privasi user minor, menghindari kebutuhan tracking pihak ketiga, dan menyederhanakan compliance.
First-Party Internal Analytics: Event tracking disimpan di tabel database internal analytics_events atau structured log. Agregasi dilakukan melalui SQL/Supabase View untuk Admin Dashboard.
35.3 - Minor Protection in Analytics (Anti-Profiling)
Segmentasi usia, Minor vs Adult, hanya digunakan untuk Trust & Safety, misalnya memastikan minor tidak masuk ke opportunity yang membutuhkan consent tetapi belum disetujui.
Dilarang menggunakan data minor untuk:
behavioral profiling
predictive targeting
monetisasi iklan
35.4 - Demo & Pitching Analytics Strategy (Seed Data)
Karena ini lomba, production database diisi dengan Analytics Seed Data yang realistis untuk mendukung narasi pitching dan memperlihatkan dampak solusi.
Target seed data:
Supply:
500+ Active Talents

Demand:
50+ Active Hirers
(UMKM, Startup, EO)

North Star:
120+ Successful Matches
(Verified Work History)

Trust:
Average Rating 4.8/5.0
Dispute Rate < 2%

Data divisualisasikan di:
Admin Dashboard
Pitch Deck

35.5 - Funnel & Marketplace Health
Core Funnel
Visitor
 ↓
Registered
 ↓
Activated
 ↓
Applied
 ↓
Selected
 ↓
Meeting
 ↓
Consent
 ↓
Contract
 ↓
Work
 ↓
Verified Match

Marketplace Balance
Mengukur:
Supply → Talent
Demand → Hirer

agar marketplace tidak pincang.
Trust Metrics
Ghost Job Indicator
Cancellation Rate
Dispute Rate
Two-way Rating

35.6 - MVP vs Future
MVP 🔒
First-party internal event tracking
Core funnel
Marketplace balance
Trust metrics
Privacy controls
Pitching Seed Data

Future 🔜
Cohort retention
A/B testing
Predictive analytics
Automated anomaly detection

🔒 35.7 - FINAL DECISION
North Star: Verified Work History, dengan successful match yang tervalidasi melalui Contract Completed + Work Completed + Payment Released + Two-way Rating.
Implementation: Zero Third-Party SaaS, menggunakan first-party internal analytics.
Pitching: Realistic Seed Data untuk membuktikan dampak solusi ke juri.
Anti-Profiling: Minor segmentation strictly untuk Trust & Safety.



POINT 36 - UX, ACCESSIBILITY & DESIGN QUALITY
36.1 - Tujuan
UX Flex Network dirancang berdasarkan kebutuhan dan tujuan user, bukan berdasarkan struktur teknis internal system.
UX harus memastikan:
Clear
Predictable
Responsive
Accessible
Error-handled
Consistent
36.2 - User Goal Driven
Setiap feature harus menjawab:
Apa tujuan user?
Contoh:
Talent:
Find Opportunity
↓
Evaluate Opportunity
↓
Apply
↓
Track Application
Hirer:
Create Opportunity
↓
Review Talent
↓
Select Talent
↓
Schedule Meeting
UX tidak boleh memaksa user memahami struktur internal system.
36.3 - Navigation
Navigation harus konsisten antar halaman.
Contoh:
Talent
├── Dashboard
├── Opportunities
├── Applications
├── Meetings
├── Contracts
└── Profile
Hirer:
Hirer
├── Dashboard
├── Opportunities
├── Applications
├── Meetings
├── Contracts
└── Profile
Admin:
Admin
├── Dashboard
├── Users
├── Opportunities
├── Reports
└── Audit
36.4 - Visual Hierarchy
UI harus memiliki hierarchy yang jelas melalui:
Typography
Spacing
Layout
Component hierarchy
Color usage
Content grouping
Informasi penting harus lebih mudah ditemukan dibanding informasi sekunder.
36.5 - Responsive Design
Flex Network harus mendukung:
Mobile
Tablet
Desktop
Primary device strategy
Talent:
Mobile-first
Hirer:
Desktop-optimized
Admin:
Desktop-optimized
Namun seluruh core flow tetap harus usable pada supported viewport.
36.6 - Accessibility
Accessibility dianggap sebagai bagian dari feature quality.
Minimum baseline:
WCAG AA-oriented accessibility practices
Core flows harus dapat digunakan melalui:
Keyboard
Visible Focus
Accessible Labels
Semantic HTML
Readable Contrast
Clear Error Messages
36.7 - Color Contrast
Color contrast harus diverifikasi menggunakan accessibility checking tool.
Jangan hanya mengandalkan visual inspection.
Target:
Text dan interactive elements harus memenuhi contrast requirement yang relevan untuk WCAG AA.
36.8 - Color Independence
Color tidak boleh menjadi satu-satunya cara untuk menyampaikan informasi.
Contoh:
❌ Red = Error
✅ Red + Error icon + Text
36.9 - Keyboard Navigation
Relevant interactive elements harus dapat diakses melalui keyboard.
Contoh:
Buttons
Forms
Dropdowns
Dialogs
Navigation
Tables
36.10 - Focus State
Focused element harus memiliki visible focus state.
Focus state tidak boleh dihilangkan tanpa alternative yang accessible.
36.11 - Forms
Form harus memiliki:
Labels
Validation
Error messages
Required indicators
Input hints jika diperlukan
Error harus:
Explain the problem
Identify the affected field
Provide recovery guidance where possible
36.12 - Loading State
Setiap asynchronous operation yang membutuhkan waktu harus memberikan feedback.
Contoh:
Apply
↓
Loading
↓
Success
Jangan membuat user mengira tombol tidak bekerja.
36.13 - Success State
Critical action harus memberikan success feedback.
Contoh:
Application Submitted
Contract Created
Consent Recorded
Payment Released
36.14 - Empty State
Empty state harus menjelaskan:
What happened?
What can the user do next?
Contoh:
No applications yet.

[Browse Opportunities]
Bukan hanya:
No data.
36.15 - Error State
Error state harus memberikan:
Clear explanation
Recovery action
Retry jika memungkinkan
Contoh:
Unable to load opportunities.

[Try Again]
36.16 - Destructive Actions
Destructive action memerlukan protection yang sesuai.
Contoh:
Suspend User
Reject Application
Terminate Contract
Protection dapat berupa:
Confirmation
Warning
Explicit action
36.17 - Notifications
Notification harus:
Relevant
Timely
Non-spammy
Understandable
Notification tidak boleh dibuat tanpa business trigger.
36.18 - Status Terminology
UI menggunakan status terminology yang konsisten dengan canonical SRS.
Contoh internal:
APPLIED
UNDER_REVIEW
SELECTED
REJECTED
UI dapat menggunakan Bahasa Indonesia yang user-friendly.
Contoh:
APPLIED → Diajukan
UNDER_REVIEW → Sedang Ditinjau
SELECTED → Terpilih
REJECTED → Ditolak
36.19 - Design System
UI menggunakan shared design system.
Minimum:
Typography
Spacing
Colors
Buttons
Inputs
Cards
Dialogs
Status components
Shared component harus menjaga visual dan accessibility consistency.
36.20 - Design System Baseline
Baseline mengikuti BRD:
Royal Blue
Inter Typography
Consistent spacing
Consistent component behavior
Implementation details tetap mengikuti final UI design.
36.21 - Component Reusability
Shared UI component harus digunakan untuk pola interaksi yang berulang.
Contoh:
Button
Input
Select
Modal
Badge
Card
Toast
36.22 - Component Consistency
Component yang sama harus memiliki:
Consistent behavior
Consistent terminology
Consistent spacing
Consistent accessibility
36.23 - Mobile UX
Mobile interface harus memperhatikan:
Touch targets
Readable text
Scrollable content
Bottom actions
Responsive navigation
36.24 - Touch Targets
Interactive elements harus memiliki touch target yang cukup untuk digunakan dengan nyaman pada mobile.
Target implementation:
minimum sekitar 44 × 44 CSS pixels
kecuali terdapat alasan UX/accessibility tertentu.
36.25 - Motion
Animation digunakan untuk membantu understanding, bukan mengganggu user.
Gunakan:
prefers-reduced-motion
untuk user yang mengaktifkan reduced motion preference.
36.26 - UX Privacy
Privacy information harus:
Clear
Understandable
Relevant
tetapi tidak membuat UX unnecessarily painful.
36.27 - UX Security Balance
Security control harus proportional terhadap risk.
Contoh:
Low-risk read
→ simple interaction

High-risk mutation
→ stronger confirmation / authorization
36.28 - Usability Testing
Major workflow harus divalidasi melalui usability testing jika diperlukan.
Testing dapat menggunakan:
Task-based testing
Observation
Short interview
Survey
Review
36.29 - Accessibility Testing
Accessibility testing dapat melibatkan:
Keyboard Testing
Screen Reader Testing
Contrast Checking
Semantic Inspection
Form Label Checking
Automated accessibility testing digunakan sebagai support, bukan satu-satunya validation method.
36.30 - UX Regression
Perubahan feature tidak boleh merusak flow yang sebelumnya bekerja.
Regression harus mempertimbangkan:
Navigation
Components
Forms
Responsive behavior
Accessibility
Error states
36.31 - Accessibility Regression
Jika shared component berubah, accessibility test harus memastikan perubahan tersebut tidak merusak halaman lain yang menggunakan component tersebut.
36.32 - UX Quality Gate
Major feature tidak dianggap selesai hanya karena functionality bekerja.
Minimum:
Functional
+
Usable
+
Responsive
+
Accessible
+
Error-handled
36.33 - Demo & Pitching UX Readiness
Untuk competition demo:
High Contrast & Readability
Color contrast harus diverifikasi menggunakan accessibility checker agar tetap readable saat screen sharing.
Clear Visual Feedback
Critical actions seperti:
Apply
Create Contract
Approve Consent
Release Payment
harus memiliki:
Loading State
Success State
Error State
Empty States
Empty state harus tetap terlihat polished.
Untuk demo, synthetic seed data dapat digunakan agar primary dashboard tidak kosong.
36.34 - Accessibility Target
MVP:
Accessibility baseline diterapkan pada core user flows.
Future:
Coverage diperluas ke seluruh application.
36.35 - Core Accessible Flows
Minimal:
Registration
Login
Profile
Opportunity Discovery
Application
Application Tracking
Opportunity Creation
Candidate Review
Meeting
Contract
Payment-related flows
36.36 - UX Principles
UX must be user-goal driven.
Core flows must be clear and predictable.
Navigation must remain consistent.
Visual hierarchy must communicate importance.
Responsive behavior is required across supported viewports.
Accessibility is part of feature quality.
Color must not be the sole carrier of meaning.
Keyboard navigation must work for relevant interactions.
Focus states must remain visible.
Forms must have accessible labels and useful validation.
Errors must explain the problem and provide recovery where possible.
Loading states must provide feedback.
Empty states must explain what the user can do next.
Destructive actions require appropriate protection.
Notifications must be relevant and non-spammy.
Status terminology must remain consistent.
Core workflows must be usable on supported devices.
Shared components must preserve UX and accessibility consistency.
UX changes require regression consideration.
Major workflows should be validated through usability and accessibility testing.
36.37 - MVP vs Future
MVP 🔒
Responsive design
Mobile-first Talent experience
Desktop-optimized Hirer/Admin experience
Core accessibility baseline
Keyboard navigation
Visible focus states
Accessible forms
Error/loading/empty/success states
Consistent navigation
Core user flows
Design system baseline
Accessibility testing
UX regression testing
Status language mapping in Bahasa Indonesia
Future 🔜
Advanced usability testing
Full WCAG coverage
Automated accessibility regression
Advanced personalization
Internationalized UX
Advanced design system documentation
36.38 - FINAL DECISION
UX: Flex Network is designed around user goals rather than technical structure.
Consistency: Navigation, terminology, components, and interaction patterns remain consistent across modules.
Responsive: Mobile-first untuk Talent, Desktop-optimized untuk Hirer/Admin.
Accessibility: Accessibility is treated as part of feature completion and tested across core workflows.
Contrast: Color contrast is verified against the applicable WCAG AA requirements.
Design System: UI follows the BRD Color Palette and Inter Typography.
Status Language: Canonical SRS state translated into user-friendly Bahasa Indonesia.
Quality Gate: A feature is not considered complete merely because it technically works; it must also provide an acceptable user experience.
POINT 36 - LOCKED 🔒

POINT 37 - INTERNATIONALIZATION & LOCALIZATION
37.1 - Tujuan
Internationalization (i18n) memastikan application secara teknis siap menangani:
Language
Currency
Date & Time
Number Format
Timezone
Locale
Localization (l10n) menangani implementasi pengalaman sesuai region tertentu.
37.2 - MVP Scope
Primary locale:
id-ID
MVP tidak memaksakan multi-language.
Namun architecture tetap translation-ready.
37.3 - Language
Primary:
Bahasa Indonesia
Future:
English
Other supported languages
37.4 - Translation Strategy
UI text tidak boleh tersebar sebagai hard-coded string secara berlebihan.
Gunakan translation keys.
Contoh:
application.apply
application.cancel
application.status
37.5 - Translation Keys
Contoh:
application.apply
application.cancel
application.status
37.6 - Translation Files
locales/
├── id-ID/
│   └── common.json
└── en-US/
    └── common.json
37.7 - Missing Translation
Application tidak boleh crash hanya karena translation missing.
37.8 - Translation Fallback
Default locale:
id-ID
37.9 - Pluralization
Gunakan localization-aware plural rules.
Jangan mengandalkan manual string concatenation.
37.10 - Gendered Language
Jangan menyimpan asumsi gender user hanya untuk kebutuhan grammar jika tidak diperlukan.
37.11 - Variable Interpolation
Translation harus mendukung variable interpolation.
Contoh:
Hello, {name}
37.12 - Date Formatting
Tanggal harus menggunakan locale-aware formatting.
Jangan hard-code format date.
37.13 - Time Formatting
Waktu harus mempertimbangkan:
Locale
Timezone
24-hour / 12-hour preference
Untuk Indonesia, default UI:
24-hour format
37.14 - Timezone
Backend timestamps sebaiknya menggunakan UTC.
Flow:
UTC
↓
User Timezone
↓
Display
37.15 - User Timezone
Timezone dapat ditentukan berdasarkan:
User preference
Browser/device
Account configuration
37.16 - Deadline
Deadline harus memiliki timezone yang jelas.
Contoh:
14 Agustus 2026, 23:59 WIB
lebih jelas daripada:
14 Agustus 2026, 23:59
37.17 - Currency
MVP:
IDR / Rupiah
Future:
USD
MYR
SGD
37.18 - Currency Representation
System menyimpan:
amount
+
currency
bukan formatted currency string.
37.19 - Money Precision
Untuk financial values:
Jangan menggunakan floating-point representation secara tidak aman.
MVP IDR Representation
Karena MVP menggunakan IDR dan Simulated Escrow:
Nilai uang disimpan sebagai INTEGER tanpa desimal/sen.
Contoh:
Rp1.500.000
→
1500000
UI formatting menggunakan locale-aware currency formatter.
37.20 - Currency Formatting
UI dapat memformat:
500000
→
Rp500.000
Database tetap menyimpan canonical monetary representation.
37.21 - Number Formatting
Number formatting mengikuti locale.
Contoh:
1.000
1.000.000
37.22 - Address
Untuk Indonesia, address model dapat mendukung:
Province
City/Regency
District
Village
Postal Code
37.23 - Phone Number
Phone number menggunakan canonical representation.
Contoh:
+62...
37.24 - Phone Formatting
Storage:
Canonical
Presentation:
Localized
Database representation tidak sama dengan UI formatting.
37.25 - Locale
Locale dapat direpresentasikan seperti:
id-ID
en-US
Locale dan language tidak selalu identical.
37.26 - Locale Resolution
Prioritas:
User Preference
↓
Browser / Device Preference
↓
Application Default
MVP:
id-ID
37.27 - RTL Support
Future localization dapat membutuhkan RTL.
UI architecture sebaiknya menggunakan logical properties ketika relevan.
37.28 - Text Expansion
Translation dapat membuat text lebih panjang.
UI tidak boleh bergantung pada fixed width yang tidak fleksibel.
37.29 - Font Support
Font harus mendukung karakter dari locale yang digunakan.
MVP:
Inter
37.30 - Sorting
Sorting text harus mempertimbangkan locale.
Jangan selalu menggunakan simple ASCII comparison.
37.31 - Search
Search dapat dipengaruhi oleh:
Locale
Case
Accent
Language
Unicode
MVP difokuskan pada Bahasa Indonesia.
37.32 - Localization of Opportunity Data
Opportunity data merupakan user-generated content.
User-generated content tidak otomatis diterjemahkan hanya karena UI menggunakan i18n.
37.33 - User-Generated Content
User-generated content tetap disimpan sebagai content asli.
37.34 - Translation of User Content
Future:
Original Content
↓
Optional Translation
↓
Translated View
Original content tetap tersedia.
37.35 - Legal & Compliance Localization
Legal document tidak boleh hanya diterjemahkan oleh UI translation system tanpa review yang sesuai.
37.36 - Notification Localization
Notification harus mengikuti locale user ketika localization support tersedia.
37.37 - Email Localization
Future email template dapat memiliki:
Template
Locale
Variables
Version
37.38 - Push Notification
Future push notification mengikuti localization settings.
37.39 - Localization Metadata
Localization resources dapat memiliki:
translation_key
locale
version
updated_at
37.40 - Translation Versioning
Translation files harus version-controlled via Git.
37.41 - Translation Quality
Translation harus diperiksa:
Accuracy
Consistency
Context
Terminology
Grammar
UI Fit
37.42 - Product Terminology
Flex Network harus memiliki terminology glossary.
37.43 - Terminology Consistency
Jika domain menggunakan:
Opportunity
maka terminology tersebut harus digunakan konsisten.
Jangan mengganti secara acak menjadi:
Job
Project
Task
jika sebenarnya merujuk pada entity yang sama.
37.44 - Accessibility + Localization
Localization tidak boleh merusak:
Responsive Layout
Readability
Accessibility
37.45 - Date + Accessibility
Critical date information sebaiknya tidak menggunakan format ambigu.
Contoh:
9 Agustus 2026
lebih jelas daripada:
08/09/26
37.46 - Localization Testing
Localization testing mencakup:
Text
Date
Time
Currency
Number
Forms
Notifications
Responsive UI
Accessibility
37.47 - Pseudo-Localization
Future testing dapat menggunakan pseudo-localization untuk menemukan:
Overflow
Hard-coded strings
Layout assumptions
Missing translations
37.48 - Hard-Coded Text Detection
CI dapat melakukan checking untuk menemukan hard-coded UI strings jika tooling tersedia.
37.49 - Translation Missing Monitoring
Production dapat mencatat:
Missing translation key
Locale
Screen/module
Telemetry tidak boleh memasukkan sensitive user data.
37.50 - Localization Architecture
Application
↓
i18n Service
↓
Locale + Formatter
↓
Translation + Date/Time/Currency
↓
UI
37.51 - Module Integration
Semua module menggunakan shared localization mechanism.
Tidak membuat translation system sendiri-sendiri.
37.52 - Backend Localization
Backend harus menangani localization bila menghasilkan:
Email
Notification
Generated Document
User-facing Message
Business rules tetap locale-independent.
37.53 - Domain Independence
Domain logic tidak boleh bergantung pada:
Rp
Agustus
09:30 WIB
Domain hanya bekerja dengan canonical values.
37.54 - API Localization
API sebaiknya mengirim structured data.
Contoh:
{
  "status": "SUBMITTED"
}
bukan:
{
  "status": "Lamaran telah dikirim"
}
Presentation layer bertanggung jawab terhadap localization.
37.55 - Error Localization
Backend:
APPLICATION_ALREADY_SUBMITTED
Frontend:
localized message
37.56 - Localization Boundary
Domain
↓
Canonical Data
↓
Application / API
↓
Localization
↓
UI
37.57 - Internationalization Principles
MVP uses Indonesian as the primary locale.
UI strings use localization mechanisms where appropriate.
Translation keys are used for localizable content.
A defined fallback locale exists.
Date and time formatting are locale-aware.
Timezone is explicitly handled where relevant.
Currency is represented separately from amount.
Monetary calculations avoid unsafe floating-point usage.
Number formatting is locale-aware.
Phone numbers use canonical representation.
User-generated content remains distinct from UI translation.
Domain logic remains locale-independent.
API responses prefer structured codes over localized presentation strings.
Notifications and emails can be localized.
Translation resources are version-controlled.
Product terminology remains consistent.
Localization must not break responsive or accessible UI.
Missing translations must fail gracefully.
Localization changes should be tested.
Additional locales are introduced only when product requirements justify them.
37.58 - MVP vs Future
MVP 🔒
Indonesian locale (id-ID)
Locale-aware date/time formatting
IDR currency with integer representation
Canonical phone number representation
Translation-ready UI architecture
Shared terminology / glossary
Structured API status/error codes
Basic localization testing
Future 🔜
English locale
Additional regions
Multi-currency
Advanced timezone support
RTL support
Translation management workflow
Pseudo-localization
User-content translation
37.59 - FINAL DECISION
Locale: MVP menggunakan id-ID sebagai primary locale.
i18n: Architecture translation-ready tanpa memaksakan multi-language pada MVP.
UI: User-facing strings menggunakan localization mechanism terpusat.
Domain: Business logic tetap locale-independent.
API: Backend menggunakan structured codes/data daripada localized presentation strings.
Date/Time: Menggunakan locale dan timezone yang eksplisit.
Currency: Amount dan currency disimpan sebagai data terpisah dengan integer representation untuk IDR.
Phone: Nomor telepon menggunakan canonical representation.
User Content: Content buatan user tidak otomatis diterjemahkan atau diubah.
Consistency: Terminology Flex Network memiliki glossary dan digunakan konsisten.
Accessibility: Localization tidak boleh merusak responsive layout maupun accessibility.
Expansion: Locale tambahan hanya ditambahkan ketika ada kebutuhan product/business yang jelas.
POINT 37 - LOCKED 🔒

POINT 38 - SEO, WEB VITALS & PUBLIC PERFORMANCE
38.1 - Tujuan
Memastikan Flex Network memiliki public experience yang cepat, stabil, accessible, dan profesional saat diakses oleh juri, panitia, maupun user.
Karena Flex Network merupakan authenticated application, SEO difokuskan pada:
Landing Page
Public Information Pages
Public Opportunity Pages jika tersedia
Data privat tidak boleh di-index.
38.2 - Core Web Vitals

Metric
Target
LCP
< 2.5s
INP
< 200ms
CLS
< 0.1

Target tersebut digunakan sebagai engineering guideline.
38.3 - Performance Budget
Landing Page
Performance ≥ 90
Accessibility ≥ 90
Best Practices ≥ 95
SEO ≥ 90
Authenticated App
Performance ≥ 80
Accessibility ≥ 90
Target merupakan internal quality target, bukan contractual SLA.
38.4 - Next.js Optimization Strategy
Image Optimization
Image assets yang membutuhkan optimization menggunakan:
next/image
atau equivalent optimization mechanism.
SVG/icon assets dapat menggunakan pendekatan yang sesuai dengan asset type.
Non-critical images menggunakan lazy loading bila sesuai.
Font Optimization
Inter menggunakan Next.js font optimization.
Tujuan:
Reduce layout shift
Improve loading consistency
Code Splitting & Lazy Loading
Komponen berat dapat menggunakan dynamic import.
Jangan memasukkan seluruh library ke initial page bundle tanpa kebutuhan.
Third-Party Scripts
MVP tidak menggunakan third-party analytics tracking seperti:
Google Analytics
Meta Pixel
Mixpanel
sesuai Point 35.
38.5 - SEO Fundamentals
Public Pages
Mendukung:
Meta Title
Meta Description
Semantic HTML
Heading hierarchy
Canonical URL bila diperlukan
Authenticated Pages
Dashboard dan private pages:
Tidak ditujukan untuk indexing.
Gunakan appropriate robots metadata seperti noindex apabila diperlukan.
38.6 - Social Sharing & OpenGraph
Public URL Flex Network harus memiliki social preview yang professional.
Metadata harus menggunakan configurable application URL.
Contoh concept:
NEXT_PUBLIC_APP_URL
OpenGraph asset:
og-image.png
1200 × 630
Design mengikuti:
Royal Blue
Flex Network branding
Inter Typography
Production domain tidak boleh di-hardcode di architecture documentation.
38.7 - Robots.txt & Sitemap
Next.js App Router dapat menggunakan:
robots.ts
sitemap.ts
Public pages dapat di-index.
Private routes seperti:
/dashboard
/admin
/api
harus excluded dari indexing.
Private user-specific pages juga harus mendapatkan protection yang sesuai.
38.8 - Accessibility & Performance Intersection
Accessibility dan performance harus dipertimbangkan bersama.
Hal yang diperhatikan:
Contrast Ratio
Touch Target
Reduced Motion
Readable Typography
Stable Layout
Contrast ratio harus diverifikasi menggunakan accessibility checker.
Target touch interaction:
sekitar 44 × 44 CSS pixels
jika applicable.
38.9 - Monitoring Web Vitals
Pre-Submission Audit
Jalankan:
Lighthouse
pada:
Desktop
Mobile
Hasil audit dapat disimpan sebagai evidence untuk competition.
Optional future:
Real User Monitoring
38.10 - Competition Demo Readiness
Checklist sebelum submission:
[ ] Landing page responsive
[ ] Landing page performance target met
[ ] No significant layout shift
[ ] OpenGraph preview verified
[ ] Inter typography loaded correctly
[ ] Seed/demo data available
[ ] Public URL accessible
38.11 - MVP vs Future
MVP 🔒
next/image / appropriate image optimization
next/font
OpenGraph / Social Preview
robots.txt
sitemap.xml
Lighthouse audit
Core Web Vitals monitoring target
No third-party analytics tracking scripts
Future 🔜
Vercel Web Analytics / RUM
Advanced SEO / Structured Data
Multi-language SEO
PWA
Advanced edge caching optimization
38.12 - FINAL DECISION
Scope: SEO and public performance difokuskan pada public/landing pages.
Performance Target: LCP < 2.5s, INP < 200ms, CLS < 0.1 sebagai engineering targets.
Optimization: Next.js image/font optimization, code-splitting, dan responsive asset strategy digunakan sesuai kebutuhan.
Dashboard: Authenticated/private pages tidak menjadi target SEO.
Social Sharing: OpenGraph wajib untuk public presentation pages dengan configurable application URL.
Accessibility: Contrast dan touch targets diverifikasi terhadap accessibility requirements yang relevan.
Monitoring: Lighthouse audit dilakukan sebelum submission dan dapat disimpan sebagai evidence.
POINT 38 - LOCKED 🔒

POINT 39 - TESTING STRATEGY & QUALITY ASSURANCE
39.1 - Tujuan
Testing memastikan:
Requirement
↓
Implementation
↓
Verification
↓
Expected Behavior
Testing dilakukan sepanjang SDLC.
39.2 - Relationship with Point 28
Point 28 mendefinisikan:
High-level testing strategy
Testing layers
Acceptance Criteria traceability
Point 39 mengembangkan strategy tersebut menjadi:
Full QA framework
Point 28 tetap menjadi referensi:
AC-01 sampai AC-12
39.3 - Testing Principles
Core quality dimensions:
Correctness
Reliability
Security
Maintainability
Regression Prevention
39.4 - Testing Pyramid
      E2E
        ▲
   Integration
        ▲
     Unit Tests
Banyak:
Unit
Sedang:
Integration
Sedikit:
E2E
39.5 - Unit Testing
Unit testing menguji:
Domain Rule
Service Logic
Validator
Utility
secara isolated.
39.6 - Unit Test Focus
Prioritas:
Business Rules
Validation
State Transition
Calculation
Authorization Rules
Domain Logic
Matching Logic
Consent Rules
Payment Rules
39.7 - Unit Test Independence
Unit test harus:
Fast
Deterministic
Isolated
Repeatable
Tidak membutuhkan:
Real Database
Real Payment Gateway
Real Email Provider
39.8 - Integration Testing
Integration testing menguji interaksi antar component.
Contoh:
Application Module
↓
Repository
↓
Database
39.9 - Integration Test Scope
Meliputi:
Database
Repository
Module Integration
API
Authentication Infrastructure
External Service Adapter
39.10 - API Testing
API testing memastikan:
Request
↓
Validation
↓
Authorization
↓
Business Logic
↓
Response
berjalan sesuai API contract.
39.11 - API Contract Testing
Verifikasi:
Endpoint
Method
Request Schema
Response Schema
Status Code
Error Contract
39.12 - E2E Testing
E2E menguji complete user journey.
Contoh Talent:
Login
↓
Browse
↓
View
↓
Apply
↓
Track Application
Contoh Hirer:
Login
↓
Create Opportunity
↓
Review
↓
Select
↓
Schedule Meeting
39.13 - E2E Scope
Prioritas:
Critical User Journey
Critical Business Flow
Security-Critical Flow
High-Risk Workflow
39.14 - Regression Testing
Setiap perubahan harus mempertimbangkan apakah existing functionality masih bekerja.
39.15 - Regression Suite
Berisi test untuk:
Critical Features
Known Bug Fixes
Important Business Rules
Security Controls
Core User Flows
39.16 - Smoke Testing
Setelah deployment:
Application Starts
↓
Login Works
↓
Database Reachable
↓
Core API Works
39.17 - Sanity Testing
Sanity testing digunakan setelah perubahan tertentu untuk memastikan area yang diubah masih berfungsi.
39.18 - Functional Testing
Functional testing memverifikasi:
Requirement → Expected Behavior
AC Traceability
AC-01 Registration & Login
→ Auth tests

AC-02 Profile
→ Profile tests

AC-03 Opportunity
→ Opportunity tests

AC-04 Matching & Apply
→ Matching + Application tests

AC-05 Selection & Meeting
→ Application + Meeting tests

AC-06 Contract & Simulated Payment
→ Contract + Payment tests

AC-07 Work Completion
→ Work completion tests

AC-08 Rating & Work History
→ Rating + Work History tests

AC-09 Parental Consent
→ Consent tests

AC-10 Admin Moderation
→ Admin tests

AC-11 Error Handling
→ Error tests

AC-12 Responsive UI
→ Responsive / UI tests
Setiap relevant test case dapat memiliki AC reference/tag.
39.19 - Negative Testing
Testing mencakup:
Invalid Input
Missing Input
Unauthorized User
Duplicate Request
Expired State
Unexpected State
Consent Testing
1. Consent not required
Selected + Meeting Completed
→ Contract Allowed ✅

2. Consent required + approved
→ Contract Allowed ✅

3. Consent required + pending
→ Contract Blocked ❌

4. Consent required + rejected
→ Contract Blocked ❌

5. Consent required + missing
→ Contract Blocked ❌
MVP:
No Guardian Account
Simulated Consent
No Guardian ID Upload
39.20 - Boundary Testing
Test:
Minimum
Maximum
Empty
Null
Very Large
Very Small
39.21 - Validation Testing
Validation harus diuji terhadap business-relevant boundaries.
39.22 - Authorization Testing
Pastikan user tidak dapat mengakses resource yang bukan miliknya.
39.23 - Authentication Testing
Meliputi:
Login
Logout
Session
Token/session validation
Password Reset jika tersedia
Account Verification jika tersedia
39.24 - Security Testing
Security testing dapat mencakup:
Authentication
Authorization
Input Validation
Session Security
Rate Limiting
Data Exposure
Injection
Access Control
Supabase RLS Testing
RLS merupakan defense-in-depth protection.
Testing wajib mencakup:
Role
Resource
Action
Expected
Talent
Own profile
Read
✅
Talent
Own profile
Update
✅
Talent
Other profile private data
Read
❌
Talent
Other profile private data
Update
❌
Talent
Own application
Read
✅
Talent
Other application
Read
❌
Hirer
Own opportunity
Update
✅
Hirer
Other opportunity
Update
❌
Hirer
Applicants for own opportunity
Read
✅
Hirer
Applicants for other opportunity
Read
❌
Admin
Moderation resources
Manage
✅

Testing approach:
Supabase local / test project
User/anon authentication
Service role hanya untuk setup/seed
Negative authorization cases wajib diuji
39.25 - Abuse Case Testing
Testing dilakukan terhadap abusive behavior secara aman.
Contoh:
Repeated Requests
Invalid Token
Unauthorized Resource Access
Mass Form Submission
Duplicate Mutations
39.26 - Performance Testing
Metric:
Latency
Throughput
Error Rate
Resource Usage
39.27 - Load Testing
Simulasikan concurrent users sesuai expected workload.
39.28 - Stress Testing
Future atau release-specific testing dapat digunakan untuk mencari degradation point.
Tidak menjadi mandatory MVP baseline.
39.29 - Scalability Testing
Jika diperlukan:
More Users
More Data
More Requests
39.30 - Reliability Testing
Meliputi:
Failure Recovery
Retry Behavior
Dependency Failure
Database Failure
Service Failure
39.31 - Fault Injection
Future:
Controlled failure testing
Tidak wajib untuk MVP.
39.32 - Database Testing
Test:
Constraints
Transactions
Migrations
Indexes
Data Integrity
39.33 - Migration Testing
Migration harus:
Safe
Validated
Backward-compatible where necessary
39.34 - Backup & Restore Testing
Backup dianggap belum terbukti sampai restore berhasil dan integrity dapat diverifikasi.
39.35 - External Service Testing
External dependencies menggunakan:
Mock
Stub
Sandbox
Test Environment
Automated tests tidak menggunakan production external service.
39.36 - Payment Testing
MVP simulated payment:
PENDING
↓
SIMULATED_PAID
↓
RELEASED
Invalid:
RELEASED before Work Completed ❌
Payment Created without ACTIVE Contract ❌
Duplicate Payment ❌
Work completion:
Work Completed
+
Hirer Confirmation
→
Payment Released ✅
Jika belum ada confirmation:
Payment tetap pada eligible pre-release state.
Future real payment:
Sandbox
Webhook
Timeout
Refund
Dispute
39.37 - Notification Testing
Test:
Correct Recipient
Correct Trigger
Correct Content
No Duplicate
Notification failure tidak boleh membatalkan core transaction.
39.38 - File Upload Testing
MVP tidak menggunakan internal file upload.
Jika future file upload diterapkan:
Valid File
Invalid File
Too Large
Unsupported Type
Corrupted File
Unauthorized File Access
39.39 - Search Testing
Test:
Exact Match
Partial Match
No Result
Special Characters
Filters
Sorting
Pagination
39.40 - Pagination Testing
Test:
0 Items
1 Item
Page Boundary
Last Page
Large Dataset
Invalid Page
39.41 - Concurrency Testing
Critical operations harus diuji ketika terjadi secara concurrent.
System harus menghasilkan consistent state.
39.42 - Idempotency Testing
Repeated request harus menghasilkan:
No unintended duplicate side effect
Contoh:
Apply
Apply Again
↓
One Application
39.43 - Business Side-Effect Testing
Karena MVP bukan event-driven architecture, testing fokus pada business trigger dan side-effect.
Contoh:
Application Selected
↓
Notification Triggered

Meeting Scheduled
↓
Notification Triggered

Admin Suspends User
↓
Audit Record Created
Future external webhook/event integrations dapat memiliki:
Duplicate Event
Retry
Invalid Event
Consumer Failure
testing.
39.44 - UI Testing
Test:
Rendering
Interaction
Validation
Navigation
State
39.45 - Responsive Testing
Test:
Mobile
Tablet
Desktop
Critical breakpoints
39.46 - Accessibility Testing
Test:
Keyboard
Focus
Screen Reader
Contrast
Labels
Semantic HTML
Error Messaging
sesuai Point 36.
39.47 - Cross-Browser Testing
Supported browser policy harus menentukan browser yang wajib diverifikasi.
Untuk competition MVP minimal:
Chrome
Firefox
Edge
Safari dapat diverifikasi bila tersedia pada target device/environment.
39.48 - Visual Regression
Future:
Automated screenshot comparison
Tidak wajib MVP.
39.49 - Test Data
Test data harus:
Deterministic
Safe
Non-sensitive
Reusable
Production personal data tidak digunakan.
39.50 - Test Fixtures
Fixture dapat digunakan untuk:
User
Opportunity
Application
Contract
Meeting
Notification
39.51 - Test Environment
MVP:
Development
CI Testing
Preview / Staging Validation
Production
Testing tidak berjalan terhadap production database.
Testing environment persistent terpisah tidak wajib untuk MVP jika CI dan preview validation sudah mencukupi.
39.52 - Production Testing
Production testing harus sangat terbatas dan controlled.
Contoh:
Health Check
Smoke Test
Synthetic Monitoring
39.53 - CI Testing
Pull Request idealnya menjalankan:
Lint
↓
Type Check
↓
Unit
↓
Integration
↓
Build
39.54 - CI Pipeline
Pull Request
↓
Static Checks
↓
Unit Tests
↓
Integration Tests
↓
Build
↓
Security Checks
↓
Preview / Test Deployment
↓
E2E / Smoke
39.55 - Test Failure
Critical test failure:
CI FAIL
↓
Merge Blocked
39.56 - Flaky Test
Flaky test harus:
Investigated
Fixed
Temporarily quarantined if necessary
Tidak boleh diabaikan.
39.57 - Test Coverage
Coverage digunakan sebagai quality indicator, bukan satu-satunya quality metric.
39.58 - Coverage Target
Tidak ada global coverage target untuk seluruh codebase.
Internal engineering guideline:
Business-critical logic ditargetkan memiliki coverage tinggi dan dapat menggunakan target >80% jika feasible dan sesuai risk.
39.59 - Mutation Testing
Future:
Mutation Testing
Tidak wajib untuk MVP.
39.60 - Test Naming
Nama test harus menjelaskan behavior.
Contoh:
should_reject_application_when_opportunity_is_closed
39.61 - Arrange / Act / Assert
Unit test dapat menggunakan:
Arrange
↓
Act
↓
Assert
39.62 - Test Isolation
Test tidak boleh bergantung pada test order.
39.63 - Deterministic Testing
Time, random values, dan external dependencies harus dikontrol bila diperlukan.
39.64 - Test Maintainability
Test harus:
Readable
Maintainable
Focused
Reusable where appropriate
39.65 - Bug Reproduction Test
Bug Found
↓
Reproduce
↓
Create Test
↓
Fix
↓
Test Passes
39.66 - Quality Assurance
QA mencakup:
Requirement Quality
Code Quality
Testing
Security
UX
Release Quality
Monitoring
39.67 - Definition of Done
Feature dianggap selesai jika:
Requirement Met
Code Reviewed
Tests Added
Critical Tests Pass
Security Considered
UX Considered
Documentation Updated
39.68 - Risk-Based Testing
High-risk feature:
Authentication
Authorization
Payment
Contract
Personal Data
Consent
Admin Moderation
mendapat testing lebih kuat.
39.69 - Test Priority
P0 → Critical
P1 → High
P2 → Medium
P3 → Low
39.70 - Quality Gate
Critical Tests
↓
PASS?
├── Yes → Release Candidate
└── No → Block
39.71 - Release Candidate Testing
Build
↓
Preview / Staging
↓
Smoke
↓
Regression
↓
E2E
↓
Security Checks
↓
Release Decision
Competition Pre-Submission Checklist
Competition dates harus mengikuti latest official ITechnoCup schedule.
Checklist minimum:
[ ] Core flow verified
[ ] AC-01 sampai AC-12 verified
[ ] Responsive testing
[ ] Cross-browser testing
[ ] Accessibility checks
[ ] RLS/security checks
[ ] Demo seed data verified
[ ] Production URL accessible
[ ] README complete
[ ] GitHub repository clean
[ ] GET /api/health returns 200
[ ] Error handling verified
[ ] Loading states verified
[ ] Empty states verified
Live final preparation:
[ ] Live demo dry-run
[ ] Pre-recorded demo ready
[ ] Screenshot / PDF backup ready
[ ] Internet backup tested
[ ] Presentation files verified
39.72 - Post-Release Validation
Deploy
↓
Health Check
↓
Smoke Test
↓
Monitoring
↓
Critical Metrics Validation
39.73 - Rollback Validation
Rollback procedure harus diketahui oleh responsible team member dan diuji bila practical.
39.74 - QA Documentation
Testing documentation minimal:
Test Strategy
Test Cases
Test Results
Known Issues
Release Checklist
39.75 - Test Report
Test report dapat berisi:
Tests Run
Passed
Failed
Skipped
Environment
Build Version
Known Issues
39.76 - Defect Lifecycle
Detected
↓
Reported
↓
Triaged
↓
Assigned
↓
Fixed
↓
Verified
↓
Closed
39.77 - Severity vs Priority
Severity:
Impact
Priority:
Urgency
39.78 - Root Cause Analysis
Symptom
↓
Cause
↓
Root Cause
↓
Corrective Action
↓
Prevention
39.79 - Quality Metrics
Contoh:
Defect Rate
Escaped Defects
Test Pass Rate
Flaky Test Rate
Build Failure Rate
Regression Rate
Mean Time to Detect
Mean Time to Resolve
MVP Testing Tool Direction
Untuk MVP implementation:
Unit / Integration → Vitest
E2E → Playwright
API → Vitest + fetch/testing utilities
Lint → ESLint
Type Check → TypeScript strict mode
Coverage → Vitest coverage
CI → GitHub Actions
Tooling dapat disesuaikan jika implementation constraints mengharuskannya, tetapi baseline yang dipilih adalah stack di atas.
39.80 - Testing Principles
Testing is part of the SDLC.
Testing focuses on correctness, reliability, security, and regression prevention.
Unit tests cover important isolated business logic.
Integration tests verify interactions between components.
E2E tests focus on critical user journeys.
Critical business rules receive stronger testing.
Negative and boundary cases are tested.
Authentication and authorization are explicitly tested.
Security-sensitive behavior receives dedicated testing.
External services use mocks, stubs, sandboxes, or test environments.
Production data is not used directly for automated testing.
Tests should be deterministic and isolated.
Flaky tests must be investigated and resolved.
Coverage is an indicator, not the sole measure of quality.
Important bugs should receive regression tests.
CI should automatically execute relevant tests.
Critical test failures can block releases.
Testing follows risk-based prioritization.
Release candidates undergo appropriate validation.
Quality is shared across development, QA, product, security, and operations.
39.81 - MVP vs Future
MVP 🔒
Unit testing
Integration testing
API testing
Critical E2E testing
Regression testing
Authentication testing
Authorization testing
Validation testing
CI automated tests
Smoke testing
Basic performance validation
Accessibility testing
Test environment
Bug regression tests
AC-01 sampai AC-12 traceability
Supabase RLS testing
Simulated payment testing
Simulated consent testing
Competition pre-submission validation
Future 🔜
Advanced load testing
Stress testing
Chaos/fault injection
Visual regression automation
Mutation testing
Advanced performance testing
Expanded E2E coverage
Advanced test analytics
39.82 - FINAL DECISION
Testing: Testing is integrated throughout the SDLC rather than performed only before release.
Strategy: The project uses a testing pyramid consisting primarily of unit tests, supported by integration and targeted E2E tests.
Risk: Testing effort is prioritized based on business and technical risk.
Security: Authentication, authorization, validation, and security-sensitive functionality receive dedicated testing. Supabase RLS testing is mandatory.
Regression: Important existing behavior is protected through regression tests.
CI: Automated tests are executed through GitHub Actions.
Quality Gate: Critical test failures may block merge or release.
External Services: External dependencies are tested using mocks, stubs, sandboxes, or test environments.
Data: Production personal data is not directly used for automated testing.
Reliability: Tests should be deterministic, isolated, and maintainable.
Coverage: Coverage is an indicator; business-critical logic receives higher coverage priority.
Defects: Significant bugs should result in regression tests and root-cause analysis.
Release: Release candidates undergo smoke, regression, E2E, and other risk-appropriate validation.
Competition: Pre-submission testing follows the latest official ITechnoCup schedule.
POINT 39 - LOCKED 🔒

POINT 40 - DEPLOYMENT STRATEGY & RELEASE MANAGEMENT
40.1 - Tujuan
Deployment strategy memastikan:
Code
↓
Build
↓
Test
↓
Release
↓
Deploy
↓
Validate
↓
Monitor
dengan risiko seminimal mungkin.
40.2 - Relationship with Point 29
Point 29 mendefinisikan:
CI/CD pipeline
Branch strategy
PR quality gate
Point 40 memperluasnya menjadi:
Release management framework
Point 29 tetap menjadi referensi untuk CI dan branch protection.
40.3 - Deployment Principles
Deployment harus:
Repeatable
Automated
Traceable
Reversible where practical
Secure
Validated
Deployment tidak boleh bergantung pada knowledge satu individu.
40.4 - Environment Strategy
MVP environment model:
Development
↓
CI Testing
↓
Preview / Staging Validation
↓
Production
Development
Local Next.js
Supabase local/dev project
.env.local
CI Testing
GitHub Actions
Unit Tests
Integration Tests
Build
Security Checks
Preview / Staging Validation
Vercel Preview Deployment
Optional Supabase test/staging project
Manual smoke test
Critical E2E
Production
Vercel Production
Supabase Production
Public URL
Dedicated persistent staging infrastructure bukan mandatory MVP.
40.5 - Environment Isolation
Environment harus memiliki:
Configuration
Database
Secrets
External Service Configuration
sesuai kebutuhan masing-masing environment.
40.6 - Branch Strategy
main
├── feature/*
├── fix/*
├── refactor/*
└── chore/*
main merupakan protected branch.
40.7 - Feature Branch & Pull Request
Developer:
Feature Branch
↓
Development
↓
Commit
↓
Push
↓
Pull Request
PR minimal menjelaskan:
What Changed?
Why?
How Tested?
Breaking Changes?
40.8 - PR Quality Gate
Minimum:
Lint ✅
Type Check ✅
Unit Tests ✅
Integration Tests ✅
Build ✅
Critical failure:
Merge Blocked
40.9 - CI Pipeline
Git Push / Pull Request
↓
Install Dependencies from Lockfile
↓
Lint
↓
Type Check
↓
Unit Tests
↓
Integration Tests
↓
Build
↓
Security Checks
40.10 - Preview Deployment
Setelah PR memenuhi CI requirements:
Vercel Preview Deployment
↓
Smoke Test
↓
Critical E2E
↓
Review
40.11 - Production Deployment
Production deployment dilakukan setelah:
CI Passed
Preview Validation
Review / Approval
Release Decision
Vercel Git integration digunakan sebagai deployment mechanism.
40.12 - Build & Artifact Strategy
Build harus:
Reproducible
Traceable
Identifiable
Preview dan production deployment harus dapat ditelusuri ke source commit/version yang relevan.
Jangan membangun source code yang berbeda secara manual untuk staging dan production.
40.13 - Artifact Traceability
Setiap deployment harus dapat dikaitkan dengan:
Commit SHA
+
Version
+
Deployment
40.14 - Release Versioning
Semantic versioning digunakan sebagai model versioning:
MAJOR.MINOR.PATCH
Untuk MVP competition, simplified milestone version dapat digunakan:
v0.1.0 → Initial Prototype
v0.2.0 → Core Flow
v0.3.0 → UI/UX Polish
v0.4.0 → Security + Reliability
v0.5.0 → Seed Data + Documentation
v0.9.0 → Release Candidate
v1.0.0 → Final Submission
Setelah competition, project dapat mengikuti standard semantic versioning secara lebih formal.
40.15 - Version Types
MAJOR:
Breaking changes
MINOR:
Backward-compatible functionality
PATCH:
Bug fix / security fix / small correction
40.16 - Release Candidate
Development
↓
Release Candidate
↓
Preview / Staging
↓
Validation
↓
Production Decision
40.17 - Release Checklist
[ ] Tests passing
[ ] Build successful
[ ] Security checks complete
[ ] Database migration reviewed
[ ] Documentation updated
[ ] Configuration verified
[ ] Rollback plan ready
[ ] Monitoring ready
40.18 - Approval
High-risk change:
Developer
↓
Review
↓
Validation
↓
Release Approval
↓
Production
Approval requirements remain proportional to risk.
40.19 - Continuous Integration
CI melakukan:
Lint
Type Check
Unit Tests
Integration Tests
Build
Security Checks where configured
40.20 - Continuous Delivery
System harus berada dalam kondisi yang dapat dipromosikan ke release.
Production release tetap dapat memerlukan approval.
40.21 - Continuous Deployment
Continuous deployment tidak wajib untuk MVP.
Baseline:
Controlled Continuous Delivery
dengan Vercel Git-based deployment.
40.22 - Deployment Automation
Deployment harus menggunakan automation yang tersedia.
Hindari manual production deployment dari developer machine jika automation sudah tersedia.
40.23 - Infrastructure as Code
IaC merupakan future capability jika infrastructure complexity membutuhkan.
Tidak diperlukan untuk MVP sederhana.
40.24 - Database Migration Deployment
Migration adalah bagian dari release planning.
Workflow:
Migration Created
↓
Feature Branch
↓
Local / Dev Testing
↓
Pull Request
↓
CI
↓
Merge
↓
Production Migration
↓
Application Validation
Migration disimpan dalam:
/supabase/migrations
Migration Principles
Gunakan:
Expand & Contract
Jangan langsung menjalankan destructive migration jika application version lama masih bergantung pada schema tersebut.
40.25 - Migration Ordering
Untuk perubahan schema yang kompleks:
Expand Schema
↓
Deploy Compatible Code
↓
Migrate / Backfill Data
↓
Verify
↓
Cleanup / Contract
Contoh:
Jangan langsung:
DROP COLUMN
↓
Deploy New App
jika old application masih memakai column tersebut.
40.26 - Migration Failure
Jika migration production gagal:
Stop
↓
Investigate
↓
Fix / Recovery
↓
Validate
Jangan melanjutkan release application yang bergantung pada migration yang belum berhasil.
40.27 - Migration Backup
Production schema changes yang berisiko harus didahului backup/recovery preparation sesuai risk.
40.28 - Database Rollback Principle
Tidak semua migration aman untuk:
UP
↓
DOWN
Karena itu:
Prefer forward-compatible recovery.
Data destructive change membutuhkan recovery plan yang jelas.
40.29 - Vercel Deployment Strategy
Flex Network menggunakan:
Vercel Git-based deployment
MVP flow:
Git Push
↓
Vercel Preview
↓
Validation
↓
Merge to main
↓
Vercel Production
↓
Health Check
↓
Smoke Test
Vercel platform capabilities seperti previous deployment rollback digunakan sesuai feature availability dan current project plan.
40.30 - Rollback Strategy
Application rollback:
Promote / restore previous stable deployment through the platform capability available.
Alternative:
Git Revert
↓
CI
↓
Deploy
Database rollback harus dievaluasi separately.
40.31 - Feature Flags
Feature flags dapat digunakan untuk controlled rollout.
Contoh:
New Matching
New UI
Experimental Feature
40.32 - Feature Flag Security
Client-side flags hanya boleh digunakan untuk:
Presentation
Non-sensitive functionality
Security-sensitive controls seperti:
Authorization
Payment
Consent
Admin Privilege
Security
harus dievaluasi server-side.
40.33 - MVP Feature Flag Strategy
MVP tidak membutuhkan feature flag SaaS seperti LaunchDarkly.
Simple configuration dapat digunakan jika diperlukan.
Contoh:
config/features.ts
Flags harus:
Documented
Owned
Removable
40.34 - Rollout Strategy
Future / growth:
Internal
↓
Small User Group
↓
Larger Group
↓
Everyone
Untuk MVP, controlled release is sufficient.
40.35 - Release Validation
Deploy
↓
Health Check
↓
Smoke Test
↓
Critical Flow Validation
↓
Monitor
40.36 - Monitoring During Release
Monitor:
Error Rate
Latency
Traffic
Database Health
Critical Business Metrics
40.37 - Deployment Window
High-risk change dapat dijadwalkan pada release window yang sesuai.
40.38 - Emergency Release
Emergency process:
Issue
↓
Assess
↓
Fix
↓
Focused Test
↓
Emergency Deploy
↓
Monitor
Testing tidak boleh dilewati sepenuhnya hanya karena emergency.
40.39 - Hotfix
Production Issue
↓
Hotfix Branch
↓
Fix
↓
Focused Test
↓
Deploy
↓
Merge Back
40.40 - Release Notes
Release notes dapat mencakup:
Added
Changed
Fixed
Security
Breaking Changes
40.41 - Changelog
Changelog mencatat perubahan antar release.
40.42 - Deployment Audit Trail
Setiap production deployment harus dapat diketahui:
Who
What
When
Version
Environment
Result
40.43 - Deployment Logs
Deployment records harus mempertahankan:
Build Result
Test Result
Deployment Result
Failure Reason jika ada
40.44 - Access Control
Production deployment permission harus dibatasi kepada authorized contributors.
40.45 - Separation of Duties
Untuk perubahan berisiko tinggi:
Code Author
tidak idealnya menjadi satu-satunya approval authority.
Minimal code review tetap diberlakukan.
40.46 - Deployment Credentials
Credentials harus:
Scoped
Protected
Rotatable
Auditable
Jika platform mendukung short-lived credentials, gunakan sesuai kebutuhan.
40.47 - Secrets During Deployment
Secrets tidak boleh muncul di:
Source Code
Git History
Build Logs
Error Logs
Public Artifacts
40.48 - Dependency Update
Update Dependency
↓
Test
↓
Security Check
↓
Release
40.49 - Dependency Locking
Gunakan lockfile untuk reproducible dependency installation.
40.50 - Container Image
Container-based deployment adalah future option dan tidak diperlukan untuk MVP Vercel deployment.
40.51 - Artifact Registry
Dedicated artifact registry merupakan future capability.
40.52 - Release Traceability
Production harus dapat menjawab:
Production sekarang menjalankan commit yang mana?
Minimum:
Production
↓
Deployment
↓
Commit SHA
40.53 - Deployment Failure
Detect
↓
Stop
↓
Assess
↓
Rollback / Fix
↓
Validate
40.54 - Partial Deployment
Sebagai Modular Monolith:
Application deployment unit terpusat pada satu application artifact.
Module boundary tetap dijaga di codebase.
40.55 - Modular Monolith Deployment
Modules
↓
One Application Artifact
↓
One Deployment Pipeline
40.56 - Release Independence
Module development dapat berlangsung terisolasi, tetapi deployment production tetap merupakan deployment application secara keseluruhan.
40.57 - Release Coordination
Jika satu perubahan memengaruhi beberapa module:
seluruh affected scope harus diuji sebagai satu release.
40.58 - Deployment Documentation
Dokumentasi deployment minimal mencakup:
Prerequisites
Pipeline
Environment
Configuration
Migration
Validation
Rollback
Troubleshooting
40.59 - Release Checklist
[ ] Requirements verified
[ ] Tests passed
[ ] Security checks passed
[ ] Artifact/release identifiable
[ ] Database migration verified
[ ] Configuration verified
[ ] Release notes prepared
[ ] Rollback plan prepared
[ ] Monitoring ready
[ ] Deployment approved
[ ] Post-deployment validation completed
40.60 - Deployment Metrics
Dapat dipantau:
Deployment Frequency
Lead Time for Changes
Change Failure Rate
Mean Time to Recovery
Deployment Duration
Rollback Rate
40.61 - DORA Metrics
DORA-style metrics dapat digunakan sebagai engineering indicators.
Metrics tidak boleh dijadikan target yang mendorong risky deployment.
40.62 - Release Governance
Low Risk:
Lightweight Process
High Risk:
Stronger Review
Governance harus proportional terhadap risk.
40.63 - Production Change Management
Production changes harus:
Tracked
Reviewed
Authorized
Validated
Auditable
40.64 - Release Freeze
Release freeze dapat diterapkan saat:
Major Incident
Critical Business Event
Infrastructure Instability
40.65 - Post-Release Review
Release
↓
Observe
↓
Review
↓
Lessons Learned
40.66 - Deployment & Incident Integration
Jika deployment menyebabkan incident:
Deployment
↓
Incident
↓
Incident Response
↓
Root Cause Analysis
↓
Corrective Action
Terhubung dengan Point 31 dan Point 32.
40.67 - Release Documentation
Setiap release dapat didokumentasikan dengan:
Version
Changes
Artifact
Tests
Deployment
Approval
Result
40.68 - Competition Deployment Checklist
Competition dates harus mengikuti latest official ITechnoCup schedule.
Pre-Submission
[ ] Core flow verified
[ ] Seed/demo data verified
[ ] README complete
[ ] GitHub repository clean
[ ] Production URL accessible
[ ] Supabase production ready
[ ] Health check returns 200
[ ] OpenGraph verified
[ ] Lighthouse audit complete
Final Demo Preparation
[ ] Final regression test
[ ] Responsive testing
[ ] Cross-browser testing
[ ] Error handling verified
[ ] Loading states verified
[ ] Empty states verified
[ ] Production URL tested
[ ] Database backup available
[ ] Pre-recorded demo ready
[ ] Screenshot/PDF backup ready
[ ] Internet backup tested
[ ] Presentation files verified
40.69 - Deployment Principles
Deployment is part of the SDLC.
Deployments should be repeatable and traceable.
Environment separation is maintained according to MVP architecture.
Configuration is separated from source code.
Secrets are never hardcoded or exposed.
Build artifacts should be reproducible and identifiable.
CI/CD automation is preferred.
Preview/staging is used for appropriate release validation.
Production changes are controlled and auditable.
Critical releases require rollback planning.
Deployment validation includes health checks and smoke tests.
Production monitoring validates release health.
Feature flags may be used for controlled non-sensitive rollout.
Database migrations are part of release planning.
Production data integrity must be protected during deployment.
Emergency releases may use accelerated workflows but still require appropriate validation.
Deployment permissions follow least privilege.
Release artifacts are traceable to source code.
Release governance is proportional to risk.
Post-release issues feed back into testing, documentation, and engineering improvement.
40.70 - MVP vs Future
MVP 🔒
Git feature branches
Protected main
Pull Requests
Code review
GitHub Actions CI
Vercel Preview Deployment
Vercel Production Deployment
Environment configuration
Secrets management
Git commit traceability
Release notes
Health checks
Smoke testing
Rollback procedure
Supabase migration workflow
Competition deployment checklist
Future 🔜
Blue-Green deployment
Canary deployment
Advanced feature flags
Infrastructure as Code
Advanced automated rollback
Multi-region deployment
Advanced progressive delivery
Dedicated artifact registry
40.71 - FINAL DECISION
Deployment: Flex Network uses a controlled, repeatable, and traceable deployment process integrated with CI/CD.
Platform: Vercel Git-based deployment is used as the primary application deployment mechanism.
Environment: Development, CI Testing, Preview/Staging Validation, Production.
Build: Application builds are reproducible and traceable to the corresponding Git commit/version.
Release: Releases undergo automated testing and appropriate preview validation before production.
Automation: Vercel Git integration and GitHub Actions reduce manual deployment work.
Security: Deployment credentials and production access follow least-privilege principles.
Database: Supabase migrations are version-controlled and deployed using a controlled migration workflow.
Migration: Expand & Contract is preferred for schema changes that require compatibility across application versions.
Feature Flags: Client-side flags may control presentation/non-sensitive features; security-sensitive controls remain server-side.
Rollback: Application rollback uses the available Vercel previous-deployment capability or Git revert. Database recovery is evaluated separately.
Monitoring: Health checks, smoke tests, and post-deployment monitoring validate release stability.
Architecture: As a Modular Monolith, the system is deployed as one application artifact while preserving internal module boundaries.
Traceability: Production releases are traceable to deployment, version, and Git commit.
Competition: Final deployment validation follows the latest official ITechnoCup schedule.

POINT 41 - OBSERVABILITY, MONITORING & INCIDENT RESPONSE
41.1 - Tujuan
Observability digunakan untuk memahami kondisi internal system melalui:
Logs
Metrics
Traces
Events
Health Checks
Tujuan utamanya:
Detect
  ↓
Understand
  ↓
Respond
  ↓
Recover
  ↓
Learn

Relationship with Point 26 and Point 31
Point 26 mendefinisikan observability dan monitoring strategy.
Point 31 mendefinisikan maintenance, support, dan incident management.
Point 41 mengonsolidasikan keduanya menjadi unified observability, monitoring, dan incident-response framework.
Jika terdapat konflik antara Point 26/31 dan Point 41, maka Point 41 berlaku.
Point 26 tetap menjadi referensi untuk business metrics dan funnel monitoring.
Point 31 tetap menjadi referensi untuk maintenance categories serta backup/recovery procedure.

41.2 - Observability Principles
Observability mengikuti prinsip:
Actionable, Reliable, Secure, Correlated, Cost-aware
Observability tidak bertujuan mengumpulkan log sebanyak mungkin.
Tujuannya adalah menghasilkan informasi yang cukup untuk:
Detect issue
    ↓
Understand issue
    ↓
Investigate
    ↓
Take action


41.3 - Three Pillars
            OBSERVABILITY
             /      |      \
          LOGS    METRICS   TRACES
             \      |      /
              SUPPORTING DATA
          Events / Health / Alerts

Vercel & Supabase Monitoring Reality
Vercel digunakan sebagai hosting dan menyediakan deployment/runtime visibility yang relevan untuk aplikasi.
Supabase digunakan sebagai database dan authentication platform serta menyediakan dashboard/logging yang relevan untuk:
Database health
Query statistics
Connections
Storage
Authentication
API activity
Untuk MVP kita tidak perlu membangun observability infrastructure sendiri.
Tidak termasuk MVP
Distributed tracing platform
Circuit breaker infrastructure
Synthetic monitoring platform
Dedicated observability cluster
Grafana stack
Datadog/Splunk infrastructure

Request ID dan correlation ID sudah cukup untuk tracing sederhana pada Modular Monolith.

41.4 - Logging
Application harus menghasilkan structured logs untuk event penting.
Contoh:
User registered
User logged in
Application submitted
Application selected
Application rejected
Meeting scheduled
Meeting completed
Contract created
Contract activated
Payment simulated
Payment released
Work completed
Rating submitted
Authorization denied
Database error
Admin action


41.5 - Structured Logging
Log harus memiliki struktur yang konsisten.
Minimum field yang relevan:
timestamp
level
event
module
requestId
correlationId
actorId
resourceId
errorCode

actorId hanya dicatat jika memang diperlukan.
Contoh:
{
  "level": "INFO",
  "event": "application.submitted",
  "module": "application",
  "requestId": "req_123",
  "applicationId": "app_123",
  "opportunityId": "opp_456",
  "timestamp": "..."
}

Rules:
Do not log passwords.
Do not log access tokens.
Do not log refresh tokens.
Do not log service credentials.
Do not log private messages.
Do not log unnecessary minor data.
Do not log sensitive consent contents.

Production default:
INFO
WARN
ERROR

DEBUG digunakan untuk development/troubleshooting sesuai kebutuhan.

41.6 - Log Levels
Minimal:
DEBUG
INFO
WARN
ERROR

Penggunaan harus konsisten antar module.

41.7 - DEBUG
Digunakan untuk detail development dan troubleshooting.
Contoh:
DEBUG: matching calculation started

DEBUG tidak menjadi default production logging.

41.8 - INFO
Digunakan untuk operationally meaningful events.
Contoh:
INFO: application submitted
INFO: meeting scheduled
INFO: contract created


41.9 - WARN
Digunakan ketika ada kondisi abnormal tetapi sistem masih dapat berjalan.
Contoh:
WARN: notification delivery delayed
WARN: retry triggered


41.10 - ERROR
Digunakan ketika terjadi failure yang membutuhkan investigation.
Contoh:
ERROR: contract activation failed
ERROR: database operation failed


41.11 - Sensitive Data in Logs
Sensitive information tidak boleh dimasukkan ke operational logs.
Tidak boleh:
Password
Access Token
Refresh Token
API Key
Private Key
Payment Secret
Service Role Key
Private Message
Guardian Contact Detail
Sensitive Consent Detail
Unnecessary Minor Data


41.12 - Log Redaction
Jika sensitive value berpotensi masuk ke logging pipeline, value harus diminimalkan atau di-redact.
Contoh:
secret=********
token=REDACTED

Redaction dilakukan sebelum log disimpan atau diproses lebih lanjut bila memungkinkan.

41.13 - Log Retention
Log retention mempertimbangkan:
Operational Need
Security Need
Privacy Requirement
Storage Cost

Tidak semua log harus disimpan selamanya.

41.14 - Metrics
Metrics digunakan untuk mengukur kondisi system secara numerik.
Contoh:
Request rate
Error rate
Latency
Database latency
Database connections
Storage usage
Authentication failures
429 rate
Payment failures


41.15 - Business Metrics
Observability juga melihat product health.
Contoh:
Applications submitted
Applications selected
Meetings completed
Contracts active
Contracts completed
Payments released
Ratings submitted
Verified Work Histories

Business metrics harus tetap menggunakan data minimum yang diperlukan.

41.16 - RED Metrics
Untuk request-driven application:
Rate
Errors
Duration

digunakan untuk memahami traffic dan reliability API.

41.17 - USE Metrics
Untuk infrastructure/resource monitoring:
Utilization
Saturation
Errors

digunakan bila metric infrastructure tersebut tersedia.

41.18 - Latency
Latency dipantau menggunakan distribution:
p50
p95
p99

Contoh:
p50 = 120ms
p95 = 450ms
p99 = 1.2s


41.19 - Error Rate
Error rate:
Failed Requests
---------------- × 100
Total Requests

Contoh:
1000 requests
20 errors

Error Rate = 2%

Trend juga dipantau:
1%
 ↓
2%
 ↓
8%


41.20 - Availability
Availability mengukur apakah system dapat digunakan.
Untuk MVP:
Internal availability target ≥ 99%
Target ini merupakan engineering target, bukan contractual SLA.

41.21 - Health Checks
System memiliki health endpoint:
GET /api/health

Health check harus tetap ringan dan aman.
Untuk MVP, health endpoint dapat berfungsi sebagai basic application health check.
Jika dependency check dibutuhkan, dapat dibedakan menjadi:
GET /api/health/live
GET /api/health/ready

Health endpoint tidak boleh mengembalikan:
Database credentials
Environment secrets
Service role key
Stack traces
Private data


41.22 - Liveness
Liveness menjawab:
Apakah application process masih hidup?
Liveness tidak perlu memeriksa seluruh dependency.

41.23 - Readiness
Readiness menjawab:
Apakah application siap menerima traffic?
Readiness dapat memeriksa dependency yang memang critical bagi request handling.

41.24 - Dependency Health
Dependency check harus dilakukan secara proporsional.
Database failure dapat membuat readiness failed, tetapi tidak seharusnya membuat liveness failed.
Tujuannya menghindari false failure.

41.25 - Distributed Tracing
Untuk Modular Monolith MVP, distributed tracing tidak menjadi requirement.
Tracing sederhana menggunakan:
requestId
correlationId
jobId

sudah cukup untuk mayoritas troubleshooting.
Distributed tracing dapat diperkenalkan jika system complexity meningkat.

41.26 - Correlation ID
Workflow penting dapat menggunakan:
requestId
correlationId
jobId

Contoh:
Application
 ↓
Notification
 ↓
Audit

Semua operation dapat dihubungkan melalui correlation context.

41.27 - Error Tracking
Application error harus dapat dikumpulkan secara terpusat bila diperlukan.
Minimum context:
Error Type
Message
Stack Trace
Version/Commit
Environment
Request ID
Timestamp

Error tracking tool bersifat optional pada MVP.
Jika tidak menggunakan dedicated service, Vercel runtime/deployment logs tetap menjadi baseline.

41.28 - Alerting
Alert hanya dibuat untuk kondisi yang membutuhkan action.
Metric
 ↓
Threshold / Rule
 ↓
Alert
 ↓
Human / Action

Tidak semua warning harus menjadi alert.

41.29 - Alert Fatigue
Alert yang berlebihan akan menurunkan kualitas monitoring.
Prinsip:
Alert only when action is required.

41.30 - Alert Severity
Gunakan:
P0 → Critical
P1 → High
P2 → Medium
P3 → Low


41.31 - Critical Alert
P0 digunakan untuk:
Production unavailable
Critical data integrity issue
Major security incident


41.32 - Warning Alert
P1/P2 dapat digunakan untuk:
Latency increasing
Error rate increasing
Storage approaching limit
Authentication failure spike


41.33 - Alert Routing
Alert harus diarahkan kepada anggota tim yang bertanggung jawab terhadap area tersebut.
Untuk tim 3 orang, routing dapat dilakukan melalui:
Team WhatsApp/Telegram
GitHub Issue
Direct team escalation


41.34 - Alert Deduplication
Satu root cause tidak boleh menghasilkan ratusan alert yang sama.
Alert harus dikelompokkan atau ditangani dengan mekanisme deduplication bila tooling mendukung.

41.35 - Incident Definition
Incident adalah kondisi yang menyebabkan atau berpotensi menyebabkan significant degradation terhadap:
System
Security
Users
Data
Business Operations


41.36 - Incident Lifecycle
Detect
 ↓
Triage
 ↓
Contain
 ↓
Mitigate
 ↓
Recover
 ↓
Verify
 ↓
Learn


41.37 - Incident Detection
Incident dapat diketahui melalui:
Monitoring
Alerts
Logs
Users
Support
Security Detection
Team Observation


41.38 - Incident Triage
Pertanyaan utama:
What happened?
Who is affected?
How severe?
When did it start?
Is it ongoing?
What changed recently?


41.39 - Incident Severity
P0
Major outage
Critical security incident
Severe data integrity issue

P1
Major feature unavailable
Large user impact

P2
Limited functionality degradation

P3
Minor issue


41.40 - Incident Commander
Untuk incident besar, satu anggota menjadi Incident Commander.
Tanggung jawab:
Coordinate
Prioritize
Communicate
Delegate

Simplified Incident Response - 3-Person Team
Karena tim terdiri dari 3 orang:
Incident Commander / Technical Lead
Diagnosis
Mitigation
Recovery
Technical Decisions

Communication Lead
Internal Updates
Stakeholder Communication
Competition/Panitia Communication

Supporting Member
Testing
Evidence Collection
Secondary Debugging

Jika diperlukan, anggota dapat bertukar role sesuai area incident.
Incident channel:
Team WhatsApp / Telegram
GitHub Issue jika perlu

Tidak diperlukan struktur L1/L2/L3 formal untuk MVP.

41.41 - Technical Lead
Technical Lead fokus pada:
Diagnosis
Mitigation
Recovery
Technical Decisions


41.42 - Communication Lead
Communication Lead menangani:
Internal Updates
Stakeholder Updates
User Communication
Competition Communication


41.43 - Incident Channel
Incident besar dapat menggunakan communication channel khusus.
Minimum evidence:
Timeline
Decisions
Actions
Screenshots/logs
Recovery status


41.44 - Incident Timeline
Incident timeline mencatat:
Detection Time
Response Time
Actions
Changes
Recovery
Resolution


41.45 - Containment
Tujuan containment:
Menghentikan impact agar tidak semakin besar.
Contoh:
Rollback
Disable feature
Rate limiting
Block malicious activity
Restrict access


41.46 - Mitigation
Mitigation mengurangi impact sementara.
Contoh:
Fallback
Degraded Mode
Disable Non-critical Feature
Temporary Configuration Change


41.47 - Recovery
Setelah impact terkendali:
Restore Service
 ↓
Validate Data
 ↓
Validate Functionality
 ↓
Monitor


41.48 - Incident Closure
Incident dapat ditutup apabila:
Service Stable
Impact Resolved
Monitoring Normal
Required Follow-up Created


41.49 - Post-Incident Review
Significant incident menghasilkan:
Incident
 ↓
Review
 ↓
Root Cause
 ↓
Corrective Action


41.50 - Blameless Incident Culture
Postmortem fokus pada:
System
Process
Controls
Detection
Response

Bukan menyalahkan individu.

41.51 - Root Cause Analysis
Teknik yang dapat digunakan:
5 Whys
Timeline Analysis
Dependency Analysis


41.52 - Corrective Actions
Corrective action harus:
Specific
Owned
Prioritized
Trackable

Contoh:
Add regression test
Improve timeout
Improve alert
Update runbook
Update documentation


41.53 - Runbooks
Common operational issues harus memiliki runbook.
Contoh:
Database unavailable
High error rate
External service outage
Deployment failure
Credential leak


41.54 - Runbook Structure
Runbook minimal berisi:
Problem
Symptoms
Checks
Actions
Escalation
Recovery
Validation


41.55 - Escalation
Untuk tim kecil:
Assigned Engineer
 ↓
Pair Debugging
 ↓
Technical Lead
 ↓
External Provider

Escalation dilakukan sesuai severity, bukan berdasarkan bureaucracy.

41.56 - External Dependency Incident
Detect
 ↓
Confirm
 ↓
Fallback / Degrade
 ↓
Monitor Provider
 ↓
Restore
 ↓
Verify

Untuk future payment provider:
Payment remains PENDING

sampai confirmation tersedia.

41.57 - Graceful Degradation
Non-critical functionality dapat dinonaktifkan sementara.
Contoh:
Recommendation unavailable
        ↓
Browse Opportunities
        ↓
Core Application still works


41.58 - Retry Strategy
Retry harus memiliki:
Bound
Backoff
Timeout

Exponential backoff dapat digunakan untuk transient failure.
Retry forever dilarang.

41.59 - Circuit Breaker
Circuit breaker:
Normal
 ↓
Failure
 ↓
Open Circuit
 ↓
Temporary Block
 ↓
Recovery Check
 ↓
Closed

Circuit breaker bukan requirement MVP karena external dependency complexity masih rendah.

41.60 - Timeout
External request harus mempunyai reasonable timeout.
Tidak boleh:
request waits forever


41.61 - Observability Security
Observability data sendiri harus dilindungi karena dapat mengandung:
User IDs
Request Information
System Information
Error Details


41.62 - Access Control for Observability
Tidak semua user dapat melihat:
Production Logs
Security Logs
Infrastructure Metrics
Incident Data

Akses hanya diberikan kepada anggota tim yang membutuhkan.

41.63 - Audit Logging
Security-sensitive actions dapat menghasilkan audit records.
Contoh:
Admin changed role
Account suspended
Contract modified
Sensitive data accessed
Moderation action performed


41.64 - Audit Log Integrity
Audit log harus memiliki protection terhadap unauthorized modification/deletion.
Audit log bukan pengganti operational logs.

41.65 - Monitoring Retention
Monitoring data retention mempertimbangkan:
Troubleshooting
Security
Privacy
Compliance
Cost


41.66 - Synthetic Monitoring
Synthetic monitoring dapat menjadi future capability:
Synthetic User
 ↓
Login
 ↓
Critical Endpoint
 ↓
Validate

Untuk MVP:
Manual smoke test sudah cukup.

41.67 - SLO
SLO dapat digunakan untuk menetapkan reliability target.
Untuk MVP:
Availability ≥ 99%
p95 API latency < 1s
Error rate < 2%
Normal response ≤ 3s

Target tersebut merupakan internal engineering targets.

41.68 - Error Budget
Error budget merupakan konsep future.
Jika SLO digunakan secara lebih formal:
SLO
 ↓
Allowed Failure
 ↓
Error Budget
 ↓
Reliability vs Feature Delivery

Tidak wajib untuk MVP.

41.69 - Observability Dashboard
Dashboard monitoring dapat mencakup:
Traffic
Errors
Latency
Database
Infrastructure
Business Health


41.70 - Operational Dashboard
Minimum operational information:
Requests/min
Error rate
p95 latency
Active users
Database health
External dependency health

Untuk MVP, Vercel Dashboard dan Supabase Dashboard sudah cukup.

41.71 - Business Incident Monitoring
Incident tidak selalu technical.
Contoh:
Application submissions drop 90%

System masih technically UP, tetapi product mengalami anomaly yang perlu diperiksa.

41.72 - User Impact Monitoring
Pertimbangkan:
Affected Users
Affected Features
Duration
Business Impact
Geographic Impact jika relevan


41.73 - Incident Communication
Jika incident berdampak signifikan:
Internal Communication
        +
Stakeholder Communication
        +
User Communication


41.74 - Status Communication
Status dapat menggunakan:
Operational
Degraded
Partial Outage
Major Outage
Resolved


41.75 - Recovery Verification
Setelah recovery:
Technical Health
        +
User Flow
        +
Business Metrics
        ↓
Recovery Confirmed

ITechnoCup Demo Day Monitoring Checklist
H-1 sebelum final:
[ ] Production URL accessible dari network berbeda
[ ] GET /api/health returns expected healthy response
[ ] Core flow smoke test
[ ] Seed data verified
[ ] Vercel deployment status checked
[ ] Supabase project checked
[ ] Browser console contains no critical errors
[ ] Lighthouse audit verified
[ ] Offline demo kit ready
[ ] Presentation file ready

During Live Demo
[ ] Screen sharing tested
[ ] Internet connection stable
[ ] Backup video ready
[ ] Screenshot/PDF deck ready
[ ] Panitia contact information available

Jika production down:
1. Do not attempt risky live fixes.
2. Switch to backup demo.
3. Communicate to panitia if required.
4. Investigate after presentation.
5. Document incident.


41.76 - Observability Principles
Observability is part of production readiness.
Logs, metrics, and traces are used according to system needs.
Monitoring focuses on actionable information.
Structured logging is preferred for important events.
Secrets must never be exposed through observability systems.
Sensitive data is minimized and protected.
Critical application health is monitored.
Alerts are severity-based and actionable.
Alert fatigue is actively reduced.
Important requests are traceable through correlation identifiers.
Incident response follows a defined lifecycle.
Significant incidents receive post-incident review.
Incident reviews are blameless.
Common operational problems are documented.
Incidents feed improvements into testing and architecture.
External dependency failures use appropriate timeout/retry/fallback strategies.
Observability data follows appropriate retention and access control.
Business-critical indicators may be monitored alongside technical metrics.
Reliability targets are proportional to system maturity.
Observability enables faster detection, diagnosis, response, and recovery.

41.77 - MVP vs Future
MVP 🔒
Structured application logging
Vercel deployment/runtime logs
Supabase monitoring
Health endpoint
Request/correlation ID
Basic metrics
Manual monitoring
Basic error tracking through logs
Incident severity P0-P3
Simplified incident response
Basic runbooks
Blameless post-incident review
Demo Day monitoring checklist

Future 🔜
Distributed tracing
Advanced SLO/SLI
Error budgets
Synthetic monitoring
Advanced anomaly detection
Automated remediation
Advanced observability correlation
Dedicated observability platform


41.78 - FINAL DECISION
Observability: Flex Network uses logs, metrics, health checks, events, and traces where justified.
Logging: Application logs use structured information while avoiding secrets and unnecessary sensitive data.
Monitoring: Critical technical and business health indicators are monitored through Vercel and Supabase facilities.
Tracing: Request and correlation IDs provide sufficient tracing for the Modular Monolith MVP. Distributed tracing is future development.
Health: /api/health is the baseline health endpoint. Liveness/readiness separation may be introduced when operational complexity requires it.
Alerting: Alerts are actionable and severity-based. Manual monitoring is sufficient for the MVP competition environment.
Incident Response: Incidents follow Detect → Triage → Contain → Mitigate → Recover → Verify → Learn.
Team: Incident response is simplified for a 3-person team with clear technical and communication responsibilities.
Security: Observability data follows least privilege, privacy, retention, and sensitive-data protection principles.
Recovery: Significant incidents require post-incident review and corrective actions.
Operations: Common operational issues are documented through runbooks.
Improvement: Incident findings feed back into testing, architecture, documentation, and deployment practices.

POINT 42 - PERFORMANCE, SCALABILITY & CAPACITY PLANNING
42.1 - Tujuan
Performance strategy bertujuan memastikan:
User Request
     ↓
Application
     ↓
Response

tetap:
Fast
Stable
Predictable
Efficient

ketika workload meningkat.
Relationship with Point 27 and Point 38
Point 27 mendefinisikan performance & scalability strategy high-level.
Point 38 mendefinisikan Web Vitals, SEO, dan public performance.
Point 42 mengembangkan keduanya menjadi full performance engineering framework.
Jika terdapat konflik antara Point 27/38 dan Point 42, Point 42 berlaku untuk performance/scalability detail.
Point 27 tetap menjadi referensi untuk scaling path dan optimization priority.
Point 38 tetap menjadi referensi untuk Web Vitals dan public-page performance.

42.2 - Performance Principles
Performance mengikuti:
Measurable, User-focused, Data-driven, Cost-aware, Sustainable
Optimasi harus berdasarkan measurement.

42.3 - Performance Goals
Critical user journeys:
Login
Search Opportunity
View Opportunity
Submit Application
Create Contract

SRS Target
Normal operation response time ≤ 3 seconds

Internal Engineering Target
p50 < 300ms
p95 < 1s
p99 < 2s

Web Vitals Target
LCP < 2.5s
INP < 200ms
CLS < 0.1

Lighthouse Target
Landing Page
Performance ≥ 90

Dashboard
Performance ≥ 80

Internal target dibuat lebih ketat daripada SRS untuk memberikan engineering buffer.

42.4 - User-Perceived Performance
Performance bukan hanya server latency.
Request
 ↓
Server Processing
 ↓
Network
 ↓
Frontend Rendering
 ↓
User Perception

Semua layer perlu dipertimbangkan.

42.5 - Latency Budget
Total latency dipengaruhi oleh:
Network
Application
Database
External Services
Rendering

Optimization dilakukan berdasarkan bottleneck yang terukur.

42.6 - Performance Baseline
Proses:
Measure
 ↓
Baseline
 ↓
Change
 ↓
Measure Again

Jangan mengklaim improvement tanpa measurement.

42.7 - Performance Metrics
Minimum metrics:
Response Time
Latency
Throughput
Error Rate
Resource Utilization


42.8 - Percentile Latency
Gunakan:
p50
p95
p99

karena average saja tidak menggambarkan tail latency.

42.9 - Throughput
Throughput mengukur jumlah workload yang dapat diproses.
Contoh:
Requests/second
Jobs/minute
Events/second


42.10 - Resource Utilization
Monitor resource yang tersedia:
CPU
Memory
Network
Database
Database Connections
Storage

Tidak semua resource harus dimonitor secara custom apabila platform sudah menyediakan metric.

42.11 - Performance Budget
Critical feature dapat memiliki budget untuk:
Page Load
API Latency
Payload Size
Database Query Time
Image Size


42.12 - Frontend Performance
Frontend harus menghindari:
Huge Bundle
Huge Images
Unnecessary Requests
Blocking Operations
Excessive Rendering
Unnecessary Client Components


42.13 - Asset Optimization
Gunakan:
Compressed Images
Modern Image Formats
Lazy Loading
Caching
Code Splitting

Next.js image optimization digunakan bila relevan.

42.14 - API Performance
API harus:
Efficient
Predictable
Bounded
Observable

API tidak boleh mengembalikan dataset tidak terbatas.

42.15 - Pagination
Collection besar menggunakan pagination.
Contoh:
GET /api/opportunities?page=1&limit=20

Default:
20

Maximum:
100


42.16 - Cursor Pagination
Cursor pagination dapat digunakan untuk dataset besar atau collection yang sering berubah.
Contoh:
GET /api/opportunities?cursor=abc123

Untuk MVP:
Offset pagination masih acceptable untuk dataset kecil.

42.17 - Filtering
Filtering dilakukan sedekat mungkin dengan data source.
Buruk:
Database
 ↓
100,000 rows
 ↓
Application
 ↓
Filter

Lebih baik:
Request
 ↓
Database Filter
 ↓
Required Results


42.18 - Sorting
Sorting dataset besar sebaiknya dilakukan oleh database menggunakan field dan index yang sesuai.

42.19 - Database Performance
Database menjadi salah satu potential bottleneck utama.
Monitor:
Query Latency
Connections
Locks
CPU/Resource Usage
Storage
Slow Queries


42.20 - Database Indexing
Index digunakan untuk query pattern yang benar-benar membutuhkan:
Filtering
Joining
Sorting
Uniqueness

Index didasarkan pada actual workload.

42.21 - Over-Indexing
Terlalu banyak index meningkatkan:
Storage
Write Cost
Maintenance Cost

Index bukan berarti semakin banyak semakin bagus.

42.22 - Query Optimization
Query harus menghindari:
SELECT * yang tidak diperlukan
N+1 Queries
Large Unbounded Results
Repeated Expensive Queries


42.23 - N+1 Problem
Contoh:
100 opportunities
 ↓
100 profile queries
 ↓
101 total queries

Solusi:
JOIN
Batch Query
Relational Select
Data Fetch Optimization


42.24 - Connection Pooling
Database connections harus dikelola melalui mekanisme pooling yang sesuai.
Untuk Vercel + Supabase, penggunaan connection pooling harus mengikuti mekanisme yang direkomendasikan oleh Supabase untuk workload serverless.

42.25 - Connection Limits
Connection pool harus membatasi jumlah connections agar database tidak overload.

42.26 - Caching
Caching dipertimbangkan ketika data:
Frequently Read
Expensive to Compute
Relatively Stable

MVP Caching Strategy
MVP tidak menggunakan external caching service seperti Redis.
Vercel/CDN
Static assets dapat memanfaatkan caching platform.
Next.js Built-in Caching
Dapat digunakan untuk:
Static pages
Relatively stable public data
Revalidation-based data

Contoh:
Landing Page
About
FAQ
Public Opportunity List jika sesuai freshness requirement

Browser Caching
Dapat menggunakan cache headers untuk static assets bila diperlukan.
Tidak boleh dicache secara agresif
Auth State
Session
Authorization Result
Dashboard Data
Application State
Contract State
Payment State
Consent State
Private Profile Data
Notification Unread Count
User-specific Real-time Data

Future:
Redis/Upstash
Distributed Cache
Advanced Query Cache


42.27 - Cache Strategy
Konseptual:
Request
 ↓
Cache
 ├── HIT → Response
 └── MISS
       ↓
    Database
       ↓
     Cache
       ↓
    Response

Hanya digunakan untuk data yang memang cocok di-cache.

42.28 - Cache Invalidation
Cache harus memiliki strategy:
Expiration
Revalidation
Explicit Invalidation

Cache invalidation menjadi bagian dari design.

42.29 - Cache TTL
TTL disesuaikan dengan freshness requirement.
Contoh:
5 minutes
1 hour
1 day

Tidak ada satu TTL untuk semua resource.

42.30 - Cache Consistency
Highly dynamic atau sensitive data tidak boleh dicache sembarangan.
Contoh:
Database = ACTIVE
Cache = OLD

tidak boleh terjadi pada state kritis.

42.31 - CDN
Static assets dapat menggunakan CDN.
Vercel menyediakan platform-level asset delivery untuk deployment.
Tidak perlu membangun CDN sendiri pada MVP.

42.32 - Compression
Payload dapat menggunakan compression yang tersedia pada deployment platform.
Application tidak perlu membangun compression infrastructure sendiri untuk MVP.

42.33 - Payload Optimization
API response hanya mengembalikan field yang dibutuhkan.
Contoh:
id
title
status
deadline

bukan seluruh profile/private metadata.

42.34 - Asynchronous Processing
Task yang tidak harus selesai dalam synchronous request dapat dipindahkan ke asynchronous processing.
Contoh:
Notification
Email
Report Generation
Heavy Processing
Scheduled Tasks


42.35 - Background Jobs
Candidate background jobs:
Notification processing
Meeting reminder
Opportunity expiration
Contract deadline check
Report generation
Future webhook processing

MVP dapat menggunakan scheduled functions/cron/manual trigger sesuai kebutuhan.
Dedicated queue infrastructure tidak wajib.

42.36 - Queue
Queue dapat digunakan bila workload asynchronous sudah cukup besar.
Untuk MVP:
Tidak perlu dedicated queue hanya demi complexity.

42.37 - Backpressure
System harus mencegah overload ketika workload melebihi kemampuan.
Approach:
Limit
Timeout
Rate Limit
Bounded Queue
Graceful Degradation

digunakan sesuai kebutuhan.

42.38 - Rate Limiting
Rate limiting digunakan untuk:
Protect APIs
Prevent Abuse
Control Resource Usage

MVP Strategy
Expected competition traffic relatif kecil.
Untuk MVP:
Business-level validation
Unique constraints
Application-level limits

digunakan sebagai baseline protection.
Technical distributed rate limiting tidak menjadi requirement MVP.
Future:
Upstash Rate Limit
Managed Rate Limiting


42.39 - Rate Limit Example
Conceptual example:
User
 ↓
Repeated Requests
 ↓
Threshold exceeded
 ↓
429 Too Many Requests

Actual thresholds ditentukan pada implementation stage berdasarkan endpoint risk.

42.40 - Resource Limits
Set reasonable limits untuk:
Request Body
Query Result
Page Size
Job Runtime
Payload Size


42.41 - File Upload Performance
MVP menggunakan:
External portfolio/CV links
bukan file upload internal.
Future:
Client
 ↓
Object Storage
 ↓
Application Metadata


42.42 - Object Storage
Jika file upload diperkenalkan:
Binary
 ↓
Object Storage

Database menyimpan metadata dan reference, bukan binary file besar.

42.43 - Search Performance
Opportunity search dapat menjadi performance-sensitive.
Gunakan:
Indexes
Filtering
Pagination
Bounded Queries
Appropriate Search Strategy


42.44 - Full-Text Search
PostgreSQL full-text search dapat dipertimbangkan sebelum dedicated search engine.

42.45 - Search Engine
Dedicated search engine hanya diperkenalkan ketika:
Dataset Size
+
Search Complexity
+
Performance Requirement

memang membutuhkannya.

42.46 - Modular Monolith Performance
Internal module communication tidak membutuhkan network call.
Module A
 ↓
Module B Interface

tetap berada dalam application runtime.

42.47 - Module Boundaries
Performance optimization tidak boleh menghancurkan module boundaries.
Tidak boleh:
“Biar cepat, import semua internal repository module lain.”

42.48 - Horizontal Scaling
Application architecture harus siap menangani lebih banyak concurrent requests.
Dalam Vercel serverless deployment, instance management dan request distribution ditangani oleh platform.
MVP tidak perlu:
Manual Load Balancer
Manual Instance Management
Manual Autoscaling Policy

Application harus tetap stateless.

42.49 - Stateless Application
Instance harus interchangeable.
State penting disimpan pada durable infrastructure:
Supabase Database
Supabase Auth
External Durable Storage

bukan memory instance.

42.50 - Session Management
Flex Network menggunakan Supabase Auth.
Session tidak bergantung pada memory server instance.

42.51 - Vertical Scaling
Vertical scaling:
CPU ↑
RAM ↑
Storage ↑

merupakan scaling option pada infrastructure yang mendukungnya.
Untuk Vercel serverless, resource allocation dikelola oleh platform.

42.52 - Scaling Strategy
Urutan:
Measure
 ↓
Optimize Bottleneck
 ↓
Increase Capacity if Needed
 ↓
Horizontal Scaling
 ↓
Advanced Architecture


42.53 - Auto Scaling
Pada Vercel deployment, scaling application request handling dikelola oleh platform.
Tidak perlu custom autoscaling system untuk MVP.

42.54 - Database Scaling
Jika workload meningkat, database dapat memerlukan:
Query Optimization
Indexing
Connection Pooling
Database Resource Upgrade
Read Optimization
Read Replica
Partitioning

Sharding bukan MVP strategy.
Supabase Scaling Reality
MVP priority:
1. Query Optimization
2. Indexing
3. Pagination
4. Connection Pooling
5. Supabase Monitoring

Connection pooling digunakan sesuai kebutuhan serverless workload.
Read replica dan advanced database scaling merupakan future considerations bergantung pada workload dan infrastructure plan.

42.55 - Read Replica
Future option:
Primary
 ↓
Writes

Read Replica
 ↓
Reads

Consistency implications harus diperhatikan.

42.56 - Sharding
Sharding tidak diperlukan untuk MVP.
Ini merupakan advanced scaling strategy.

42.57 - Capacity Planning
Capacity planning menjawab:
Berapa workload yang harus didukung sekarang, dan kapan kita perlu melakukan scaling?
Competition Context
Expected traffic:
Preliminary Review
~5-10 concurrent users

Final Live Demo
~1 presenter + ~10-20 viewers

MVP Capacity Target
Target engineering:
50 concurrent users

dengan:
Normal response ≤ 3s

Capacity target adalah engineering assumption untuk competition workload, bukan public-production capacity guarantee.
Load Testing MVP
Tidak diperlukan:
1,000+
10,000+
1,000,000 concurrent users

Untuk MVP:
Manual multi-tab test
Critical endpoint timing
Lighthouse
Basic database observation

cukup.

42.58 - Capacity Inputs
Capacity planning menggunakan:
Current Traffic
Peak Traffic
Growth Rate
Data Growth
Resource Usage
Performance Targets


42.59 - Growth Projection
Jika project dilanjutkan, gunakan actual usage data untuk membuat growth projection.

42.60 - Peak Load
Jangan hanya menggunakan average.
Pertimbangkan:
Peak Hours
Peak Days
Campaigns
Events
Registration Period
Competition Demo


42.61 - Capacity Headroom
Infrastructure sebaiknya memiliki headroom.
Target tidak berarti system harus beroperasi mendekati 100% utilization sepanjang waktu.

42.62 - Load Testing
Load testing digunakan untuk mengetahui:
Maximum Sustainable Load
Untuk MVP, test workload harus realistic terhadap competition scenario.

42.63 - Stress Testing
Stress testing mendorong workload melewati expected capacity untuk mengetahui failure behavior.
Future untuk Flex Network.

42.64 - Spike Testing
Spike testing:
Normal Traffic
 ↓
Sudden Spike
 ↓
Observe

Future jika workload meningkat.

42.65 - Endurance Testing
Endurance testing digunakan untuk menemukan:
Memory Leak
Resource Leak
Performance Degradation

Future untuk workload yang lebih besar.

42.66 - Performance Regression
Setiap perubahan besar harus dipastikan tidak menyebabkan unacceptable regression.

42.67 - Performance Testing Environment
Performance testing idealnya menggunakan environment yang representatif.
Untuk MVP, testing dapat menggunakan local/test/preview environment sesuai kebutuhan.

42.68 - Realistic Dataset
Performance testing tidak boleh menggunakan dataset terlalu kecil lalu mengklaim scalability besar.

42.69 - Database Data Growth
Monitor:
Users
Opportunities
Applications
Contracts
Meetings
Payments
Consents
Ratings
Audit Logs
Notifications


42.70 - Storage Capacity
Monitor:
Database Storage
Log Storage
Backup Storage
Future Object Storage


42.71 - Capacity Alerts
Conceptual thresholds:
70% → Observe
80% → Warning
90% → Action

Actual threshold mengikuti infrastructure capability.

42.72 - Cost-Aware Scaling
Scaling mempertimbangkan:
Performance
Reliability
Infrastructure Cost
Operational Complexity


42.73 - Performance vs Cost
Tidak selalu:
More infrastructure = better architecture
Kadang:
Query Optimization
+
Pagination
+
Selective Caching

lebih efektif.

42.74 - Performance Bottleneck Analysis
Measure
 ↓
Identify Bottleneck
 ↓
Optimize
 ↓
Measure Again


42.75 - Avoid Premature Optimization
MVP harus:
Simple
Measured
Upgradeable

bukan:
Over-engineered
Expensive
Hard to Operate


42.76 - Performance Documentation
Dokumentasikan:
Baseline
Targets
Known Bottlenecks
Scaling Strategy
Capacity Assumptions
Load Test Results


42.77 - Performance & Observability
Performance terhubung dengan Point 41:
Performance
 ↓
Metrics
 ↓
Monitoring
 ↓
Alert
 ↓
Incident Response


42.78 - Performance & Deployment
Performance juga terhubung dengan Point 40:
New Release
 ↓
Performance Validation
 ↓
Deploy
 ↓
Monitor


42.79 - Performance & Testing
Performance strategy terhubung dengan Point 39:
Functional Test
+
Performance Validation
+
Load Test when justified


42.80 - Performance Principles
Performance requirements are measurable.
Performance is measured before optimization.
Critical user journeys receive explicit performance consideration.
Latency, throughput, errors, and resource utilization are monitored.
Database queries are optimized based on actual workload.
Pagination is used for potentially large datasets.
APIs avoid unnecessarily large responses and unbounded queries.
Caching is introduced where measurable benefit exists.
Cache expiration and invalidation are defined.
Resource and request limits protect the system.
Rate limiting is used where necessary.
Long-running processing may use asynchronous jobs.
Application remains compatible with stateless scaling.
Capacity planning considers average, peak, and projected workload.
Performance regression is monitored.
Scaling decisions consider performance, reliability, cost, and complexity.
Premature optimization is avoided.
Performance strategy evolves with actual usage.
Database scaling follows measured workload.
Performance changes must not violate security or module boundaries.

42.81 - MVP vs Future
MVP 🔒
Basic performance baseline
Lighthouse audit
API latency checks
Database query optimization
Pagination
Database indexing
Connection pooling where required
Request limits
Basic application-level abuse protection
Basic caching
Vercel/CDN asset delivery
Performance regression awareness
Capacity estimation
Competition scenario testing

Future 🔜
Advanced load testing
Stress testing
Endurance testing
Read replicas
Dedicated search engine
Distributed caching
Automated performance regression gates
Advanced capacity forecasting
Database partitioning
Distributed rate limiting


42.82 - FINAL DECISION
Performance: Flex Network uses a measurable, user-focused, and data-driven performance strategy.
SRS Target: Normal operation response time ≤ 3 seconds.
Internal Target: p95 < 1 second for normal API endpoints.
Optimization: Performance optimization begins with measurement and bottleneck identification.
API: APIs use bounded queries, pagination, efficient payloads, and appropriate asynchronous processing.
Database: Database performance is managed through indexing, query optimization, connection pooling where required, and monitoring.
Caching: MVP does not use Redis. Appropriate Next.js/Vercel caching is used selectively.
Scalability: The Modular Monolith remains the baseline. Vercel handles application request scaling at the platform level.
Capacity: MVP target is approximately 50 concurrent users for competition workload assumptions.
Testing: MVP performance validation focuses on realistic competition traffic, endpoint timing, multi-tab testing, and Lighthouse.
Reliability: Performance data integrates with observability and incident response.
Evolution: Advanced scaling technologies are introduced only when measured workload and business requirements justify their complexity.

POINT 43 - FINAL ARCHITECTURE & ENGINEERING GOVERNANCE
43.1 - Tujuan
Engineering governance memastikan seluruh keputusan teknis tetap:
Consistent
Traceable
Reviewable
Maintainable
Secure

dan selaras dengan:
Business Goals
Product Requirements
User Needs
Technical Constraints

Relationship with Previous Points
Point 43 adalah CAPSTONE / PENUTUP dari seluruh TDD.
Point 43 tidak menggantikan detail teknis dari Point 39-42 atau point sebelumnya.
Poin spesifik tetap menjadi authority untuk detail teknis masing-masing domain.
Point 43 mengunci prinsip governance yang berlaku lintas seluruh system.
Small Team & Competition Context
Governance harus proportional terhadap:
Team Size
System Risk
Project Maturity
Competition Timeline

Untuk tim 3 orang:
Simple Process + Clear Ownership + Automated Checks + Lightweight Review
lebih sesuai daripada bureaucracy berat.

43.2 - Architecture Baseline
Architecture baseline Flex Network:
Modular Monolith
dengan layer:
Presentation / Interface
        ↓
Application
        ↓
Domain / Modules
        ↓
Data / Infrastructure
        ↓
External Services


43.3 - Architectural Boundaries
Module memiliki responsibility yang jelas.
Contoh:
Identity
Opportunity
Application
Matching
Meeting
Contract
Payment
Consent
Notification
Rating
Work History
Admin
Report
Audit


43.4 - Single Responsibility
Setiap module harus memiliki:
Clear Responsibility
Clear Ownership
Clear Interface

Jangan menjadikan satu module sebagai tempat seluruh business logic.

43.5 - Dependency Direction
Dependency direction:
Presentation
     ↓
Application
     ↓
Domain

Infrastructure berada di luar domain sebagai implementation boundary.
Higher-level business logic tidak boleh bergantung langsung pada unnecessary implementation detail.

43.6 - Module Communication
Module berkomunikasi melalui:
Defined Interface
Application Service
Domain Event bila diperlukan

Module tidak boleh mengakses internal implementation module lain secara sembarangan.

43.7 - Data Ownership
Setiap module memiliki ownership terhadap data yang menjadi responsibility-nya.
Contoh:
Application Module
→ Application Data

Contract Module
→ Contract Data

Payment Module
→ Payment Data


43.8 - Shared Data
Shared data harus diminimalkan.
Pattern:
Module A
 ↓
Defined Contract
 ↓
Module B

bukan:
Module A
 ↓
Direct Table Manipulation
 ↓
Module B Internal Data


43.9 - Architecture Decision Record
Significant architecture decisions harus terdokumentasi menggunakan ADR.
Format minimal:
Context
Decision
Alternatives
Consequences
Status


43.10 - ADR Example
ADR-001

Decision:
Modular Monolith

Context:
System masih tahap awal dan membutuhkan development speed
serta operational simplicity.

Decision:
Menggunakan Modular Monolith.

Alternative:
Microservices.

Consequence:
Deployment lebih sederhana tetapi module boundary
harus dijaga dengan discipline.


43.11 - Architecture Review
Architecture review diperlukan untuk perubahan significant, seperti:
New Module
Database Strategy Change
External Service Addition
Security Boundary Change
Major Infrastructure Change
Authentication Architecture Change
Payment Architecture Change

Tidak semua perubahan kecil membutuhkan formal architecture review.

43.12 - Technical Decision Ownership
Significant decision memiliki:
Decision
 ↓
Owner
 ↓
Documentation
 ↓
Review


43.13 - Engineering Standards
Codebase mengikuti standards untuk:
Naming
Formatting
Testing
Error Handling
Logging
Security
Documentation
Dependency Management


43.14 - Coding Standards
Standards harus konsisten pada:
Structure
Naming
File Organization
Error Handling
Dependency Management

Tools yang digunakan mengikuti implementation configuration, misalnya:
TypeScript
ESLint
Prettier


43.15 - Code Review
Significant code changes harus melalui code review.
Review minimum mempertimbangkan:
Correctness
Security
Maintainability
Testing
Architecture


43.16 - Pull Request
PR harus menjelaskan:
What changed?
Why?
Impact?
Testing?
Risk?


43.17 - Branch Strategy
Branching strategy:
main
 ↓
feature/*
fix/*
refactor/*
chore/*

Workflow:
Feature Branch
 ↓
Pull Request
 ↓
CI
 ↓
Review
 ↓
Merge


43.18 - Protected Main Branch
main harus diperlakukan sebagai protected branch.
Direct Push → ❌
Pull Request → Review → CI → Merge → ✅


43.19 - Definition of Done
Task dianggap selesai jika:
Implementation
+
Testing
+
Code Review
+
Documentation
+
Acceptance Criteria

telah terpenuhi sesuai kebutuhan.

43.20 - Definition of Ready
Task sebelum development memiliki:
Clear Requirement
Acceptance Criteria
Dependencies
Expected Outcome


43.21 - Technical Debt
Technical debt harus:
Document
 ↓
Prioritize
 ↓
Resolve

bukan disembunyikan.

43.22 - Technical Debt Classification
Technical debt dikategorikan:
Low
Medium
High
Critical

berdasarkan impact dan urgency.

43.23 - Dependency Governance
Dependency harus:
Known
Versioned
Reviewed
Security Checked
Maintained


43.24 - Deprecated Dependencies
Dependency deprecated harus memiliki replacement plan atau keputusan eksplisit untuk tetap menggunakannya dengan risk yang diketahui.

43.25 - Breaking Changes
Breaking change harus:
Identified
Documented
Reviewed
Tested
Communicated


43.26 - API Governance
API harus memiliki:
Defined Contract
Validation
Error Format
Documentation
Compatibility Strategy

API versioning mengikuti kebutuhan product dan current MVP architecture.

43.27 - API Compatibility
Perubahan API harus mempertimbangkan backward compatibility terhadap existing clients.

43.28 - Database Governance
Database changes harus:
Reviewed
Migrated
Tested
Traceable

Tidak boleh dilakukan secara sembarangan langsung terhadap production.
Production database changes mengikuti migration workflow.

43.29 - Schema Ownership
Database schema memiliki ownership yang jelas.
Migration changes tetap melalui:
Git
 ↓
Review
 ↓
Test
 ↓
Deployment


43.30 - Security Governance
Security merupakan bagian dari seluruh lifecycle:
Design
 ↓
Development
 ↓
Testing
 ↓
Deployment
 ↓
Monitoring


43.31 - Security Review
Security review wajib diprioritaskan untuk high-risk changes:
Authentication
Authorization
Payment
Personal Data
Consent
Database/RLS
External Integration
Privileged Access


43.32 - Privacy by Design
Privacy dipertimbangkan sejak:
Collect
 ↓
Use
 ↓
Store
 ↓
Retain
 ↓
Delete

Data hanya dikumpulkan dan diproses sesuai kebutuhan.

43.33 - Least Privilege
Access diberikan berdasarkan:
Need → Minimum Permission
Tidak ada permission yang diberikan tanpa alasan.

43.34 - Observability Governance
Logging, metrics, monitoring, dan audit mengikuti principles dari Point 41:
Security
Privacy
Retention
Access Control
Data Minimization


43.35 - Testing Governance
Testing mengikuti Point 39:
Unit
Integration
API
E2E
Security
Performance
Regression
RLS

sesuai risk.

43.36 - Deployment Governance
Deployment mengikuti Point 40:
Build
 ↓
Test
 ↓
Preview/Staging
 ↓
Validate
 ↓
Production
 ↓
Monitor


43.37 - Incident Governance
Incident mengikuti Point 41:
Detect
 ↓
Triage
 ↓
Contain
 ↓
Mitigate
 ↓
Recover
 ↓
Verify
 ↓
Review


43.38 - Performance Governance
Performance mengikuti Point 42:
Measure
 ↓
Identify Bottleneck
 ↓
Optimize
 ↓
Validate


43.39 - Change Management
Technical changes harus mempertimbangkan:
Impact
Risk
Dependencies
Rollback
Testing
Documentation


43.40 - Change Classification
Changes dikategorikan:
Low Risk
Medium Risk
High Risk
Critical


43.41 - Low-Risk Change
Contoh:
Minor UI Correction
Documentation Change
Non-critical Refactor


43.42 - High-Risk Change
Contoh:
Authentication Change
Database Migration
Security Boundary Change
Major Architecture Change
Payment Logic Change
Consent Logic Change


43.43 - Change Approval
Approval level mengikuti risk.
Low Risk
→ Lightweight Review

High Risk
→ Stronger Review

Tidak semua perubahan membutuhkan approval bureaucracy yang sama.

43.44 - Release Governance
Setiap release penting memiliki:
Version
Change List
Validation
Deployment Record
Rollback Plan


43.45 - Documentation Governance
Documentation harus:
Accurate
Discoverable
Versioned
Maintained


43.46 - Documentation Ownership
Critical documentation memiliki owner.
Contoh:
Architecture Docs
Deployment Docs
Database Docs
Security Docs
Runbooks
README


43.47 - Knowledge Management
Critical knowledge tidak boleh hanya berada pada satu individu.
Person Knowledge → ❌
Team Knowledge   → ✅


43.48 - Bus Factor
System harus mengurangi dependency terhadap satu engineer.
Minimum documentation:
Architecture
Deployment
Infrastructure
Security
Operations
Troubleshooting


43.49 - Onboarding
Engineer baru harus dapat memahami system melalui:
README
Architecture Docs
ADR
Development Guide
Runbooks
Codebase


43.50 - Engineering Metrics
Engineering metrics dapat membantu improvement:
Deployment Frequency
Change Failure Rate
Lead Time
MTTR
Test Reliability
Incident Frequency


43.51 - Metrics Are Not Individual Targets
Engineering metrics bukan alat untuk menghukum individu.
Tujuannya:
Identify Problems
 ↓
Improve Process
 ↓
Improve System


43.52 - Architecture Evolution
Architecture berkembang berdasarkan:
Current Need
 ↓
Measure
 ↓
Identify Limitation
 ↓
Architecture Change


43.53 - Modular Monolith Evolution
Evolution path:
Modular Monolith
 ↓
Monitor Bottleneck
 ↓
Identify Module Under Pressure
 ↓
Optimize
 ↓
Extract Specific Module if Necessary
 ↓
Potential Service

Microservices merupakan evolutionary option, bukan default.

43.54 - Avoid Premature Microservices
Microservices tidak digunakan hanya karena terlihat lebih enterprise.
Untuk current scope:
Modular Monolith lebih rational.

43.55 - Technology Selection
Technology dipilih berdasarkan:
Requirement
Team Capability
Security
Maintainability
Cost
Ecosystem
Performance
Timeline

Bukan hanya popularitas.

43.56 - Technology Evaluation
Sebelum technology baru digunakan:
Problem
 ↓
Requirement
 ↓
Evaluation
 ↓
Validation / Proof
 ↓
Decision


43.57 - Build vs Buy
Capability dapat dievaluasi melalui:
Build
Buy
Open Source

berdasarkan:
Cost
Risk
Control
Maintenance
Security
Time


43.58 - External Service Governance
External services harus memiliki:
Purpose
Owner
Credentials
Failure Strategy
Cost Awareness
Exit Strategy


43.59 - Vendor Lock-in
Vendor lock-in tidak harus selalu dihindari.
Yang penting:
Known Risk
+
Acceptable Trade-off

harus terdokumentasi.

43.60 - Architecture Constraints
Known constraints harus terdokumentasi:
Budget
Team Size
Infrastructure
Timeline
Compliance
Technical Skills
Competition Requirements


43.61 - Engineering Risk Register
Technical risks dicatat sebagai:
Risk
Probability
Impact
Mitigation
Owner
Status


43.62 - Risk Review
Risk register direview secara berkala dan diperbarui ketika architecture atau project scope berubah.

43.63 - Quality Gates
Major changes dapat memiliki:
Code Review
 ↓
Tests
 ↓
Security
 ↓
Performance
 ↓
Deployment Validation

Tidak semua change membutuhkan semua gate.

43.64 - Architecture Compliance
Implementation harus tetap sesuai architecture baseline.
Jika menyimpang:
Deviation
 ↓
Document
 ↓
Review
 ↓
Accept / Correct


43.65 - Architecture Exceptions
Exception diperbolehkan jika:
Justified
Documented
Reviewed
Time-bounded


43.66 - Governance vs Developer Speed
Governance tidak boleh menjadi bureaucratic monster.
Tujuannya:
Enough Control + Enough Speed

43.67 - Small Team Principle
Untuk tim kecil:
Simple Process
Clear Ownership
Automated Checks
Lightweight Review

lebih cocok daripada bureaucracy berat.

43.68 - Engineering Communication
Technical decisions dikomunikasikan melalui:
Documentation
Pull Request
ADR
Design Review
Team Discussion

sesuai tingkat impact.

43.69 - Final Architecture Consistency
Semua point harus konsisten dengan:
Modular Monolith
+
Layered Architecture
+
Secure Boundaries
+
Controlled Deployment
+
Observable System
+
Measured Performance


43.70 - SDLC Integration
Engineering governance terintegrasi dalam SDLC:
Requirements
 ↓
Design
 ↓
Development
 ↓
Testing
 ↓
Review
 ↓
Deployment
 ↓
Monitoring
 ↓
Incident / Feedback
 ↓
Improvement
 ↓
Requirements

Ini membentuk closed-loop engineering.

43.71 - Final Engineering Lifecycle
Requirements
 ↓
Design
 ↓
Development
 ↓
Testing
 ↓
Review
 ↓
Deployment
 ↓
Observability
 ↓
Monitoring
 ↓
Incident / Feedback
 ↓
Improvement
 ↓
Requirements


43.72 - FINAL ENGINEERING PRINCIPLES
Architecture decisions are explicit and documented.
Module boundaries are clearly defined and maintained.
Business logic remains independent from unnecessary infrastructure details.
Significant technical decisions are recorded through ADRs or equivalent documentation.
Code changes follow appropriate review and quality gates.
Technical debt is identified, documented, prioritized, and managed.
Dependencies are versioned, reviewed, and security-checked.
Database and API changes are controlled and traceable.
Security and privacy are integrated into the engineering lifecycle.
Production changes are controlled, observable, and reversible where practical.
Documentation is maintained as part of engineering work.
Critical operational knowledge is shared rather than concentrated in one individual.
Engineering metrics are used for system and process improvement rather than individual punishment.
Architecture evolves based on measured requirements and real system constraints.
Microservices are introduced only when justified by measurable technical or organizational needs.
Technology selection considers requirements, capability, security, maintainability, cost, and ecosystem.
External services are evaluated for reliability, security, cost, and operational dependency.
Technical risks are documented and actively managed.
Governance remains proportional to team size, system risk, and project maturity.
All engineering practices form one continuous SDLC feedback loop.

43.73 - MVP vs Future
MVP 🔒
Modular Monolith baseline
Defined module boundaries
Layered architecture
Code review through GitHub PR
Minimum one reviewer for important changes
Basic ADR
Coding standards
Definition of Ready
Definition of Done
Technical debt tracking
Dependency governance
Security review for high-risk changes
Deployment governance
Documentation ownership
Basic technical risk register
CI quality gates
ITechnoCup compliance checks
Final submission governance checklist

Future 🔜
Formal architecture review board
Advanced architecture compliance automation
Automated dependency governance
Advanced engineering metrics
Automated architecture validation
Service extraction when justified
Developer platform/internal tooling
Advanced governance automation


43.74 - FINAL DECISION
Architecture: Flex Network adopts a Modular Monolith architecture with clearly defined module and layer boundaries.
Governance: Significant technical decisions are documented, reviewed, and traceable. Governance is proportional to the 3-person team and competition timeline.
Development: Engineering changes follow coding standards, code review, testing, and appropriate quality gates.
Security: Security and privacy are integrated throughout the SDLC rather than treated as final-stage activities.
Operations: Deployment, observability, incident response, and performance are governed as part of one engineering lifecycle.
Maintainability: Technical debt, dependencies, documentation, and architecture exceptions are actively managed.
Scalability: Architecture evolves based on measured requirements rather than premature complexity.
Technology: Technology choices are justified through requirements, risk, maintainability, cost, ecosystem, and team capability.
Knowledge: Critical system knowledge is documented and shared to reduce operational dependency on individuals.
Architecture Evolution: Microservices or other advanced patterns may be introduced only when measurable technical or organizational requirements justify the transition.
SDLC: All engineering practices form a continuous feedback loop from requirements through development, deployment, monitoring, incident response, and improvement.
Competition: ITechnoCup governance requirements, submission requirements, framework declaration, originality, ethical AI declaration, SDG alignment, README compliance, GitHub repository, and hosting readiness must be satisfied before submission.