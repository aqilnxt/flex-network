Flex Network - Business Requirements Document (BRD)
Version: Revised & Canonical
Status: FINAL & LOCKED 🔒
Project: Flex Network

1. Target User
1.1 Primary Target
Pelajar SMA/SMK dan Young Talent yang memiliki minat, potensi, dan keterampilan dasar yang ingin dikembangkan melalui pengalaman kerja nyata.
Flex Network membantu mereka mendapatkan kesempatan untuk:
Mengeksplorasi minat dan keterampilan.
Mendapatkan pengalaman kerja nyata.
Mengenal dunia kerja.
Mengembangkan keterampilan.
Membangun rekam jejak pengalaman.
Mempertimbangkan pilihan pendidikan dan karier di masa depan.
Target Utama
Pelajar SMA/SMK dan Young Talent yang ingin mendapatkan pengalaman kerja nyata, mengeksplorasi minat dan keterampilan, serta memahami pilihan jalur pendidikan dan karier mereka.
Dalam konteks sistem, istilah TALENT digunakan sebagai role sistem untuk Young Talent.

1.2 Hirer
Hirer merupakan pihak yang menyediakan opportunity dan membutuhkan Talent.
Hirer dapat berupa:
Perusahaan.
Startup.
UMKM.
Organisasi.
Event Organizer.
Komunitas.
Individu.
Pihak lain yang memiliki kebutuhan opportunity yang relevan.
Hirer dapat membuat dan mengelola opportunity sesuai kebutuhan.
Dalam konteks sistem, HIRER merupakan role sistem untuk pihak penyedia opportunity.

1.3 Admin
Admin merupakan pihak yang bertanggung jawab terhadap moderasi, pengelolaan platform, reporting, verification, dan tindakan administratif sesuai kewenangan.
Dalam konteks sistem, ADMIN merupakan role sistem untuk administrator platform.

2. Core Problem
2.1 Kurangnya Akses terhadap Pengalaman Kerja Nyata
Pelajar SMA/SMK dan Young Talent sering memiliki minat serta keterampilan yang ingin dikembangkan, tetapi tidak selalu mudah mendapatkan kesempatan untuk merasakan pengalaman kerja secara langsung.
Opportunity seperti internship, magang, PKL, project, freelance, temporary work, dan pekerjaan berbasis keterampilan dapat tersebar di berbagai sumber dan sulit ditemukan.
Problem:
Young Talent mengalami keterbatasan akses terhadap opportunity yang dapat memberikan pengalaman kerja nyata.

2.2 Kesulitan Mengeksplorasi Minat dan Keterampilan
Young Talent tidak selalu memiliki gambaran yang jelas mengenai bidang yang sesuai dengan minat dan kemampuan mereka.
Mereka membutuhkan kesempatan untuk mencoba berbagai bidang melalui pengalaman nyata.
Problem:
Young Talent memiliki keterbatasan kesempatan untuk menguji dan mengembangkan minat serta keterampilan melalui pengalaman kerja nyata.

2.3 Kesulitan Mempertimbangkan Pilihan Pendidikan dan Karier
Young Talent dapat menghadapi pilihan untuk melanjutkan pendidikan, memasuki dunia kerja, atau mengeksplorasi bidang lain.
Keputusan tersebut dapat dilakukan tanpa pengalaman yang cukup mengenai dunia kerja.
Problem:
Young Talent perlu mendapatkan pengalaman dan informasi yang lebih nyata untuk membantu mempertimbangkan pilihan pendidikan dan karier.

2.4 Core Problem Statement
Pelajar SMA/SMK dan Young Talent memiliki minat, potensi, atau keterampilan yang ingin dikembangkan, tetapi mengalami keterbatasan akses terhadap pengalaman kerja nyata yang dapat membantu mereka mengeksplorasi kemampuan, memahami dunia kerja, dan mempertimbangkan pilihan pendidikan serta karier di masa depan.

3. Core Solution
Flex Network menyediakan platform digital yang mempertemukan:
TALENT ↔ HIRER ↔ OPPORTUNITY
berdasarkan skill, interest, dan kebutuhan opportunity.
Young Talent dapat:
Membuat profile.
Menambahkan skill.
Menambahkan interest.
Menemukan opportunity.
Mendapatkan recommendation.
Melakukan application.
Mengikuti selection.
Mengikuti meeting.
Menyelesaikan simulated contract.
Mengikuti simulated payment flow.
Menyelesaikan work.
Mendapatkan rating dan review.
Membangun Verified Work History.
Hirer dapat:
Membuat profile.
Membuat opportunity.
Menentukan requirement.
Melihat application.
Melakukan review.
Melakukan selection.
Menjadwalkan meeting.
Mengelola contract.
Mengelola work.
Mengonfirmasi completion.
Memberikan rating dan review.
Admin dapat:
Melakukan moderation.
Mengelola report.
Melakukan verification.
Menangani pelanggaran.
Melakukan administrative action.
Core Solution Flow
Profile
↓
Skills & Interests
↓
Opportunity Discovery
↓
Matching / Recommendation
↓
Application
↓
Review
↓
Selection
↓
Meeting
↓
Consent if Required
↓
Contract
↓
Payment Simulation
↓
Work
↓
Completion
↓
Rating & Review
↓
Verified Work History

