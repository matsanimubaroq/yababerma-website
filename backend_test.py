#!/usr/bin/env python3
"""
Backend test for YABABERMA admin authentication changes
Tests DB-backed admin key + forgot/reset password via email OTP
"""

import os
import sys
import time
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'your_database_name')
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://yababerma-donasi.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Original admin key from env
ORIGINAL_ADMIN_KEY = 'yababerma-admin-2026'
TEMP_ADMIN_KEY = 'temp-pass-999'

print(f"🧪 YABABERMA Admin Auth Backend Test")
print(f"📍 API Base: {API_BASE}")
print(f"📍 MongoDB: {MONGO_URL}/{DB_NAME}")
print("=" * 80)

# MongoDB connection
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

def test_login_and_guard():
    """Test 1: LOGIN + GUARD (DB-backed)"""
    print("\n🔐 TEST 1: LOGIN + GUARD (DB-backed)")
    print("-" * 80)
    
    try:
        # 1.1: Login with correct key
        print("1.1: POST /api/admin/login with correct key (yababerma-admin-2026)")
        resp = requests.post(f"{API_BASE}/admin/login", json={"key": ORIGINAL_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert resp.json().get('ok') == True, "Expected {ok:true}"
        print("    ✅ PASSED - Login with correct key returns 200 {ok:true}")
        
        # 1.2: Login with wrong key
        print("\n1.2: POST /api/admin/login with wrong key")
        resp = requests.post(f"{API_BASE}/admin/login", json={"key": "wrong-key-123"}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("    ✅ PASSED - Login with wrong key returns 401")
        
        # 1.3: GET /api/admin/summary WITH correct header
        print("\n1.3: GET /api/admin/summary WITH header x-admin-key: yababerma-admin-2026")
        resp = requests.get(f"{API_BASE}/admin/summary", headers={"x-admin-key": ORIGINAL_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        data = resp.json()
        print(f"    Response keys: {list(data.keys())}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert 'total_donations' in data, "Expected total_donations in response"
        print("    ✅ PASSED - Admin summary with correct key returns 200")
        
        # 1.4: GET /api/admin/summary WITHOUT header
        print("\n1.4: GET /api/admin/summary WITHOUT x-admin-key header")
        resp = requests.get(f"{API_BASE}/admin/summary", timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("    ✅ PASSED - Admin summary without header returns 401")
        
        print("\n✅ TEST 1 COMPLETE: All login and guard tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 1 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_forgot_password():
    """Test 2: FORGOT PASSWORD"""
    print("\n📧 TEST 2: FORGOT PASSWORD")
    print("-" * 80)
    
    try:
        # 2.1: First forgot-password request
        print("2.1: POST /api/admin/forgot-password (first request)")
        resp = requests.post(f"{API_BASE}/admin/forgot-password", json={}, timeout=10)
        print(f"    Status: {resp.status_code}")
        data = resp.json()
        print(f"    Response: {data}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get('ok') == True, "Expected {ok:true}"
        assert 'email' in data, "Expected masked email in response"
        masked_email = data.get('email', '')
        assert '*' in masked_email and '@' in masked_email, f"Expected masked email format, got {masked_email}"
        print(f"    ✅ PASSED - Forgot password returns 200 with masked email: {masked_email}")
        
        # 2.2: Immediate second request (should be rate-limited)
        print("\n2.2: POST /api/admin/forgot-password again (immediate retry - should be rate-limited)")
        resp = requests.post(f"{API_BASE}/admin/forgot-password", json={}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 429, f"Expected 429 (rate-limited), got {resp.status_code}"
        error_msg = resp.json().get('error', '')
        assert '1 menit' in error_msg.lower() or 'tunggu' in error_msg.lower(), f"Expected rate-limit message, got: {error_msg}"
        print("    ✅ PASSED - Immediate retry returns 429 (rate-limited)")
        
        print("\n✅ TEST 2 COMPLETE: Forgot password tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 2 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_reset_password():
    """Test 3: RESET PASSWORD"""
    print("\n🔑 TEST 3: RESET PASSWORD")
    print("-" * 80)
    
    try:
        # 3.1: Reset with WRONG OTP
        print("3.1: POST /api/admin/reset-password with wrong OTP (000000)")
        resp = requests.post(f"{API_BASE}/admin/reset-password", json={"otp": "000000", "new_password": "abcdef"}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        print("    ✅ PASSED - Wrong OTP returns 400")
        
        # 3.2: Reset with short password
        print("\n3.2: POST /api/admin/reset-password with password < 6 chars")
        resp = requests.post(f"{API_BASE}/admin/reset-password", json={"otp": "123456", "new_password": "short"}, timeout=10)
        print(f"    Status: {resp.status_code}")
        data = resp.json()
        print(f"    Response: {data}")
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
        error_msg = data.get('error', '')
        assert '6' in error_msg or 'minimal' in error_msg.lower(), f"Expected password length error, got: {error_msg}"
        print("    ✅ PASSED - Short password returns 400 with 'minimal 6 karakter' message")
        
        # 3.3: Read OTP from MongoDB
        print("\n3.3: Reading OTP from MongoDB (settings collection, id='admin_reset')")
        reset_doc = db.settings.find_one({"id": "admin_reset"})
        if not reset_doc or 'otp' not in reset_doc:
            print("    ⚠️  WARNING: No admin_reset document found in MongoDB. Calling forgot-password first...")
            # Call forgot-password to generate OTP
            resp = requests.post(f"{API_BASE}/admin/forgot-password", json={}, timeout=10)
            if resp.status_code != 200:
                print(f"    ❌ Failed to generate OTP: {resp.status_code} {resp.json()}")
                return False
            time.sleep(1)  # Wait a bit for DB write
            reset_doc = db.settings.find_one({"id": "admin_reset"})
            if not reset_doc or 'otp' not in reset_doc:
                print("    ❌ Still no OTP found in MongoDB after calling forgot-password")
                return False
        
        otp = reset_doc['otp']
        print(f"    OTP from MongoDB: {otp}")
        print("    ✅ Successfully read OTP from MongoDB")
        
        # 3.4: Reset password with correct OTP
        print(f"\n3.4: POST /api/admin/reset-password with correct OTP ({otp}) and new password (temp-pass-999)")
        resp = requests.post(f"{API_BASE}/admin/reset-password", json={"otp": otp, "new_password": TEMP_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        data = resp.json()
        print(f"    Response: {data}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert data.get('ok') == True, "Expected {ok:true}"
        print("    ✅ PASSED - Reset password with correct OTP returns 200 {ok:true}")
        
        # 3.5: Verify password change - login with NEW password
        print(f"\n3.5: POST /api/admin/login with NEW password ({TEMP_ADMIN_KEY})")
        resp = requests.post(f"{API_BASE}/admin/login", json={"key": TEMP_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert resp.json().get('ok') == True, "Expected {ok:true}"
        print("    ✅ PASSED - Login with new password succeeds")
        
        # 3.6: Verify OLD password no longer works
        print(f"\n3.6: POST /api/admin/login with OLD password ({ORIGINAL_ADMIN_KEY})")
        resp = requests.post(f"{API_BASE}/admin/login", json={"key": ORIGINAL_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("    ✅ PASSED - Login with old password now returns 401")
        
        # 3.7: Verify admin guard works with NEW password
        print(f"\n3.7: GET /api/admin/summary with NEW password ({TEMP_ADMIN_KEY})")
        resp = requests.get(f"{API_BASE}/admin/summary", headers={"x-admin-key": TEMP_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print("    ✅ PASSED - Admin summary with new password returns 200")
        
        # 3.8: Verify admin guard FAILS with OLD password
        print(f"\n3.8: GET /api/admin/summary with OLD password ({ORIGINAL_ADMIN_KEY})")
        resp = requests.get(f"{API_BASE}/admin/summary", headers={"x-admin-key": ORIGINAL_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("    ✅ PASSED - Admin summary with old password returns 401")
        
        print("\n✅ TEST 3 COMPLETE: All reset password tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 3 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def critical_cleanup():
    """Test 4: CRITICAL CLEANUP - Restore original admin key"""
    print("\n🧹 TEST 4: CRITICAL CLEANUP - Restore original admin key")
    print("-" * 80)
    
    try:
        # 4.1: Update admin_auth password back to original via MongoDB
        print(f"4.1: Updating MongoDB settings.admin_auth.password to '{ORIGINAL_ADMIN_KEY}'")
        result = db.settings.update_one(
            {"id": "admin_auth"},
            {"$set": {"password": ORIGINAL_ADMIN_KEY, "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z")}},
            upsert=True
        )
        print(f"    MongoDB update result: matched={result.matched_count}, modified={result.modified_count}")
        print("    ✅ Admin password restored to original value")
        
        # 4.2: Delete admin_reset document
        print("\n4.2: Deleting MongoDB settings document id='admin_reset'")
        result = db.settings.delete_one({"id": "admin_reset"})
        print(f"    MongoDB delete result: deleted={result.deleted_count}")
        print("    ✅ Admin reset document deleted")
        
        # 4.3: Verify login with original password works again
        print(f"\n4.3: POST /api/admin/login with restored password ({ORIGINAL_ADMIN_KEY})")
        resp = requests.post(f"{API_BASE}/admin/login", json={"key": ORIGINAL_ADMIN_KEY}, timeout=10)
        print(f"    Status: {resp.status_code}")
        print(f"    Response: {resp.json()}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert resp.json().get('ok') == True, "Expected {ok:true}"
        print("    ✅ PASSED - Login with restored original password succeeds")
        
        print("\n✅ TEST 4 COMPLETE: Cleanup successful - original admin key restored!")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 4 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def quick_regression():
    """Test 5: Quick regression - test other admin endpoints"""
    print("\n🔄 TEST 5: QUICK REGRESSION - Other admin endpoints")
    print("-" * 80)
    
    try:
        headers = {"x-admin-key": ORIGINAL_ADMIN_KEY}
        
        # 5.1: GET /api/admin/summary
        print("5.1: GET /api/admin/summary")
        resp = requests.get(f"{API_BASE}/admin/summary", headers=headers, timeout=10)
        print(f"    Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print("    ✅ PASSED")
        
        # 5.2: GET /api/admin/donations
        print("\n5.2: GET /api/admin/donations")
        resp = requests.get(f"{API_BASE}/admin/donations", headers=headers, timeout=10)
        print(f"    Status: {resp.status_code}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        print("    ✅ PASSED")
        
        # 5.3: GET /api/campaigns (should return 8)
        print("\n5.3: GET /api/campaigns")
        resp = requests.get(f"{API_BASE}/campaigns", timeout=10)
        print(f"    Status: {resp.status_code}")
        data = resp.json()
        print(f"    Campaigns count: {len(data)}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert len(data) == 8, f"Expected 8 campaigns, got {len(data)}"
        print("    ✅ PASSED")
        
        print("\n✅ TEST 5 COMPLETE: Quick regression passed - zero 500s!")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 5 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("🚀 STARTING ADMIN AUTH BACKEND TESTS")
    print("=" * 80)
    
    results = {
        "Test 1: Login + Guard": False,
        "Test 2: Forgot Password": False,
        "Test 3: Reset Password": False,
        "Test 4: Critical Cleanup": False,
        "Test 5: Quick Regression": False,
    }
    
    # Run tests in sequence
    results["Test 1: Login + Guard"] = test_login_and_guard()
    results["Test 2: Forgot Password"] = test_forgot_password()
    results["Test 3: Reset Password"] = test_reset_password()
    results["Test 4: Critical Cleanup"] = critical_cleanup()
    results["Test 5: Quick Regression"] = quick_regression()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        status = "✅ PASSED" if passed_flag else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    print("=" * 80)
    print(f"TOTAL: {passed}/{total} test groups passed")
    print("=" * 80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Admin auth feature is working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test group(s) failed. Please review the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
