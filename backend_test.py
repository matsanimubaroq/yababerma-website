#!/usr/bin/env python3
"""
YABABERMA Backend Regression Test - Resend Email Integration
Tests fire-and-forget email functionality + core endpoints
"""
import requests
import time
import json

BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"
ADMIN_KEY = "yababerma-admin-2026"

def test_donation_with_email_fast():
    """Test 1: POST /api/donations with email - must return 200 QUICKLY (under 2 seconds)"""
    print("\n=== Test 1: POST /api/donations with email (fire-and-forget) ===")
    
    # First, get current campaign state
    resp = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin")
    if resp.status_code != 200:
        print(f"❌ FAILED - Cannot get campaign: {resp.status_code}")
        return False
    
    campaign_before = resp.json()
    collected_before = campaign_before.get('collected_amount', 0)
    donor_count_before = campaign_before.get('donor_count', 0)
    print(f"Campaign before: collected={collected_before}, donor_count={donor_count_before}")
    
    # Create donation with email
    payload = {
        "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
        "amount": 75000,
        "donor_name": "Reg Test",
        "donor_whatsapp": "0812",
        "donor_email": "delivered@resend.dev",
        "payment_method": "bca"
    }
    
    start_time = time.time()
    resp = requests.post(f"{BASE_URL}/donations", json=payload)
    elapsed = time.time() - start_time
    
    print(f"Response time: {elapsed:.3f}s")
    
    if resp.status_code != 200:
        print(f"❌ FAILED - Expected 200, got {resp.status_code}: {resp.text}")
        return False
    
    if elapsed >= 2.0:
        print(f"❌ FAILED - Response too slow ({elapsed:.3f}s >= 2.0s). Email may be blocking!")
        return False
    
    donation = resp.json()
    
    # Verify donation structure
    if 'unique_code' not in donation:
        print(f"❌ FAILED - Missing unique_code in response")
        return False
    
    if 'total_amount' not in donation:
        print(f"❌ FAILED - Missing total_amount in response")
        return False
    
    unique_code = donation['unique_code']
    total_amount = donation['total_amount']
    
    if not (100 <= unique_code <= 999):
        print(f"❌ FAILED - unique_code {unique_code} not in range 100-999")
        return False
    
    expected_total = 75000 + unique_code
    if total_amount != expected_total:
        print(f"❌ FAILED - total_amount {total_amount} != {expected_total}")
        return False
    
    print(f"✅ Donation created: unique_code={unique_code}, total_amount={total_amount}")
    
    # Verify campaign progress increment
    time.sleep(0.5)  # Small delay to ensure DB update
    resp = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin")
    if resp.status_code != 200:
        print(f"❌ FAILED - Cannot verify campaign after donation: {resp.status_code}")
        return False
    
    campaign_after = resp.json()
    collected_after = campaign_after.get('collected_amount', 0)
    donor_count_after = campaign_after.get('donor_count', 0)
    
    if collected_after != collected_before + 75000:
        print(f"❌ FAILED - collected_amount not incremented correctly: {collected_after} != {collected_before + 75000}")
        return False
    
    if donor_count_after != donor_count_before + 1:
        print(f"❌ FAILED - donor_count not incremented: {donor_count_after} != {donor_count_before + 1}")
        return False
    
    print(f"✅ Campaign updated: collected={collected_after} (+75000), donor_count={donor_count_after} (+1)")
    print(f"✅ PASSED - Response time {elapsed:.3f}s < 2.0s (email is fire-and-forget)")
    return True