4. Unique Innovation
Flex Network menggunakan pendekatan:
Experience-Driven, Skill & Interest-Based Opportunity Platform
Flex Network tidak hanya berfungsi sebagai job board.
Platform berfokus pada pertanyaan:
"What can you do, and what do you want to explore?"
Keunikan Flex Network meliputi:
Fokus pada Young Talent.
Skill & interest-based opportunity discovery.
Basic skill & interest matching.
Berbagai jenis opportunity.
Meeting sebelum contract.
Simulated digital contract.
Simulated payment flow.
Two-way rating.
Verified Work History.
Simulated parental consent.
Administrative moderation.
Reporting dan trust mechanism.
Flex Network tidak mengklaim sebagai satu-satunya platform yang menyediakan internship atau opportunity.
Keunggulannya terletak pada:
Integration of opportunity discovery, experience workflow, trust, dan career exploration dalam satu ekosistem untuk Young Talent.

5. MVP Scope
MVP Flex Network berfokus pada core workflow yang memungkinkan opportunity berkembang menjadi pengalaman kerja yang dapat ditelusuri.
5.1 MVP Features
Fitur utama MVP:
User Registration & Login.
Profile Management.
Skills & Interests.
Hirer Profile.
Opportunity Creation.
Opportunity Review.
Opportunity Publication.
Search & Filter.
Basic Skill & Interest Matching.
Application.
Application Review.
Selection.
Meeting Scheduling.
Meeting Completion.
Simulated Parental Consent.
Simulated Contract.
Simulated Payment.
Work Management.
Work Completion.
Hirer Completion Confirmation.
Rating & Review.
Verified Work History.
Reporting.
Admin Moderation.
Admin Verification.
Auditability.

5.2 Out of Scope - MVP
Fitur berikut tidak menjadi fokus implementasi MVP:
Real Payment Gateway.
Real Escrow.
Real financial transaction.
Official digital signature.
Real legal contract verification.
Parent Account.
Guardian Account.
Guardian Dashboard.
School Integration.
Advanced AI Matching.
Advanced AI Recommendation.
Advanced Identity Verification.
Advanced Fraud Detection.
Complex Dispute Resolution.
Advanced Analytics.
Internal Video Call.
Complex Financial Infrastructure.
Fitur tersebut dapat dipertimbangkan pada tahap Future Development.

6. User Roles
Flex Network memiliki tiga role utama:
6.1 TALENT
Role sistem untuk Young Talent.
TALENT bertanggung jawab untuk:
Mengelola profile.
Mengelola skill.
Mengelola interest.
Menemukan opportunity.
Mendapatkan recommendation.
Melakukan application.
Mengikuti meeting.
Memberikan agreement.
Menjalankan work.
Memberikan rating dan review.
Melihat Work History.

6.2 HIRER
Role sistem untuk penyedia opportunity.
HIRER bertanggung jawab untuk:
Mengelola profile.
Membuat opportunity.
Mengelola opportunity.
Melihat applicant.
Melakukan review.
Melakukan selection.
Mengatur meeting.
Memberikan agreement.
Mengelola work.
Mengonfirmasi completion.
Memberikan rating dan review.

6.3 ADMIN
Role sistem untuk pengelolaan platform.
ADMIN bertanggung jawab untuk:
User moderation.
Opportunity moderation.
Report handling.
Verification.
Administrative actions.
Auditability.

7. User Flow - TALENT
Core flow TALENT:
Register
↓
Create Profile
↓
Add Skills & Interests
↓
Browse / Search Opportunity
↓
Matching / Recommendation
↓
Apply
↓
Application APPLIED
↓
UNDER_REVIEW
↓
SELECTED / REJECTED
Jika application menjadi SELECTED:
SELECTED
↓
Meeting SCHEDULED
↓
Meeting COMPLETED
↓
Consent Required?
Jika tidak diperlukan:
NOT_REQUIRED
↓
Contract
Jika diperlukan:
Consent PENDING
↓
Consent Declaration
↓
APPROVED / REJECTED
Jika approved:
Contract
Jika rejected:
Contract Blocked
Setelah contract:
PENDING_AGREEMENT
↓
Talent + Hirer Agreement
↓
ACTIVE
↓
Payment PENDING
↓
SIMULATED_PAID
↓
Work NOT_STARTED
↓
IN_PROGRESS
↓
COMPLETED
↓
Hirer Confirmation
↓
Rating & Review
↓
Verified Work History

8. User Flow - HIRER
Core flow HIRER:
Register
↓
Create Profile
↓
Create Opportunity
↓
DRAFT
↓
PENDING_REVIEW
↓
PUBLISHED
↓
Receive Applications
↓
Review
↓
UNDER_REVIEW
↓
SELECTED / REJECTED
Jika selected:
Meeting SCHEDULED
↓
Meeting COMPLETED
↓
Consent if Required
↓
Contract
↓
PENDING_AGREEMENT
↓
Talent + Hirer Agreement
↓
ACTIVE
↓
Payment PENDING
↓
SIMULATED_PAID
↓
Work
↓
COMPLETED
↓
Hirer Confirmation
↓
Payment RELEASED
↓
Rating & Review

