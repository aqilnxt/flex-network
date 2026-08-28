SRS — Software Requirements Specification
Flex Network
Version: Final rev. 1.2
Status: FINAL & LOCKED 🔒

1. System Overview
1.1 System Purpose
Flex Network merupakan platform digital yang dirancang untuk mempertemukan TALENT, khususnya Pelajar SMA/SMK dan Young Talent, dengan HIRER yang menyediakan berbagai opportunity untuk memperoleh pengalaman kerja nyata.
Sistem memungkinkan TALENT menemukan opportunity berdasarkan skill dan interest, kemudian mengikuti proses mulai dari pencarian opportunity, application, selection, meeting, consent apabila diperlukan, contract, hingga penyelesaian pekerjaan dan pencatatan Verified Work History.
Di sisi HIRER, sistem menyediakan fitur untuk membuat dan mengelola opportunity, melihat applicant, melakukan seleksi, menjadwalkan meeting, membuat contract, mengelola pekerjaan, serta memberikan rating setelah pekerjaan selesai.
Admin bertanggung jawab terhadap moderation, reporting, verification, dan tindakan administratif sesuai kewenangannya.
1.2 System Scope
In Scope — MVP
Sistem mencakup:
User registration dan authentication
Role-based authorization
TALENT profile
HIRER profile
Skill & interest management
Opportunity creation dan management
Opportunity review dan moderation
Opportunity discovery
Search dan filtering
Rule-based skill & interest matching
Application management
Applicant selection
Meeting scheduling dan completion
Simulated parental / guardian consent
Simulated contract
Simulated payment
Work management
Work completion confirmation
Rating & review
Verified Work History
Reporting
Admin moderation
Auditability untuk tindakan administratif penting
Out of Scope — MVP
Fitur berikut tidak menjadi fokus implementasi MVP:
Real payment gateway
Real escrow / financial transaction
Independent Guardian Account
Guardian Dashboard
Independent Guardian Authentication
Official digital signature
Legal contract verification
In-platform video call
Advanced AI / ML matching
Advanced recommendation engine
Advanced recruitment analytics
Advanced identity verification
Advanced fraud detection
Complex dispute resolution
Advanced monetization system
School integration
Fitur tersebut dapat dipertimbangkan pada tahap Future Development.

MVP Priority Classification
Seluruh fitur In Scope diklasifikasikan menjadi tiga tingkat prioritas.
Klasifikasi ini digunakan untuk pengambilan keputusan apabila terjadi
keterbatasan waktu development.

Definisi:
- MUST HAVE   : Fitur inti. Tanpa fitur ini, core flow sistem rusak dan MVP dinyatakan gagal.
- SHOULD HAVE : Fitur penting yang meningkatkan kualitas sistem, namun MVP masih dapat
                berfungsi penuh tanpa fitur tersebut.
- NICE TO HAVE: Fitur pelengkap. Fitur ini dipotong terlebih dahulu apabila
                waktu development tidak mencukupi.


MUST HAVE
Registration & Auth, Role-based authorization, Profile TALENT/HIRER, Skill & Interest, Opportunity CRUD + moderation + discovery, Search/Filter, Weighted Matching, Application, Selection, Meeting, Simulated Consent, Contract, Simulated Payment, Work, Completion Confirmation, Rating & Review, Verified Work History, Reporting, Admin moderation, Audit log
SHOULD HAVE
Notification service (sesuai Section 10.6 "Recommended"), Portfolio display lengkap, UI label Indonesia (No 20)
NICE TO HAVE
Email service, File/object storage untuk foto profile, Environment terpisah dev/prod (NFR-31)




Aturan Potong Fitur:
Apabila terjadi pembatasan scope, pemotongan dilakukan dari tier terendah
ke tertinggi: Nice to Have → Should Have → Must Have.
Fitur Out of Scope tidak boleh dipromosikan masuk ke dalam MVP
tanpa keputusan resmi perubahan scope.

1.3 System Objective
Sistem dikembangkan untuk:
Memudahkan TALENT menemukan opportunity yang sesuai dengan skill dan interest.
Memfasilitasi proses opportunity dari application hingga completion.
Membantu HIRER menemukan dan menyeleksi TALENT yang sesuai dengan kebutuhan opportunity.
Membangun mekanisme trust melalui moderation, meeting, contract, rating, review, reporting, dan Verified Work History.
Membantu TALENT memperoleh pengalaman kerja nyata yang dapat menjadi bahan pertimbangan dalam eksplorasi pendidikan dan karier.
Mendukung subtema “Smart Sustainable Digital Solution for Inclusive Society” melalui perluasan akses TALENT terhadap opportunity dan pengalaman kerja nyata melalui platform digital yang terstruktur, inklusif, dan dapat ditelusuri.
Mendukung Sustainable Development Goals (SDGs), terutama:
SDG 8 — Decent Work and Economic Growth sebagai primary alignment.
SDG 9 — Industry, Innovation and Infrastructure sebagai supporting alignment.
SDG 11 — Sustainable Cities and Communities sebagai supporting alignment melalui perluasan akses terhadap opportunity lokal dan partisipasi komunitas.
1.4 Relationship with BRD
SRS merupakan technical/system-level translation dari kebutuhan bisnis yang telah ditetapkan dalam BRD.
BRD menjelaskan mengapa Flex Network dibangun dan kebutuhan bisnis apa yang ingin diselesaikan, sedangkan SRS mendefinisikan kebutuhan dan perilaku sistem yang diperlukan untuk memenuhi kebutuhan tersebut.
Hubungan dokumen:
BRD (Business Requirements)
        │
        ▼
SRS (System Requirements)
        │
        ▼
UI/UX Design
        │
        ▼
Technical Design Document
        │
        ▼
API Specification
        │
        ▼
Development
        │
        ▼
Testing
        │
        ▼
Deployment

1.5 System Boundary
Sistem memiliki tiga role utama:
TALENT
HIRER
ADMIN
Parent / Guardian bukan merupakan role platform dalam MVP.

2. Target User
2.1 Primary Target User
Pelajar SMA/SMK dan Young Talent yang ingin mendapatkan pengalaman kerja nyata, mengeksplorasi minat dan keterampilan, serta memahami pilihan jalur pendidikan dan karier mereka.
Dalam sistem, role teknis pengguna tersebut menggunakan:
TALENT
2.2 HIRER
HIRER merupakan pihak yang menyediakan opportunity dan membutuhkan TALENT untuk pekerjaan, project, internship, freelance, pekerjaan sementara, event work, atau kebutuhan berbasis keterampilan lainnya.
HIRER dapat berasal dari:
Perusahaan
Startup
UMKM
Organisasi
Event Organizer
Komunitas
Individu
2.3 ADMIN
ADMIN bertanggung jawab terhadap:
Opportunity moderation
User management
Report handling
Verification
Administrative action
Auditability
ADMIN hanya dapat melakukan tindakan sesuai authorization yang diberikan sistem.

3. Core Problem
3.1 Kurangnya Akses terhadap Pengalaman Kerja Nyata
Pelajar SMA/SMK dan Young Talent sering memiliki minat, potensi, atau keterampilan yang ingin dikembangkan, tetapi memiliki keterbatasan dalam mendapatkan kesempatan untuk merasakan pengalaman kerja secara langsung.
Problem: TALENT kesulitan mendapatkan opportunity untuk memperoleh pengalaman kerja nyata.
3.2 Kesulitan Mengeksplorasi Minat dan Keterampilan
TALENT belum selalu memiliki gambaran yang jelas mengenai bidang pekerjaan yang sesuai dengan minat dan kemampuan mereka.
Problem: TALENT memiliki keterbatasan kesempatan untuk mengeksplorasi dan menguji minat serta keterampilan melalui pengalaman nyata.
3.3 Kesulitan Mempertimbangkan Pilihan Pendidikan dan Karier
TALENT dapat menghadapi pilihan antara melanjutkan pendidikan, memasuki dunia kerja, atau mengeksplorasi bidang lain tanpa memiliki pengalaman yang cukup untuk memahami bidang yang sesuai dengan diri mereka.
Problem: TALENT sering kali harus mempertimbangkan pilihan pendidikan dan karier tanpa pengalaman kerja nyata yang cukup.
3.4 Core Problem Statement
Pelajar SMA/SMK dan Young Talent memiliki minat, potensi, atau keterampilan yang ingin dikembangkan, tetapi kesulitan mendapatkan kesempatan untuk memperoleh pengalaman kerja nyata yang dapat membantu mereka mengeksplorasi kemampuan, memahami dunia kerja, dan mempertimbangkan pilihan pendidikan serta karier di masa depan.

