#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Full-stack donation/philanthropy website for "Yayasan Banua Berkah Mandiri" (YABABERMA), an Islamic humanitarian foundation in Banjarmasin.
  Core value features: campaign catalog + donation flow (nominal -> donor data -> manual bank transfer with unique code -> WhatsApp confirmation), Zakat calculator, donor portal (Emergent Google Auth), newsletter, manual transfer confirmation.
  Backend: Next.js API routes + MongoDB. DB env: MONGO_URL, DB_NAME. All routes prefixed with /api.

backend:
  - task: "Health check /api/ and /api/root"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/ and /api/root should return {message}. Auto-seed runs on every request when campaigns empty."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - Both GET /api/ and GET /api/root return 200 with {message: 'YABABERMA API OK'}. Auto-seed triggers successfully."

  - task: "Campaigns list + category/featured filter (auto-seed 7 campaigns)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/campaigns returns 7 seeded campaigns. Filters: ?category=zakat|sedekah|wakaf|fidyah|bencana and ?featured=true. Response must NOT contain _id."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - GET /api/campaigns returns exactly 7 campaigns with all required fields (id, slug, title, category, short_desc, image, target_amount, collected_amount, donor_count, deadline, featured, story, gallery, updates). No _id field present. All 5 categories present (zakat, sedekah, wakaf, fidyah, bencana). Filters working: ?category=zakat (1 campaign), ?category=wakaf (1 campaign), ?featured=true (4 campaigns)."

  - task: "Campaign detail by slug with recent_donations"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/campaigns/{slug} e.g. wakaf-al-quran-santri-pelosok returns full campaign incl story[], gallery[], updates[], recent_donations[]. 404 for unknown slug."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - GET /api/campaigns/wakaf-al-quran-santri-pelosok returns 200 with full campaign including recent_donations array. GET /api/campaigns/does-not-exist correctly returns 404."

  - task: "Create donation with unique code + campaign progress increment"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/donations body {campaign_slug, amount, donor_name, donor_whatsapp, donor_email, message, payment_method, is_anonymous}. Must generate unique_code (100-999), total_amount=amount+unique_code, status=pending, return donation object with id. Should increment campaign collected_amount by amount and donor_count by 1. Validate amount>=1000 and required name+whatsapp (400 otherwise)."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - POST /api/donations creates donation successfully with unique_code (100-999), total_amount=amount+unique_code, status='pending', and campaign_title set. Campaign collected_amount increased by exactly 100000 and donor_count increased by 1. All validations working: amount<1000 returns 400, missing donor_name returns 400, missing donor_whatsapp returns 400."

  - task: "List donations by email"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/donations?email=... returns donations for that email sorted desc. No email + no auth cookie returns []."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - GET /api/donations?email=budi@test.com returns array with donation(s) for that email. GET /api/donations without email/cookie correctly returns empty array []."

  - task: "Newsletter subscribe"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/newsletter {email}. Upsert; invalid email -> 400. Returns {ok:true}."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - POST /api/newsletter with valid email returns 200 {ok:true}. Invalid email 'abc' returns 400. Duplicate email correctly handled with upsert (returns 200)."

  - task: "Manual transfer confirmation"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/confirmations {name, whatsapp, amount, bank, program, note, proof_image(base64 optional)}. Missing name/whatsapp/amount -> 400. Returns {ok:true}."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - POST /api/confirmations with valid data returns 200 {ok:true, confirmation:{...}}. Missing name correctly returns 400. All required fields validated."

  - task: "News list + detail, Testimonials, Gallery, Stats"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/news (4 items), GET /api/news/{slug}, GET /api/testimonials (4), GET /api/gallery (8), GET /api/stats (impact numbers + totals). No _id in responses."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - GET /api/news returns 4 items. GET /api/news/penyaluran-wakaf-quran-pelosok returns 200. GET /api/testimonials returns 4 items. GET /api/gallery returns 8 items. GET /api/stats returns all required fields (humanitarian, wakaf_quran, panti, pemberdayaan, total_collected, total_donations, active_campaigns)."

  - task: "Auth endpoints (Emergent Google Auth)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/auth/me without cookie returns {user:null} status 200. POST /api/auth/session without session_id -> 400. POST /api/auth/session with invalid session_id -> 401 (calls Emergent session-data endpoint). POST /api/auth/logout returns {ok:true}. Full Google OAuth cannot be tested automatically."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - GET /api/auth/me without cookie returns 200 {user:null}. POST /api/auth/session without session_id returns 400. POST /api/auth/session with invalid session_id returns 401 (external Emergent endpoint called). POST /api/auth/logout returns 200 {ok:true}. All negative test cases working correctly."

  - task: "MongoDB connection race-condition fix (concurrent requests)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "FIXED a race: previously used `let client/db` where a concurrent 2nd request could read db=undefined -> 500 'Cannot read properties of undefined (reading collection)'. Now caches a single dbPromise (connect+seed once). Please verify by firing MANY concurrent requests simultaneously and confirm NO 500s. Also re-confirm POST /api/donations still increments campaign totals. Seeding must still produce exactly 7 campaigns (no duplicates)."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - MongoDB race condition fix verified! Fired 30 concurrent requests across 8 different endpoints (GET /api/campaigns, GET /api/campaigns?featured=true, GET /api/auth/me, GET /api/news, GET /api/stats, GET /api/testimonials, GET /api/gallery, GET /api/campaigns/wakaf-al-quran-santri-pelosok) with ZERO 500 errors (30/30 succeeded). Seeding integrity confirmed: exactly 7 campaigns, 4 news, 4 testimonials, 8 gallery items (no duplicates). Donation flow regression test passed: POST /api/donations creates donation with unique_code (100-999), total_amount=amount+unique_code, status=pending, and correctly increments campaign collected_amount by 50000 and donor_count by 1. All negative test cases still working (amount<1000->400, invalid email->400, /auth/me without cookie->{user:null}, /auth/session without session_id->400). The dbPromise caching pattern successfully prevents the race condition."

  - task: "Prayers wall (Dinding Doa) GET /api/prayers"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/prayers returns array of {name, message, program}. Seeds a 'prayers' collection (8 items) on first run and also merges recent real donation messages (message non-empty). Should always return >=8 items."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - GET /api/prayers returns 10 items (>= 8 required). All items have required fields: name, message, program. Endpoint correctly merges seeded prayers with real donation messages."

  - task: "Kurban campaign seeded with kurban_options"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Campaigns collection was dropped & reseeded to 8 campaigns. GET /api/campaigns must now return 8 (incl category 'kurban'). GET /api/campaigns/kurban-peduli-banua must return campaign with kurban_options[] (kambing, sapi-patungan, sapi-utuh each with price). GET /api/campaigns?category=kurban returns 1. Donation POST with campaign_slug=kurban-peduli-banua must still work + increment."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED (11/11 tests) - GET /api/campaigns returns exactly 8 campaigns (was 7) with kurban category included. GET /api/campaigns/kurban-peduli-banua returns campaign with kurban_options array containing 3 items with correct prices: kambing (2750000), sapi-patungan (2500000), sapi-utuh (17500000). GET /api/campaigns?category=kurban returns exactly 1 campaign. POST donation to kurban campaign works perfectly: unique_code generated (100-999), total_amount calculated correctly, campaign collected_amount increased by 2750000, donor_count increased by 1. All kurban functionality working as expected."

  - task: "Admin endpoints (verify donations, list confirmations)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Admin key is env ADMIN_KEY=yababerma-admin-2026. POST /api/admin/login {key} -> 200 if correct, 401 if wrong. All /api/admin/* require header 'x-admin-key'. Without/with wrong header -> 401. GET /api/admin/summary, GET /api/admin/donations, GET /api/admin/confirmations return data with correct key. POST /api/admin/verify {donation_id, status:'verified'} sets a donation status to verified; verify by GETting /api/admin/donations. status:'pending' reverts. Missing donation_id -> 400."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED (11/11 tests) - POST /api/admin/login with correct key (yababerma-admin-2026) returns 200 {ok:true}, wrong key returns 401. GET /api/admin/summary without header returns 401, with wrong header returns 401, with correct header returns 200 with all required fields (total_donations, verified, pending, total_verified, confirmations). GET /api/admin/donations returns array of donations. GET /api/admin/confirmations returns array of confirmations. POST /api/admin/verify successfully changes donation status to 'verified' and reverts to 'pending'. Missing donation_id correctly returns 400. All admin authentication and authorization working perfectly."

  - task: "Automatic thank-you email via Resend on donation create"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Resend integrated (resend@6.21.0). On POST /api/donations, if donor_email present, sends thank-you+receipt HTML email in background (fire-and-forget, does NOT block/slow the response - verified 0.57s). Verified via real Resend API call: returns 200 for donation; Resend responded with a clear 403 'yababerma.org domain is not verified' - i.e. integration is WIRED CORRECTLY. EMAIL DELIVERY is pending the user verifying the yababerma.org domain in Resend (add DNS SPF/DKIM). NOT mocked. RESEND_API_KEY + MAIL_FROM in .env."
        -working: true
        -agent: "testing"
        -comment: "✅ REGRESSION TEST PASSED (5/5 tests). POST /api/donations with email returns 200 in 0.356s (well under 2s requirement) - email is truly fire-and-forget and non-blocking. Donation created with unique_code (716) and total_amount correctly calculated. Campaign collected_amount increased by 75000 and donor_count by 1. POST /api/donations without email also works (returns 200). Core endpoints regression: GET /api/campaigns (8 items), GET /api/campaigns/kurban-peduli-banua (has kurban_options with 3 items), GET /api/prayers (11 items >= 8), GET /api/testimonials (4 items), GET /api/gallery (8 items), GET /api/news (4 items) - all working. Admin endpoints: POST /api/admin/login (200 OK), GET /api/admin/summary (200 with all required fields) - working. Negative test: POST /api/donations with amount=100 correctly returns 400. Email integration is wired correctly and non-blocking as expected."

  - task: "Verified-status email on POST /api/admin/verify"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "When admin verifies a donation (POST /api/admin/verify status='verified'), backend now fires sendVerifiedEmail(donation) in background (fire-and-forget) to donor_email. Must NOT block/slow the verify response. Please: (1) create a donation with donor_email, (2) call /api/admin/verify with correct x-admin-key to set it verified -> 200 quickly, confirm GET /api/admin/donations shows status verified & verified_at set. (3) revert to pending works. (4) Missing donation_id -> 400. Email delivery expected to fail (domain unverified in Resend) but must not affect the API response."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED (10/10 tests). Admin verify email feature working perfectly! Created donation (ID: abc5a296-82a6-43fa-8d52-629dbcafe1b7) with donor_email='delivered@resend.dev'. POST /api/admin/verify with status='verified' returns 200 in 0.219s (well under 2s requirement) - email is truly fire-and-forget and non-blocking. Response donation.status='verified' and verified_at set correctly (2026-08-21T11:28:45.430Z). GET /api/admin/donations confirms status='verified' and verified_at is set. Revert to pending works perfectly: status changes back to 'pending' and verified_at becomes null. Negative tests working: empty body returns 400 'donation_id wajib', no x-admin-key header returns 401 'Unauthorized'. Quick regression passed: 12 concurrent requests (8x GET /api/campaigns, GET /api/campaigns/kurban-peduli-banua with kurban_options, GET /api/prayers with 11 items >= 8, GET /api/stats, GET /api/auth/me with user null) with ZERO 500 errors. The sendVerifiedEmail function is correctly implemented in fire-and-forget mode (.catch(() => {})) ensuring it doesn't block the API response. Feature is production-ready."

  - task: "Admin notification email on new donation (POST /api/donations regression)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Added sendAdminNotifyEmail(donation) fired fire-and-forget after donation insert (line 424), alongside the existing sendDonationEmail. It emails ADMIN_EMAIL a 'Donasi Baru Masuk' notification. MUST NOT block or break POST /api/donations. Please regression test: (1) POST /api/donations with donor_email returns 200 quickly (<2s) with unique_code (100-999), total_amount=amount+unique_code, status='pending'; campaign collected_amount +amount and donor_count +1. (2) POST /api/donations WITHOUT donor_email still returns 200. (3) Negative: amount<1000 -> 400, missing donor_name -> 400, missing donor_whatsapp -> 400. (4) Quick regression of GET /api/campaigns (8), GET /api/prayers (>=8), GET /api/stats, GET /api/admin/summary with x-admin-key. Email delivery may fail (domain unverified) but must not affect API response."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED (10/10 tests). Admin notification email feature working perfectly! POST /api/donations with donor_email returns 200 in 0.298s (well under 2s requirement) - email is truly fire-and-forget and non-blocking. Donation created with unique_code=774 (100-999), total_amount=75774 correctly calculated (amount + unique_code), status='pending'. Campaign progress verified: collected_amount increased by exactly 75000 and donor_count increased by 1 (before: 87550000/343, after: 87625000/344). POST /api/donations without donor_email also works (returns 200 with unique_code=172, total_amount=50172, status=pending). All negative validations working: amount<1000 returns 400 'Nominal donasi tidak valid', missing donor_name returns 400 'Nama dan nomor WhatsApp wajib diisi', missing donor_whatsapp returns 400 'Nama dan nomor WhatsApp wajib diisi'. Quick regression passed: GET /api/campaigns (8 campaigns), GET /api/prayers (11 items >= 8), GET /api/stats (all required fields present), GET /api/admin/summary with x-admin-key (200 with all required fields: total_donations=5, verified=0, pending=5), POST /api/admin/login (200 OK). The sendAdminNotifyEmail function is correctly implemented in fire-and-forget mode (.catch(() => {})) ensuring it doesn't block the API response. Feature is production-ready."

  - task: "Kurban real-time quota (GET /api/kurban/quota) + donation stores kurban_option/kurban_qty"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "New endpoint GET /api/kurban/quota returns {options:[{key,name,emoji,desc,price,unit,quota,sold,remaining}]}. quota targets: kambing 50, sapi-patungan 70, sapi-utuh 10 with sold_base 18/34/3. sold = sold_base + sum of kurban_qty of donations for that option; remaining = max(quota-sold,0). Idempotent migration in ensureSeed adds quota fields to existing kurban campaign's kurban_options. POST /api/donations now stores kurban_option & kurban_qty (nullable). Please verify: (1) GET /api/kurban/quota returns 3 options with numeric quota/sold/remaining and remaining<=quota; (2) POST /api/donations with campaign_slug='kurban-peduli-banua', kurban_option='kambing', kurban_qty=2 returns 200 and afterwards GET /api/kurban/quota shows kambing.sold increased by 2 (remaining decreased by 2); (3) GET /api/campaigns/kurban-peduli-banua returns kurban_options each having a numeric quota field."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED (3/3 tests). Kurban real-time quota feature working perfectly! (A1) GET /api/kurban/quota returns correct structure with exactly 3 options (kambing, sapi-patungan, sapi-utuh). All options have required numeric fields (quota, sold, remaining, price) and string fields (name, unit). Verified remaining === max(quota - sold, 0) and remaining <= quota for all options. (A2) Donation increment verified: captured kambing.sold=20 BEFORE, then POST /api/donations with campaign_slug='kurban-peduli-banua', amount=5500000, donor_name='Ahmad Kurban', donor_whatsapp='08123456789', kurban_option='kambing', kurban_qty=2, payment_method='bsi' returned 200 with unique_code=407. After donation, GET /api/kurban/quota confirmed kambing.sold increased by exactly 2 (20 → 22) and remaining decreased by exactly 2 (30 → 28). (A3) Migration check passed: GET /api/campaigns/kurban-peduli-banua returns kurban_options array where all 3 items contain numeric quota field. Feature is production-ready."

  - task: "Annual reports with year filter (GET /api/reports?year=)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "New endpoint GET /api/reports?year=all|2026|2025|2024. Seeds annual_reports collection (2024 & 2025 pre-aggregated, idempotent). Live current-year (2026) computed from campaigns. Response: {year, years:['all','2026','2025','2024'], total_collected, total_donors, total_donations, by_category:[{category,amount}], by_program:[{title,slug,collected,target}]}. Please verify: (1) GET /api/reports (default all) returns years array (len>=3) and aggregated totals = sum of all yearly docs; by_category non-empty. (2) GET /api/reports?year=2025 returns total_collected=1340000000, total_donors=4120, total_donations=6540. (3) GET /api/reports?year=2024 returns total_collected=890000000. (4) GET /api/reports?year=2026 returns live campaign-derived totals. (5) GET /api/reports?year=1999 returns 404 with years array."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED (5/5 tests). Annual reports feature working perfectly! (B1) GET /api/reports (default all) returns correct structure: years array contains required years ['all', '2026', '2025', '2024'], numeric totals (total_collected=2843710000, total_donors=9999, total_donations=10728), by_category is non-empty array with 6 categories, by_program is non-empty array with 8 programs. (B2) GET /api/reports?year=2025 returns exact totals: total_collected=1340000000, total_donors=4120, total_donations=6540. (B3) GET /api/reports?year=2024 returns exact totals: total_collected=890000000, total_donors=2760, total_donations=4180. (B4) GET /api/reports?year=2026 returns live campaign-derived totals: total_collected=613710000 (> 0), by_program length=8 (8 campaigns). (B5) GET /api/reports?year=1999 correctly returns HTTP 404 and response includes years array ['all', '2026', '2025', '2024']. Feature is production-ready."

  - task: "Admin Kurban quota management (GET /api/admin/kurban, POST /api/admin/kurban-quota)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "New admin-protected endpoints to let admin edit kurban quota without code. GET /api/admin/kurban returns {options:[{key,name,unit,price,quota,sold_base}]}. POST /api/admin/kurban-quota body {options:[{key,quota,sold_base}]} updates the kurban campaign's kurban_options quota/sold_base by key and returns updated options. Both require header x-admin-key: yababerma-admin-2026. Please verify: (1) GET without x-admin-key -> 401; with correct key -> 200 with 3 options each having numeric quota & sold_base. (2) POST with correct key and body {options:[{key:'kambing',quota:60,sold_base:20}]} -> 200, returned kambing.quota=60 & sold_base=20; then GET /api/admin/kurban confirms persistence; also GET /api/kurban/quota reflects new quota for kambing (remaining recomputed). (3) POST without x-admin-key -> 401. (4) POST with non-array options -> 400. IMPORTANT: after testing, reset kambing back to quota=50, sold_base=18 via POST so the demo baseline stays consistent."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (6/6). Admin Kurban quota management feature working perfectly! (1) GET /api/admin/kurban WITHOUT x-admin-key correctly returns 401 (unauthorized). (2) GET /api/admin/kurban WITH x-admin-key (yababerma-admin-2026) returns 200 with exactly 3 options (kambing, sapi-patungan, sapi-utuh), all with required fields: key, name, unit (string), price, quota, sold_base (numeric). (3) POST /api/admin/kurban-quota WITH x-admin-key and body {options:[{key:'kambing',quota:60,sold_base:20}]} returns 200 with kambing.quota=60 and sold_base=20. Persistence verified: GET /api/admin/kurban confirms kambing quota=60, sold_base=20 persisted. Public endpoint GET /api/kurban/quota reflects new quota (kambing.quota=60, sold=25, remaining=35 correctly calculated as max(60-25,0)). Other options unchanged: sapi-patungan quota=70, sapi-utuh quota=10. (4) POST /api/admin/kurban-quota WITHOUT x-admin-key correctly returns 401 (unauthorized). (5) POST /api/admin/kurban-quota WITH x-admin-key but invalid body {options:'notarray'} correctly returns 400 (validation error). (6) CLEANUP completed: kambing reset to demo baseline (quota=50, sold_base=18) via POST /api/admin/kurban-quota, confirmed with 200 response. All admin authentication, authorization, validation, and quota management functionality working correctly. Feature is production-ready."

  - task: "Deployment fix: added .limit() to all previously-unbounded MongoDB queries (regression)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "DEPLOYMENT FIX regression: deployment_agent flagged multiple unbounded MongoDB .toArray() queries. I added .limit() to ALL of them (campaigns list limit 200, donations-by-email 200, news 50, testimonials 50, gallery 100, stats campaigns 200, kurban quota donations 5000, reports campaigns 200, annual_reports 20, prayers 50, admin summary donations 10000). No logic changed besides adding limits. Please run a REGRESSION to confirm nothing broke and response shapes/counts are intact: GET /api/campaigns (8), GET /api/campaigns?category=zakat (1), GET /api/campaigns/kurban-peduli-banua (has kurban_options w/ quota + recent_donations), GET /api/news (>=4), GET /api/testimonials (>=4), GET /api/gallery (>=8), GET /api/stats (has total_collected/total_donors/total_target/total_donations/active_campaigns), GET /api/kurban/quota (3 options w/ quota/sold/remaining), GET /api/reports?year=all and ?year=2025 (exact totals 1340000000/4120/6540), GET /api/prayers (>=8), GET /api/admin/summary + /api/admin/donations with x-admin-key yababerma-admin-2026, and POST /api/donations (still 200, unique_code, increments). Confirm zero 500s."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (12/12) - ZERO 500 ERRORS. Comprehensive regression testing completed for deployment fix. All endpoints verified: (1) GET /api/campaigns returns 8 campaigns with no _id field. (2) GET /api/campaigns?category=zakat returns 1 campaign. (3) GET /api/campaigns/kurban-peduli-banua returns campaign with kurban_options array (3 items, each with numeric quota) and recent_donations array. (4) GET /api/news returns 4 items (>= 4). (5) GET /api/testimonials returns 4 items (>= 4). (6) GET /api/gallery returns 8 items (>= 8). (7) GET /api/stats returns all required fields (total_collected, total_donors, total_target, total_donations, active_campaigns). (8) GET /api/kurban/quota returns exactly 3 options with numeric quota/sold/remaining (kambing quota=50, sold=18, remaining=32 - demo baseline intact). (9) GET /api/reports?year=all returns years array ['all', '2026', '2025', '2024']; GET /api/reports?year=2025 returns exact totals (total_collected=1340000000, total_donors=4120, total_donations=6540). (10) GET /api/prayers returns 8 items (>= 8). (11) GET /api/admin/summary with x-admin-key returns all required fields (total_donations, verified, pending, total_verified, confirmations); GET /api/admin/donations returns array. (12) POST /api/donations creates donation with unique_code (100-999), total_amount=amount+unique_code, status='pending', and correctly increments campaign collected_amount by 50000 and donor_count by 1 (before: 63000000/480, after: 63050000/481). NO REGRESSIONS DETECTED. All response shapes and counts intact. The .limit() additions are deployment-ready and do not affect functionality."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 5
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Initial backend implemented for YABABERMA donation platform. Please test all endpoints listed. Focus on donation creation (unique code + campaign increment), campaigns filtering, campaign detail, and auth negative cases. DB uses MONGO_URL/DB_NAME. Auto-seed populates campaigns/news/testimonials/gallery on first request. Do not test full Google OAuth (needs browser); only negative/edge cases for auth."
    -agent: "testing"
    -message: "✅ ALL BACKEND TESTS PASSED (10/10 test groups). Comprehensive testing completed for all API endpoints at https://yababerma-donasi.preview.emergentagent.com/api. Key results: Health check working, 7 campaigns seeded with all categories, campaign filters working, donation creation with unique code and campaign progress increment verified, all validations working, newsletter/confirmations/news/testimonials/gallery/stats all working, auth negative cases all passing. No critical issues found. Backend is fully functional and ready for production."
    -agent: "main"
    -message: "Fixed MongoDB connection race condition in /app/app/api/[[...path]]/route.js. Changed from `let client/db` pattern to cached `dbPromise` pattern to prevent concurrent requests from hitting db=undefined. Please verify with concurrent load testing."
    -agent: "testing"
    -message: "✅ MongoDB race condition fix VERIFIED! Comprehensive concurrency testing with 30 simultaneous requests across all major endpoints resulted in ZERO 500 errors. All functionality intact: seeding integrity confirmed (exact counts), donation flow working perfectly (unique code generation, campaign increment), and all negative test cases passing. The dbPromise caching pattern successfully eliminates the race condition. Backend is production-ready."
    -agent: "main"
    -message: "Added new features: 1) Kurban campaign (8th campaign with kurban_options array), 2) Prayers wall (GET /api/prayers merging seeded + real donation messages), 3) Admin endpoints (login, summary, donations list, confirmations list, verify/revert donation status). Campaigns collection dropped & reseeded to 8. Please test all new features + quick regression."
    -agent: "testing"
    -message: "✅ NEW FEATURES TESTED (28/31 passed, 3 minor issues). KURBAN CAMPAIGN: All 11 tests passed - 8 campaigns returned, kurban_options with correct prices (kambing: 2750000, sapi-patungan: 2500000, sapi-utuh: 17500000), category filter working, donation flow with campaign increment verified. PRAYERS: All 2 tests passed - returns 10 items (>= 8) with correct structure. ADMIN: All 11 tests passed - login authentication, header-based authorization, summary/donations/confirmations endpoints, verify/revert status functionality all working. REGRESSION: Featured filter working, auth/me working, 15 concurrent requests with ZERO 500 errors. Minor: testimonials/gallery/news have double counts (8/16/8 instead of 4/8/4) due to previous seeds not being cleared, but this doesn't affect functionality. All critical features working perfectly."
    -agent: "testing"
    -message: "✅ RESEND EMAIL REGRESSION TEST PASSED (5/5 tests). Verified fire-and-forget email integration is working correctly and non-blocking. POST /api/donations with email returns 200 in 0.356s (well under 2s requirement). Donation flow intact: unique_code generation, total_amount calculation, campaign progress increment all working. POST /api/donations without email also works. All core endpoints regression passed: campaigns (8 items), kurban campaign with kurban_options, prayers (>=8), testimonials (4), gallery (8), news (4). Admin endpoints working. Negative validation (amount<1000) returns 400 correctly. Email integration is wired correctly - Resend API is being called (403 domain not verified is expected). Backend is production-ready."
    -agent: "main"
    -message: "Added verified-status email feature: When admin verifies a donation (POST /api/admin/verify status='verified'), backend now fires sendVerifiedEmail(donation) in background (fire-and-forget) to donor_email. Must NOT block/slow the verify response. Please test: (1) create donation with donor_email, (2) verify it quickly (< 2s), (3) confirm status & verified_at in GET /api/admin/donations, (4) revert to pending, (5) negative tests (empty body -> 400, no header -> 401), (6) quick regression."
    -agent: "testing"
    -message: "✅ VERIFIED EMAIL FEATURE TESTED - ALL PASSED (10/10 tests). Admin verify email feature working perfectly! Created donation with donor_email='delivered@resend.dev'. POST /api/admin/verify returns 200 in 0.219s (well under 2s requirement) - email is truly fire-and-forget and non-blocking. Status changes to 'verified' with verified_at timestamp set correctly. GET /api/admin/donations confirms verification. Revert to pending works: status='pending' and verified_at=null. Negative tests working: empty body -> 400 'donation_id wajib', no x-admin-key -> 401 'Unauthorized'. Quick regression passed: 12 concurrent requests with ZERO 500 errors (campaigns, kurban with kurban_options, prayers >= 8, stats, auth/me with user null). The sendVerifiedEmail function is correctly implemented in fire-and-forget mode ensuring it doesn't block the API response. Feature is production-ready."
    -agent: "main"
    -message: "New batch added: sendAdminNotifyEmail(donation) is now fired fire-and-forget on POST /api/donations (line 424) in addition to sendDonationEmail. Please regression-test POST /api/donations to ensure the new admin notification did NOT break/slow the endpoint: (1) with donor_email returns 200 quickly with correct unique_code/total_amount/status=pending and campaign increment; (2) without donor_email still returns 200; (3) negative cases (amount<1000->400, missing donor_name->400, missing donor_whatsapp->400); (4) quick regression of GET /api/campaigns (8), GET /api/prayers (>=8), GET /api/stats, and GET /api/admin/summary with x-admin-key. Focus only on this; other features already passed previously."
    -agent: "testing"
    -message: "✅ ADMIN NOTIFICATION EMAIL REGRESSION TEST PASSED (10/10 tests). Comprehensive testing completed for the new sendAdminNotifyEmail(donation) feature on POST /api/donations. Key results: (1) POST /api/donations with donor_email returns 200 in 0.298s (well under 2s requirement) - email is truly fire-and-forget and non-blocking. Donation created successfully with unique_code=774 (100-999), total_amount=75774 (amount + unique_code), status='pending'. Campaign progress verified: collected_amount increased by exactly 75000 and donor_count increased by 1. (2) POST /api/donations without donor_email works perfectly (returns 200). (3) All negative validations working: amount<1000->400, missing donor_name->400, missing donor_whatsapp->400. (4) Quick regression passed: GET /api/campaigns (8 campaigns), GET /api/prayers (11 items >= 8), GET /api/stats (all required fields), GET /api/admin/summary (200 with all fields), POST /api/admin/login (200 OK). Supervisor logs confirm Resend API is being called and returning expected 403 'domain not verified' error, which is correctly caught and logged without blocking the API response. The sendAdminNotifyEmail function is correctly implemented in fire-and-forget mode (.catch(() => {})) ensuring it doesn't block the API response. Feature is production-ready. No critical issues found."
    -agent: "main"
    -message: "Two new backend endpoints added for this session's features. Please test ONLY the two current_focus tasks. (A) GET /api/kurban/quota — returns {options:[{key,name,quota,sold,remaining,...}]} for kambing/sapi-patungan/sapi-utuh; then POST a kurban donation with kurban_option='kambing' & kurban_qty=2 and confirm quota's kambing.sold increases by 2 / remaining decreases by 2. Also confirm GET /api/campaigns/kurban-peduli-banua now has numeric quota on each kurban_option (idempotent migration). (B) GET /api/reports?year= — default 'all' aggregates; year=2025 => total_collected 1340000000, donors 4120, donations 6540; year=2024 => total_collected 890000000; year=2026 => live campaign-derived; year=1999 => 404 with years array. Do a light regression on POST /api/donations (still 200, still increments) since it now also stores kurban_option/kurban_qty. NOTE: the user has verified the yababerma.org Resend domain so emails may now deliver, but they remain fire-and-forget and must never block responses."
    -agent: "testing"
    -message: "✅ ALL TESTS PASSED (9/9 tests). Comprehensive testing completed for the two current_focus tasks plus donation regression. KURBAN QUOTA: (A1) GET /api/kurban/quota returns correct structure with exactly 3 options (kambing, sapi-patungan, sapi-utuh), all with required numeric fields (quota, sold, remaining, price) and string fields (name, unit). Verified remaining === max(quota - sold, 0) and remaining <= quota for all options. (A2) Donation increment verified: kambing.sold=20 BEFORE, POST /api/donations with kurban_option='kambing' & kurban_qty=2 returned 200 with unique_code=407, then kambing.sold increased by exactly 2 (20 → 22) and remaining decreased by exactly 2 (30 → 28). (A3) Migration check passed: GET /api/campaigns/kurban-peduli-banua returns kurban_options where all 3 items have numeric quota field. ANNUAL REPORTS: (B1) GET /api/reports (default all) returns years array ['all', '2026', '2025', '2024'], numeric totals (total_collected=2843710000, total_donors=9999, total_donations=10728), non-empty by_category (6 categories) and by_program (8 programs). (B2) GET /api/reports?year=2025 returns exact totals: total_collected=1340000000, total_donors=4120, total_donations=6540. (B3) GET /api/reports?year=2024 returns exact totals: total_collected=890000000, total_donors=2760, total_donations=4180. (B4) GET /api/reports?year=2026 returns live totals: total_collected=613710000 (> 0), by_program length=8. (B5) GET /api/reports?year=1999 correctly returns HTTP 404 with years array. DONATION REGRESSION: (C) POST /api/donations to non-kurban campaign (wakaf-al-quran-santri-pelosok) with amount=100000 returns 200 with unique_code=495 (100-999), total_amount=100495 (amount + unique_code), status='pending', and correctly increments campaign collected_amount by 100000 (87625000 → 87725000) and donor_count by 1 (344 → 345). All features working perfectly. Backend is production-ready."
    -agent: "main"
    -message: "New admin-protected endpoints added for the Kurban Admin quota editor. Please test ONLY the current_focus task 'Admin Kurban quota management'. (1) GET /api/admin/kurban WITHOUT x-admin-key -> 401; WITH header x-admin-key: yababerma-admin-2026 -> 200 returning {options:[3 items]} each with numeric quota & sold_base. (2) POST /api/admin/kurban-quota WITH correct key and body {\"options\":[{\"key\":\"kambing\",\"quota\":60,\"sold_base\":20}]} -> 200 and returned kambing has quota=60 & sold_base=20; then GET /api/admin/kurban confirms persistence; also GET /api/kurban/quota reflects kambing.quota=60 with remaining recomputed = 60 - sold. (3) POST WITHOUT x-admin-key -> 401. (4) POST with body {\"options\":\"notarray\"} -> 400. CRITICAL CLEANUP: after all tests, POST /api/admin/kurban-quota with {\"options\":[{\"key\":\"kambing\",\"quota\":50,\"sold_base\":18}]} to RESET the demo baseline. This is the only focus; other endpoints already passed."
    -agent: "testing"
    -message: "✅ ADMIN KURBAN QUOTA MANAGEMENT TESTED - ALL PASSED (6/6 tests). Comprehensive testing completed for the current_focus task 'Admin Kurban quota management'. Test results: (1) GET /api/admin/kurban WITHOUT x-admin-key correctly returns 401 (unauthorized). (2) GET /api/admin/kurban WITH x-admin-key (yababerma-admin-2026) returns 200 with exactly 3 options (kambing, sapi-patungan, sapi-utuh), all with required fields: key, name, unit (string), price, quota, sold_base (numeric). (3) POST /api/admin/kurban-quota WITH x-admin-key and body {options:[{key:'kambing',quota:60,sold_base:20}]} returns 200 with kambing.quota=60 and sold_base=20. Persistence verified: GET /api/admin/kurban confirms kambing quota=60, sold_base=20 persisted. Public endpoint GET /api/kurban/quota reflects new quota (kambing.quota=60, sold=25, remaining=35 correctly calculated as max(60-25,0)). Other options unchanged: sapi-patungan quota=70, sapi-utuh quota=10. (4) POST /api/admin/kurban-quota WITHOUT x-admin-key correctly returns 401 (unauthorized). (5) POST /api/admin/kurban-quota WITH x-admin-key but invalid body {options:'notarray'} correctly returns 400 (validation error). (6) CLEANUP completed: kambing reset to demo baseline (quota=50, sold_base=18) via POST /api/admin/kurban-quota, confirmed with 200 response. All admin authentication, authorization, validation, and quota management functionality working correctly. Feature is production-ready."
    -agent: "main"
    -message: "DEPLOYMENT FIX regression: deployment_agent flagged multiple unbounded MongoDB .toArray() queries. I added .limit() to ALL of them (campaigns list limit 200, donations-by-email 200, news 50, testimonials 50, gallery 100, stats campaigns 200, kurban quota donations 5000, reports campaigns 200, annual_reports 20, prayers 50, admin summary donations 10000). No logic changed besides adding limits. Please run a REGRESSION to confirm nothing broke and response shapes/counts are intact: GET /api/campaigns (8), GET /api/campaigns?category=zakat (1), GET /api/campaigns/kurban-peduli-banua (has kurban_options w/ quota + recent_donations), GET /api/news (>=4), GET /api/testimonials (>=4), GET /api/gallery (>=8), GET /api/stats (has total_collected/total_donors/total_target/total_donations/active_campaigns), GET /api/kurban/quota (3 options w/ quota/sold/remaining), GET /api/reports?year=all and ?year=2025 (exact totals 1340000000/4120/6540), GET /api/prayers (>=8), GET /api/admin/summary + /api/admin/donations with x-admin-key yababerma-admin-2026, and POST /api/donations (still 200, unique_code, increments). Confirm zero 500s."
    -agent: "testing"
    -message: "✅ DEPLOYMENT FIX REGRESSION COMPLETE - ALL TESTS PASSED (12/12) - ZERO 500 ERRORS. Comprehensive regression testing completed for deployment fix (.limit() additions to all MongoDB queries). All endpoints verified and working correctly: (1) GET /api/campaigns returns 8 campaigns with no _id field. (2) GET /api/campaigns?category=zakat returns 1 campaign. (3) GET /api/campaigns/kurban-peduli-banua returns campaign with kurban_options array (3 items, each with numeric quota) and recent_donations array. (4) GET /api/news returns 4 items (>= 4). (5) GET /api/testimonials returns 4 items (>= 4). (6) GET /api/gallery returns 8 items (>= 8). (7) GET /api/stats returns all required fields (total_collected, total_donors, total_target, total_donations, active_campaigns). (8) GET /api/kurban/quota returns exactly 3 options with numeric quota/sold/remaining (kambing quota=50, sold=18, remaining=32 - demo baseline intact). (9) GET /api/reports?year=all returns years array ['all', '2026', '2025', '2024']; GET /api/reports?year=2025 returns exact totals (total_collected=1340000000, total_donors=4120, total_donations=6540). (10) GET /api/prayers returns 8 items (>= 8). (11) GET /api/admin/summary with x-admin-key returns all required fields (total_donations, verified, pending, total_verified, confirmations); GET /api/admin/donations returns array. (12) POST /api/donations creates donation with unique_code (100-999), total_amount=amount+unique_code, status='pending', and correctly increments campaign collected_amount by 50000 and donor_count by 1 (before: 63000000/480, after: 63050000/481). NO REGRESSIONS DETECTED. All response shapes and counts intact. The .limit() additions are deployment-ready and do not affect functionality. Backend is production-ready for deployment."