9. Job / Opportunity System
Hirer dapat membuat opportunity dengan informasi:
Job Title.
Description.
Required Skills.
Relevant Interests.
Number of Talent.
Location.
Start Date.
End Date.
Working Hours.
Duration.
Compensation.
Opportunity Type.
Requirements.
CV Requirement.
Portfolio Requirement.
Interview Requirement.
Meeting Method.
Other Terms.
Application Deadline.
9.1 Opportunity Type
Opportunity dapat berupa:
Internship / Magang.
PKL.
Contract.
Freelance / Project.
Temporary Work.
Daily Work.
Event Work.
Part-time.

9.2 Opportunity Lifecycle
Opportunity menggunakan lifecycle canonical:
DRAFT
↓
PENDING_REVIEW
↓
PUBLISHED
↓
CLOSED
DRAFT
Opportunity sedang dibuat atau diperbaiki oleh HIRER.
PENDING_REVIEW
Opportunity telah dikirim untuk proses review.
PUBLISHED
Opportunity tersedia untuk ditemukan dan menerima application.
CLOSED
Opportunity tidak lagi menerima application baru.

10. Matching
Flex Network menggunakan dua pendekatan:
10.1 Manual Discovery
TALENT dapat menemukan opportunity menggunakan:
Search.
Filter.
Category.
Location.
Opportunity Type.
Compensation.
Duration.
Required Skills.
Relevant Interests.

10.2 Basic Skill & Interest Matching
Sistem membandingkan:
Talent Skills + Talent Interests
dengan:
Required Skills + Opportunity Interests
Matching menghasilkan:
Match Score
Match strength dapat ditampilkan sebagai:
Strong Match.
Good Match.
Weak Match.
No Match.
Untuk MVP, matching bersifat:
Rule-Based Matching
Bukan:
AI / ML Matching
Matching hanya digunakan sebagai recommendation/support mechanism.
Matching:
Tidak otomatis melakukan hiring.
Keputusan akhir tetap dilakukan oleh HIRER dan TALENT melalui workflow application.

11. Application System
Application merupakan proses ketika TALENT mendaftarkan diri pada opportunity.
11.1 Application Lifecycle
Canonical application status:
APPLIED
↓
UNDER_REVIEW
↓
SELECTED
atau:
REJECTED

11.2 APPLIED
Application telah berhasil dikirim oleh TALENT.

11.3 UNDER_REVIEW
Application sedang ditinjau oleh HIRER.

11.4 SELECTED
TALENT dipilih untuk melanjutkan proses meeting.

11.5 REJECTED
Application tidak dipilih oleh HIRER.

11.6 Application Rules
Hanya TALENT yang dapat melakukan application.
Application hanya dapat dilakukan pada opportunity PUBLISHED.
Opportunity CLOSED tidak menerima application baru.
Duplicate application tidak diperbolehkan.
HIRER hanya dapat mengelola application pada opportunity miliknya.
Application selection dilakukan oleh HIRER.
Matching tidak otomatis menentukan application status.

12. Meeting
Meeting merupakan tahap setelah application SELECTED dan sebelum contract.
12.1 Meeting Lifecycle
Canonical MVP status:
SCHEDULED
↓
COMPLETED
atau:
SCHEDULED
↓
CANCELLED
Meeting status PROPOSED bukan requirement mandatory MVP.

12.2 Meeting Information
Meeting dapat menyimpan:
Date.
Time.
Meeting Method.
Location.
Meeting Link.
Additional Information.
Status.
Meeting tidak harus dilakukan melalui video call internal Flex Network.

12.3 Meeting Rule
Contract tidak dapat dilanjutkan sebelum meeting berada pada:
COMPLETED

13. Parental / Guardian Consent
Flex Network mendukung Young Talent termasuk pengguna yang masih di bawah umur.
Untuk opportunity atau kondisi tertentu, sistem dapat mewajibkan consent.
13.1 Consent Lifecycle
Jika tidak diperlukan:
NOT_REQUIRED
Jika diperlukan:
PENDING
↓
APPROVED
atau:
REJECTED

13.2 Simulated Consent
MVP menggunakan:
Simulated Parental / Guardian Consent
Consent direpresentasikan sebagai proses deklarasi dan validasi sistem.
MVP tidak menyediakan:
Parent Account.
Guardian Account.
Guardian Login.
Parent Dashboard.
Independent Guardian Authentication.
Real Digital Signature.
Upload identity document guardian.

13.3 Consent Flow
Application SELECTED
↓
Meeting COMPLETED
↓
Consent Required?
├── No → NOT_REQUIRED → Contract
└── Yes → PENDING
↓
Consent Declaration
↓
Server Validation
↓
APPROVED / REJECTED
Jika:
APPROVED → Contract
Jika:
REJECTED → Contract Blocked