4. Core Solution
Flex Network menyediakan platform yang mempertemukan TALENT dengan opportunity berdasarkan skill dan interest mereka.
Sistem memungkinkan TALENT:
Membuat profile
Menambahkan skill dan interest
Menemukan opportunity
Mendapatkan rekomendasi opportunity
Melakukan application
Mengikuti proses selection
Mengikuti meeting
Menyelesaikan consent apabila diperlukan
Menyetujui contract
Menyelesaikan pekerjaan
Mendapatkan rating
Mendapatkan Verified Work History
Sementara HIRER dapat:
Membuat profile
Membuat opportunity
Menentukan requirement
Mengirim opportunity untuk moderation
Melihat applicant
Melakukan review applicant
Melakukan selection
Menjadwalkan meeting
Membuat contract
Mengelola work
Mengonfirmasi completion
Memberikan rating
ADMIN dapat:
Melakukan moderation
Menangani report
Mengelola user sesuai kewenangan
Melakukan verification override pada kasus khusus
Mencatat administrative action
Core Solution Flow
TALENT
   │
   ▼
Profile + Skill + Interest
   │
   ▼
Opportunity Discovery
   │
   ▼
Matching / Recommendation
   │
   ▼
Application
   │
   ▼
Selection
   │
   ▼
Meeting
   │
   ▼
Consent if Required
   │
   ▼
Contract
   │
   ▼
Work
   │
   ▼
Completion
   │
   ▼
Rating + Review
   │
   ▼
Verified Work History


5. Functional Requirements
Functional Requirements mendefinisikan perilaku dan kemampuan yang harus disediakan oleh sistem Flex Network. Setiap requirement dibuat agar dapat diimplementasikan dan diverifikasi melalui proses development dan testing.
5.1 Authentication & Authorization
FR-AUTH-001 — Registration
Sistem harus memungkinkan user melakukan registrasi akun baru
dengan memilih role:
TALENT
HIRER
Registrasi harus menghasilkan akun dengan role sesuai pilihan user.
FR-AUTH-002 — Login
Sistem harus memungkinkan user melakukan login menggunakan credential yang terdaftar.
FR-AUTH-003 — Logout
Sistem harus memungkinkan user melakukan logout dari session yang sedang aktif.
FR-AUTH-004 — Authentication
Sistem harus memverifikasi authentication status user sebelum mengakses fitur yang memerlukan akun.
FR-AUTH-005 — Role-Based Access
Sistem harus membatasi akses fitur berdasarkan role:
TALENT
HIRER
ADMIN
User hanya dapat melakukan tindakan yang diizinkan oleh role yang dimilikinya.
FR-AUTH-006 — Server-Side Authorization
Sistem harus melakukan authorization pada sisi server sebelum menjalankan operasi yang membutuhkan permission.
Authorization tidak boleh hanya bergantung pada:
UI restriction
Hidden button
Client-side state
Client-provided role
Server harus melakukan verifikasi terhadap:
Authentication status
User role
Resource ownership
Business rules
Permission yang diperlukan
FR-AUTH-007 — Resource Ownership
Sistem harus memastikan bahwa user hanya dapat mengakses atau mengubah resource yang:
Dimilikinya; atau
Secara eksplisit berada dalam kewenangan role user tersebut.
Contoh:
HIRER hanya dapat mengelola opportunity miliknya sendiri.
TALENT hanya dapat melihat application miliknya sendiri.
TALENT dan HIRER hanya dapat mengakses contract yang melibatkan dirinya.
ADMIN dapat mengakses resource sesuai kewenangan administratifnya.
FR-AUTH-008 — Ownership Validation
Setiap operasi terhadap resource yang memiliki owner harus melakukan ownership validation pada server sebelum resource diproses.
Contoh:
Authenticated User
        ↓
Role Check
        ↓
Resource Ownership Check
        ↓
Business Rule Check
        ↓
Process Request
Apabila ownership tidak sesuai, operasi harus ditolak.
FR-AUTH-009 — Database-Level Protection
Authorization dan ownership validation pada application layer harus didukung oleh database-level protection sesuai arsitektur sistem.
Untuk sistem yang menggunakan Supabase PostgreSQL, Row Level Security (RLS) digunakan sebagai defense-in-depth dan bukan sebagai pengganti server-side authorization.
FR-AUTH-010 — Unauthorized Access Prevention
Sistem harus mencegah user mengakses atau memodifikasi resource user lain tanpa permission yang sah.
Contoh:
TALENT A
   ↓
Contract milik TALENT B
   ↓
ACCESS DENIED
HIRER A
   ↓
Opportunity milik HIRER B
   ↓
ACCESS DENIED
TALENT
   ↓
ADMIN Resource
   ↓
ACCESS DENIED
FR-AUTH-011 — Privileged Operation Protection
Operasi sensitif harus selalu melewati authentication, authorization, ownership validation, dan business-rule validation.
Operasi sensitif meliputi:
Create Opportunity
Submit Application
Select Application
Create Contract
Agree Contract
Change Payment State
Complete Work
Confirm Work Completion
Submit Rating
Process Consent
Admin Moderation
Verification Override
FR-AUTH-012 — Admin Authorization
ADMIN memiliki kewenangan lebih tinggi dibandingkan TALENT dan HIRER, tetapi setiap tindakan ADMIN tetap harus melalui authentication dan authorization.
ADMIN hanya dapat melakukan tindakan administratif yang memang didefinisikan oleh sistem.

5.2 TALENT Profile
FR-TALENT-001 — Create Profile
Sistem harus memungkinkan TALENT membuat profile.
FR-TALENT-002 — Update Profile
Sistem harus memungkinkan TALENT mengubah informasi profile miliknya.
FR-TALENT-003 — Skill Management
Sistem harus memungkinkan TALENT menambahkan, melihat, mengubah, dan menghapus skill yang dimiliki.
FR-TALENT-004 — Interest Management
Sistem harus memungkinkan TALENT menambahkan, melihat, mengubah, dan menghapus interest.
FR-TALENT-005 — Portfolio
Sistem harus memungkinkan TALENT menambahkan informasi portfolio yang relevan dengan skill atau experience.
FR-TALENT-006 — Work History
Sistem harus memungkinkan TALENT melihat Work History yang telah tercatat melalui platform.

5.3 HIRER Profile
FR-HIRER-001 — Create Profile
Sistem harus memungkinkan HIRER membuat profile.
FR-HIRER-002 — Update Profile
Sistem harus memungkinkan HIRER mengubah informasi profile miliknya.
FR-HIRER-003 — Organization Information
Sistem harus memungkinkan HIRER menyimpan informasi organisasi, perusahaan, startup, UMKM, komunitas, atau pihak lain yang diwakili.

5.4 Opportunity Management
FR-OPP-001 — Create Opportunity
Sistem harus memungkinkan HIRER membuat opportunity baru.
Opportunity yang baru dibuat harus memiliki status:
DRAFT
FR-OPP-002 — Update Opportunity
Sistem harus memungkinkan HIRER mengubah opportunity yang masih dapat diedit.
HIRER hanya dapat mengubah opportunity yang dimilikinya atau yang secara eksplisit berada dalam kewenangannya.
FR-OPP-003 — Submit Opportunity
Sistem harus memungkinkan HIRER mengirim opportunity untuk dilakukan moderation oleh ADMIN.
Status berubah menjadi:
PENDING_REVIEW
FR-OPP-004 — Publish Opportunity
Sistem harus memungkinkan opportunity yang telah disetujui ADMIN berubah menjadi:
PUBLISHED
Opportunity dengan status PUBLISHED dapat ditemukan oleh TALENT.
FR-OPP-005 — Close Opportunity
Sistem harus memungkinkan HIRER menutup opportunity miliknya.
Status berubah menjadi:
CLOSED
Opportunity dengan status CLOSED tidak dapat menerima application baru.
FR-OPP-006 — Opportunity Detail
Sistem harus memungkinkan TALENT melihat detail opportunity yang berstatus PUBLISHED.
FR-OPP-007 — Opportunity Lifecycle
Lifecycle opportunity:
DRAFT
  ↓
PENDING_REVIEW
  ↓
PUBLISHED
  ↓
CLOSED

5.5 Opportunity Discovery
FR-DISC-001 — Browse Opportunity
Sistem harus memungkinkan TALENT melihat daftar opportunity yang berstatus PUBLISHED.
FR-DISC-002 — Search Opportunity
Sistem harus memungkinkan TALENT melakukan pencarian opportunity berdasarkan informasi yang tersedia.
FR-DISC-003 — Filter Opportunity
Sistem harus memungkinkan TALENT melakukan filtering berdasarkan informasi seperti:
Opportunity Type
Location
Duration
Compensation
Required Skills
Relevant Interests
FR-DISC-004 — Opportunity Recommendation
Sistem harus dapat memberikan rekomendasi opportunity berdasarkan hasil rule-based weighted matching antara data TALENT dan requirement opportunity.
Rekomendasi harus menggunakan:
Talent Skills
Talent Interests
Opportunity Required Skills
Opportunity Relevant Interests
Match score dihitung oleh sistem dan digunakan sebagai recommendation/support mechanism.

