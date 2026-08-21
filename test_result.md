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