14. Contract
Contract merupakan simulated agreement antara TALENT dan HIRER setelah proses selection dan meeting.
14.1 Contract Eligibility
Contract hanya dapat dibuat setelah:
Application = SELECTED


Meeting = COMPLETED


Consent = NOT_REQUIRED
OR
Consent = APPROVED

14.2 Contract Lifecycle
Canonical lifecycle:
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

14.3 Contract Information
Contract dapat memuat:
Contract ID.
Opportunity.
Talent.
Hirer.
Role.
Description.
Duration.
Location.
Compensation.
Responsibilities.
Terms & Conditions.
Talent Agreement.
Hirer Agreement.
Contract Status.

14.4 Contract Agreement
Contract menggunakan simulated agreement.
Contract menjadi:
ACTIVE
apabila:
Talent Agreement = TRUE
AND
Hirer Agreement = TRUE
MVP tidak menggunakan official digital signature.

15. Payment
Payment pada MVP bersifat:
Simulated Payment
Tidak ada transaksi uang nyata.
15.1 Payment Lifecycle
Canonical MVP lifecycle:
PENDING
↓
SIMULATED_PAID
↓
RELEASED

15.2 Payment Meaning
PENDING
Payment belum disimulasikan.
SIMULATED_PAID
Dana dianggap telah ditahan secara simulasi.
RELEASED
Dana dianggap telah dicairkan secara simulasi.

15.3 Payment Release Rule
Payment hanya dapat menjadi:
RELEASED
jika:
Payment = SIMULATED_PAID


Work = COMPLETED


Hirer Confirmation = TRUE

15.4 Payment Scope
MVP tidak menggunakan:
Real Payment Gateway.
Real Escrow.
Real Financial Transaction.
Real Withdrawal.
Real Refund Processing.

16. Work Management
Work merepresentasikan pekerjaan yang dilakukan berdasarkan contract ACTIVE.
16.1 Work Lifecycle
Canonical status:
NOT_STARTED
↓
IN_PROGRESS
↓
COMPLETED

16.2 Work Rules
Work hanya dapat dibuat berdasarkan contract ACTIVE.
NOT_STARTED dapat menjadi IN_PROGRESS.
IN_PROGRESS dapat menjadi COMPLETED.
Work tidak boleh langsung berubah dari NOT_STARTED menjadi COMPLETED.
Work yang selesai memerlukan completion confirmation dari HIRER.

17. Trust System
Trust System digunakan untuk membangun kepercayaan antara TALENT dan HIRER.
Komponen utama:
Rating.
Review.
Completion Confirmation.
Verification.
Verified Work History.
Reporting.
Moderation.

17.1 Rating
Rating dilakukan dua arah:
TALENT → HIRER
dan:
HIRER → TALENT
Rating:
1-5
Rating hanya dapat diberikan setelah:
Work = COMPLETED

17.2 Review
Review merupakan komentar atau feedback yang dapat diberikan bersama rating setelah pekerjaan selesai.

17.3 Completion Confirmation
Setelah Work COMPLETED:
Hirer Confirms Completion
Confirmation menjadi verification event untuk pengalaman kerja.

17.4 Verified Work History
Pengalaman kerja yang berhasil diselesaikan melalui Flex Network dapat dicatat sebagai:
Verified Work History
Verification didasarkan pada completion confirmation dan dapat diperiksa oleh ADMIN apabila diperlukan.

18. Underage Protection
Karena target Flex Network mencakup pelajar SMA/SMK dan Young Talent, sistem perlu memperhatikan kondisi pengguna di bawah umur.
Prinsip:
Consent hanya digunakan apabila diperlukan.
Parent / Guardian bukan role platform pada MVP.
Tidak ada Guardian Account.
Tidak ada Guardian Dashboard.
Tidak ada independent Guardian authentication.
Tidak ada upload identity documents guardian.
Data minor harus diperlakukan dengan perlindungan yang sesuai.
Authorization harus dilakukan pada server-side.
Akses terhadap data consent harus dibatasi.
Flex Network juga mempertimbangkan batas usia, jenis pekerjaan, jam kerja, dan ketentuan yang berlaku terhadap pengguna di bawah umur.

19. Admin & Moderation
ADMIN berfungsi sebagai moderator dan pengelola ekosistem Flex Network.
19.1 User Management
ADMIN dapat:
Melihat user.
Melihat role.
Meninjau informasi dasar.
Suspend user.
Reactivate user.
Menangani pelanggaran.

19.2 Opportunity Moderation
ADMIN dapat:
Melihat opportunity.
Meninjau opportunity.
Menyetujui opportunity.
Meminta perubahan.
Menutup opportunity.
Menghapus opportunity yang melanggar aturan.

19.3 Report Management
Flow:
Report Submitted
↓
Under Review
↓
Resolved / Rejected
ADMIN dapat:
Warning.
Suspend User.
Remove Opportunity.
Resolve Report.
Reject Report.

19.4 Verification
ADMIN dapat melakukan verification override apabila:
Terdapat report.
Terdapat kondisi khusus.
Diperlukan pemeriksaan terhadap Work History.