5.6 Matching
FR-MATCH-001 — Skill Matching
Sistem harus membandingkan skill yang dimiliki TALENT dengan required skill pada opportunity.
Perhitungan:
Skill Match = (Matched Skills / Required Skills) × 100
Apabila opportunity tidak memiliki required skill:
Skill Match = 100

FR-MATCH-002 — Interest Matching
Sistem harus membandingkan interest TALENT dengan relevant interest pada opportunity.
Perhitungan:
Interest Match = (Matched Interests / Relevant Interests) × 100
Apabila opportunity tidak memiliki relevant interest:
Interest Match = 100

FR-MATCH-003 — Weighted Match Score
Sistem harus menghasilkan Final Match Score menggunakan weighted scoring:
Final Match Score = (Skill Match × 0.70) + (Interest Match × 0.30)
Weight yang digunakan:
Skill Match = 70%
Interest Match = 30%
Nilai final berada pada rentang:
0–100
Weighted matching bersifat deterministic dan rule-based.

FR-MATCH-004 — Match Classification
Sistem harus mengelompokkan Final Match Score menjadi:
Score
Classification
80–100
STRONG_MATCH
60–79
GOOD_MATCH
30–59
WEAK_MATCH
0–29
NO_MATCH

Classification ditentukan oleh server berdasarkan Final Match Score.

FR-MATCH-005 — Recommendation Only
Matching hanya berfungsi sebagai recommendation/support mechanism.
Matching:
Tidak dapat melakukan automatic hiring.
Tidak dapat mengubah application menjadi SELECTED.
Tidak dapat menggantikan proses review dan selection oleh HIRER.
Tidak dapat membuat contract secara otomatis.
Keputusan application dan selection tetap dilakukan oleh HIRER.

FR-MATCH-006 — Server-Side Match Calculation
Perhitungan match score harus dilakukan pada server/application layer.
Frontend tidak boleh menghitung atau menentukan Final Match Score sebagai sumber kebenaran.
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

FR-MATCH-007 — Deterministic Matching
Untuk input TALENT dan opportunity yang sama, sistem harus menghasilkan score dan classification yang konsisten selama configuration weight dan rule tidak berubah.

5.7 Application Management
FR-APP-001 — Submit Application
Sistem harus memungkinkan TALENT melakukan application terhadap opportunity yang berstatus PUBLISHED.
FR-APP-002 — Application Status
Sistem harus menyimpan status application menggunakan canonical status:
APPLIED
   ↓
UNDER_REVIEW
   ├──→ SELECTED
   └──→ REJECTED
FR-APP-003 — View Application
TALENT harus dapat melihat application yang dimilikinya beserta statusnya.
FR-APP-004 — Applicant Management
HIRER harus dapat melihat application yang berkaitan dengan opportunity miliknya.
FR-APP-005 — Application Review
HIRER harus dapat melakukan review terhadap applicant pada opportunity miliknya.
FR-APP-006 — Selection
HIRER harus dapat mengubah application menjadi:
SELECTED
atau:
REJECTED
HIRER hanya dapat melakukan selection terhadap application yang berada dalam scope opportunity miliknya.

5.8 Meeting
FR-MEET-001 — Schedule Meeting
HIRER atau user yang memiliki kewenangan harus dapat membuat jadwal meeting terhadap application yang berada dalam kewenangannya.
FR-MEET-002 — Meeting Information
Sistem harus menyimpan informasi meeting seperti:
Date
Time
Meeting Method
Location / Meeting Information
FR-MEET-003 — Meeting Status
Sistem harus menyediakan status:
SCHEDULED
COMPLETED
CANCELLED
FR-MEET-004 — Meeting Completion
Meeting harus dapat ditandai sebagai COMPLETED sebelum proses contract dapat dilanjutkan.
Meeting tidak harus dilakukan melalui video call di dalam platform.

5.9 Parental / Guardian Consent
FR-CONSENT-001 — Consent Requirement
Sistem harus dapat menentukan apakah suatu opportunity membutuhkan parental / guardian consent.
FR-CONSENT-002 — Consent Request
Apabila consent diperlukan, sistem harus membuat consent dengan status:
PENDING
FR-CONSENT-003 — Simulated Consent Declaration
MVP harus menyediakan simulated consent declaration.
Consent direpresentasikan sebagai declaration yang divalidasi server-side dan bukan sebagai independent Guardian approval.
FR-CONSENT-004 — Consent Result
Consent dapat menghasilkan:
APPROVED
atau:
REJECTED
FR-CONSENT-005 — Contract Blocking
Apabila consent diwajibkan dan statusnya REJECTED, sistem tidak boleh mengaktifkan contract.
FR-CONSENT-006 — Guardian Account Constraint
MVP tidak menyediakan:
Guardian Account
Guardian Dashboard
Guardian Login
Independent Guardian Authentication

5.10 Contract
FR-CONTRACT-001 — Create Contract
Sistem harus dapat membuat simulated contract setelah:
Application berstatus SELECTED
Meeting berstatus COMPLETED
Consent tidak diperlukan atau consent berstatus APPROVED
FR-CONTRACT-002 — Contract Information
Contract harus menyimpan informasi seperti:
Contract ID
Application
TALENT
HIRER
Opportunity
Role
Responsibilities
Duration
Location
Compensation
Terms & Conditions
FR-CONTRACT-003 — Contract Agreement
Sistem harus memungkinkan TALENT dan HIRER memberikan persetujuan terhadap contract.
FR-CONTRACT-004 — Contract Activation
Contract hanya dapat berstatus:
ACTIVE
setelah:
Talent Agreement + Hirer Agreement
dan seluruh requirement sebelumnya telah terpenuhi.
FR-CONTRACT-005 — Contract Lifecycle
Lifecycle contract:
DRAFT
  ↓
PENDING_AGREEMENT
  ↓
ACTIVE
  ↓
COMPLETED
Contract juga dapat berakhir melalui:
TERMINATED

5.11 Payment
FR-PAY-001 — Simulated Payment
Sistem harus menyediakan simulated payment untuk menunjukkan alur pembayaran pada MVP.
FR-PAY-002 — Payment Status
Sistem harus mencatat status pembayaran:
PENDING
   ↓
SIMULATED_PAID
   ↓
RELEASED
FR-PAY-003 — No Real Transaction
MVP tidak boleh memproses transaksi uang nyata.
FR-PAY-004 — Payment Release
Payment hanya dapat berstatus RELEASED setelah kondisi completion yang diperlukan terpenuhi.

5.12 Work Management
FR-WORK-001 — Work Creation
Sistem harus membuat record pekerjaan berdasarkan contract yang berstatus ACTIVE.
FR-WORK-002 — Work Status
Sistem harus menyediakan status:
NOT_STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED
FR-WORK-003 — Work Completion
Work hanya dapat ditandai COMPLETED setelah pekerjaan dinyatakan selesai oleh pihak yang memiliki kewenangan.

5.13 Completion Confirmation
FR-COMP-001 — HIRER Confirmation
Sistem harus memungkinkan HIRER mengonfirmasi bahwa pekerjaan telah selesai.
HIRER hanya dapat melakukan confirmation terhadap work yang berada dalam scope contract dan opportunity miliknya.
FR-COMP-002 — Completion Verification
Setelah HIRER melakukan confirmation, sistem dapat melanjutkan proses menuju:
Payment Release
Rating & Review
Verified Work History

5.14 Rating & Review
FR-RATE-001 — Two-Way Rating
Sistem harus memungkinkan:
TALENT memberikan rating kepada HIRER.
HIRER memberikan rating kepada TALENT.
FR-RATE-002 — Rating Range
Rating menggunakan skala:
1–5
FR-RATE-003 — Review
Sistem harus memungkinkan user memberikan review setelah pekerjaan selesai.
FR-RATE-004 — Rating Availability
Rating hanya dapat diberikan setelah:
WORK COMPLETED
dan completion telah dikonfirmasi.
User hanya dapat memberikan rating sebagai pihak yang terlibat dalam work tersebut.

5.15 Verified Work History
FR-WH-001 — Record Experience
Sistem harus mencatat pekerjaan yang berhasil diselesaikan melalui platform.
FR-WH-002 — Verification
Work History dapat menjadi:
VERIFIED
setelah HIRER melakukan completion confirmation.
FR-WH-003 — Work History Display
TALENT harus dapat melihat Work History yang berkaitan dengan dirinya.
FR-WH-004 — Verification Override
ADMIN dapat melakukan verification override apabila terdapat laporan atau kasus khusus yang membutuhkan pemeriksaan.

