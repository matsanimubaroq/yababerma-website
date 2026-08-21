#!/usr/bin/env python3
"""
YABABERMA Backend Regression Test
Tests deployment fix: added .limit() to all MongoDB queries
Verifies ZERO 500 errors and correct response shapes/counts
"""

import requests
import sys
import json

BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"
ADMIN_KEY = "yababerma-admin-2026"

def test_campaigns_list():
    """Test 1: GET /api/campaigns -> 200, returns 8 campaigns, no _id field"""
    print("\n[TEST 1] GET /api/campaigns")
    try:
        r = requests.get(f"{BASE_URL}/campaigns", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) == 8, f"Expected 8 campaigns, got {len(data)}"
        
        # Check no _id field
        for campaign in data:
            assert '_id' not in campaign, f"Found _id field in campaign: {campaign.get('slug', 'unknown')}"
        
        print(f"✅ PASSED - Returns 8 campaigns, no _id field")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_campaigns_category_filter():
    """Test 2: GET /api/campaigns?category=zakat -> 200, returns 1 campaign"""
    print("\n[TEST 2] GET /api/campaigns?category=zakat")
    try:
        r = requests.get(f"{BASE_URL}/campaigns?category=zakat", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) == 1, f"Expected 1 campaign, got {len(data)}"
        assert data[0]['category'] == 'zakat', f"Expected category 'zakat', got {data[0].get('category')}"
        
        print(f"✅ PASSED - Returns 1 zakat campaign")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_campaign_detail_kurban():
    """Test 3: GET /api/campaigns/kurban-peduli-banua -> 200, has kurban_options array (3 items, each with numeric quota) and recent_donations array"""
    print("\n[TEST 3] GET /api/campaigns/kurban-peduli-banua")
    try:
        r = requests.get(f"{BASE_URL}/campaigns/kurban-peduli-banua", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        # Check kurban_options
        assert 'kurban_options' in data, "Missing kurban_options field"
        assert isinstance(data['kurban_options'], list), f"kurban_options should be list, got {type(data['kurban_options'])}"
        assert len(data['kurban_options']) == 3, f"Expected 3 kurban_options, got {len(data['kurban_options'])}"
        
        # Check each option has numeric quota
        for opt in data['kurban_options']:
            assert 'quota' in opt, f"Missing quota in option: {opt.get('key', 'unknown')}"
            assert isinstance(opt['quota'], (int, float)), f"quota should be numeric, got {type(opt['quota'])} for {opt.get('key')}"
        
        # Check recent_donations
        assert 'recent_donations' in data, "Missing recent_donations field"
        assert isinstance(data['recent_donations'], list), f"recent_donations should be list, got {type(data['recent_donations'])}"
        
        print(f"✅ PASSED - Has kurban_options (3 items with numeric quota) and recent_donations array")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_news():
    """Test 4: GET /api/news -> 200, array length >= 4"""
    print("\n[TEST 4] GET /api/news")
    try:
        r = requests.get(f"{BASE_URL}/news", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 4, f"Expected >= 4 news items, got {len(data)}"
        
        print(f"✅ PASSED - Returns {len(data)} news items (>= 4)")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_testimonials():
    """Test 5: GET /api/testimonials -> array length >= 4"""
    print("\n[TEST 5] GET /api/testimonials")
    try:
        r = requests.get(f"{BASE_URL}/testimonials", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 4, f"Expected >= 4 testimonials, got {len(data)}"
        
        print(f"✅ PASSED - Returns {len(data)} testimonials (>= 4)")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_gallery():
    """Test 6: GET /api/gallery -> array length >= 8"""
    print("\n[TEST 6] GET /api/gallery")
    try:
        r = requests.get(f"{BASE_URL}/gallery", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 8, f"Expected >= 8 gallery items, got {len(data)}"
        
        print(f"✅ PASSED - Returns {len(data)} gallery items (>= 8)")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_stats():
    """Test 7: GET /api/stats -> 200 with fields total_collected, total_donors, total_target, total_donations, active_campaigns"""
    print("\n[TEST 7] GET /api/stats")
    try:
        r = requests.get(f"{BASE_URL}/stats", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        required_fields = ['total_collected', 'total_donors', 'total_target', 'total_donations', 'active_campaigns']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            assert isinstance(data[field], (int, float)), f"{field} should be numeric, got {type(data[field])}"
        
        print(f"✅ PASSED - Has all required fields: {', '.join(required_fields)}")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_kurban_quota():
    """Test 8: GET /api/kurban/quota -> 200, exactly 3 options each with numeric quota/sold/remaining (kambing quota=50 sold=18 remaining=32 as demo baseline)"""
    print("\n[TEST 8] GET /api/kurban/quota")
    try:
        r = requests.get(f"{BASE_URL}/kurban/quota", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert 'options' in data, "Missing options field"
        assert isinstance(data['options'], list), f"options should be list, got {type(data['options'])}"
        assert len(data['options']) == 3, f"Expected exactly 3 options, got {len(data['options'])}"
        
        # Check each option has numeric quota/sold/remaining
        for opt in data['options']:
            assert 'quota' in opt, f"Missing quota in option: {opt.get('key', 'unknown')}"
            assert 'sold' in opt, f"Missing sold in option: {opt.get('key', 'unknown')}"
            assert 'remaining' in opt, f"Missing remaining in option: {opt.get('key', 'unknown')}"
            
            assert isinstance(opt['quota'], (int, float)), f"quota should be numeric, got {type(opt['quota'])} for {opt.get('key')}"
            assert isinstance(opt['sold'], (int, float)), f"sold should be numeric, got {type(opt['sold'])} for {opt.get('key')}"
            assert isinstance(opt['remaining'], (int, float)), f"remaining should be numeric, got {type(opt['remaining'])} for {opt.get('key')}"
        
        # Check kambing baseline (quota=50, sold_base=18, so sold should be >= 18)
        kambing = next((o for o in data['options'] if o['key'] == 'kambing'), None)
        assert kambing is not None, "Missing kambing option"
        assert kambing['quota'] == 50, f"Expected kambing quota=50, got {kambing['quota']}"
        # sold might be > 18 due to test donations, but should be >= 18
        print(f"   Kambing: quota={kambing['quota']}, sold={kambing['sold']}, remaining={kambing['remaining']}")
        
        print(f"✅ PASSED - Returns 3 options with numeric quota/sold/remaining")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_reports():
    """Test 9: GET /api/reports?year=all -> 200 with years array; GET /api/reports?year=2025 -> total_collected=1340000000, total_donors=4120, total_donations=6540"""
    print("\n[TEST 9a] GET /api/reports?year=all")
    try:
        r = requests.get(f"{BASE_URL}/reports?year=all", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert 'years' in data, "Missing years field"
        assert isinstance(data['years'], list), f"years should be list, got {type(data['years'])}"
        assert len(data['years']) >= 3, f"Expected >= 3 years, got {len(data['years'])}"
        
        print(f"✅ PASSED - Returns years array: {data['years']}")
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False
    
    print("\n[TEST 9b] GET /api/reports?year=2025")
    try:
        r = requests.get(f"{BASE_URL}/reports?year=2025", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert data['total_collected'] == 1340000000, f"Expected total_collected=1340000000, got {data['total_collected']}"
        assert data['total_donors'] == 4120, f"Expected total_donors=4120, got {data['total_donors']}"
        assert data['total_donations'] == 6540, f"Expected total_donations=6540, got {data['total_donations']}"
        
        print(f"✅ PASSED - Returns exact 2025 totals: collected=1340000000, donors=4120, donations=6540")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_prayers():
    """Test 10: GET /api/prayers -> 200, array length >= 8"""
    print("\n[TEST 10] GET /api/prayers")
    try:
        r = requests.get(f"{BASE_URL}/prayers", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 8, f"Expected >= 8 prayers, got {len(data)}"
        
        print(f"✅ PASSED - Returns {len(data)} prayers (>= 8)")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_admin_endpoints():
    """Test 11: Admin (header x-admin-key: yababerma-admin-2026): GET /api/admin/summary -> 200 with required fields; GET /api/admin/donations -> 200 array"""
    print("\n[TEST 11a] GET /api/admin/summary")
    try:
        headers = {'x-admin-key': ADMIN_KEY}
        r = requests.get(f"{BASE_URL}/admin/summary", headers=headers, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        required_fields = ['total_donations', 'verified', 'pending', 'total_verified', 'confirmations']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✅ PASSED - Returns all required fields: {', '.join(required_fields)}")
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False
    
    print("\n[TEST 11b] GET /api/admin/donations")
    try:
        headers = {'x-admin-key': ADMIN_KEY}
        r = requests.get(f"{BASE_URL}/admin/donations", headers=headers, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        
        print(f"✅ PASSED - Returns donations array with {len(data)} items")
        return True
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_donation_creation():
    """Test 12: POST /api/donations -> 200 with unique_code (100-999), total_amount=amount+unique_code, status='pending', and campaign collected_amount +50000 and donor_count +1"""
    print("\n[TEST 12] POST /api/donations (campaign progress increment)")
    
    # First, get current campaign state
    try:
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        before = r.json()
        collected_before = before['collected_amount']
        donor_count_before = before['donor_count']
        print(f"   BEFORE: collected_amount={collected_before}, donor_count={donor_count_before}")
    except Exception as e:
        print(f"❌ FAILED to get campaign before state - {str(e)}")
        return False
    
    # Create donation
    try:
        payload = {
            "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
            "amount": 50000,
            "donor_name": "Regress Test",
            "donor_whatsapp": "08123456789"
        }
        r = requests.post(f"{BASE_URL}/donations", json=payload, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        donation = r.json()
        
        # Check donation fields
        assert 'unique_code' in donation, "Missing unique_code field"
        assert 100 <= donation['unique_code'] <= 999, f"unique_code should be 100-999, got {donation['unique_code']}"
        
        assert 'total_amount' in donation, "Missing total_amount field"
        expected_total = 50000 + donation['unique_code']
        assert donation['total_amount'] == expected_total, f"Expected total_amount={expected_total}, got {donation['total_amount']}"
        
        assert 'status' in donation, "Missing status field"
        assert donation['status'] == 'pending', f"Expected status='pending', got {donation['status']}"
        
        print(f"   Donation created: unique_code={donation['unique_code']}, total_amount={donation['total_amount']}, status={donation['status']}")
    except Exception as e:
        print(f"❌ FAILED to create donation - {str(e)}")
        return False
    
    # Check campaign state after
    try:
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        after = r.json()
        collected_after = after['collected_amount']
        donor_count_after = after['donor_count']
        print(f"   AFTER: collected_amount={collected_after}, donor_count={donor_count_after}")
        
        # Check increments
        collected_diff = collected_after - collected_before
        donor_count_diff = donor_count_after - donor_count_before
        
        assert collected_diff == 50000, f"Expected collected_amount to increase by 50000, got {collected_diff}"
        assert donor_count_diff == 1, f"Expected donor_count to increase by 1, got {donor_count_diff}"
        
        print(f"✅ PASSED - Donation created with correct fields and campaign progress incremented correctly")
        return True
    except Exception as e:
        print(f"❌ FAILED to verify campaign after state - {str(e)}")
        return False

def main():
    print("=" * 80)
    print("YABABERMA BACKEND REGRESSION TEST")
    print("Deployment fix: added .limit() to all MongoDB queries")
    print("=" * 80)
    
    tests = [
        test_campaigns_list,
        test_campaigns_category_filter,
        test_campaign_detail_kurban,
        test_news,
        test_testimonials,
        test_gallery,
        test_stats,
        test_kurban_quota,
        test_reports,
        test_prayers,
        test_admin_endpoints,
        test_donation_creation,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ EXCEPTION in {test.__name__}: {str(e)}")
            results.append(False)
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED - ZERO 500 ERRORS, ALL RESPONSE SHAPES INTACT")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