19.5 Auditability
Tindakan administratif penting harus dapat ditelusuri.
Contoh:
User Suspended.
User Reactivated.
Opportunity Approved.
Opportunity Rejected.
Opportunity Removed.
Report Resolved.
Verification Override.

20. System Roles & Terminology
Untuk mencegah perbedaan istilah antar dokumen dan implementasi, terminology sistem dikunci sebagai berikut:
Business Term
Canonical System Role
Young Talent
TALENT
Hirer
HIRER
Administrator
ADMIN

Principle
Young Talent digunakan sebagai istilah bisnis dan target user.
TALENT digunakan sebagai canonical role di sistem.
HIRER digunakan sebagai canonical role di sistem.
ADMIN digunakan sebagai canonical role di sistem.
Guardian bukan role platform pada MVP.

21. Canonical Status Definitions
Seluruh implementasi sistem harus menggunakan terminology status yang konsisten.

21.0 User Account Status
ACTIVE
SUSPENDED
DEACTIVATED

ACTIVE
Akun aktif dan dapat digunakan.

SUSPENDED
Akun ditangguhkan sementara oleh ADMIN.

DEACTIVATED
Akun dinonaktifkan secara permanen, baik atas permintaan user maupun oleh ADMIN.

21.1 Opportunity
DRAFT
PENDING_REVIEW
PUBLISHED
CLOSED


21.2 Application
APPLIED
UNDER_REVIEW
SELECTED
REJECTED


21.3 Meeting
SCHEDULED
COMPLETED
CANCELLED


21.4 Parental Consent
NOT_REQUIRED
PENDING
APPROVED
REJECTED


21.5 Contract
DRAFT
PENDING_AGREEMENT
ACTIVE
COMPLETED
TERMINATED


21.6 Payment
PENDING
SIMULATED_PAID
RELEASED


21.7 Work
NOT_STARTED
IN_PROGRESS
COMPLETED


21.8 Work History
PENDING
VERIFIED
REJECTED


21.9 Report
SUBMITTED
UNDER_REVIEW
RESOLVED
REJECTED


22. Core Business Rules
22.1 Account Rule
Setiap account memiliki satu role utama:
TALENT
HIRER
ADMIN


22.2 Opportunity Rule
Opportunity dibuat oleh HIRER.
Opportunity harus memiliki information minimum sebelum dipublikasikan.
Opportunity yang CLOSED tidak menerima application baru.

22.3 Application Rule
Hanya TALENT yang dapat melakukan application.
Application hanya dapat dilakukan pada opportunity:
PUBLISHED
Duplicate application tidak diperbolehkan.

22.4 Selection Rule
HIRER melakukan review dan selection.
Application dapat berubah menjadi:
SELECTED
atau:
REJECTED

22.5 Meeting Rule
Meeting harus COMPLETED sebelum contract dapat dibuat.

22.6 Consent Rule
Jika consent diperlukan:
PENDING → APPROVED / REJECTED
REJECTED memblokir contract.

22.7 Contract Rule
Contract hanya dapat dibuat apabila:
Application = SELECTED


Meeting = COMPLETED


Consent = NOT_REQUIRED / APPROVED

22.8 Agreement Rule
Contract menjadi:
ACTIVE
hanya setelah:
Talent Agreement = TRUE
dan:
Hirer Agreement = TRUE

22.9 Payment Rule
Payment menggunakan simulated payment.
Payment:
PENDING → SIMULATED_PAID → RELEASED
RELEASED hanya setelah:
SIMULATED_PAID


Work COMPLETED


Hirer Confirmation

22.10 Work Rule
Work hanya dapat dilakukan berdasarkan contract ACTIVE.

22.11 Rating Rule
Rating hanya dapat diberikan setelah:
Work = COMPLETED
Rater harus merupakan pihak yang terkait dalam contract.

22.12 Verification Rule
Verified Work History berasal dari work yang berhasil diselesaikan dan dikonfirmasi.
Talent tidak dapat secara manual menetapkan pengalaman menjadi VERIFIED.

22.13 Data Ownership Rule
TALENT hanya dapat mengelola data miliknya.
HIRER hanya dapat mengelola opportunity miliknya.
ADMIN memiliki kewenangan administratif sesuai authorization.
User tidak dapat mengubah resource milik user lain tanpa permission.

23. Visual Identity & Color System
Flex Network menggunakan visual identity yang:
Clean.
Modern.
Professional.
Approachable.
Inclusive.
23.1 Primary Brand Color
Royal Blue
#2447F9

Digunakan untuk:
Primary CTA.
Primary Button.
Active State.
Main Interactive Element.
Apply.
Hire.
Post Opportunity.
Create Profile.
Get Started.

23.2 Accent
Light Blue
#459CE8

Digunakan untuk:
Highlight.
Badge.
Hover State.
Informational UI.
Secondary Highlight.

23.3 Semantic Colors
Success
#22C55E

Error
#EF4444

Warning
#F59E0B

Semantic colors digunakan untuk status sistem, bukan sebagai primary brand identity.