5.16 Reporting & Moderation
FR-REPORT-001 — Create Report
User harus dapat membuat report terhadap user, opportunity,
atau aktivitas yang dianggap melanggar aturan.
Report yang baru dibuat harus memiliki status:
SUBMITTED
FR-REPORT-002 — View Report
ADMIN harus dapat melihat report yang masuk.
FR-REPORT-003 — Review Report
ADMIN harus dapat melakukan review terhadap report.
FR-REPORT-004 — Moderation Action
ADMIN dapat melakukan tindakan seperti:
Warning
Suspend User
Remove Opportunity
Resolve Report
Reject Report
FR-REPORT-005 — Auditability
Tindakan administratif penting harus dicatat untuk kebutuhan accountability dan traceability.


6. Data Requirements / Entity Model
Data Requirements mendefinisikan entity utama yang diperlukan sistem beserta hubungan dan aturan dasarnya. Entity ini menjadi dasar untuk pembuatan ERD dan database schema.
6.1 Core Entities
Sistem minimal memiliki entity:
User
Talent Profile
Hirer Profile
Skill
Interest
Talent Skill
Talent Interest
Opportunity
Opportunity Skill
Opportunity Interest
Application
Meeting
Consent
Contract
Payment
Work
Rating
Review
Work History
Report
Admin Action / Audit Log

6.2 User
Entity User menyimpan informasi dasar akun.
Data minimal:
User ID
Name
Email / Username
Password Credential
Role
Account Status
Created At
Updated At
Role:
TALENT
HIRER
ADMIN

6.3 Talent Profile
Talent Profile menyimpan informasi khusus TALENT.
Relationship:
User 1 : 1 Talent Profile
Data dapat mencakup:
Profile ID
User ID
Bio
Education
Location
Portfolio
Profile Status

6.4 Hirer Profile
Hirer Profile menyimpan informasi pihak yang menyediakan opportunity.
Relationship:
User 1 : 1 Hirer Profile
Data dapat mencakup:
Profile ID
User ID
Organization Name
Organization Type
Description
Location
Profile Status

6.5 Skill
Entity Skill menyimpan daftar skill yang digunakan sistem.
Relationship:
TALENT M : N Skill
dan:
Opportunity M : N Skill
Karena itu diperlukan entity penghubung:
Talent Skill
Opportunity Skill

6.6 Interest
Entity Interest menyimpan daftar interest yang digunakan sistem.
Relationship:
TALENT M : N Interest
dan:
Opportunity M : N Interest
Karena itu diperlukan entity penghubung:
Talent Interest
Opportunity Interest

6.7 Opportunity
Entity Opportunity menyimpan opportunity yang dibuat HIRER.
Relationship:
HIRER 1 : N Opportunity
Data minimal:
Opportunity ID
Hirer ID
Title
Description
Opportunity Type
Location
Start Date
End Date
Working Hours
Duration
Compensation
Requirements
Application Deadline
Status
Created At
Updated At
Status:
DRAFT
PENDING_REVIEW
PUBLISHED
CLOSED

6.8 Application
Application menghubungkan TALENT dengan Opportunity.
Relationship:
TALENT 1 : N Application
Opportunity 1 : N Application
Data minimal:
Application ID
Talent ID
Opportunity ID
Application Date
Application Status
Notes / Message
Created At
Updated At
Canonical Status:
APPLIED
UNDER_REVIEW
SELECTED
REJECTED

6.9 Meeting
Meeting menyimpan informasi pertemuan antara TALENT dan HIRER.
Relationship:
Application / Selection 1 : N Meeting
Data dapat mencakup:
Meeting ID
Application ID
Date
Time
Method
Location / Meeting Information
Status
Status:
SCHEDULED
COMPLETED
CANCELLED

6.10 Consent
Consent menyimpan informasi simulated parental / guardian consent apabila diperlukan.
Relationship:
Application / Contract 1 : 0..1 Consent
Data:
Consent ID
Talent ID
Opportunity ID
Required
Status
Created At
Updated At
Status:
PENDING
APPROVED
REJECTED
Consent digunakan sebagai simulated declaration dan tidak membuat Guardian menjadi independent platform user.

6.11 Contract
Contract menyimpan simulated agreement antara TALENT dan HIRER.
Relationship:
Application 1 : 0..1 Contract
Data minimal:
Contract ID
Application ID
Talent ID
Hirer ID
Opportunity ID
Compensation
Duration
Responsibilities
Terms
Talent Agreement
Hirer Agreement
Status
Status:
DRAFT
PENDING_AGREEMENT
ACTIVE
COMPLETED
TERMINATED

6.12 Payment
Payment menyimpan simulasi pembayaran.
Relationship:
Contract 1 : 0..1 Payment
Data:
Payment ID
Contract ID
Amount
Payment Type
Status
Created At
Updated At
Status:
PENDING
SIMULATED_PAID
RELEASED

6.13 Work
Work merepresentasikan pekerjaan yang dilakukan berdasarkan contract.
Relationship:
Contract 1 : 1 Work
Data:
Work ID
Contract ID
Start Date
End Date
Status
Completion Date
Hirer Confirmation
Status:
NOT_STARTED
IN_PROGRESS
COMPLETED

6.14 Rating
Rating menyimpan penilaian antara TALENT dan HIRER.
Relationship:
Work 1 : N Rating
Data:
Rating ID
Work ID
Reviewer ID
Reviewed User ID
Score
Created At
Score:
1–5

6.15 Review
Review menyimpan komentar atau review dari user.
Relationship:
Rating 1 : 0..1 Review
Data:
Review ID
Rating ID
Content
Created At

6.16 Work History
Work History menyimpan pengalaman kerja yang diperoleh TALENT.
Relationship:
TALENT 1 : N Work History
dan:
Work 1 : 0..1 Work History
Data:
Work History ID
Talent ID
Work ID
Opportunity ID
Hirer ID
Title
Duration
Completion Date
Verification Status
Verification status:
PENDING
VERIFIED
REJECTED

6.17 Report
Report menyimpan laporan yang dibuat user.
Relationship:
User 1 : N Report
Data:
Report ID
Reporter ID
Target Type
Target ID
Reason
Description
Status
Created At
Updated At
Resolved At
Status:
SUBMITTED
UNDER_REVIEW
RESOLVED
REJECTED

6.18 Admin Action / Audit Log
Entity ini digunakan untuk mencatat tindakan administratif penting.
Data minimal:
Log ID
Admin ID
Action Type
Target Type
Target ID
Reason
Created At
Contoh action:
User Suspended
User Reactivated
Opportunity Approved
Opportunity Rejected
Opportunity Removed
Report Resolved
Verification Override

6.19 Core Entity Relationships
Secara konseptual hubungan utama sistem adalah:
User
 │
 ├── TALENT Profile
 │      │
 │      ├── Skills
 │      ├── Interests
 │      ├── Applications
 │      └── Work History
 │
 └── HIRER Profile
        │
        └── Opportunities

Core Experience Flow
Opportunity
    ↓
Application
    ↓
Selection
    ↓
Meeting
    ↓
Consent (if required)
    ↓
Contract
    ↓
Payment
    ↓
Work
    ↓
Completion
    ↓
Rating / Review
    ↓
Verified Work History

Admin Flow
ADMIN
   ↓
Moderation
   ↓
Reports
   ↓
Verification
   ↓
Admin Action / Audit Log


6.20 Data Integrity Rules
Sistem harus menerapkan aturan dasar:
Setiap User memiliki satu role utama.
Role menggunakan TALENT, HIRER, atau ADMIN.
TALENT hanya dapat mengakses fitur yang diperbolehkan untuk role TALENT.
HIRER hanya dapat mengelola opportunity miliknya sendiri.
ADMIN memiliki kewenangan moderation sesuai authorization.
Satu application menghubungkan satu TALENT dengan satu Opportunity.
Application hanya dapat diproses melalui status transition yang valid.
Contract hanya dapat dibuat dari application yang telah SELECTED.
Contract hanya dapat menjadi ACTIVE setelah seluruh requirement dan agreement terpenuhi.
Work hanya dapat dibuat berdasarkan contract ACTIVE.
Rating hanya dapat diberikan setelah work COMPLETED dan completion dikonfirmasi.
Verified Work History hanya dapat dibuat dari work yang telah dikonfirmasi selesai.
Opportunity CLOSED tidak menerima application baru.
Consent yang diwajibkan dan berstatus REJECTED harus memblokir aktivasi contract.
User tidak boleh mengubah data yang bukan menjadi kewenangannya.
ADMIN action penting harus dapat ditelusuri melalui audit log.

6.21 Data Model Principle
Data model Flex Network harus mendukung tiga prinsip utama:
Identity
Siapa user dan role yang dimilikinya.
Opportunity
Opportunity apa yang tersedia dan siapa yang menyediakannya.
Experience
Bagaimana opportunity berkembang menjadi application, contract, work, rating, dan verified work history.
Dengan demikian, data model tidak hanya menyimpan data pengguna dan opportunity, tetapi juga mendukung end-to-end experience lifecycle yang menjadi inti sistem Flex Network.

