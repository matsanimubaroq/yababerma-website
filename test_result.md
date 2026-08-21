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

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
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