23.4 Background
Main Background
#FFFFFF

Surface
#F7F8FC

Featured Surface
#F3F6FF


23.5 Typography Colors
Primary Text
#0D0907

Secondary Text
#34364A


23.6 Border
#E6EAF2


23.7 Visual Principle
White is the space.
Blue is the brand and action.
Green, orange, and red communicate system status.

24. Typography System
Flex Network menggunakan:
Inter
sebagai font family utama.
24.1 Font Weight
400 - Regular
Body text, paragraph, description, caption, metadata.
500 - Medium
Navigation, labels, badges, tags.
600 - Semi Bold
Primary buttons, card titles, UI actions.
700 - Bold
H1, H2, major section headings.
800 - Extra Bold
Hero heading dan major brand statement.

25. Logo & Brand Identity
Flex Network memiliki identitas visual yang merepresentasikan:
Flexibility.
Skill.
Movement.
Opportunity.
Network.
Logo menggunakan simbol berbentuk:
"F"
Logo terdiri atas:
Logo Mark.
Wordmark.
Tagline.
Wordmark
Flex Network
Tagline
Your Skill, Your Opportunity
Logo utama menggunakan:
Royal Blue - #2447F9
Varian logo:
Primary Logo.
Logo Mark.
Wordmark.
Logo + Tagline.

26. SDG & Competition Subtheme Alignment
26.1 Competition Subtheme
Flex Network mendukung subtema:
Smart Sustainable Digital Solution for Inclusive Society
Flex Network menggunakan solusi digital untuk memperluas akses Young Talent terhadap opportunity dan pengalaman kerja nyata berdasarkan skill dan interest.
Platform dirancang untuk memberikan akses yang lebih inklusif kepada:
Pelajar SMA/SMK.
Young Talent.
UMKM.
Startup.
Komunitas.
Organisasi.
Hirer lainnya.

26.2 SDG 8 - Decent Work and Economic Growth
Primary SDG
Flex Network mendukung SDG 8 melalui:
Pengalaman kerja.
Pengembangan keterampilan.
Opportunity access.
Pemahaman dunia kerja.
Career exploration.
Fokus:
Real Work Experience → Skill Development → Career Exploration
Positioning
SDG 8 = Why Flex Network exists.

26.3 SDG 9 - Industry, Innovation and Infrastructure
Supporting SDG
Flex Network menggunakan teknologi digital untuk mempertemukan:
Skills + Interests + Opportunity Requirements
melalui:
Digital Platform.
Matching.
Opportunity Discovery.
Structured Workflow.
Fokus:
Digital Platform → Matching → Opportunity Access
Positioning
SDG 9 = How Flex Network delivers the solution.

26.4 SDG 11 - Sustainable Cities and Communities
Supporting SDG
Flex Network mendukung inklusivitas komunitas dengan membantu memperluas akses Young Talent terhadap opportunity yang tersedia di lingkungan lokal.
Opportunity dapat berasal dari:
UMKM.
Komunitas.
Organisasi.
Startup.
Pelaku usaha lokal.
Event Organizer.
Fokus:
Local Opportunity Access → Inclusive Participation → Community Development
Positioning
SDG 11 = Supporting Alignment for Inclusive Local Opportunity Access.

27. Core Value Proposition
Flex Network membantu Young Talent mendapatkan pengalaman kerja nyata sebelum menentukan langkah pendidikan dan karier berikutnya.
Platform menjadi jembatan:
Interest → Opportunity → Experience → Exploration
Young Talent dapat:
Mengembangkan keterampilan.
Mengenal dunia kerja.
Mengeksplorasi bidang yang diminati.
Membangun pengalaman.
Memahami kemampuan.
Mempertimbangkan pilihan pendidikan dan karier.
Core Value
Flex Network transforms skills and interests into real-world opportunities and experiences.
Nilai utama Flex Network bukan hanya jumlah opportunity, tetapi kemampuan menghasilkan:
Relevant + Traceable + Experience-Driven Work Experience

28. User Persona
28.1 TALENT - Andi
Name: Andi
Age: 17
Status: SMK Student
Major: Rekayasa Perangkat Lunak
Profile
Andi memiliki minat di bidang teknologi dan sedang mengembangkan skill seperti:
HTML.
CSS.
JavaScript.
Andi ingin mendapatkan pengalaman nyata untuk mengetahui apakah bidang teknologi sesuai dengan minat dan rencana kariernya.
Goals
Mendapatkan pengalaman kerja.
Mengembangkan skill.
Mencoba opportunity yang relevan.
Membangun Work History.
Memahami pilihan karier.
Pain Points
Sulit menemukan opportunity yang sesuai.
Belum memiliki banyak pengalaman.
Sulit mengetahui pihak yang menerima Young Talent.
Sulit membandingkan opportunity.
Needs
Profile.
Skills & Interests.
Search & Filter.
Matching.
Application.
Meeting.
Contract.
Work History.