7. Non-Functional Requirements
7.1 Performance
ID
Requirement
NFR-01
Operasi normal sistem diharapkan memberikan response dalam ≤ 3 detik.
NFR-02
Sistem harus memproses request secara efisien.

7.2 Security
ID
Requirement
NFR-03
Sistem harus menyediakan authentication yang aman.
NFR-04
Sistem harus menerapkan role-based access control.
NFR-05
Sistem harus melakukan validasi terhadap input user.
NFR-06
Data personal user harus dilindungi.
NFR-07
Informasi sensitif tidak boleh ditampilkan kepada pihak yang tidak memiliki kewenangan.
NFR-08
Authorization dan ownership validation harus dilakukan pada sisi server/database sesuai arsitektur sistem.

7.3 Privacy
ID
Requirement
NFR-09
Sistem harus menjaga data personal pengguna.
NFR-10
Data TALENT di bawah umur harus mendapatkan perlindungan yang sesuai.
NFR-11
MVP harus menerapkan data minimization untuk informasi minor.

7.4 Availability
ID
Requirement
NFR-12
Sistem harus dapat digunakan selama periode demo dan penilaian lomba tanpa downtime yang tidak direncanakan.
NFR-13
Jika terjadi kegagalan, sistem harus memberikan feedback yang jelas dan tidak menampilkan informasi teknis sensitif.

7.5 Usability
ID
Requirement
NFR-14
Interface harus mudah dipahami oleh target utama.
NFR-15
Komponen UI dan interaction pattern harus konsisten.
NFR-16
Sistem harus memberikan feedback yang jelas setelah tindakan pengguna.

7.6 Responsiveness
ID
Requirement
NFR-17
Sistem harus dapat digunakan pada Desktop, Tablet, dan Mobile.

7.7 Scalability
ID
Requirement
NFR-18
Sistem harus dirancang secara modular sehingga fitur baru dapat ditambahkan tanpa perubahan besar terhadap keseluruhan sistem.
NFR-19
Struktur sistem harus memungkinkan pengembangan fitur di masa depan.

7.8 Maintainability
ID
Requirement
NFR-20
Implementasi sistem harus menggunakan struktur kode yang terorganisir dan mudah dipelihara.
NFR-21
Komponen sistem harus memiliki tanggung jawab yang jelas.
NFR-22
Komponen dan fungsi penting harus memiliki dokumentasi yang cukup.

7.9 Compatibility
ID
Requirement
NFR-23
Sistem harus berjalan pada browser modern.
NFR-24
UI harus tetap dapat digunakan pada berbagai resolusi layar.

7.10 Accessibility
ID
Requirement
NFR-25
Text dan informasi penting harus dapat dibaca dengan jelas.
NFR-26
Contrast harus memadai.
NFR-27
Form dan interactive elements harus memiliki label atau indikator yang jelas.
NFR-28
Informasi penting tidak boleh hanya disampaikan melalui warna.

7.11 Deployment Requirements
ID
Requirement
NFR-29
Flex Network harus dapat diakses melalui web browser.
NFR-30
MVP harus dapat diakses melalui public URL selama proses penilaian lomba.
NFR-31
Jika diperlukan, sistem dapat memiliki environment terpisah untuk development dan production.

7.12 Competition Constraints
ID
Requirement
NFR-32
Sistem harus mematuhi ketentuan teknologi, hosting, penggunaan AI, keamanan data, dan submission lomba.
NFR-33
Jika AI digunakan, penggunaannya harus mengikuti aturan lomba dan tidak boleh digunakan untuk melanggar ketentuan kompetisi.


8. UI/UX Requirements
UI/UX Flex Network harus dirancang untuk memberikan pengalaman yang sederhana, jelas, dan mudah dipahami oleh TALENT dan HIRER, terutama karena target utama mencakup Pelajar SMA/SMK.
8.1 General UI Requirements
ID
Requirement
UI-01
Responsive Interface — Tampilan harus responsif pada Desktop, Tablet, dan Mobile.
UI-02
Consistent Design — Elemen visual dan interaction pattern harus konsisten.
UI-03
Clear Navigation — Pengguna harus dapat berpindah antar fitur utama dengan mudah.
UI-04
Clear Information Hierarchy — Informasi penting harus mudah ditemukan.
UI-05
Clear System Feedback — Sistem harus memberikan feedback setelah tindakan pengguna.

8.2 TALENT Interface
UI harus memprioritaskan proses:
Discover
   ↓
Evaluate
   ↓
Apply
   ↓
Track
   ↓
Work

8.3 HIRER Interface
UI harus memprioritaskan:
Create
   ↓
Review
   ↓
Select
   ↓
Contract
   ↓
Manage

8.4 Opportunity Card
Minimal menampilkan:
Title
HIRER / Company
Opportunity Type
Required Skills
Location / Work Mode
Duration
Compensation
Status
8.5 Opportunity Detail
Minimal menampilkan:
Title
HIRER information
Description
Responsibilities
Required skills
Preferred interests
Location
Work mode
Duration
Compensation
Requirements
Application deadline
Apply button
8.6 Application Status
Status harus jelas:
Applied
   ↓
Under Review
   ↓
Selected / Rejected

Status backend dapat menggunakan canonical enum, sedangkan UI dapat menampilkan label yang lebih mudah dipahami pengguna.

Pemetaan lengkap antara canonical enum dan label UI Indonesia
didefinisikan pada Section 12.15.
8.7 Meeting Interface
Menampilkan:
Date
Time
Method
Location / Information
Status
8.8 Consent Interface
Menampilkan:
Consent requirement
Consent status
Declaration information
Result
MVP tidak menampilkan Guardian Dashboard atau Guardian Account.
8.9 Contract Interface
Menampilkan:
Opportunity
Parties
Responsibilities
Duration
Compensation
Terms
Contract status
Agreement state
8.10 Profile Interface
TALENT Profile
Profile information
Education
Skills
Interests
Portfolio
Verified Work History
HIRER Profile
Company / Hirer information
Description
Industry
Location
Opportunity history
8.11 Trust & Verification UI
Sistem harus memberikan indikator yang mudah dipahami untuk:
Verified Work History
Rating
Review
Verification status
8.12 Form Requirements
Form harus:
Memiliki label yang jelas.
Menunjukkan field wajib.
Melakukan validasi input.
Memberikan pesan error yang mudah dipahami.
Memberikan feedback setelah submit berhasil.
8.13 Accessibility
UI harus mempertimbangkan accessibility dasar seperti:
Text dapat dibaca dengan jelas.
Contrast memadai.
Interactive element mudah dikenali.
Form memiliki label.
Informasi penting tidak hanya disampaikan melalui warna.
8.14 Error & Empty State
Sistem harus menyediakan tampilan untuk:
Empty state
Error state
Loading state
8.15 Confirmation & Critical Actions
Tindakan penting harus memberikan confirmation sebelum dilakukan.
Contoh:
Delete opportunity
Close opportunity
Reject applicant
Reject contract
Submit report
8.16 UI/UX Design Consistency
UI/UX harus menggunakan design system yang konsisten, termasuk:
Typography
Spacing
Button
Form
Card
Modal
Badge
Status indicator
Navigation
Icons
Detail design token, font, warna, component library, dan implementasi UI ditentukan pada tahap UI/UX Design dan Technical Design Document.
8.17 Core Navigation
TALENT
Home
├── Opportunities
├── Applications
├── Work
├── Work History
└── Profile

HIRER
Dashboard
├── Opportunities
├── Applicants
├── Contracts
├── Work
└── Profile

ADMIN
Admin Dashboard
├── Users
├── Opportunities
├── Reports
├── Verification
└── Audit Logs


9. System Constraints & Business Rules
9.1 Account & Role Rules
Setiap akun memiliki satu role utama.
Role sistem adalah TALENT, HIRER, atau ADMIN.
User hanya dapat mengakses fungsi sesuai role dan authorization.
Role tidak boleh ditentukan atau dipercaya hanya berdasarkan client-side input.
Authorization harus diverifikasi pada server.
9.2 Authorization Rules
Setiap request terhadap resource protected harus melalui urutan:
Request
   ↓
Authentication Check
   ↓
Role Check
   ↓
Resource Ownership Check
   ↓
Business Rule Check
   ↓
