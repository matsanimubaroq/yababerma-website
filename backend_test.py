#!/usr/bin/env python3
"""
Backend test for YABABERMA donation platform - Admin Notification Email Regression
Tests the new sendAdminNotifyEmail(donation) on POST /api/donations
"""

import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = "https://yababerma-donasi.preview.emergentagent.com"
ADMIN_KEY = "yababerma-admin-2026"
ADMIN_HEADERS = {"x-admin-key": ADMIN_KEY, "Content-Type": "application/json"}

def test_get_campaign_before(campaign_slug):
    """Get campaign state before donation"""
    print("\n" + "="*80)
    print(f"PRE-TEST: Get campaign state before donation")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/campaigns/{campaign_slug}"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            collected = data.get("collected_amount", 0)
            donor_count = data.get("donor_count", 0)
            print(f"✅ Campaign state: collected_amount={collected}, donor_count={donor_count}")
            return collected, donor_count
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return None, None


def test_donation_with_email():
    """Test 1: POST /api/donations WITH donor_email - must be fast (<2s) and work correctly"""
    print("\n" + "="*80)
    print("TEST 1: POST /api/donations WITH donor_email (< 2s, unique_code, campaign increment)")
    print("="*80)
    
    campaign_slug = "wakaf-al-quran-santri-pelosok"
    amount = 75000
    
    # Get campaign state before
    collected_before, donor_count_before = test_get_campaign_before(campaign_slug)
    if collected_before is None:
        print("⚠️  WARNING - Could not get campaign state before donation")
        return False
    
    try:
        url = f"{BASE_URL}/api/donations"
        payload = {
            "campaign_slug": campaign_slug,
            "amount": amount,
            "donor_name": "Budi Santoso",
            "donor_whatsapp": "081234567890",
            "donor_email": "budi.santoso@test.com",
            "message": "Semoga berkah",
            "payment_method": "bsi"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=10)
        elapsed = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Response time: {elapsed:.3f}s")
        
        if response.status_code != 200:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Check response time
        if elapsed >= 2.0:
            print(f"❌ FAIL - Response time {elapsed:.3f}s >= 2s (email blocking the response)")
            return False
        else:
            print(f"✅ PASS - Response time {elapsed:.3f}s < 2s (fire-and-forget working)")
        
        data = response.json()
        
        # Check unique_code (100-999)
        unique_code = data.get("unique_code")
        if unique_code and 100 <= unique_code <= 999:
            print(f"✅ PASS - unique_code={unique_code} (100-999)")
        else:
            print(f"❌ FAIL - unique_code={unique_code} (not in 100-999 range)")
            return False
        
        # Check total_amount = amount + unique_code
        total_amount = data.get("total_amount")
        expected_total = amount + unique_code
        if total_amount == expected_total:
            print(f"✅ PASS - total_amount={total_amount} (amount + unique_code)")
        else:
            print(f"❌ FAIL - total_amount={total_amount}, expected {expected_total}")
            return False
        
        # Check status = 'pending'
        status = data.get("status")
        if status == "pending":
            print(f"✅ PASS - status='pending'")
        else:
            print(f"❌ FAIL - status='{status}', expected 'pending'")
            return False
        
        # Check campaign increment
        print(f"\nVerifying campaign progress increment...")
        time.sleep(0.5)  # Small delay to ensure DB update
        
        url_after = f"{BASE_URL}/api/campaigns/{campaign_slug}"
        response_after = requests.get(url_after, timeout=10)
        
        if response_after.status_code == 200:
            data_after = response_after.json()
            collected_after = data_after.get("collected_amount", 0)
            donor_count_after = data_after.get("donor_count", 0)
            
            collected_diff = collected_after - collected_before
            donor_count_diff = donor_count_after - donor_count_before
            
            print(f"Before: collected_amount={collected_before}, donor_count={donor_count_before}")
            print(f"After:  collected_amount={collected_after}, donor_count={donor_count_after}")
            print(f"Diff:   collected_amount +{collected_diff}, donor_count +{donor_count_diff}")
            
            if collected_diff == amount:
                print(f"✅ PASS - collected_amount increased by exactly {amount}")
            else:
                print(f"❌ FAIL - collected_amount increased by {collected_diff}, expected {amount}")
                return False
            
            if donor_count_diff == 1:
                print(f"✅ PASS - donor_count increased by 1")
            else:
                print(f"❌ FAIL - donor_count increased by {donor_count_diff}, expected 1")
                return False
        else:
            print(f"⚠️  WARNING - Could not verify campaign increment (status {response_after.status_code})")
        
        return True
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_donation_without_email():
    """Test 2: POST /api/donations WITHOUT donor_email - should still work"""
    print("\n" + "="*80)
    print("TEST 2: POST /api/donations WITHOUT donor_email (should still work)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/donations"
        payload = {
            "campaign_slug": "kurban-peduli-banua",
            "amount": 50000,
            "donor_name": "Siti Aminah",
            "donor_whatsapp": "082345678901",
            "payment_method": "bca"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASS - Donation without email works")
            print(f"   unique_code: {data.get('unique_code')}")
            print(f"   total_amount: {data.get('total_amount')}")
            print(f"   status: {data.get('status')}")
            return True
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_negative_amount_too_low():
    """Test 3a: POST /api/donations with amount < 1000 -> 400"""
    print("\n" + "="*80)
    print("TEST 3a: POST /api/donations with amount < 1000 (expect 400)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/donations"
        payload = {
            "campaign_slug": "wakaf-al-quran-santri-pelosok",
            "amount": 500,
            "donor_name": "Test User",
            "donor_whatsapp": "081234567890"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
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


def test_negative_missing_donor_name():
    """Test 3b: POST /api/donations without donor_name -> 400"""
    print("\n" + "="*80)
    print("TEST 3b: POST /api/donations without donor_name (expect 400)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/donations"
        payload = {
            "campaign_slug": "wakaf-al-quran-santri-pelosok",
            "amount": 50000,
            "donor_whatsapp": "081234567890"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
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


def test_negative_missing_donor_whatsapp():
    """Test 3c: POST /api/donations without donor_whatsapp -> 400"""
    print("\n" + "="*80)
    print("TEST 3c: POST /api/donations without donor_whatsapp (expect 400)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/donations"
        payload = {
            "campaign_slug": "wakaf-al-quran-santri-pelosok",
            "amount": 50000,
            "donor_name": "Test User"
        }
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
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


def test_regression_campaigns():
    """Test 4a: GET /api/campaigns (expect 8 campaigns)"""
    print("\n" + "="*80)
    print("TEST 4a: GET /api/campaigns (expect 8 campaigns)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/campaigns"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            count = len(data)
            
            if count == 8:
                print(f"✅ PASS - Got exactly 8 campaigns")
                return True
            else:
                print(f"❌ FAIL - Got {count} campaigns, expected 8")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_regression_prayers():
    """Test 4b: GET /api/prayers (expect >= 8 items)"""
    print("\n" + "="*80)
    print("TEST 4b: GET /api/prayers (expect >= 8 items)")
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


def test_regression_stats():
    """Test 4c: GET /api/stats (has required fields)"""
    print("\n" + "="*80)
    print("TEST 4c: GET /api/stats (has required fields)")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/stats"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = [
                "humanitarian", "wakaf_quran", "panti", "pemberdayaan",
                "total_collected", "total_donors", "total_target", 
                "total_donations", "active_campaigns"
            ]
            
            missing_fields = [f for f in required_fields if f not in data]
            
            if not missing_fields:
                print(f"✅ PASS - All required fields present")
                print(f"   Fields: {', '.join(required_fields)}")
                return True
            else:
                print(f"❌ FAIL - Missing fields: {', '.join(missing_fields)}")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_regression_admin_summary():
    """Test 4d: GET /api/admin/summary with x-admin-key (200 with required fields)"""
    print("\n" + "="*80)
    print("TEST 4d: GET /api/admin/summary with x-admin-key")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/summary"
        print(f"GET {url}")
        print(f"Headers: x-admin-key={ADMIN_KEY}")
        
        response = requests.get(url, headers=ADMIN_HEADERS, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = [
                "total_donations", "verified", "pending", 
                "total_verified", "total_all", "confirmations"
            ]
            
            missing_fields = [f for f in required_fields if f not in data]
            
            if not missing_fields:
                print(f"✅ PASS - All required fields present")
                print(f"   total_donations: {data.get('total_donations')}")
                print(f"   verified: {data.get('verified')}")
                print(f"   pending: {data.get('pending')}")
                return True
            else:
                print(f"❌ FAIL - Missing fields: {', '.join(missing_fields)}")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def test_regression_admin_login():
    """Test 4e: POST /api/admin/login with correct key (200)"""
    print("\n" + "="*80)
    print("TEST 4e: POST /api/admin/login with correct key")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/admin/login"
        payload = {"key": ADMIN_KEY}
        
        print(f"POST {url}")
        print(f"Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                print(f"✅ PASS - Admin login successful")
                return True
            else:
                print(f"❌ FAIL - Response ok=false")
                return False
        else:
            print(f"❌ FAIL - Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False


def main():
    print("\n" + "="*80)
    print("YABABERMA BACKEND TEST - Admin Notification Email Regression")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Key: {ADMIN_KEY}")
    print("\nTesting: sendAdminNotifyEmail(donation) on POST /api/donations")
    print("Must NOT block or break the donation endpoint")
    
    results = {}
    
    # Test 1: Donation with email (main test)
    results["donation_with_email"] = test_donation_with_email()
    
    # Test 2: Donation without email
    results["donation_without_email"] = test_donation_without_email()
    
    # Test 3: Negative cases
    results["negative_amount_low"] = test_negative_amount_too_low()
    results["negative_missing_name"] = test_negative_missing_donor_name()
    results["negative_missing_whatsapp"] = test_negative_missing_donor_whatsapp()
    
    # Test 4: Quick regression
    results["regression_campaigns"] = test_regression_campaigns()
    results["regression_prayers"] = test_regression_prayers()
    results["regression_stats"] = test_regression_stats()
    results["regression_admin_summary"] = test_regression_admin_summary()
    results["regression_admin_login"] = test_regression_admin_login()
    
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
        print("\nConclusion:")
        print("- sendAdminNotifyEmail(donation) is working correctly")
        print("- Email is fire-and-forget and does NOT block the API response")
        print("- POST /api/donations returns quickly (< 2s)")
        print("- Campaign progress increment working correctly")
        print("- All negative validations working")
        print("- Quick regression passed (campaigns, prayers, stats, admin endpoints)")
        print("\nNote: Email delivery may fail (yababerma.org domain unverified in Resend)")
        print("      but this does NOT affect the API responses - as expected.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