28.2 HIRER - Budi
Name: Budi
Age: 29
Role: HR / Recruiter Startup
Profile
Budi bertanggung jawab mencari individu untuk kebutuhan project.
Budi membutuhkan cara menemukan talent berdasarkan skill tanpa selalu mensyaratkan pengalaman profesional yang panjang.
Goals
Menemukan talent yang sesuai.
Melihat skill dan interest kandidat.
Menyeleksi kandidat.
Mendapatkan bantuan project.
Menemukan talent potensial.
Pain Points
Sulit menemukan kandidat.
Recruitment project kecil memakan waktu.
Kandidat potensial belum tentu memiliki pengalaman panjang.
Informasi skill tersebar.
Needs
Opportunity Posting.
Required Skills.
Applicant Management.
Candidate Discovery.
Meeting.
Contract Workflow.
Rating.
Work History.

29. Business Goals & KPIs
29.1 Business Goals
1. Memperluas Access terhadap Opportunity
Young Talent dapat menemukan opportunity yang relevan.
2. Memfasilitasi Real Work Experience
Platform menyediakan workflow dari application sampai completion.
3. Mendukung Career Exploration
Pengalaman membantu Young Talent memahami bidang yang diminati.
4. Mempermudah Talent Discovery
HIRER dapat menemukan Talent berdasarkan requirement.
5. Membangun Trust
Trust dibangun melalui:
Moderation.
Meeting.
Contract.
Rating.
Verified Work History.
Reporting.
Consent.

29.2 Key Performance Indicators
KPI
Indikator
Profile Completion
Talent berhasil melengkapi profile
Opportunity Publication
Hirer berhasil mempublikasikan opportunity
Opportunity Discovery
Talent dapat menemukan opportunity
Matching
Sistem menghasilkan basic match score
Application
Application berhasil dibuat dan dikelola
Meeting Completion
Meeting dapat mencapai COMPLETED
Contract Activation
Contract dapat mencapai ACTIVE
Work Completion
Work mencapai COMPLETED
Rating & Review
Rating dapat dilakukan setelah work selesai
Verified Work History
Experience tercatat sebagai verified
Admin Moderation
Admin dapat menjalankan moderation dan reporting


29.3 MVP Success Criteria
MVP dinyatakan berhasil apabila core workflow dapat berjalan dari:
Register
hingga:
Verified Work History
dengan alur:
Register
↓
Profile
↓
Skills & Interests
↓
Opportunity
↓
Search / Matching
↓
Application APPLIED
↓
UNDER_REVIEW
↓
SELECTED
↓
Meeting COMPLETED
↓
Consent if Required
↓
Contract ACTIVE
↓
Payment SIMULATED_PAID
↓
Work COMPLETED
↓
Hirer Confirmation
↓
Rating
↓
Verified Work History
Core KPI
Successful Opportunity Completion Rate
Yaitu persentase opportunity yang berhasil mencapai:
Work COMPLETED
kemudian:
Hirer Confirmation
dan menghasilkan:
Verified Work History

30. Competitor Analysis
Flex Network berada dalam ekosistem platform career dan job marketplace.
Flex Network tidak mengklaim sebagai satu-satunya platform yang menyediakan pekerjaan, internship, atau career opportunity.
Diferensiasi Flex Network berada pada:
Young Talent + Skill & Interest + Real Experience + Career Exploration
30.1 Competitor Comparison
Platform
Fokus Utama
Target Utama
Opportunity
Pendekatan
Jobstreet
Job Marketplace
Job Seekers & Professionals
Full-time, Contract, Part-time, Freelance
Job Search
Glints
Career & Talent Platform
Job Seekers & Young Professionals
Jobs, Internship, Career Opportunities
Career & Talent
MagangHub
Pemagangan
Peserta Program Pemagangan
Internship / Pemagangan
Structured Internship
Flex Network
Experience & Opportunity Platform
Pelajar SMA/SMK & Young Talent
Internship, PKL, Project, Freelance, Temporary Work
Skill & Interest + Experience


31. Positioning
Flex Network mengambil posisi sebagai:
Experience-Driven Opportunity Platform for Young Talent
Core positioning:
Skills & Interests
↓
Opportunity Discovery
↓
Real Work Experience
↓
Exploration
↓
Career Consideration
Competitive advantage berasal dari kombinasi:
Young Talent-focused.
Skill & Interest-based discovery.
Experience-driven workflow.
Multiple opportunity types.
Meeting before Contract.
Simulated Contract.
Simulated Payment.
Verified Work History.
Two-way Rating.
Simulated Parental Consent.
Moderation and Reporting.
Keunggulan utama:
Integration of these capabilities into an experience-first workflow for Young Talent.

32. Revenue Model
32.1 MVP Revenue Model
Pada MVP:
Tidak ada transaksi uang nyata.
Payment hanya merepresentasikan:
Simulated Payment
Tujuannya menunjukkan business workflow tanpa financial infrastructure kompleks.

32.2 Future Revenue Model
Transaction Fee
Service fee terhadap transaksi platform.
Hirer Subscription
Fitur tambahan seperti:
Additional opportunity posting.
Advanced candidate search.
Advanced matching.
Candidate analytics.
Priority listing.
Premium Recruitment Features
Advanced filtering.
Candidate recommendation.
Priority discovery.
Advanced talent analytics.