Process Request
Apabila salah satu pemeriksaan gagal, request harus dihentikan.
9.3 Resource Ownership Rules
User hanya dapat mengakses atau memodifikasi resource yang:
Dimilikinya sendiri; atau
Secara eksplisit termasuk dalam kewenangan role user tersebut.
TALENT
TALENT hanya dapat:
Mengubah profile miliknya sendiri.
Mengelola skill dan interest miliknya sendiri.
Melihat application miliknya sendiri.
Melihat meeting yang berkaitan dengannya.
Melihat consent yang berkaitan dengannya.
Melihat contract yang melibatkan dirinya.
Mengelola work yang memang menjadi bagian dari contract miliknya.
Melihat Work History miliknya.
Memberikan rating sebagai pihak yang terlibat.
HIRER
HIRER hanya dapat:
Mengubah profile miliknya sendiri.
Membuat dan mengelola opportunity miliknya sendiri.
Melihat application pada opportunity miliknya.
Melakukan review dan selection pada application dalam scope opportunity miliknya.
Mengelola meeting pada application dalam scope opportunity miliknya.
Mengelola contract dalam scope opportunity miliknya.
Melakukan payment operation sesuai kewenangan dan business rules.
Mengonfirmasi completion pada work yang berkaitan dengan contract miliknya.
Memberikan rating sebagai pihak yang terlibat.
ADMIN
ADMIN dapat melakukan tindakan administratif sesuai authorization, termasuk:
User management
Opportunity moderation
Report handling
Verification
Audit log access
ADMIN tetap harus melalui authentication dan authorization.
9.4 Server-Side Authorization Rules
Authorization tidak boleh hanya dilakukan melalui:
Hidden UI element
Disabled button
Client-side role check
Route restriction pada frontend
Validasi authorization harus dilakukan pada server sebelum operasi dijalankan.
Contoh:
HIRER A
   ↓
PATCH Opportunity B
   ↓
Authentication ✅
Role = HIRER ✅
Ownership Check ❌
   ↓
ACCESS DENIED
9.5 Database-Level Security Rules
Application-layer authorization harus didukung oleh database-level protection sesuai arsitektur sistem.
Untuk Supabase PostgreSQL:
Row Level Security (RLS)
digunakan sebagai defense-in-depth.
Prinsip:
Server Authorization
        +
Database RLS
        ↓
Defense in Depth
RLS tidak menggantikan server-side authorization.
9.6 Sensitive Operation Rules
Operasi berikut harus selalu melewati authentication, authorization, ownership validation, dan business-rule validation:
Create Opportunity
Submit Application
Review Application
Select Application
Reject Application
Schedule Meeting
Process Consent
Create Contract
Agree Contract
Change Payment State
Update Work Status
Confirm Work Completion
Submit Rating
Submit Report
Admin Moderation
Verification Override
9.7 Opportunity Rules
Opportunity dibuat oleh HIRER.
HIRER hanya dapat mengelola opportunity miliknya sendiri.
Opportunity harus memiliki informasi minimum sebelum dipublikasikan.
Opportunity dengan status DRAFT tidak dapat menerima application.
Opportunity harus melalui moderation sesuai workflow.
Opportunity dengan status CLOSED tidak menerima application baru.
ADMIN dapat melakukan moderation sesuai authorization.
9.8 Application Rules
Hanya TALENT yang dapat melakukan application.
TALENT tidak dapat apply pada opportunity CLOSED.
Duplicate application harus dicegah.
HIRER hanya dapat mengelola application pada opportunity miliknya.
Application harus mengikuti canonical status transition:
APPLIED
   ↓
UNDER_REVIEW
   ├──→ SELECTED
   └──→ REJECTED
9.9 Matching Rules
Matching harus menggunakan:
Skill TALENT
Interest TALENT
Required Skills opportunity
Relevant Interests opportunity
Weighted Formula
Sistem menggunakan formula:
Skill Match = (Matched Skills / Required Skills) × 100
Interest Match = (Matched Interests / Relevant Interests) × 100
Final Match Score = (Skill Match × 70%) + (Interest Match × 30%)
Weight
Skill = 70%
Interest = 30%
Edge Case
Apabila opportunity tidak memiliki required skills:
Skill Match = 100
Apabila opportunity tidak memiliki relevant interests:
Interest Match = 100
Hal tersebut mencegah division by zero dan memastikan opportunity yang memang tidak mensyaratkan skill atau interest tidak memperoleh score 0 hanya karena field requirement kosong.
Classification
80–100 → STRONG_MATCH
60–79  → GOOD_MATCH
30–59  → WEAK_MATCH
0–29   → NO_MATCH
Business Rule
Matching:
bukan automatic hiring.
Matching hanya digunakan untuk:
Recommendation / Decision Support
Keputusan akhir tetap dilakukan oleh HIRER.
9.10 Meeting Rules
Meeting merupakan bagian dari proses sebelum contract.
Meeting hanya dapat dibuat untuk application yang memenuhi requirement.
Meeting tidak harus dilakukan melalui platform.
Meeting memiliki status:
SCHEDULED
COMPLETED
CANCELLED
Contract tidak dapat dilanjutkan sebelum meeting berstatus COMPLETED.
User hanya dapat mengakses meeting yang berkaitan dengannya atau berada dalam kewenangannya.
9.11 Consent Rules
Consent hanya digunakan apabila opportunity atau kondisi TALENT membutuhkan consent.
Consent requirement ditentukan server-side.
MVP menggunakan simulated consent declaration.
Tidak ada independent Guardian Account.
Tidak ada independent Guardian Authentication.
Consent REJECTED memblokir contract activation.
Consent APPROVED memungkinkan proses contract berlanjut apabila seluruh requirement lain terpenuhi.
Akses terhadap data consent harus mengikuti ownership dan authorization rules.
9.12 Contract Rules
Contract hanya dapat dibuat untuk application yang SELECTED.
Meeting harus COMPLETED.
Jika consent diperlukan, consent harus APPROVED.
TALENT dan HIRER hanya dapat melakukan agreement terhadap contract yang melibatkan dirinya.
Contract harus disetujui oleh TALENT dan HIRER sebelum menjadi ACTIVE.
User tidak dapat mengubah contract yang bukan berada dalam kewenangannya.
9.13 Payment Rules
Payment pada MVP bersifat simulated payment.
MVP tidak melakukan transaksi uang nyata.
Payment harus berkaitan dengan contract yang valid.
Payment mengikuti:
PENDING
   ↓
SIMULATED_PAID
   ↓
RELEASED
Payment state change harus diverifikasi server-side.
User tidak dapat menentukan payment state secara langsung melalui client input.
9.14 Work Completion Rules
Work hanya dapat dilakukan berdasarkan contract ACTIVE.
Work mengikuti:
NOT_STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED
Work hanya dapat diakses oleh pihak yang terlibat atau ADMIN sesuai authorization.
HIRER melakukan completion confirmation setelah pekerjaan selesai.
Completion confirmation hanya dapat dilakukan oleh HIRER yang berwenang terhadap work tersebut.
9.15 Rating & Review Rules
TALENT dapat memberikan rating kepada HIRER setelah pekerjaan selesai.
HIRER dapat memberikan rating kepada TALENT setelah pekerjaan selesai.
Rating hanya dapat diberikan oleh pihak yang terlibat dalam work.
Rating hanya dapat dilakukan setelah completion confirmation.
User tidak dapat memberikan rating atas nama user lain.
Duplicate rating pada arah yang sama harus dicegah.
9.16 Verified Work History Rules
Work History dibuat dari work yang diselesaikan melalui platform.
Work History dapat menjadi VERIFIED setelah HIRER melakukan completion confirmation.
TALENT tidak dapat secara manual menandai pengalaman sebagai VERIFIED.
ADMIN dapat melakukan verification override apabila dibutuhkan.
User hanya dapat melihat data Work History sesuai visibility dan authorization yang berlaku.
9.17 Reporting Rules
TALENT dan HIRER dapat membuat report.
Report harus memiliki informasi yang diperlukan.
User hanya dapat melihat report yang dimilikinya atau yang secara eksplisit berada dalam kewenangannya.
ADMIN bertanggung jawab melakukan review report.
Tindakan administratif terhadap report harus dicatat melalui audit log.
9.18 Data Ownership Rules
User hanya dapat mengubah profile miliknya sendiri.
HIRER hanya dapat mengubah opportunity miliknya sendiri.
TALENT hanya dapat mengakses application yang berkaitan dengannya.
TALENT dan HIRER hanya dapat mengakses meeting yang berkaitan dengan dirinya.
Contract hanya dapat diakses oleh TALENT, HIRER, atau ADMIN sesuai authorization.
Work hanya dapat diakses dan diubah oleh pihak yang berwenang.
User tidak dapat mengubah data user lain tanpa permission.
ADMIN action harus dilakukan berdasarkan authorization.
Ownership check harus dilakukan pada server.
9.19 Privacy & Sensitive Data Rules
User hanya menerima data yang memang diperlukan dan diizinkan oleh sistem.
Data personal user lain tidak boleh terekspos hanya karena user berhasil login.
Public profile tidak boleh menampilkan data sensitif yang tidak diperlukan.
Data minor harus diproses berdasarkan prinsip data minimization.
Sensitive operation dan sensitive data harus tetap berada dalam batas authorization yang sesuai.
9.20 MVP Constraints
MVP:
Tidak menggunakan real payment gateway.
Tidak menggunakan real escrow.
Tidak menyediakan Guardian Account.
Tidak menyediakan Guardian Dashboard.
Tidak menyediakan independent Guardian authentication.
Tidak menyediakan video call internal.
Tidak menggunakan advanced AI matching sebagai requirement utama.
Authorization tetap dilakukan server-side.
RLS digunakan sebagai defense-in-depth.
Berfokus pada core flow.
Core Flow
Opportunity
    ↓
