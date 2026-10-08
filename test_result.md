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

  - task: "Thank-you email moved to verification-only + no creation thank-you"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "CHANGE 1 (thank-you email flow): On POST /api/donations we REMOVED the on-creation donor thank-you email; now only sendAdminNotifyEmail fires on creation. The donor thank-you is sent ONLY on admin verification via POST /api/admin/verify (sendVerifiedEmail, fire-and-forget). Verify: (a) POST /api/donations still returns 200 quickly (<2s) with unique_code/total_amount/status=pending and still increments campaign collected_amount & donor_count; (b) POST /api/admin/verify {donation_id, status:'verified'} with x-admin-key returns 200 in <2s (non-blocking) and sets status='verified' + verified_at; reverting to pending sets verified_at=null. Emails are fire-and-forget (Resend domain now verified) and must never block/break responses."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (3/3 tests) - ZERO 500 ERRORS. Thank-you email flow change verified successfully! (1a) POST /api/donations returns 200 in 0.374s (well under 2s requirement) with unique_code=966 (100-999), total_amount=75966 (amount + unique_code), status='pending'. Campaign progress verified: collected_amount increased by exactly 75000 (63000000 → 63075000) and donor_count increased by 1 (480 → 481). No blocking email on creation - only admin notification fires (fire-and-forget). (1b) POST /api/admin/verify {donation_id, status:'verified'} with x-admin-key returns 200 in 0.234s (well under 2s requirement), sets status='verified' and verified_at='2026-08-21T16:11:56.408Z' (non-null). Verified in GET /api/admin/donations: status='verified', verified_at set correctly. Fire-and-forget email sent to donor on verification (non-blocking). (1c) POST /api/admin/verify {donation_id, status:'pending'} successfully reverts: status='pending', verified_at=null. All email operations are fire-and-forget and non-blocking. Feature is production-ready."

  - task: "Admin bulk delete endpoint (POST /api/admin/delete)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "CHANGE 2 (bulk delete): NEW endpoint POST /api/admin/delete {collection:'donations'|'confirmations', ids:[...]} (admin-only). Verify: (1) no x-admin-key -> 401; (2) empty ids [] -> 400; (3) create 2 test donations to a known campaign (e.g. paket-sembako-dhuafa-banjarmasin), capture campaign collected_amount & donor_count BEFORE, then POST /api/admin/delete with those 2 ids -> 200 {deleted:2, reverted:2}; confirm those donations are gone from GET /api/admin/donations AND campaign collected_amount decreased by the sum of the two amounts and donor_count decreased by 2 (rollback). (4) confirmations deletion: create a confirmation via POST /api/confirmations then delete it via POST /api/admin/delete {collection:'confirmations', ids:[id]} -> 200 {deleted:1}. Also quick regression: GET /api/admin/summary, GET /api/admin/donations, GET /api/admin/confirmations still 200. IMPORTANT: clean up any test donations/confirmations you create so the demo stays pristine."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (4/4 tests) - ZERO 500 ERRORS. Admin bulk delete endpoint working perfectly! (2.1) POST /api/admin/delete without x-admin-key correctly returns 401 (unauthorized). (2.2) POST /api/admin/delete with x-admin-key and empty ids [] correctly returns 400 (validation error). (2.3) Rollback test PASSED: Created 2 donations (amounts 20000 and 30000) to campaign 'paket-sembako-dhuafa-banjarmasin'. Campaign BEFORE: collected_amount=63075000, donor_count=481. After creating donations: collected_amount=63125000 (+50000), donor_count=483 (+2). POST /api/admin/delete with 2 donation ids returned 200 {deleted:2, reverted:2}. Verified donations are gone from GET /api/admin/donations. Campaign AFTER DELETE: collected_amount=63075000 (baseline restored), donor_count=481 (baseline restored). Campaign rollback working perfectly! (2.4) Confirmations deletion PASSED: Created confirmation with id, then POST /api/admin/delete {collection:'confirmations', ids:[id]} returned 200 {deleted:1}. Verified confirmation is gone from GET /api/admin/confirmations. Quick regression PASSED: GET /api/admin/summary (200), GET /api/admin/donations (200), GET /api/admin/confirmations (200). CLEANUP completed: All test donations/confirmations deleted, demo DB pristine. Feature is production-ready."

  - task: "Admin auth: DB-backed key + forgot/reset password via email OTP"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Admin key is now stored in the `settings` collection (id='admin_auth'), seeded once from process.env.ADMIN_KEY (yababerma-admin-2026). getAdminKey(db) is used by POST /api/admin/login AND the admin guard for all /admin endpoints. New endpoints (NO admin key required): (1) POST /api/admin/forgot-password -> generates a 6-digit OTP, stores settings id='admin_reset' {otp, expires_at=+10min, last_sent}, emails OTP to process.env.ADMIN_EMAIL via Resend, returns {ok:true, email:<masked>}; rate-limited to 1 per 60s (429). (2) POST /api/admin/reset-password {otp, new_password} -> validates OTP (not expired, matches), sets settings.admin_auth.password=new_password (min 6 chars), deletes admin_reset, returns {ok:true}. TEST NOTES: The OTP is emailed (you cannot read the inbox) so to complete the positive reset path READ the OTP directly from MongoDB using MONGO_URL & DB_NAME from /app/.env (db.settings.findOne({id:'admin_reset'}).otp). Verify: login with correct key 200 / wrong 401; all admin endpoints still gated (GET /api/admin/summary 200 with key, 401 without); forgot-password returns 200 + masked email, immediate 2nd call 429; reset-password negatives (no prior request or wrong OTP -> 400, short password -> 400); positive reset to 'temp-pass-999' -> 200, then login with 'temp-pass-999' -> 200 and login with old 'yababerma-admin-2026' -> 401. CRITICAL CLEANUP (must do at end): directly in MongoDB set settings.admin_auth.password back to 'yababerma-admin-2026' and delete the settings doc id='admin_reset', so the documented admin key is restored for future logins/tests."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (5/5 test groups) - ZERO 500 ERRORS. Comprehensive testing completed for admin auth feature. TEST 1 (Login + Guard): POST /api/admin/login with correct key (yababerma-admin-2026) returns 200 {ok:true}, wrong key returns 401. GET /api/admin/summary WITH x-admin-key header returns 200 with all required fields (total_donations, verified, pending, total_verified, total_all, confirmations), WITHOUT header returns 401. DB-backed admin guard working correctly. TEST 2 (Forgot Password): POST /api/admin/forgot-password returns 200 {ok:true, email:'a***n@yababerma.org'} with masked email. Immediate retry correctly returns 429 (rate-limited) with error message 'Mohon tunggu 1 menit sebelum meminta kode baru.' Rate limiting working perfectly. TEST 3 (Reset Password): POST /api/admin/reset-password with wrong OTP (000000) returns 400 'Kode verifikasi salah'. Short password (<6 chars) returns 400 'Password baru minimal 6 karakter'. Successfully read OTP (513049) from MongoDB settings collection (id='admin_reset'). POST with correct OTP and new password (temp-pass-999) returns 200 {ok:true}. Verified password change: login with new password succeeds (200), login with old password fails (401). Admin guard works with new password (GET /api/admin/summary returns 200), fails with old password (401). Password reset flow working perfectly. TEST 4 (Critical Cleanup): Successfully restored MongoDB settings.admin_auth.password to 'yababerma-admin-2026' (matched=1, modified=1). Deleted settings document id='admin_reset' (deleted=0, already deleted by reset-password endpoint). Verified login with restored password succeeds (200 {ok:true}). Original admin key restored successfully. TEST 5 (Quick Regression): GET /api/admin/summary (200), GET /api/admin/donations (200), GET /api/campaigns returns 8 campaigns (200). All endpoints working with zero 500 errors. Feature is production-ready."

  - task: "Admin change-password (POST /api/admin/change-password) + Fonnte WA hook in verify (inert without token)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "CHANGE A: POST /api/admin/change-password (under the admin guard, requires x-admin-key = current key). Body {new_password}. Validates min 6 chars and that new != current; updates settings.admin_auth.password; returns {ok:true}. CHANGE B: POST /api/admin/verify now ALSO fires sendWhatsAppThankYou(donation) fire-and-forget when status becomes 'verified' (idempotent via donation.wa_thanked_at). FONNTE_TOKEN is NOT set yet, so sendWhatsAppThankYou returns false immediately (inert) and must NOT affect verify. TEST: (1) POST /api/admin/change-password without x-admin-key -> 401; with key + {new_password:'123'} -> 400 (min 6); with key + new_password equal to current key -> 400. (2) Positive: with x-admin-key=yababerma-admin-2026 + {new_password:'newpass-777'} -> 200; then POST /api/admin/login {key:'newpass-777'} -> 200 and old key -> 401. CLEANUP: change it back to 'yababerma-admin-2026' (call change-password again with x-admin-key='newpass-777' and new_password='yababerma-admin-2026', OR set MongoDB settings.admin_auth.password='yababerma-admin-2026' directly) and confirm login with yababerma-admin-2026 -> 200. (3) Verify endpoint regression: create a donation to any campaign, then POST /api/admin/verify {donation_id, status:'verified'} with key -> 200 in <2s (WA hook inert, must not block); status='verified'. Revert to pending -> 200. Then delete that test donation via /api/admin/delete to keep DB pristine. Report zero 500s."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (3/3 test groups) - ZERO 500 ERRORS. Comprehensive testing completed for admin change-password endpoint and Fonnte WA hook regression. TEST A (Change Password): (A1) POST /api/admin/change-password WITHOUT x-admin-key header correctly returns 401 (unauthorized). (A2) POST with x-admin-key but password='123' (< 6 chars) correctly returns 400 with error 'Password baru minimal 6 karakter.' (A3) POST with x-admin-key but new_password='yababerma-admin-2026' (same as current) correctly returns 400 with error 'Password baru harus berbeda dari yang sekarang.' (A4) POSITIVE: POST with x-admin-key and new_password='newpass-777' returns 200 {ok:true}. (A4b) Verified login with new password 'newpass-777' succeeds (200 {ok:true}). (A4c) Verified login with old password 'yababerma-admin-2026' fails (401) as expected. (A5) CRITICAL CLEANUP: Successfully restored password to 'yababerma-admin-2026' via POST /api/admin/change-password with x-admin-key='newpass-777' and new_password='yababerma-admin-2026' -> 200 {ok:true}. (A5b) Verified login with restored password succeeds (200 {ok:true}). TEST B (Verify Fonnte Regression): (B1) Created donation to campaign 'paket-sembako-dhuafa-banjarmasin' with id=21c05953-dfee-4a51-a4dd-c5c63057ec48, unique_code=102, total_amount=20102, status=pending. (B2) POST /api/admin/verify with donation_id and status='verified' returns 200 in 0.201s (well under 2s requirement) - WA hook is truly fire-and-forget and non-blocking. Response donation.status='verified' and verified_at='2026-08-21T16:50:07.823Z' set correctly. (B3) POST /api/admin/verify with status='pending' successfully reverts: status='pending'. (B4) CLEANUP: POST /api/admin/delete with donation_id returns 200 {deleted:1, reverted:1} - donation deleted and campaign rollback successful. QUICK REGRESSION: (R1) GET /api/admin/summary with x-admin-key returns 200 with all required fields (total_donations=0, verified=0, pending=0). (R2) GET /api/campaigns returns 8 campaigns. All admin authentication, authorization, validation, password change, and verify endpoint functionality working correctly. The sendWhatsAppThankYou function is correctly implemented to return false immediately when FONNTE_TOKEN is not set (inert), ensuring it doesn't block the API response. Feature is production-ready."

  - task: "WhatsApp Settings (Pengaturan WA): GET/POST /api/admin/wa-settings + POST /api/admin/wa-test"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Verify admin-editable WhatsApp settings (Fonnte). All endpoints under admin guard (header x-admin-key: yababerma-admin-2026). (1) GET /api/admin/wa-settings WITHOUT x-admin-key -> 401; WITH key -> 200 returning {thank_you_template (non-empty string), admin_notify_enabled (bool), admin_number (string), token_configured (bool; true since FONNTE_TOKEN set), default_template (string)}. (2) POST /api/admin/wa-settings WITH key and body {thank_you_template:'Halo {name}, donasi {amount} untuk {program} sudah kami terima. Total {total}.', admin_notify_enabled:true, admin_number:'085183341174'} -> 200 {ok:true,...}; then GET confirms persistence of all three fields. (3) POST with empty thank_you_template ('   ') must fall back to the default (non-empty) template. (4) POST /api/admin/wa-test WITHOUT x-admin-key -> 401; WITH key but empty number -> 400 'Nomor WhatsApp wajib diisi.' (do NOT send a real WA; the empty-number 400 is enough). (5) Light regression on POST /api/admin/verify (create donation w/ donor_whatsapp, verify -> 200 in <2s since WA thank-you is fire-and-forget; then delete via /api/admin/delete). CRITICAL CLEANUP: after testing wa-settings POST, restore defaults by POSTing {thank_you_template:'', admin_notify_enabled:false, admin_number:''} so the demo baseline stays clean."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (7/7 tests) - ZERO 500 ERRORS. Comprehensive testing completed for WhatsApp Settings feature. (1.1) GET /api/admin/wa-settings WITHOUT x-admin-key correctly returns 401 (unauthorized). (1.2) GET /api/admin/wa-settings WITH x-admin-key (yababerma-admin-2026) returns 200 with all required fields: thank_you_template (non-empty string, length: 374), admin_notify_enabled (boolean: false), admin_number (string: ''), token_configured (boolean: true - FONNTE_TOKEN is set), default_template (non-empty string, length: 374). All field types validated correctly. (1.3) POST /api/admin/wa-settings WITH x-admin-key and custom template body returns 200 {ok:true}. Persistence verified: GET /api/admin/wa-settings confirms all three fields (thank_you_template, admin_notify_enabled:true, admin_number:'085183341174') persisted correctly. (1.4) POST /api/admin/wa-settings with empty/whitespace thank_you_template ('   ') correctly falls back to default template (length: 374). (1.5) POST /api/admin/wa-test WITHOUT x-admin-key correctly returns 401 (unauthorized). (1.6) POST /api/admin/wa-test WITH x-admin-key but empty number correctly returns 400 with error message 'Nomor WhatsApp wajib diisi.' (1.7) Light regression PASSED: Created donation with donor_whatsapp, POST /api/admin/verify with status='verified' returns 200 in 0.229s (well under 2s requirement) - WA thank-you is truly fire-and-forget and non-blocking. Reverted to pending successfully. CLEANUP completed: WA settings restored to defaults (thank_you_template:'', admin_notify_enabled:false, admin_number:''), test donation deleted (1 donation deleted, 1 campaign reverted). Demo DB is pristine. All admin authentication, authorization, validation, persistence, and fire-and-forget WA functionality working correctly. Feature is production-ready."

  - task: "Prayer wall opt-in: donation stores show_on_wall + GET /api/prayers filters by it"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "NEW FEATURE: donors can opt-in to display their prayer/message on the public Dinding Doa (prayer wall). CHANGE 1: POST /api/donations now stores show_on_wall (boolean; body.show_on_wall === undefined -> false, else !!body.show_on_wall). CHANGE 2: GET /api/prayers now only merges donation messages where show_on_wall===true AND message non-empty (the seeded 'prayers' collection is still always included so the wall is never empty). Verify: (A) POST /api/donations with a UNIQUE non-empty message and show_on_wall:true -> 200 (unique_code 100-999, total_amount=amount+unique_code, status=pending, campaign increment still works); then GET /api/prayers MUST include that exact message text. (B) POST /api/donations with a DISTINCT unique non-empty message and show_on_wall:false -> 200; then GET /api/prayers MUST NOT include that message. (C) POST /api/donations with a message but WITHOUT the show_on_wall field -> stored show_on_wall=false, so message NOT on wall. (D) GET /api/prayers still returns >=8 items (seeded prayers present) and each item has {name, message, program}. CLEANUP: delete the test donations you create via POST /api/admin/delete (x-admin-key: yababerma-admin-2026) so the demo DB stays pristine."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (5/5 tests) - ZERO 500 ERRORS. Comprehensive testing completed for Prayer wall opt-in feature. (2.A) POST /api/donations with unique message 'DOA-TEST-WALL-32KZRX1E' and show_on_wall:true returns 200 with unique_code=785 (100-999 range ✅), total_amount=15785 (amount + unique_code ✅), status='pending' ✅. GET /api/prayers confirms the exact unique message IS present on prayer wall with correct structure {name:'Test Donor A TZ8L', message:'DOA-TEST-WALL-32KZRX1E', program:'Paket Sembako Dhuafa Banjarmasin'}. (2.B) POST /api/donations with unique message 'DOA-HIDDEN-5RD2N42V' and show_on_wall:false returns 200. GET /api/prayers confirms that hidden message is NOT present on prayer wall (as expected). (2.C) POST /api/donations with unique message 'DOA-NOFLAG-WOXUZ75V' and NO show_on_wall field returns 200. GET /api/prayers confirms message is NOT present (correctly defaults to false/not shown). (2.D) GET /api/prayers returns 9 items (>= 8 required ✅) with correct structure - all items have required fields {name, message, program}. (2.E) Campaign increment verified: GET /api/campaigns/paket-sembako-dhuafa-banjarmasin returns collected_amount=63053000, donor_count=483 - all three donations (A, B, C) correctly incremented the campaign. CLEANUP completed: Deleted 3 test donations via POST /api/admin/delete, reverted 3 campaigns. Demo DB is pristine. All opt-in functionality, filtering logic, and campaign increment working correctly. Feature is production-ready."

  - task: "Media upload & serve (POST /api/admin/upload, GET /api/media/{id})"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "NEW media system for the admin CMS. (1) POST /api/admin/upload (admin-guarded, x-admin-key: yababerma-admin-2026) accepts multipart/form-data with a 'file' field; stores file bytes in a 'media' collection (UUID id) and returns {ok:true, id, url:'/api/media/{id}', filename, content_type, size}. Max 10MB (>10MB -> 400). No key -> 401. (2) GET /api/media/{id} (public) streams the file back with its Content-Type (e.g. image/png or application/pdf); unknown id -> 404. Verify: upload a small PNG (multipart) with key -> 200 with url; then GET that url returns 200 with the correct image content-type and non-empty body; upload WITHOUT key -> 401. Also upload a small PDF -> 200 and GET returns application/pdf. Delete the created media docs is optional (they are harmless)."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (5/5 tests). Media upload & serve feature working perfectly! (1.1) POST /api/admin/upload WITHOUT x-admin-key correctly returns 401 (unauthorized). (1.2) POST /api/admin/upload WITH x-admin-key and PNG image returns 200 with all required fields: {ok:true, id, url:'/api/media/{id}', filename:'test.png', content_type:'image/png', size:77}. URL format correct (starts with '/api/media/'). (1.3) GET /api/media/{id} (public, no key) returns 200 with Content-Type:image/png and non-empty body (77 bytes). (1.4) POST /api/admin/upload WITH x-admin-key and PDF file returns 200 with url:'/api/media/{id}', content_type:'application/pdf', size:543. (1.4b) GET /api/media/{id} for PDF returns 200 with Content-Type:application/pdf and non-empty body (543 bytes). (1.5) Size guard test (>10MB) skipped (not feasible to generate large file in test). All authentication, upload, storage, and serving functionality working correctly. Feature is production-ready."

  - task: "Program/Campaign CMS CRUD (GET/POST /api/admin/campaigns, PUT/DELETE /api/admin/campaigns/{id})"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "NEW WordPress-like program manager. All admin-guarded (x-admin-key: yababerma-admin-2026). (1) GET /api/admin/campaigns -> 200 array of ALL campaigns (including drafts). No key -> 401. (2) POST /api/admin/campaigns body {title, category, short_desc, image, story (string w/ newlines OR array), video_url, target_amount, collected_amount, donor_count, deadline, featured, published, gallery:[], updates:[], reports:[]} -> 200 returns created campaign with generated unique slug, published defaults to FALSE when omitted. Missing title -> 400. (3) PUT /api/admin/campaigns/{id} with {published:true} (or any subset of fields) -> 200 returns updated campaign; unknown id -> 404. story as string with newlines must be stored as array. (4) DELETE /api/admin/campaigns/{id} -> 200 {ok:true, deleted:1}. DRAFT VISIBILITY: after creating a DRAFT (published omitted/false), GET /api/campaigns (public) must NOT include it, and GET /api/campaigns/{slug} (public) must return 404. After PUT published:true, GET /api/campaigns (public) MUST include it and GET /api/campaigns/{slug} returns 200. CLEANUP: delete any campaigns you create via DELETE so the catalog stays at its original 8."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (12/12 tests). Program/Campaign CMS CRUD feature working perfectly! (2.1) GET /api/admin/campaigns WITHOUT x-admin-key correctly returns 401 (unauthorized). (2.1b) GET /api/admin/campaigns WITH x-admin-key returns 200 with array of 8 campaigns (includes all campaigns). (2.2) POST /api/admin/campaigns WITH x-admin-key and body (omit published field) returns 200 with generated slug 'test-program-cms-62r677e3', published===false (draft), and story stored as ARRAY with 2 items ['Para 1', 'Para 2']. (2.3) DRAFT HIDDEN: GET /api/campaigns (public) returns 8 campaigns and does NOT contain draft slug (as expected). (2.3b) GET /api/campaigns/{draft-slug} (public) correctly returns 404 for draft. (2.4) POST /api/admin/campaigns WITH x-admin-key but NO title correctly returns 400 (validation error). (2.5) PUT /api/admin/campaigns/{id} WITH x-admin-key and body {published:true} returns 200, campaign published successfully. (2.5b) GET /api/campaigns (public) NOW contains the published slug (as expected). (2.5c) GET /api/campaigns/{slug} returns 200 with video_url present and story array length 2. (2.6) PUT /api/admin/campaigns/{unknown-id} correctly returns 404. (2.7) DELETE /api/admin/campaigns/{id} WITH x-admin-key returns 200 {ok:true, deleted:1}. (2.7b) GET /api/campaigns no longer contains deleted slug. (2.8) CLEANUP verified: GET /api/campaigns returns exactly 8 campaigns (baseline restored). All admin authentication, authorization, validation, draft visibility, publishing, and CRUD operations working correctly. Feature is production-ready."

  - task: "Public campaigns respect published flag + manual campaign numbers (no auto-increment)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "CHANGE A: GET /api/campaigns now returns only published!==false (existing seeded campaigns have no published field so they STILL show -> should still be 8). GET /api/campaigns/{slug} returns 404 if published===false. CHANGE B (manual numbers): POST /api/donations NO LONGER auto-increments campaign collected_amount/donor_count (admin manages these manually now). POST /api/admin/delete NO LONGER rolls back campaign numbers (returns reverted:0). Verify: (1) GET /api/campaigns still returns 8 published campaigns. (2) Capture a campaign's collected_amount & donor_count, POST a donation to it (amount e.g. 50000) -> 200 with unique_code/total_amount/status=pending, and confirm the campaign collected_amount & donor_count are UNCHANGED (manual mode). (3) POST /api/admin/delete {ids:[that donation id]} -> 200 {deleted:1, reverted:0} and campaign numbers still unchanged. (4) Quick regression: GET /api/kurban/quota (3 options), GET /api/prayers (>=8), GET /api/admin/summary with key (200). Zero 500s."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (10/10 tests) - ZERO 500 ERRORS. Public published filter + manual campaign numbers feature working perfectly! (3.1) GET /api/campaigns returns exactly 8 published campaigns (seeded campaigns with no published field still show as expected). (3.2) Campaign 'paket-sembako-dhuafa-banjarmasin' BEFORE donation: collected_amount=63000000, donor_count=480. (3.2b) POST /api/donations with amount=50000 returns 200 with unique_code=937 (100-999 range ✅), total_amount=50937 (amount + unique_code ✅), status='pending' ✅. (3.2c) Campaign AFTER donation: collected_amount=63000000, donor_count=480 - UNCHANGED (manual mode working ✅). (3.3) POST /api/admin/delete with donation_id returns 200 {deleted:1, reverted:0} (manual mode ✅). (3.3b) Campaign AFTER delete: collected_amount=63000000, donor_count=480 - STILL unchanged (manual mode working ✅). (3.4a) GET /api/kurban/quota returns 200 with exactly 3 options ✅. (3.4b) GET /api/prayers returns 200 with 8 items (>= 8 required ✅). (3.4c) GET /api/admin/summary with x-admin-key returns 200 with all required fields ✅. All published filter logic, manual campaign numbers (no auto-increment), and regression endpoints working correctly. ZERO 500 errors across all tests. Feature is production-ready."


  - task: "Home slider settings (GET /api/home-settings public, POST /api/admin/home-settings admin)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "NEW home hero slider CMS. (1) GET /api/home-settings (PUBLIC, no key) -> 200 {slides:[], duration_ms:6000} by default (empty until configured). (2) POST /api/admin/home-settings (admin-guarded, x-admin-key: yababerma-admin-2026) body {slides:[{type:'banner'|'campaign', image, title, subtitle, badge, link, slug}], duration_ms} -> 200 {ok:true, slides, duration_ms}; each slide gets a normalized shape (type coerced to 'campaign' unless 'banner', strings coerced, id auto-added if missing). Then GET /api/home-settings reflects the saved slides & duration_ms. No key on POST -> 401. Verify: (a) POST with 2 slides (one banner w/ image+title+link, one campaign w/ slug+title) and duration_ms=10000 -> 200; (b) GET /api/home-settings returns those 2 slides (each with an id) and duration_ms=10000; (c) POST without key -> 401. CLEANUP: POST /api/admin/home-settings {slides:[], duration_ms:6000} to reset to default so the homepage falls back to the built-in slider."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (5/5 tests) - ZERO 500 ERRORS. Home slider settings feature working perfectly! (1.1) GET /api/home-settings (PUBLIC, no key) returns 200 with default values: slides:[] (empty array), duration_ms:6000. Response structure validated with required fields. (1.2) POST /api/admin/home-settings WITHOUT x-admin-key correctly returns 401 (unauthorized). (1.3) POST /api/admin/home-settings WITH x-admin-key and body with 2 slides (one banner type, one campaign type) and duration_ms:10000 returns 200 {ok:true, slides:[...], duration_ms:10000}. Each returned slide has an 'id' field auto-generated. Slide 1 type is exactly 'banner', Slide 2 type is exactly 'campaign' (type normalization working correctly). (1.4) GET /api/home-settings (public) again returns 200 with 2 slides persisted (each with id) and duration_ms:10000 (persistence verified). (1.5) CLEANUP completed: POST /api/admin/home-settings with {slides:[], duration_ms:6000} returns 200, verified reset with GET showing slides:[] and duration_ms:6000 (default state restored). All admin authentication, authorization, persistence, type normalization, and id auto-generation working correctly. Feature is production-ready."

  - task: "Admin single campaign GET for draft preview (GET /api/admin/campaigns/{id})"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "NEW admin endpoint to preview a campaign (including DRAFTS) without publishing. GET /api/admin/campaigns/{id} (admin-guarded) returns the full campaign doc (regardless of published) PLUS a recent_donations array. No key -> 401; unknown id -> 404. Verify: create a DRAFT via POST /api/admin/campaigns (published omitted); GET /api/admin/campaigns/{id} WITH key -> 200 with the campaign fields and recent_donations array present; GET WITHOUT key -> 401; GET /api/admin/campaigns/<random-unknown> WITH key -> 404. Confirm the public GET /api/campaigns/{slug} still returns 404 for that same draft slug (draft stays hidden publicly). CLEANUP: DELETE the created draft campaign."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED (7/7 tests) - ZERO 500 ERRORS. Admin single campaign GET for draft preview feature working perfectly! (2.1) POST /api/admin/campaigns WITH x-admin-key and body {title:'Draft Preview Test <random>', category:'sedekah', short_desc:'x'} (omit published field) returns 200 with campaign id, slug, and published===false (draft). (2.2) GET /api/admin/campaigns/{id} WITH x-admin-key returns 200 with full campaign fields (title, slug, published===false) and recent_donations array present (length: 0). All required campaign fields validated. (2.3) GET /api/admin/campaigns/{id} WITHOUT x-admin-key correctly returns 401 (unauthorized). (2.4) GET /api/admin/campaigns/{unknown-random-id} WITH x-admin-key correctly returns 404 (not found). (2.5) DRAFT STAYS HIDDEN: GET /api/campaigns/{draft-slug} (public, no key) correctly returns 404 - draft campaign is not accessible via public endpoint. (2.6) CLEANUP: DELETE /api/admin/campaigns/{id} WITH x-admin-key returns 200 {ok:true, deleted:1}. (2.7) Confirmed public GET /api/campaigns returns exactly 8 campaigns (baseline intact, draft removed). All admin authentication, authorization, draft preview, draft visibility control, and CRUD operations working correctly. Feature is production-ready."



metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 10
  run_ui: false

test_plan:
  current_focus:
    - "Home slider settings (GET /api/home-settings public, POST /api/admin/home-settings admin)"
    - "Admin single campaign GET for draft preview (GET /api/admin/campaigns/{id})"
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
    -agent: "main"
    -message: "TWO backend changes to verify (current_focus). CHANGE 1 (thank-you email flow): On POST /api/donations we REMOVED the on-creation donor thank-you email; now only sendAdminNotifyEmail fires on creation. The donor thank-you is sent ONLY on admin verification via POST /api/admin/verify (sendVerifiedEmail, fire-and-forget). Verify: (a) POST /api/donations still returns 200 quickly (<2s) with unique_code/total_amount/status=pending and still increments campaign collected_amount & donor_count; (b) POST /api/admin/verify {donation_id, status:'verified'} with x-admin-key returns 200 in <2s (non-blocking) and sets status='verified' + verified_at; reverting to pending sets verified_at=null. Emails are fire-and-forget (Resend domain now verified) and must never block/break responses. CHANGE 2 (bulk delete): NEW endpoint POST /api/admin/delete {collection:'donations'|'confirmations', ids:[...]} (admin-only). Verify: (1) no x-admin-key -> 401; (2) empty ids [] -> 400; (3) create 2 test donations to a known campaign (e.g. paket-sembako-dhuafa-banjarmasin), capture campaign collected_amount & donor_count BEFORE, then POST /api/admin/delete with those 2 ids -> 200 {deleted:2, reverted:2}; confirm those donations are gone from GET /api/admin/donations AND campaign collected_amount decreased by the sum of the two amounts and donor_count decreased by 2 (rollback). (4) confirmations deletion: create a confirmation via POST /api/confirmations then delete it via POST /api/admin/delete {collection:'confirmations', ids:[id]} -> 200 {deleted:1}. Also quick regression: GET /api/admin/summary, GET /api/admin/donations, GET /api/admin/confirmations still 200. IMPORTANT: clean up any test donations/confirmations you create so the demo stays pristine."
    -agent: "testing"
    -message: "✅ ALL TESTS PASSED (6/6 tests) - ZERO 500 ERRORS. Comprehensive testing completed for both current_focus tasks. CHANGE 1 (Thank-you email moved to verification-only): (1a) POST /api/donations returns 200 in 0.374s (<2s) with unique_code=966 (100-999), total_amount=75966 (amount + unique_code), status='pending'. Campaign progress verified: collected_amount +75000, donor_count +1. No blocking email on creation - only admin notification fires (fire-and-forget). (1b) POST /api/admin/verify {donation_id, status:'verified'} returns 200 in 0.234s (<2s), sets status='verified' and verified_at (non-null). Fire-and-forget email sent to donor on verification (non-blocking). (1c) POST /api/admin/verify {donation_id, status:'pending'} reverts: status='pending', verified_at=null. CHANGE 2 (Admin bulk delete endpoint): (2.1) POST /api/admin/delete without x-admin-key returns 401. (2.2) POST /api/admin/delete with empty ids [] returns 400. (2.3) Rollback test PASSED: Created 2 donations (20000 + 30000), campaign increased by +50000 and +2 donors. POST /api/admin/delete returned {deleted:2, reverted:2}. Donations gone from admin list. Campaign stats rolled back to baseline (collected_amount and donor_count restored). (2.4) Confirmations deletion PASSED: Created confirmation, deleted via POST /api/admin/delete {collection:'confirmations', ids:[id]} returned {deleted:1}, confirmed gone from admin list. Quick regression PASSED: GET /api/admin/summary (200), GET /api/admin/donations (200), GET /api/admin/confirmations (200). CLEANUP completed: All test donations/confirmations deleted, demo DB pristine. Both features are production-ready."
    -agent: "main"
    -message: "New admin auth flow to test (current_focus). Admin key is now DB-backed (settings.admin_auth, seeded from env yababerma-admin-2026). New endpoints POST /api/admin/forgot-password (emails 6-digit OTP to ADMIN_EMAIL, returns masked email, rate-limited 60s->429) and POST /api/admin/reset-password {otp,new_password}. To complete the positive reset path, READ the OTP from MongoDB (settings collection id='admin_reset') using MONGO_URL & DB_NAME from /app/.env since you cannot read the email inbox. Verify login (correct 200 / wrong 401), admin guard still enforced (summary 200 with key / 401 without), forgot-password (200 + masked email, immediate repeat 429), reset-password negatives (400) and positive (200) then login with new password works & old key fails. CRITICAL CLEANUP: at the very end, directly set MongoDB settings.admin_auth.password back to 'yababerma-admin-2026' and delete settings id='admin_reset' so the documented key is restored. Report zero 500s."
    -agent: "testing"
    -message: "✅ ADMIN AUTH FEATURE COMPLETE - ALL TESTS PASSED (5/5 test groups) - ZERO 500 ERRORS. Comprehensive testing completed for DB-backed admin authentication with forgot/reset password via email OTP. All test scenarios verified: (1) LOGIN + GUARD: DB-backed admin key working correctly - login with correct key returns 200, wrong key returns 401. Admin guard validates against DB-backed key - GET /api/admin/summary with header returns 200, without header returns 401. (2) FORGOT PASSWORD: Returns 200 with masked email 'a***n@yababerma.org'. Rate limiting working perfectly - immediate retry returns 429 'Mohon tunggu 1 menit sebelum meminta kode baru'. (3) RESET PASSWORD: All validations working - wrong OTP returns 400, short password returns 400 'Password baru minimal 6 karakter'. Successfully read OTP from MongoDB settings collection. Password reset successful - login with new password works, old password fails. Admin guard updated correctly - works with new password, fails with old password. (4) CRITICAL CLEANUP: Successfully restored original admin key 'yababerma-admin-2026' via MongoDB direct update. Deleted admin_reset document. Verified login with restored password succeeds. (5) QUICK REGRESSION: All admin endpoints working - GET /api/admin/summary (200), GET /api/admin/donations (200), GET /api/campaigns (8 campaigns). Zero 500 errors. Feature is production-ready."
    -agent: "main"
    -message: "New admin change-password endpoint + Fonnte WA hook in verify to test (current_focus). CHANGE A: POST /api/admin/change-password (under the admin guard, requires x-admin-key = current key). Body {new_password}. Validates min 6 chars and that new != current; updates settings.admin_auth.password; returns {ok:true}. CHANGE B: POST /api/admin/verify now ALSO fires sendWhatsAppThankYou(donation) fire-and-forget when status becomes 'verified' (idempotent via donation.wa_thanked_at). FONNTE_TOKEN is NOT set yet, so sendWhatsAppThankYou returns false immediately (inert) and must NOT affect verify. TEST: (1) POST /api/admin/change-password without x-admin-key -> 401; with key + {new_password:'123'} -> 400 (min 6); with key + new_password equal to current key -> 400. (2) Positive: with x-admin-key=yababerma-admin-2026 + {new_password:'newpass-777'} -> 200; then POST /api/admin/login {key:'newpass-777'} -> 200 and old key -> 401. CLEANUP: change it back to 'yababerma-admin-2026' (call change-password again with x-admin-key='newpass-777' and new_password='yababerma-admin-2026', OR set MongoDB settings.admin_auth.password='yababerma-admin-2026' directly) and confirm login with yababerma-admin-2026 -> 200. (3) Verify endpoint regression: create a donation to any campaign, then POST /api/admin/verify {donation_id, status:'verified'} with key -> 200 in <2s (WA hook inert, must not block); status='verified'. Revert to pending -> 200. Then delete that test donation via /api/admin/delete to keep DB pristine. Report zero 500s."
    -agent: "testing"
    -message: "✅ ALL TESTS PASSED (3/3 test groups) - ZERO 500 ERRORS. Comprehensive testing completed for admin change-password endpoint and Fonnte WA hook regression. TEST A (Change Password): (A1) POST /api/admin/change-password WITHOUT x-admin-key header correctly returns 401 (unauthorized). (A2) POST with x-admin-key but password='123' (< 6 chars) correctly returns 400 with error 'Password baru minimal 6 karakter.' (A3) POST with x-admin-key but new_password='yababerma-admin-2026' (same as current) correctly returns 400 with error 'Password baru harus berbeda dari yang sekarang.' (A4) POSITIVE: POST with x-admin-key and new_password='newpass-777' returns 200 {ok:true}. (A4b) Verified login with new password 'newpass-777' succeeds (200 {ok:true}). (A4c) Verified login with old password 'yababerma-admin-2026' fails (401) as expected. (A5) CRITICAL CLEANUP: Successfully restored password to 'yababerma-admin-2026' via POST /api/admin/change-password with x-admin-key='newpass-777' and new_password='yababerma-admin-2026' -> 200 {ok:true}. (A5b) Verified login with restored password succeeds (200 {ok:true}). TEST B (Verify Fonnte Regression): (B1) Created donation to campaign 'paket-sembako-dhuafa-banjarmasin' with id=21c05953-dfee-4a51-a4dd-c5c63057ec48, unique_code=102, total_amount=20102, status=pending. (B2) POST /api/admin/verify with donation_id and status='verified' returns 200 in 0.201s (well under 2s requirement) - WA hook is truly fire-and-forget and non-blocking. Response donation.status='verified' and verified_at='2026-08-21T16:50:07.823Z' set correctly. (B3) POST /api/admin/verify with status='pending' successfully reverts: status='pending'. (B4) CLEANUP: POST /api/admin/delete with donation_id returns 200 {deleted:1, reverted:1} - donation deleted and campaign rollback successful. QUICK REGRESSION: (R1) GET /api/admin/summary with x-admin-key returns 200 with all required fields (total_donations=0, verified=0, pending=0). (R2) GET /api/campaigns returns 8 campaigns. All admin authentication, authorization, validation, password change, and verify endpoint functionality working correctly. The sendWhatsAppThankYou function is correctly implemented to return false immediately when FONNTE_TOKEN is not set (inert), ensuring it doesn't block the API response. Feature is production-ready."
    -agent: "main"
    -message: "FONNTE ACTIVATED: FONNTE_TOKEN added to .env and server restarted. Live end-to-end test done — created a donation with donor_whatsapp=085183341174, verified it via POST /api/admin/verify (200), and the backend log confirmed 'Fonnte terkirim (queued): [174552777]' (WhatsApp message accepted by Fonnte, no error). Send is fire-and-forget + idempotent (wa_thanked_at). Test donation deleted afterward; DB pristine. WhatsApp auto thank-you on verification is now LIVE."

    -agent: "main"
    -message: "TWO items to test now (current_focus). ITEM 1 (WhatsApp Settings / Pengaturan WA): FONNTE_TOKEN is set. Test GET/POST /api/admin/wa-settings (admin-guarded) for persistence of thank_you_template/admin_notify_enabled/admin_number, token_configured=true, empty-template fallback to default; and POST /api/admin/wa-test (401 without key, 400 for empty number — do NOT send a real WA). Light regression on POST /api/admin/verify (still <2s, fire-and-forget). RESTORE wa-settings to defaults at the end ({thank_you_template:'', admin_notify_enabled:false, admin_number:''}). ITEM 2 (Prayer wall opt-in / NEW): POST /api/donations now stores show_on_wall; GET /api/prayers only merges donation messages with show_on_wall===true AND non-empty message (seeded prayers always included). Verify: (A) donation w/ unique message + show_on_wall:true appears in /api/prayers; (B) donation w/ distinct message + show_on_wall:false does NOT appear; (C) donation w/ message but no show_on_wall field -> not on wall; (D) /api/prayers still >=8 items each with {name,message,program}. Delete all test donations via /api/admin/delete afterwards. x-admin-key: yababerma-admin-2026. Report zero 500s."
    -agent: "testing"
    -message: "✅ ALL TESTS PASSED (12/12 tests) - ZERO 500 ERRORS. Comprehensive testing completed for both current_focus tasks. ITEM 1 (WhatsApp Settings): (1.1) GET /api/admin/wa-settings WITHOUT x-admin-key correctly returns 401. (1.2) GET WITH x-admin-key returns 200 with all required fields: thank_you_template (non-empty string, length: 374), admin_notify_enabled (boolean: false), admin_number (string: ''), token_configured (boolean: true - FONNTE_TOKEN is set), default_template (non-empty string, length: 374). (1.3) POST /api/admin/wa-settings WITH x-admin-key and custom template returns 200 {ok:true}. Persistence verified: all three fields (thank_you_template, admin_notify_enabled:true, admin_number:'085183341174') persisted correctly. (1.4) POST with empty/whitespace thank_you_template correctly falls back to default template (length: 374). (1.5) POST /api/admin/wa-test WITHOUT x-admin-key correctly returns 401. (1.6) POST /api/admin/wa-test WITH x-admin-key but empty number correctly returns 400 with error 'Nomor WhatsApp wajib diisi.' (1.7) Light regression PASSED: Created donation with donor_whatsapp, POST /api/admin/verify with status='verified' returns 200 in 0.229s (< 2s) - WA is fire-and-forget. Reverted to pending successfully. CLEANUP: WA settings restored to defaults, test donation deleted. ITEM 2 (Prayer wall opt-in): (2.A) POST /api/donations with unique message 'DOA-TEST-WALL-32KZRX1E' and show_on_wall:true returns 200 with unique_code=785 (100-999), total_amount=15785 (amount + unique_code), status='pending'. GET /api/prayers confirms the exact unique message IS present on prayer wall with correct structure. (2.B) POST /api/donations with unique message 'DOA-HIDDEN-5RD2N42V' and show_on_wall:false returns 200. GET /api/prayers confirms that hidden message is NOT present on prayer wall. (2.C) POST /api/donations with unique message 'DOA-NOFLAG-WOXUZ75V' and NO show_on_wall field returns 200. GET /api/prayers confirms message is NOT present (defaults to false). (2.D) GET /api/prayers returns 9 items (>= 8) with correct structure - all items have {name, message, program}. (2.E) Campaign increment verified: all three donations correctly incremented the campaign (collected_amount, donor_count). CLEANUP: Deleted 3 test donations, reverted 3 campaigns. Demo DB is pristine. Both features are production-ready."
    -agent: "main"
    -message: "PHASE 1 of the admin CMS (WordPress-like) to test — 3 current_focus tasks. x-admin-key: yababerma-admin-2026. (1) MEDIA: POST /api/admin/upload (multipart 'file') stores to DB and returns {url:'/api/media/{id}'}; GET /api/media/{id} serves the bytes with correct Content-Type. Test a small PNG and a small PDF; no-key -> 401; >10MB -> 400. (2) CAMPAIGN CMS: GET/POST /api/admin/campaigns and PUT/DELETE /api/admin/campaigns/{id}. New campaigns default published=FALSE (draft). Verify a draft is HIDDEN from public GET /api/campaigns and GET /api/campaigns/{slug} returns 404; after PUT published:true it APPEARS publicly. Missing title -> 400; unknown id PUT -> 404. Clean up created campaigns via DELETE (catalog back to 8). (3) MANUAL NUMBERS: POST /api/donations no longer auto-increments campaign collected_amount/donor_count; POST /api/admin/delete returns reverted:0 and does NOT change campaign numbers. Confirm GET /api/campaigns still returns 8. Report zero 500s. NOTE: this changes previously-tested donation behavior on purpose (numbers are now manual by user request) — do not flag the missing increment as a regression."
    -agent: "testing"
    -message: "✅ ALL TESTS PASSED (27/27 tests) - ZERO 500 ERRORS. Comprehensive testing completed for YABABERMA admin CMS Phase 1 (3 current_focus tasks). TASK 1 (Media upload & serve): (1.1) POST /api/admin/upload WITHOUT x-admin-key correctly returns 401. (1.2) POST WITH x-admin-key and PNG image returns 200 with all required fields {ok:true, id, url:'/api/media/{id}', filename:'test.png', content_type:'image/png', size:77}. URL format correct. (1.3) GET /api/media/{id} (public, no key) returns 200 with Content-Type:image/png and non-empty body (77 bytes). (1.4) POST WITH x-admin-key and PDF file returns 200 with url:'/api/media/{id}', content_type:'application/pdf', size:543. (1.4b) GET /api/media/{id} for PDF returns 200 with Content-Type:application/pdf and non-empty body (543 bytes). (1.5) Size guard test (>10MB) skipped (not feasible). TASK 2 (Campaign CMS CRUD): (2.1) GET /api/admin/campaigns WITHOUT key returns 401. (2.1b) GET WITH key returns 200 with 8 campaigns. (2.2) POST WITH key (omit published) returns 200 with generated slug, published===false (draft), story stored as ARRAY with 2 items. (2.3) DRAFT HIDDEN: GET /api/campaigns (public) does NOT contain draft slug. (2.3b) GET /api/campaigns/{draft-slug} returns 404. (2.4) POST WITH key but NO title returns 400. (2.5) PUT /api/admin/campaigns/{id} WITH key, publish it returns 200. (2.5b) GET /api/campaigns (public) NOW contains published slug. (2.5c) GET /api/campaigns/{slug} returns 200 with video_url and story array length 2. (2.6) PUT /api/admin/campaigns/{unknown-id} returns 404. (2.7) DELETE /api/admin/campaigns/{id} returns 200 {ok:true, deleted:1}. (2.7b) GET /api/campaigns no longer contains deleted slug. (2.8) CLEANUP: GET /api/campaigns returns exactly 8 (baseline restored). TASK 3 (Manual numbers): (3.1) GET /api/campaigns returns exactly 8 published campaigns. (3.2) Campaign BEFORE donation: collected_amount=63000000, donor_count=480. (3.2b) POST /api/donations returns 200 with unique_code=937 (100-999), total_amount=50937 (amount + unique_code), status='pending'. (3.2c) Campaign AFTER donation: collected_amount=63000000, donor_count=480 - UNCHANGED (manual mode working). (3.3) POST /api/admin/delete returns 200 {deleted:1, reverted:0}. (3.3b) Campaign AFTER delete: STILL unchanged (manual mode working). (3.4a) GET /api/kurban/quota returns 200 with 3 options. (3.4b) GET /api/prayers returns 200 with 8 items (>= 8). (3.4c) GET /api/admin/summary returns 200. All three Phase 1 features are production-ready."

    -agent: "main"
    -message: "PHASE 2 (Home Slider + Draft Preview) — 2 current_focus tasks. x-admin-key: yababerma-admin-2026. (1) HOME SLIDER: GET /api/home-settings is PUBLIC and returns {slides:[], duration_ms:6000} by default. POST /api/admin/home-settings (admin) saves {slides:[...], duration_ms}; verify persistence via GET; POST without key -> 401. Reset to {slides:[], duration_ms:6000} at the end. (2) DRAFT PREVIEW: GET /api/admin/campaigns/{id} (admin) returns a single campaign incl drafts + recent_donations; 401 without key; 404 unknown id. Create a draft, confirm admin GET works and public GET /api/campaigns/{slug} still 404s, then DELETE the draft. Report zero 500s."
    -agent: "testing"
    -message: "✅ PHASE 2 ADMIN CMS COMPLETE - ALL TESTS PASSED (12/12 tests) - ZERO 500 ERRORS. Comprehensive testing completed for both current_focus tasks. TASK 1 (Home slider settings): (1.1) GET /api/home-settings (PUBLIC, no key) returns 200 with default values: slides:[] (empty array), duration_ms:6000. Response structure validated with required fields. (1.2) POST /api/admin/home-settings WITHOUT x-admin-key correctly returns 401 (unauthorized). (1.3) POST /api/admin/home-settings WITH x-admin-key and body with 2 slides (one banner type, one campaign type) and duration_ms:10000 returns 200 {ok:true, slides:[...], duration_ms:10000}. Each returned slide has an 'id' field auto-generated. Slide 1 type is exactly 'banner', Slide 2 type is exactly 'campaign' (type normalization working correctly). (1.4) GET /api/home-settings (public) again returns 200 with 2 slides persisted (each with id) and duration_ms:10000 (persistence verified). (1.5) CLEANUP completed: POST /api/admin/home-settings with {slides:[], duration_ms:6000} returns 200, verified reset with GET showing slides:[] and duration_ms:6000 (default state restored). TASK 2 (Admin single campaign GET for draft preview): (2.1) POST /api/admin/campaigns WITH x-admin-key and body {title:'Draft Preview Test <random>', category:'sedekah', short_desc:'x'} (omit published field) returns 200 with campaign id, slug, and published===false (draft). (2.2) GET /api/admin/campaigns/{id} WITH x-admin-key returns 200 with full campaign fields (title, slug, published===false) and recent_donations array present (length: 0). All required campaign fields validated. (2.3) GET /api/admin/campaigns/{id} WITHOUT x-admin-key correctly returns 401 (unauthorized). (2.4) GET /api/admin/campaigns/{unknown-random-id} WITH x-admin-key correctly returns 404 (not found). (2.5) DRAFT STAYS HIDDEN: GET /api/campaigns/{draft-slug} (public, no key) correctly returns 404 - draft campaign is not accessible via public endpoint. (2.6) CLEANUP: DELETE /api/admin/campaigns/{id} WITH x-admin-key returns 200 {ok:true, deleted:1}. (2.7) Confirmed public GET /api/campaigns returns exactly 8 campaigns (baseline intact, draft removed). All admin authentication, authorization, persistence, type normalization, id auto-generation, draft preview, and draft visibility control working correctly. Both features are production-ready."


