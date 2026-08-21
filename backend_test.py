#!/usr/bin/env python3
"""
Backend test for YABABERMA donation platform - Admin Verify Email Feature
Tests the new automatic verified email on admin verify + quick regression
"""

import requests
import time
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = "https://yababerma-donasi.preview.emergentagent.com"
ADMIN_KEY = "yababerma-admin-2026"
ADMIN_HEADERS = {"x-admin-key": ADMIN_KEY, "Content-Type": "application/json"}

def test_create_donation_for_verify():
    """Test 1: Create a donation to verify"""
    print("\n" + "="*80)
    print("TEST 1: Create donation for verification")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/donations"
        payload = {
            "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
            "amount": 60000,
            "donor_name": "Verify Test",
            "donor_whatsapp": "0812",
            "donor_email": "delivered@resend.dev",
            "payment_method": "bca"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            donation_id = data.get("id")
            print(f"✅ PASS - Donation created successfully")
            print(f"   Donation ID: {donation_id}")
            print(f"   Unique code: {data.get('unique_code')}")
            print(f"   Total amount: {data.get('total_amount')}")
            print(f"   Status: {data.get('status')}")
            return donation_id
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return None


def test_admin_verify_donation(donation_id):
    """Test 2: Verify donation - must be fast (< 2s)"""
    print("\n" + "="*80)
    print("TEST 2: Admin verify donation (must be < 2s)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/verify"
        payload = {
            "donation_id": donation_id,
            "status": "verified"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        print(f"Headers: x-admin-key={ADMIN_KEY}")
        
        start_time = time.time()
        response = requests.post(url, json=payload, headers=ADMIN_HEADERS, timeout=10)
        elapsed = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Response time: {elapsed:.3f}s")
        
        if response.status_code == 200:
            data = response.json()
            donation = data.get("donation", {})
            status = donation.get("status")
            verified_at = donation.get("verified_at")
            
            if elapsed < 2.0:
                print(f"✅ PASS - Response time OK ({elapsed:.3f}s < 2s)")
            else:
                print(f"⚠️  WARNING - Response time slow ({elapsed:.3f}s >= 2s)")
            
            if status == "verified":
                print(f"✅ PASS - Status is 'verified'")
            else:
                print(f"❌ FAIL - Status is '{status}', expected 'verified'")
            
            if verified_at:
                print(f"✅ PASS - verified_at is set: {verified_at}")
            else:
                print(f"❌ FAIL - verified_at is null")
            
            return elapsed < 2.0 and status == "verified" and verified_at is not None
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_get_admin_donations(donation_id):
    """Test 3: GET /api/admin/donations - confirm status and verified_at"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/admin/donations - confirm verification")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/donations"
        
        print(f"GET {url}")
        print(f"Headers: x-admin-key={ADMIN_KEY}")
        
        response = requests.get(url, headers=ADMIN_HEADERS, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            donations = response.json()
            print(f"✅ PASS - Got {len(donations)} donations")
            
            # Find our donation
            target = None
            for d in donations:
                if d.get("id") == donation_id:
                    target = d
                    break
            
            if target:
                print(f"✅ PASS - Found donation {donation_id}")
                status = target.get("status")
                verified_at = target.get("verified_at")
                
                if status == "verified":
                    print(f"✅ PASS - Status is 'verified'")
                else:
                    print(f"❌ FAIL - Status is '{status}', expected 'verified'")
                
                if verified_at:
                    print(f"✅ PASS - verified_at is set: {verified_at}")
                else:
                    print(f"❌ FAIL - verified_at is null")
                
                return status == "verified" and verified_at is not None
            else:
                print(f"❌ FAIL - Donation {donation_id} not found in list")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_revert_to_pending(donation_id):
    """Test 4: Revert donation to pending"""
    print("\n" + "="*80)
    print("TEST 4: Revert donation to pending")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/verify"
        payload = {
            "donation_id": donation_id,
            "status": "pending"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, headers=ADMIN_HEADERS, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            donation = data.get("donation", {})
            status = donation.get("status")
            verified_at = donation.get("verified_at")
            
            if status == "pending":
                print(f"✅ PASS - Status reverted to 'pending'")
            else:
                print(f"❌ FAIL - Status is '{status}', expected 'pending'")
            
            if verified_at is None:
                print(f"✅ PASS - verified_at is null")
            else:
                print(f"❌ FAIL - verified_at is '{verified_at}', expected null")
            
            return status == "pending" and verified_at is None
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_negative_empty_body():
    """Test 5a: POST /api/admin/verify with empty body -> 400"""
    print("\n" + "="*80)
    print("TEST 5a: POST /api/admin/verify with empty body (expect 400)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/verify"
        payload = {}
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, headers=ADMIN_HEADERS, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 400:
            print(f"✅ PASS - Got 400 as expected")
            print(f"   Response: {response.text}")
            return True
        else:
            print(f"❌ FAIL - Expected 400, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_negative_no_header():
    """Test 5b: POST /api/admin/verify without x-admin-key header -> 401"""
    print("\n" + "="*80)
    print("TEST 5b: POST /api/admin/verify without x-admin-key (expect 401)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/verify"
        payload = {"donation_id": "test-id", "status": "verified"}
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        print(f"Headers: (no x-admin-key)")
        
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"✅ PASS - Got 401 as expected")
            print(f"   Response: {response.text}")
            return True
        else:
            print(f"❌ FAIL - Expected 401, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_regression_concurrent():
    """Test 6: Quick regression - fire ~10 concurrent requests"""
    print("\n" + "="*80)
    print("TEST 6: Quick regression - concurrent requests (no 500s)")
    print("="*80)
    
    endpoints = [
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns", None),
        ("GET", "/api/campaigns/kurban-peduli-banua", None),
        ("GET", "/api/prayers", None),
        ("GET", "/api/stats", None),
        ("GET", "/api/auth/me", None),
    ]
    
    def make_request(method, path, headers):
        url = f"{BASE_URL}{path}"
        try:
            if method == "GET":
                resp = requests.get(url, headers=headers, timeout=10)
            else:
                resp = requests.post(url, headers=headers, timeout=10)
            return (path, resp.status_code, None)
        except Exception as e:
            return (path, None, str(e))
    
    print(f"Firing {len(endpoints)} concurrent requests...")
    
    results = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = [executor.submit(make_request, method, path, headers) for method, path, headers in endpoints]
        for future in as_completed(futures):
            results.append(future.result())
    
    # Analyze results
    success_count = 0
    error_count = 0
    status_500_count = 0
    
    for path, status, error in results:
        if error:
            print(f"❌ {path}: Exception - {error}")
            error_count += 1
        elif status == 500:
            print(f"❌ {path}: 500 Internal Server Error")
            status_500_count += 1
        elif status in [200, 201]:
            print(f"✅ {path}: {status}")
            success_count += 1
        else:
            print(f"⚠️  {path}: {status}")
    
    print(f"\nResults: {success_count}/{len(endpoints)} succeeded, {status_500_count} 500s, {error_count} errors")
    
    if status_500_count == 0:
        print(f"✅ PASS - No 500 errors")
        return True
    else:
        print(f"❌ FAIL - Found {status_500_count} 500 errors")
        return False


def test_kurban_campaign_has_options():
    """Test 6b: Verify kurban campaign has kurban_options"""
    print("\n" + "="*80)
    print("TEST 6b: GET /api/campaigns/kurban-peduli-banua (has kurban_options)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/campaigns/kurban-peduli-banua"
        
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            kurban_options = data.get("kurban_options")
            
            if kurban_options and isinstance(kurban_options, list) and len(kurban_options) > 0:
                print(f"✅ PASS - kurban_options present with {len(kurban_options)} items")
                for opt in kurban_options:
                    print(f"   - {opt.get('type')}: {opt.get('price')}")
                return True
            else:
                print(f"❌ FAIL - kurban_options missing or empty")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_prayers_count():
    """Test 6c: Verify prayers returns >= 8 items"""
    print("\n" + "="*80)
    print("TEST 6c: GET /api/prayers (>= 8 items)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/prayers"
        
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            count = len(data)
            
            if count >= 8:
                print(f"✅ PASS - Got {count} prayers (>= 8)")
                return True
            else:
                print(f"❌ FAIL - Got {count} prayers (< 8)")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_auth_me_null():
    """Test 6d: Verify /api/auth/me returns user null"""
    print("\n" + "="*80)
    print("TEST 6d: GET /api/auth/me (user null)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/auth/me"
        
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user")
            
            if user is None:
                print(f"✅ PASS - user is null")
                return True
            else:
                print(f"❌ FAIL - user is {user}, expected null")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def main():
    print("\n" + "="*80)
    print("YABABERMA BACKEND TEST - Admin Verify Email Feature")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Key: {ADMIN_KEY}")
    
    results = {}
    
    # Test 1: Create donation
    donation_id = test_create_donation_for_verify()
    results["create_donation"] = donation_id is not None
    
    if donation_id:
        # Test 2: Verify donation (must be fast)
        results["verify_fast"] = test_admin_verify_donation(donation_id)
        
        # Test 3: Confirm in admin list
        results["confirm_verified"] = test_get_admin_donations(donation_id)
        
        # Test 4: Revert to pending
        results["revert_pending"] = test_revert_to_pending(donation_id)
    else:
        print("\n⚠️  Skipping tests 2-4 because donation creation failed")
        results["verify_fast"] = False
        results["confirm_verified"] = False
        results["revert_pending"] = False
    
    # Test 5: Negative tests
    results["negative_empty_body"] = test_negative_empty_body()
    results["negative_no_header"] = test_negative_no_header()
    
    # Test 6: Regression
    results["regression_concurrent"] = test_regression_concurrent()
    results["kurban_options"] = test_kurban_campaign_has_options()
    results["prayers_count"] = test_prayers_count()
    results["auth_me_null"] = test_auth_me_null()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        status = "✅ PASS" if passed_flag else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