Application
    ↓
Selection
    ↓
Meeting
    ↓
Consent if Required
    ↓
Contract
    ↓
Work
    ↓
Completion
    ↓
Rating
    ↓
Verified Work History


10. External System & Integration Requirements
10.1 Authentication Service
Sistem dapat menggunakan layanan authentication eksternal untuk:
Registration
Login
Session management
Password management
Provider ditentukan pada Technical Design Document.
Status MVP: Optional
10.2 Email Service
Dapat digunakan untuk:
Registration confirmation
Application status
Meeting notification
Contract notification
Status MVP: Optional
10.3 File / Object Storage
Dapat digunakan untuk:
Profile photo
Portfolio
Dokumen pendukung
Contract document
Status MVP: Optional
10.4 Payment Gateway
Tidak diperlukan pada MVP.
MVP menggunakan simulated payment.
Status MVP: Tidak diperlukan
10.5 Video Conference
Tidak diperlukan pada MVP.
Meeting dilakukan melalui metode yang disepakati TALENT dan HIRER.
Status MVP: Tidak diperlukan
10.6 Notification Service
Sistem dapat menyediakan notification untuk:
Application update
Meeting schedule
Contract update
Work completion
Status MVP: Recommended
10.7 Admin & Moderation
ADMIN tidak membutuhkan external moderation system untuk MVP.
Moderation dilakukan melalui Admin Dashboard.
10.8 Integration Priority
External System
MVP
Priority
Authentication Service
Optional
Medium
Email Service
Optional
Low
File Storage
Optional
Medium
Payment Gateway
❌
—
Video Conference
❌
—
Notification Service
✅
Medium
External Moderation Service
❌
—


11. System Error Handling & Validation Requirements
11.1 Input Validation
Sistem harus:
Memvalidasi input sebelum diproses.
Memastikan required field tidak kosong.
Memvalidasi format data.
Memberikan pesan error yang jelas.
11.2 Registration Validation
Validasi:
Email
Password
Role
Required profile information
Email yang sudah terdaftar tidak dapat digunakan untuk membuat akun baru.
11.3 Login Error
Authentication failure harus memberikan pesan yang aman.
Contoh:
Invalid email or password.
11.4 Authorization Error
User yang tidak memiliki permission harus menerima pesan:
Access denied.
11.5 Resource Ownership Validation
Sistem harus memvalidasi ownership sebelum user mengubah resource.
Berlaku untuk:
Opportunity
Application
Contract
Profile
Work
Work History
Report
11.6 Opportunity Validation
Opportunity harus memiliki required information sebelum dipublikasikan.
11.7 Application Validation
Sistem harus mencegah:
User bukan TALENT melakukan application.
Application ke opportunity CLOSED.
Duplicate application.
Application yang melanggar requirement sistem.
Application harus menggunakan status canonical yang valid.
11.8 Meeting Validation
Meeting hanya dapat dibuat apabila application telah memenuhi kondisi yang diperlukan.
11.9 Contract Validation
Contract hanya dapat dibuat apabila:
Application = SELECTED
        +
Meeting = COMPLETED
        +
Consent = APPROVED / NOT_REQUIRED
        ↓
Contract

11.10 Payment Validation
Simulated payment hanya dapat dilakukan terhadap contract yang valid.
11.11 Work Completion Validation
Work tidak dapat menjadi COMPLETED apabila contract belum ACTIVE.
11.12 Completion Confirmation Validation
Completion confirmation hanya dapat dilakukan oleh HIRER yang berwenang terhadap work tersebut.
11.13 Rating Validation
Rating hanya dapat diberikan apabila:
User merupakan pihak yang terlibat.
Contract berkaitan dengan user.
Work status = COMPLETED.
Completion telah dikonfirmasi.
Rating untuk arah tersebut belum diberikan.
11.14 Parental Consent Validation
Jika consent diperlukan:
Consent Required
      ↓
PENDING
      ↓
Approved?
   ┌──┴──┐
  Yes    No
   ↓      ↓
Continue  Stop

11.15 Error Categories
Sistem menangani:
Validation Error
Authentication Error
Authorization Error
Resource Error
Conflict Error
Business Rule Error
Server Error
Network Error
11.16 User-Friendly Error Message
Error harus:
Jelas
Singkat
Menjelaskan masalah
Jika memungkinkan memberikan tindakan yang dapat dilakukan user
Sistem tidak boleh menampilkan informasi teknis sensitif.
11.17 Unexpected System Error
Jika terjadi error tidak terduga:
Sistem menampilkan pesan error yang aman.
Sistem tidak menampilkan informasi internal.
Sistem tidak menyebabkan data rusak.
User dapat mencoba kembali jika memungkinkan.
11.18 Error Logging
Sistem harus menyediakan mekanisme pencatatan error untuk kebutuhan debugging dan maintenance.
Detail implementasi ditentukan pada Technical Design Document.
11.19 Validation Principle
User Action
    ↓
Input Validation
    ↓
Authentication Check
    ↓
Authorization Check
    ↓
Ownership Check
    ↓
Business Rule Check
    ↓
Process Request
    ↓
Success / Error Response


12. System States & Status Definitions
12.1 User Account Status
ACTIVE
SUSPENDED
DEACTIVATED

12.2 Opportunity Status
DRAFT
   ↓
PENDING_REVIEW
   ↓
PUBLISHED
   ↓
CLOSED

12.3 Application Status
Canonical application status:
APPLIED
   ↓
UNDER_REVIEW
   ├──→ SELECTED
   └──→ REJECTED

12.4 Meeting Status
SCHEDULED
   ↓
COMPLETED

Meeting juga dapat berstatus:
CANCELLED
12.5 Parental Consent Status
Jika consent tidak diperlukan:
NOT_REQUIRED
Jika diperlukan:
PENDING
   ↓
APPROVED / REJECTED

12.6 Contract Status
DRAFT
   ↓
PENDING_AGREEMENT
   ↓
ACTIVE
   ↓
COMPLETED

Contract juga dapat berakhir melalui:
TERMINATED
12.7 Payment Status
Karena MVP menggunakan simulated payment:
PENDING
   ↓
SIMULATED_PAID
   ↓
RELEASED

Status tersebut hanya merepresentasikan simulasi dan tidak menunjukkan transaksi uang nyata.
12.8 Work Status
NOT_STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED

12.9 Rating Status
Rating tidak menggunakan status eksplisit.
Keberadaan record rating menentukan apakah rating sudah diberikan.
Jika belum ada record rating untuk suatu arah, maka dianggap belum dinilai.
12.10 Work History Verification Status
PENDING
   ↓
VERIFIED / REJECTED

Work History yang berasal dari work yang telah diselesaikan dan dikonfirmasi dapat ditandai sebagai VERIFIED.
12.11 Report Status
SUBMITTED
   ↓
UNDER_REVIEW
   ├──→ RESOLVED
   └──→ REJECTED

12.12 Status Transition Rules
Tidak semua status dapat berpindah secara bebas.
Opportunity
DRAFT
   ↓
PENDING_REVIEW
   ↓
PUBLISHED
   ↓
CLOSED

Application
APPLIED
   ↓
UNDER_REVIEW
   ├──→ SELECTED
   └──→ REJECTED

Tidak boleh:
APPLIED → CONTRACT ❌

Karena harus melalui:
APPLIED
   ↓
UNDER_REVIEW
   ↓
SELECTED
   ↓
MEETING COMPLETED
   ↓
CONSENT APPROVED / NOT_REQUIRED
   ↓
CONTRACT

12.13 Core System State Flow
                   OPPORTUNITY
                         │
                     PUBLISHED
                         │
                         ▼
                    APPLICATION
                         │
                    UNDER_REVIEW
                         │
                  SELECTED / REJECTED
                         │
                     SELECTED
                         │
                         ▼
                      MEETING
                         │
                 MEETING COMPLETED
                         │
                         ▼
                PARENTAL CONSENT*
                         │
                  APPROVED / NOT_REQUIRED*
                         │
                         ▼
                     CONTRACT
                         │
                       ACTIVE
                         │
                         ▼
                       WORK
                         │
                     COMPLETED
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
          PAYMENT                 RATING
             │                       │
          RELEASED              REVIEW
             │
             └───────────┐
                         ▼
                VERIFIED WORK HISTORY