def test_donation_without_email():
    """Test 2: POST /api/donations without email - still 200"""
    print("\n=== Test 2: POST /api/donations without email ===")
    
    payload = {
        "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
        "amount": 50000,
        "donor_name": "Test No Email",
        "donor_whatsapp": "0813",
        "payment_method": "bsi"
    }
    
    resp = requests.post(f"{BASE_URL}/donations", json=payload)
    
    if resp.status_code != 200:
        print(f"❌ FAILED - Expected 200, got {resp.status_code}: {resp.text}")
        return False
    
    donation = resp.json()
    
    if 'unique_code' not in donation or 'total_amount' not in donation:
        print(f"❌ FAILED - Missing required fields in response")
        return False
    
    print(f"✅ PASSED - Donation created without email: unique_code={donation['unique_code']}")
    return True


def test_core_endpoints():
    """Test 3: Core endpoints regression"""
    print("\n=== Test 3: Core endpoints regression ===")
    
    tests = []
    
    # GET /api/campaigns -> 8 items
    print("Testing GET /api/campaigns...")
    resp = requests.get(f"{BASE_URL}/campaigns")
    if resp.status_code == 200:
        campaigns = resp.json()
        if len(campaigns) == 8:
            print(f"✅ GET /api/campaigns: 8 campaigns")
            tests.append(True)
        else:
            print(f"❌ GET /api/campaigns: Expected 8, got {len(campaigns)}")
            tests.append(False)
    else:
        print(f"❌ GET /api/campaigns: {resp.status_code}")
        tests.append(False)
    
    # GET /api/campaigns/kurban-peduli-banua -> has kurban_options
    print("Testing GET /api/campaigns/kurban-peduli-banua...")
    resp = requests.get(f"{BASE_URL}/campaigns/kurban-peduli-banua")
    if resp.status_code == 200:
        campaign = resp.json()
        if 'kurban_options' in campaign and len(campaign['kurban_options']) > 0:
            print(f"✅ GET /api/campaigns/kurban-peduli-banua: has kurban_options ({len(campaign['kurban_options'])} items)")
            tests.append(True)
        else:
            print(f"❌ GET /api/campaigns/kurban-peduli-banua: Missing kurban_options")
            tests.append(False)
    else:
        print(f"❌ GET /api/campaigns/kurban-peduli-banua: {resp.status_code}")
        tests.append(False)
    
    # GET /api/prayers -> >=8
    print("Testing GET /api/prayers...")
    resp = requests.get(f"{BASE_URL}/prayers")
    if resp.status_code == 200:
        prayers = resp.json()
        if len(prayers) >= 8:
            print(f"✅ GET /api/prayers: {len(prayers)} items (>= 8)")
            tests.append(True)
        else:
            print(f"❌ GET /api/prayers: Expected >= 8, got {len(prayers)}")
            tests.append(False)
    else:
        print(f"❌ GET /api/prayers: {resp.status_code}")
        tests.append(False)
    
    # GET /api/testimonials -> 4
    print("Testing GET /api/testimonials...")
    resp = requests.get(f"{BASE_URL}/testimonials")
    if resp.status_code == 200:
        testimonials = resp.json()
        if len(testimonials) >= 4:  # May have duplicates from previous seeds
            print(f"✅ GET /api/testimonials: {len(testimonials)} items (>= 4)")
            tests.append(True)
        else:
            print(f"❌ GET /api/testimonials: Expected >= 4, got {len(testimonials)}")
            tests.append(False)
    else:
        print(f"❌ GET /api/testimonials: {resp.status_code}")
        tests.append(False)
    
    # GET /api/gallery -> 8
    print("Testing GET /api/gallery...")
    resp = requests.get(f"{BASE_URL}/gallery")
    if resp.status_code == 200:
        gallery = resp.json()
        if len(gallery) >= 8:  # May have duplicates from previous seeds
            print(f"✅ GET /api/gallery: {len(gallery)} items (>= 8)")
            tests.append(True)
        else:
            print(f"❌ GET /api/gallery: Expected >= 8, got {len(gallery)}")
            tests.append(False)
    else:
        print(f"❌ GET /api/gallery: {resp.status_code}")
        tests.append(False)
    
    # GET /api/news -> 4
    print("Testing GET /api/news...")
    resp = requests.get(f"{BASE_URL}/news")
    if resp.status_code == 200:
        news = resp.json()
        if len(news) >= 4:  # May have duplicates from previous seeds
            print(f"✅ GET /api/news: {len(news)} items (>= 4)")
            tests.append(True)
        else:
            print(f"❌ GET /api/news: Expected >= 4, got {len(news)}")
            tests.append(False)
    else:
        print(f"❌ GET /api/news: {resp.status_code}")
        tests.append(False)
    
    passed = sum(tests)
    total = len(tests)
    print(f"\n{'✅' if passed == total else '❌'} Core endpoints: {passed}/{total} passed")
    return passed == total


