#!/usr/bin/env python3
"""
Backend test for YABABERMA Next.js API
Testing: Admin change-password endpoint + Fonnte WA hook regression in verify endpoint
"""
import os
import sys
import time
import requests
from pymongo import MongoClient

# Load environment variables
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://yababerma-donasi.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'your_database_name')
ADMIN_KEY = 'yababerma-admin-2026'

print(f"🧪 YABABERMA Backend Test")
print(f"API URL: {API_URL}")
print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
print("=" * 80)

# MongoDB client for cleanup/setup
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

def test_change_password():
    """Test A: Admin change-password endpoint"""
    print("\n📝 TEST A: Admin change-password endpoint")
    print("-" * 80)
    
    # A1: Without x-admin-key header -> 401
    print("\n[A1] POST /api/admin/change-password WITHOUT x-admin-key header")
    try:
        response = requests.post(
            f"{API_URL}/admin/change-password",
            json={"new_password": "test123"},
            timeout=10
        )
        if response.status_code == 401:
            print(f"✅ PASSED: Returns 401 (unauthorized) as expected")
        else:
            print(f"❌ FAILED: Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # A2: With header but short password (< 6 chars) -> 400
    print("\n[A2] POST /api/admin/change-password WITH x-admin-key but password='123' (< 6 chars)")
    try:
        response = requests.post(
            f"{API_URL}/admin/change-password",
            headers={"x-admin-key": ADMIN_KEY},
            json={"new_password": "123"},
            timeout=10
        )
        if response.status_code == 400:
            data = response.json()
            print(f"✅ PASSED: Returns 400 with error: {data.get('error', '')}")
        else:
            print(f"❌ FAILED: Expected 400, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # A3: With header but same password as current -> 400 ("harus berbeda")
    print(f"\n[A3] POST /api/admin/change-password WITH x-admin-key but new_password='{ADMIN_KEY}' (same as current)")
    try:
        response = requests.post(
            f"{API_URL}/admin/change-password",
            headers={"x-admin-key": ADMIN_KEY},
            json={"new_password": ADMIN_KEY},
            timeout=10
        )
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get('error', '')
            if 'berbeda' in error_msg.lower():
                print(f"✅ PASSED: Returns 400 with error: {error_msg}")
            else:
                print(f"⚠️  WARNING: Returns 400 but error message doesn't contain 'berbeda': {error_msg}")
        else:
            print(f"❌ FAILED: Expected 400, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # A4: Positive - change password to "newpass-777"
    print("\n[A4] POSITIVE: Change password to 'newpass-777'")
    try:
        response = requests.post(
            f"{API_URL}/admin/change-password",
            headers={"x-admin-key": ADMIN_KEY},
            json={"new_password": "newpass-777"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print(f"✅ PASSED: Password changed successfully - {data}")
            else:
                print(f"❌ FAILED: Response ok=false - {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # A4b: Verify login with new password succeeds
    print("\n[A4b] Verify: POST /api/admin/login with key='newpass-777' -> 200")
    try:
        response = requests.post(
            f"{API_URL}/admin/login",
            json={"key": "newpass-777"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print(f"✅ PASSED: Login with new password succeeds - {data}")
            else:
                print(f"❌ FAILED: Login response ok=false - {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # A4c: Verify login with old password fails
    print(f"\n[A4c] Verify: POST /api/admin/login with key='{ADMIN_KEY}' (old) -> 401")
    try:
        response = requests.post(
            f"{API_URL}/admin/login",
            json={"key": ADMIN_KEY},
            timeout=10
        )
        if response.status_code == 401:
            print(f"✅ PASSED: Login with old password fails (401) as expected")
        else:
            print(f"❌ FAILED: Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # A5: CRITICAL CLEANUP - restore password back to original
    print(f"\n[A5] CRITICAL CLEANUP: Restore password to '{ADMIN_KEY}'")
    try:
        response = requests.post(
            f"{API_URL}/admin/change-password",
            headers={"x-admin-key": "newpass-777"},
            json={"new_password": ADMIN_KEY},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print(f"✅ PASSED: Password restored successfully - {data}")
            else:
                print(f"❌ FAILED: Response ok=false - {data}")
                # Try MongoDB direct restore as fallback
                print("⚠️  Attempting MongoDB direct restore...")
                result = db.settings.update_one(
                    {"id": "admin_auth"},
                    {"$set": {"password": ADMIN_KEY}},
                    upsert=True
                )
                print(f"MongoDB restore: matched={result.matched_count}, modified={result.modified_count}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            # Try MongoDB direct restore as fallback
            print("⚠️  Attempting MongoDB direct restore...")
            result = db.settings.update_one(
                {"id": "admin_auth"},
                {"$set": {"password": ADMIN_KEY}},
                upsert=True
            )
            print(f"MongoDB restore: matched={result.matched_count}, modified={result.modified_count}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        # Try MongoDB direct restore as fallback
        print("⚠️  Attempting MongoDB direct restore...")
        result = db.settings.update_one(
            {"id": "admin_auth"},
            {"$set": {"password": ADMIN_KEY}},
            upsert=True
        )
        print(f"MongoDB restore: matched={result.matched_count}, modified={result.modified_count}")
        return False
    
    # A5b: Verify login with restored password succeeds
    print(f"\n[A5b] Verify: POST /api/admin/login with key='{ADMIN_KEY}' (restored) -> 200")
    try:
        response = requests.post(
            f"{API_URL}/admin/login",
            json={"key": ADMIN_KEY},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                print(f"✅ PASSED: Login with restored password succeeds - {data}")
            else:
                print(f"❌ FAILED: Login response ok=false - {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    print("\n✅ TEST A COMPLETE: All change-password tests passed!")
    return True


def test_verify_fonnte_regression():
    """Test B: Verify endpoint regression with Fonnte WA hook (inert without token)"""
    print("\n📝 TEST B: Verify endpoint regression (Fonnte WA hook inert)")
    print("-" * 80)
    
    donation_id = None
    campaign_slug = "paket-sembako-dhuafa-banjarmasin"
    
    try:
        # B1: Create a donation
        print(f"\n[B1] Create donation to campaign '{campaign_slug}'")
        response = requests.post(
            f"{API_URL}/donations",
            json={
                "campaign_slug": campaign_slug,
                "amount": 20000,
                "donor_name": "WA Test",
                "donor_whatsapp": "081234567890",
                "donor_email": "watest@example.com",
                "payment_method": "bsi"
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            donation_id = data.get('id')
            print(f"✅ PASSED: Donation created with id={donation_id}")
            print(f"   unique_code={data.get('unique_code')}, total_amount={data.get('total_amount')}, status={data.get('status')}")
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        if not donation_id:
            print("❌ FAILED: No donation_id returned")
            return False
        
        # B2: POST /api/admin/verify with status='verified' -> expect 200 in under 2s
        print(f"\n[B2] POST /api/admin/verify with donation_id={donation_id}, status='verified'")
        print("   Expecting: 200 in under 2s (WA hook must NOT block since FONNTE_TOKEN not set)")
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/admin/verify",
            headers={"x-admin-key": ADMIN_KEY},
            json={"donation_id": donation_id, "status": "verified"},
            timeout=10
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            donation = data.get('donation', {})
            status = donation.get('status')
            verified_at = donation.get('verified_at')
            
            if status == 'verified' and verified_at:
                print(f"✅ PASSED: Verify returned 200 in {elapsed:.3f}s")
                print(f"   status={status}, verified_at={verified_at}")
                
                if elapsed < 2.0:
                    print(f"✅ PASSED: Response time {elapsed:.3f}s < 2s (non-blocking)")
                else:
                    print(f"⚠️  WARNING: Response time {elapsed:.3f}s >= 2s (may be blocking)")
            else:
                print(f"❌ FAILED: status={status}, verified_at={verified_at}")
                print(f"Response: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # B3: Revert to pending
        print(f"\n[B3] POST /api/admin/verify with donation_id={donation_id}, status='pending'")
        response = requests.post(
            f"{API_URL}/admin/verify",
            headers={"x-admin-key": ADMIN_KEY},
            json={"donation_id": donation_id, "status": "pending"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            donation = data.get('donation', {})
            status = donation.get('status')
            
            if status == 'pending':
                print(f"✅ PASSED: Reverted to pending - status={status}")
            else:
                print(f"❌ FAILED: Expected status='pending', got status={status}")
                print(f"Response: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # B4: CLEANUP - delete donation via POST /api/admin/delete
        print(f"\n[B4] CLEANUP: Delete donation via POST /api/admin/delete")
        response = requests.post(
            f"{API_URL}/admin/delete",
            headers={"x-admin-key": ADMIN_KEY},
            json={"collection": "donations", "ids": [donation_id]},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            deleted = data.get('deleted', 0)
            reverted = data.get('reverted', 0)
            print(f"✅ PASSED: Donation deleted - deleted={deleted}, reverted={reverted}")
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print("\n✅ TEST B COMPLETE: All verify regression tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        # Cleanup on error
        if donation_id:
            print(f"⚠️  Attempting cleanup of donation {donation_id}...")
            try:
                requests.post(
                    f"{API_URL}/admin/delete",
                    headers={"x-admin-key": ADMIN_KEY},
                    json={"collection": "donations", "ids": [donation_id]},
                    timeout=10
                )
                print("✅ Cleanup successful")
            except Exception:
                print("❌ Cleanup failed")
        return False


def test_quick_regression():
    """Quick regression: GET /api/admin/summary and GET /api/campaigns"""
    print("\n📝 QUICK REGRESSION")
    print("-" * 80)
    
    # GET /api/admin/summary
    print("\n[R1] GET /api/admin/summary with x-admin-key")
    try:
        response = requests.get(
            f"{API_URL}/admin/summary",
            headers={"x-admin-key": ADMIN_KEY},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            required_fields = ['total_donations', 'verified', 'pending', 'total_verified', 'confirmations']
            missing = [f for f in required_fields if f not in data]
            if not missing:
                print(f"✅ PASSED: GET /api/admin/summary returns 200 with all required fields")
                print(f"   total_donations={data.get('total_donations')}, verified={data.get('verified')}, pending={data.get('pending')}")
            else:
                print(f"❌ FAILED: Missing fields: {missing}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    # GET /api/campaigns
    print("\n[R2] GET /api/campaigns (should return 8 campaigns)")
    try:
        response = requests.get(f"{API_URL}/campaigns", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                count = len(data)
                if count == 8:
                    print(f"✅ PASSED: GET /api/campaigns returns {count} campaigns")
                else:
                    print(f"⚠️  WARNING: Expected 8 campaigns, got {count}")
            else:
                print(f"❌ FAILED: Response is not an array")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False
    
    print("\n✅ QUICK REGRESSION COMPLETE: All regression tests passed!")
    return True


def main():
    """Run all tests"""
    results = []
    
    # Test A: Change password
    results.append(("Change Password", test_change_password()))
    
    # Test B: Verify endpoint regression
    results.append(("Verify Fonnte Regression", test_verify_fonnte_regression()))
    
    # Quick regression
    results.append(("Quick Regression", test_quick_regression()))
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} test groups passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Backend is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test group(s) failed.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