* Jika consent diperlukan

12.14 Status Consistency
Status pada seluruh sistem harus:
Menggunakan nama yang konsisten.
Menggunakan canonical terminology yang telah ditentukan.
Memiliki definisi yang jelas.
Memiliki transisi yang valid.
Tidak dapat diubah secara sembarangan oleh user.
Mengikuti business rules.
Menjadi acuan yang sama untuk frontend, backend, database, API, dan testing.

12.15 Enum ↔ UI Label Mapping
Pemetaan ini mendefinisikan hubungan antara canonical enum yang digunakan oleh backend, database, dan API dengan label Indonesia yang ditampilkan pada layer presentation (UI).
Prinsip:
Canonical enum adalah satu-satunya nilai yang disimpan di database dan dikirim melalui API.
Label Indonesia hanya digunakan pada layer presentation (UI) untuk keterbacaan pengguna.
Label TIDAK menggantikan enum sebagai sumber kebenaran.
Perubahan enum atau label harus diperbarui pada tabel ini terlebih dahulu.
12.15.1 Opportunity Status
Enum
Label UI
Digunakan Pada
DRAFT
Draf
Dashboard HIRER
PENDING_REVIEW
Menunggu Tinjauan
Card/detail opportunity, dashboard ADMIN
PUBLISHED
Terbit
Card discovery, detail opportunity
CLOSED
Ditutup
Card/detail opportunity

12.15.2 Application Status
Enum
Label UI
Digunakan Pada
APPLIED
Diajukan
Card application, detail application
UNDER_REVIEW
Sedang Ditinjau
Card/detail application, dashboard HIRER
SELECTED
Terpilih
Card/detail application
REJECTED
Ditolak
Card/detail application

12.15.3 Meeting Status
Enum
Label UI
Digunakan Pada
SCHEDULED
Terjadwal
Detail meeting
COMPLETED
Selesai
Detail meeting
CANCELLED
Dibatalkan
Detail meeting

12.15.4 Consent Status
Enum
Label UI
Digunakan Pada
NOT_REQUIRED
Tidak Diperlukan
Detail contract/application
PENDING
Menunggu Persetujuan
Detail consent
APPROVED
Disetujui
Detail consent
REJECTED
Ditolak
Detail consent

12.15.5 Contract Status
Enum
Label UI
Digunakan Pada
DRAFT
Draf
Detail contract
PENDING_AGREEMENT
Menunggu Persetujuan
Detail contract
ACTIVE
Aktif
Detail contract, dashboard
COMPLETED
Selesai
Detail contract, history
TERMINATED
Dihentikan
Detail contract

12.15.6 Payment Status
Enum
Label UI
Digunakan Pada
PENDING
Menunggu Pembayaran
Detail payment
SIMULATED_PAID
Pembayaran (Simulasi)
Detail payment
RELEASED
Dana Dilepas
Detail payment

12.15.7 Work Status
Enum
Label UI
Digunakan Pada
NOT_STARTED
Belum Dimulai
Detail work
IN_PROGRESS
Sedang Berjalan
Detail work
COMPLETED
Selesai
Detail work, history

12.15.8 Rating Status (per arah)
Rating tidak memiliki canonical enum tersendiri.
Keberadaan record rating menentukan tampilan status pada UI.

Jika record rating untuk arah tersebut belum ada:
UI menampilkan "Belum Dinilai".

Jika record rating untuk arah tersebut sudah ada:
UI menampilkan "Sudah Dinilai".

Label UI tersebut bukan canonical database status.
12.15.9 Work History Verification Status
Enum
Label UI
Digunakan Pada


PENDING
Menunggu Verifikasi
Card work history


VERIFIED
Terverifikasi ✅
Badge card/profile


REJECTED
Tidak Terverifikasi
Card work history



12.15.10 Report Status
Enum
Label UI
Digunakan Pada
SUBMITTED
Terkirim
Detail report
UNDER_REVIEW
Sedang Ditinjau
Detail report, dashboard ADMIN
RESOLVED
Diselesaikan
Detail report, dashboard ADMIN
REJECTED
Ditolak
Detail report, dashboard ADMIN

12.15.11 Account Status
Enum
Label UI
Digunakan Pada
ACTIVE
Aktif
Admin user management
SUSPENDED
Ditangguhkan
Admin user management
DEACTIVATED
Nonaktif
Admin user management

Aturan Khusus:
Status SIMULATED_PAID harus selalu ditampilkan dengan konteks "(Simulasi)" pada UI agar tidak membingungkan pengguna seolah-olah merupakan transaksi uang nyata.
Status REJECTED pada Work History Verification ditampilkan sebagai "Tidak Terverifikasi".


13. Acceptance Criteria
MVP Flex Network dinyatakan memenuhi kriteria penerimaan apabila seluruh core flow dan requirement utama dapat dijalankan sesuai business rules yang telah ditentukan tanpa error yang menghambat penggunaan sistem.
ID
Skenario
Kriteria Sukses
AC-01
Registrasi & Login
TALENT dan HIRER berhasil membuat akun dan melakukan login sesuai role masing-masing.
AC-02
Membuat Profil
TALENT berhasil melengkapi profile, skill, dan interest. HIRER berhasil melengkapi informasi profile.
AC-03
Membuat & Menemukan Opportunity
HIRER berhasil membuat dan mempublikasikan opportunity. TALENT berhasil menemukan opportunity melalui browse, search, atau filter.
AC-04
Matching & Apply
Sistem membandingkan skill dan interest TALENT dengan requirement opportunity menggunakan weighted matching dengan bobot 70% skill dan 30% interest, menghasilkan Final Match Score 0–100 dan classification STRONG_MATCH, GOOD_MATCH, WEAK_MATCH, atau NO_MATCH. TALENT kemudian dapat membuat application dengan status APPLIED.
AC-05
Seleksi & Meeting
HIRER berhasil melakukan review dan selection terhadap applicant, application menjadi SELECTED, meeting dapat dijadwalkan, dan meeting dapat menjadi COMPLETED.
AC-06
Consent
Untuk opportunity yang membutuhkan consent, simulated consent dapat diproses dan contract tidak dapat diaktifkan sebelum consent APPROVED.
AC-07
Contract & Simulated Payment
Contract berhasil dibuat setelah seluruh requirement terpenuhi, kedua pihak dapat memberikan agreement, contract menjadi ACTIVE, dan simulated payment dapat diproses sesuai lifecycle MVP.
AC-08
Pekerjaan Selesai
TALENT dapat menjalankan pekerjaan berdasarkan contract aktif dan work dapat mencapai COMPLETED.
AC-09
Completion Confirmation
HIRER dapat mengonfirmasi penyelesaian pekerjaan dan sistem melanjutkan proses yang berkaitan dengan completion.
AC-10
Rating & Work History
TALENT dan HIRER dapat memberikan rating setelah completion dan pengalaman tersebut dapat tercatat sebagai Verified Work History.
AC-11
Admin Moderation
ADMIN dapat mengakses dashboard, melihat user, opportunity, report, serta melakukan moderation dan administrative action sesuai kewenangannya.
AC-12
Security & Authorization
User tidak dapat mengakses atau mengubah resource milik user lain tanpa authorization yang sesuai.
AC-13
Error Handling
Sistem memberikan pesan error yang jelas ketika pengguna melakukan tindakan tidak valid atau melanggar business rules.
AC-14
Responsive UI
Halaman utama dan fitur utama dapat digunakan dengan baik pada Desktop, Tablet, dan Mobile.

Matching Acceptance Example
Contoh validasi:
Skill Match    = 80
Interest Match = 66.67

Final Score
= (80 × 0.70) + (66.67 × 0.30)
= 76.00

Classification
= GOOD_MATCH
Nilai Final Match Score dan classification harus ditentukan oleh server dan digunakan sebagai sumber kebenaran untuk recommendation.

Poin 13 — Final Matching Decision
Matching Type: Rule-Based Weighted Matching
Skill Weight: 70%
Interest Weight: 30%
Final Score: (Skill Match × 0.70) + (Interest Match × 0.30)
Score Range: 0–100
Classification: STRONG_MATCH, GOOD_MATCH, WEAK_MATCH, NO_MATCH
Calculation: Server-side
Purpose: Recommendation / Decision Support
Automatic Hiring: Tidak diperbolehkan

Document Status
SRS — Software Requirements Specification
Project: Flex Network
Version: Final rev. 1.2
Total Points: 13
Status: FINAL & LOCKED 🔒
Development Documentation Flow
BRD
 │
 ▼
SRS
 │
 ▼
UI/UX Design
 │
 ▼
Technical Design Document
 │
 ▼
API Specification
 │
 ▼
Development
 │
 ▼
Testing
 │
 ▼
Deployment

— END OF SRS —