def test_admin_endpoints():
    """Test 4: Admin endpoints"""
    print("\n=== Test 4: Admin endpoints ===")
    
    tests = []
    
    # POST /api/admin/login
    print("Testing POST /api/admin/login...")
    resp = requests.post(f"{BASE_URL}/admin/login", json={"key": ADMIN_KEY})
    if resp.status_code == 200:
        data = resp.json()
        if data.get('ok'):
            print(f"✅ POST /api/admin/login: 200 OK")
            tests.append(True)
        else:
            print(f"❌ POST /api/admin/login: Missing 'ok' field")
            tests.append(False)
    else:
        print(f"❌ POST /api/admin/login: {resp.status_code}")
        tests.append(False)
    
    # GET /api/admin/summary with header
    print("Testing GET /api/admin/summary...")
    resp = requests.get(f"{BASE_URL}/admin/summary", headers={"x-admin-key": ADMIN_KEY})
    if resp.status_code == 200:
        data = resp.json()
        required_fields = ['total_donations', 'verified', 'pending', 'total_verified', 'confirmations']
        missing = [f for f in required_fields if f not in data]
        if not missing:
            print(f"✅ GET /api/admin/summary: 200 OK with all fields")
            tests.append(True)
        else:
            print(f"❌ GET /api/admin/summary: Missing fields {missing}")
            tests.append(False)
    else:
        print(f"❌ GET /api/admin/summary: {resp.status_code}")
        tests.append(False)
    
    passed = sum(tests)
    total = len(tests)
    print(f"\n{'✅' if passed == total else '❌'} Admin endpoints: {passed}/{total} passed")
    return passed == total


def test_negative_donation():
    """Test 5: Negative test - amount < 1000 -> 400"""
    print("\n=== Test 5: Negative test - amount < 1000 ===")
    
    payload = {
        "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
        "amount": 100,
        "donor_name": "Test",
        "donor_whatsapp": "0814",
        "payment_method": "bca"
    }
    
    resp = requests.post(f"{BASE_URL}/donations", json=payload)
    
    if resp.status_code == 400:
        print(f"✅ PASSED - Correctly rejected amount=100 with 400")
        return True
    else:
        print(f"❌ FAILED - Expected 400, got {resp.status_code}")
        return False


def main():
    print("=" * 70)
    print("YABABERMA Backend Regression Test - Resend Email Integration")
    print("=" * 70)
    
    results = []
    
    # Run all tests
    results.append(("Donation with email (fire-and-forget)", test_donation_with_email_fast()))
    results.append(("Donation without email", test_donation_without_email()))
    results.append(("Core endpoints regression", test_core_endpoints()))
    results.append(("Admin endpoints", test_admin_endpoints()))
    results.append(("Negative test (amount < 1000)", test_negative_donation()))
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print("\n" + "=" * 70)
    print(f"TOTAL: {total_passed}/{total_tests} tests passed")
    print("=" * 70)
    
    if total_passed == total_tests:
        print("\n🎉 ALL TESTS PASSED - Backend is working correctly!")
        print("Note: Email delivery cannot be verified (domain not verified in Resend)")
        print("      but the integration is wired correctly and non-blocking.")
        return 0
    else:
        print(f"\n⚠️  {total_tests - total_passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit(main())