32.3 Revenue Strategy
Free Access
↓
User Growth
↓
Trust & Activity
↓
Premium Features
↓
Transaction Revenue
Prioritas awal:
User Base + Trust + Successful Opportunities

33. Business Risk Assessment
Flex Network memiliki risiko yang berkaitan dengan:
Trust.
Safety.
Opportunity validity.
Agreement.
Platform abuse.
Adoption.
Regulatory considerations.
33.1 Risk Assessment
Risk
Impact
MVP Mitigation
Ghost Job / Opportunity Palsu
Talent dapat dirugikan
Moderation + Reporting
Fake Profile
Informasi user tidak valid
Reporting + Verification
Opportunity Tidak Sesuai
Experience tidak relevan
Standardized Fields + Moderation
Opportunity Cancellation
Process terhenti
Status + Agreement
Contract Dispute
Perbedaan pemahaman
Clear Terms
Underage Risk
Risiko terhadap Talent minor
Consent jika diperlukan
Platform Abuse
Penyalahgunaan platform
Terms + Reporting + Moderation
Low Trust
User ragu menggunakan platform
Rating + Work History
Low Adoption
Aktivitas rendah
Fokus Young Talent
Scope Creep
MVP tidak selesai
Strict MVP Scope
Hirer Dependency
Opportunity terbatas
Relevant Hirer Acquisition
Regulatory Mismatch
Opportunity tidak sesuai aturan
Restriction + Future Compliance


33.2 High Priority Risks
Ghost Job / Opportunity Palsu.
Underage Risk.
Contract Dispute.
Platform Abuse.
Scope Creep.

33.3 Risk Mitigation Principle
Untuk MVP, Flex Network menggunakan:
Moderation


Reporting


Meeting


Clear Agreement


Verification


Consent
Core trust flow:
Opportunity Created
↓
Moderation
↓
Published
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
Hirer Confirmation
↓
Rating
↓
Verified Work History

34. Future Development
Fitur berikut dapat dikembangkan setelah MVP:
Payment & Financial
Real Payment Gateway.
Real Escrow.
Automated Payment Processing.
Refund Management.
Contract & Legal
Official Digital Signature.
Legal Contract Management.
Legal Verification.
Advanced Agreement Management.
Matching & Intelligence
AI Matching.
AI Recommendation.
Advanced Recommendation.
Predictive Opportunity Recommendation.
Parent & Education
Parent Account.
Parent Dashboard.
School Integration.
School Verification.
School Partnership.
Trust & Verification
Advanced Identity Verification.
Company Verification.
Skill Certification.
Advanced Fraud Detection.
Dispute Resolution.
Analytics
Career Analytics.
Talent Analytics.
Hirer Analytics.
Platform Analytics.
Future development tidak boleh menjadi dependency wajib untuk MVP.

35. Executive Summary
Flex Network adalah platform digital yang mempertemukan TALENT dan HIRER melalui opportunity berbasis skill dan interest untuk menghasilkan pengalaman kerja nyata.
Platform membantu Young Talent melalui proses:
Profile
→
Skills & Interests
→
Opportunity Discovery
→
Matching
→
Application
→
Selection
→
Meeting
→
Consent if Required
→
Contract
→
Work
→
Completion
→
Rating
→
Verified Work History
Di sisi TALENT, platform membantu memperoleh:
Experience.
Skill Development.
Career Exploration.
Work History.
Di sisi HIRER, platform membantu:
Talent Discovery.
Applicant Management.
Selection.
Work Coordination.
Di sisi ADMIN, platform menyediakan:
Moderation.
Reporting.
Verification.
Accountability.
Flex Network menjadi jembatan:
Interest → Opportunity → Experience → Exploration
Core Vision
Membantu Young Talent menemukan pengalaman nyata untuk memahami potensi, mengeksplorasi dunia kerja, dan mempersiapkan masa depan mereka.
Core Mission
Memperluas akses Young Talent terhadap opportunity.
Mempertemukan Talent dan Hirer berdasarkan skills dan interests.
Memfasilitasi pengalaman kerja nyata.
Membangun Verified Work History.
Mendukung career exploration.
Mendukung akses opportunity yang lebih inklusif.

36. BRD Canonicalization Note
Untuk menjaga konsistensi antara BRD dan dokumen teknis, terminology berikut digunakan sebagai acuan:
Roles
TALENT
HIRER
ADMIN

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

Business-facing terminology seperti Young Talent tetap digunakan ketika menjelaskan target user dan value proposition.
Canonical terminology digunakan untuk sistem, database, API, state transition, dan implementation.

37. Document Status
Document: Business Requirements Document
Project: Flex Network
Version: Revised & Canonical
Status: FINAL & LOCKED 🔒
Documentation Flow
BRD
 ↓
SRS
 ↓
UI/UX Design
 ↓
Technical Design Document
 ↓
API Specification
 ↓
Development
 ↓
Testing
 ↓
Deployment

- END OF BRD -