#!/usr/bin/env python3
"""
Backend API Test Suite for YABABERMA
Tests Kurban quota, Annual reports, and Donation regression
"""
import requests
import time
import sys

BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"
ADMIN_KEY = "yababerma-admin-2026"

def log_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    return passed

def test_kurban_quota_structure():
    """Test A1: GET /api/kurban/quota returns correct structure"""
    print("\n=== TEST A1: Kurban Quota Structure ===")
    try:
        resp = requests.get(f"{BASE_URL}/kurban/quota", timeout=10)
        if resp.status_code != 200:
            return log_test("Kurban quota endpoint", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        if "options" not in data:
            return log_test("Kurban quota structure", False, "Missing 'options' key")
        
        options = data["options"]
        if len(options) != 3:
            return log_test("Kurban quota options count", False, f"Expected 3 options, got {len(options)}")
        
        # Check for required keys
        required_keys = ["kambing", "sapi-patungan", "sapi-utuh"]
        option_keys = [opt["key"] for opt in options]
        if set(option_keys) != set(required_keys):
            return log_test("Kurban quota option keys", False, f"Expected {required_keys}, got {option_keys}")
        
        # Verify each option has required numeric fields
        all_valid = True
        for opt in options:
            required_fields = ["quota", "sold", "remaining", "price", "name", "unit"]
            for field in required_fields:
                if field not in opt:
                    log_test(f"Option {opt['key']} field {field}", False, f"Missing field")
                    all_valid = False
                    continue
                
                # Check numeric fields
                if field in ["quota", "sold", "remaining", "price"]:
                    if not isinstance(opt[field], (int, float)):
                        log_test(f"Option {opt['key']} field {field}", False, f"Expected numeric, got {type(opt[field])}")
                        all_valid = False
                
                # Check string fields
                if field in ["name", "unit"]:
                    if not isinstance(opt[field], str):
                        log_test(f"Option {opt['key']} field {field}", False, f"Expected string, got {type(opt[field])}")
                        all_valid = False
            
            # Verify remaining calculation
            expected_remaining = max(opt["quota"] - opt["sold"], 0)
            if opt["remaining"] != expected_remaining:
                log_test(f"Option {opt['key']} remaining calculation", False, 
                        f"Expected {expected_remaining}, got {opt['remaining']}")
                all_valid = False
            
            # Verify remaining <= quota
            if opt["remaining"] > opt["quota"]:
                log_test(f"Option {opt['key']} remaining <= quota", False, 
                        f"remaining ({opt['remaining']}) > quota ({opt['quota']})")
                all_valid = False
        
        if all_valid:
            log_test("Kurban quota structure validation", True, 
                    f"All 3 options valid with correct fields and calculations")
        
        return all_valid
    except Exception as e:
        return log_test("Kurban quota structure test", False, f"Exception: {str(e)}")

def test_kurban_quota_donation_increment():
    """Test A2: POST donation with kurban_option increments quota correctly"""
    print("\n=== TEST A2: Kurban Quota Donation Increment ===")
    try:
        # Get initial quota
        resp = requests.get(f"{BASE_URL}/kurban/quota", timeout=10)
        if resp.status_code != 200:
            return log_test("Get initial quota", False, f"Status {resp.status_code}")
        
        initial_data = resp.json()
        kambing_before = next((opt for opt in initial_data["options"] if opt["key"] == "kambing"), None)
        if not kambing_before:
            return log_test("Find kambing option", False, "kambing option not found")
        
        sold_before = kambing_before["sold"]
        remaining_before = kambing_before["remaining"]
        log_test("Capture kambing.sold BEFORE", True, f"sold={sold_before}, remaining={remaining_before}")
        
        # Create donation with kurban_option
        donation_data = {
            "campaign_slug": "kurban-peduli-banua",
            "amount": 5500000,
            "donor_name": "Ahmad Kurban",
            "donor_whatsapp": "08123456789",
            "kurban_option": "kambing",
            "kurban_qty": 2,
            "payment_method": "bsi"
        }
        
        resp = requests.post(f"{BASE_URL}/donations", json=donation_data, timeout=10)
        if resp.status_code != 200:
            return log_test("POST kurban donation", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        
        donation = resp.json()
        log_test("POST kurban donation", True, 
                f"Created donation ID: {donation.get('id', 'N/A')}, unique_code: {donation.get('unique_code', 'N/A')}")
        
        # Wait a moment for DB to update
        time.sleep(0.5)
        
        # Get updated quota
        resp = requests.get(f"{BASE_URL}/kurban/quota", timeout=10)
        if resp.status_code != 200:
            return log_test("Get updated quota", False, f"Status {resp.status_code}")
        
        updated_data = resp.json()
        kambing_after = next((opt for opt in updated_data["options"] if opt["key"] == "kambing"), None)
        if not kambing_after:
            return log_test("Find kambing option after", False, "kambing option not found")
        
        sold_after = kambing_after["sold"]
        remaining_after = kambing_after["remaining"]
        
        # Verify sold increased by exactly 2
        sold_diff = sold_after - sold_before
        if sold_diff != 2:
            return log_test("Kambing sold increment", False, 
                          f"Expected +2, got +{sold_diff} (before: {sold_before}, after: {sold_after})")
        
        # Verify remaining decreased by exactly 2
        remaining_diff = remaining_before - remaining_after
        if remaining_diff != 2:
            return log_test("Kambing remaining decrement", False, 
                          f"Expected -2, got -{remaining_diff} (before: {remaining_before}, after: {remaining_after})")
        
        log_test("Kambing quota update", True, 
                f"sold increased by 2 ({sold_before} → {sold_after}), remaining decreased by 2 ({remaining_before} → {remaining_after})")
        
        return True
    except Exception as e:
        return log_test("Kurban quota donation increment test", False, f"Exception: {str(e)}")

def test_kurban_campaign_quota_migration():
    """Test A3: GET /api/campaigns/kurban-peduli-banua has quota field in kurban_options"""
    print("\n=== TEST A3: Kurban Campaign Quota Migration ===")
    try:
        resp = requests.get(f"{BASE_URL}/campaigns/kurban-peduli-banua", timeout=10)
        if resp.status_code != 200:
            return log_test("Get kurban campaign", False, f"Expected 200, got {resp.status_code}")
        
        campaign = resp.json()
        if "kurban_options" not in campaign:
            return log_test("Kurban campaign has kurban_options", False, "Missing kurban_options field")
        
        kurban_options = campaign["kurban_options"]
        if not isinstance(kurban_options, list) or len(kurban_options) == 0:
            return log_test("Kurban options is non-empty array", False, f"Got {type(kurban_options)}")
        
        # Check each option has numeric quota field
        all_valid = True
        for opt in kurban_options:
            if "quota" not in opt:
                log_test(f"Option {opt.get('key', 'unknown')} has quota", False, "Missing quota field")
                all_valid = False
            elif not isinstance(opt["quota"], (int, float)):
                log_test(f"Option {opt.get('key', 'unknown')} quota is numeric", False, 
                        f"Expected numeric, got {type(opt['quota'])}")
                all_valid = False
        
        if all_valid:
            log_test("Kurban campaign quota migration", True, 
                    f"All {len(kurban_options)} kurban_options have numeric quota field")
        
        return all_valid
    except Exception as e:
        return log_test("Kurban campaign quota migration test", False, f"Exception: {str(e)}")

def test_reports_default_all():
    """Test B1: GET /api/reports (default all) returns correct structure"""
    print("\n=== TEST B1: Annual Reports Default (all) ===")
    try:
        resp = requests.get(f"{BASE_URL}/reports", timeout=10)
        if resp.status_code != 200:
            return log_test("Reports endpoint", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check years array
        if "years" not in data:
            return log_test("Reports has years array", False, "Missing 'years' field")
        
        years = data["years"]
        required_years = ["all", "2026", "2025", "2024"]
        for year in required_years:
            if year not in years:
                log_test(f"Years contains {year}", False, f"Missing year {year}")
                return False
        
        log_test("Years array", True, f"Contains required years: {required_years}")
        
        # Check numeric totals
        numeric_fields = ["total_collected", "total_donors", "total_donations"]
        for field in numeric_fields:
            if field not in data:
                log_test(f"Reports has {field}", False, f"Missing field")
                return False
            if not isinstance(data[field], (int, float)):
                log_test(f"{field} is numeric", False, f"Expected numeric, got {type(data[field])}")
                return False
        
        log_test("Numeric totals", True, 
                f"total_collected={data['total_collected']}, total_donors={data['total_donors']}, total_donations={data['total_donations']}")
        
        # Check by_category
        if "by_category" not in data:
            return log_test("Reports has by_category", False, "Missing by_category field")
        
        by_category = data["by_category"]
        if not isinstance(by_category, list) or len(by_category) == 0:
            return log_test("by_category is non-empty array", False, f"Got {type(by_category)} with length {len(by_category) if isinstance(by_category, list) else 'N/A'}")
        
        # Verify each category has category and amount
        for cat in by_category:
            if "category" not in cat or "amount" not in cat:
                log_test("by_category items structure", False, f"Missing category or amount in {cat}")
                return False
        
        log_test("by_category", True, f"Non-empty array with {len(by_category)} categories")
        
        # Check by_program
        if "by_program" not in data:
            return log_test("Reports has by_program", False, "Missing by_program field")
        
        by_program = data["by_program"]
        if not isinstance(by_program, list) or len(by_program) == 0:
            return log_test("by_program is non-empty array", False, f"Got {type(by_program)}")
        
        log_test("by_program", True, f"Non-empty array with {len(by_program)} programs")
        
        return True
    except Exception as e:
        return log_test("Reports default all test", False, f"Exception: {str(e)}")

def test_reports_year_2025():
    """Test B2: GET /api/reports?year=2025 returns specific totals"""
    print("\n=== TEST B2: Annual Reports Year 2025 ===")
    try:
        resp = requests.get(f"{BASE_URL}/reports?year=2025", timeout=10)
        if resp.status_code != 200:
            return log_test("Reports year 2025", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Verify specific totals
        expected = {
            "total_collected": 1340000000,
            "total_donors": 4120,
            "total_donations": 6540
        }
        
        all_match = True
        for field, expected_value in expected.items():
            if field not in data:
                log_test(f"2025 has {field}", False, "Missing field")
                all_match = False
            elif data[field] != expected_value:
                log_test(f"2025 {field}", False, f"Expected {expected_value}, got {data[field]}")
                all_match = False
        
        if all_match:
            log_test("Reports year 2025 totals", True, 
                    f"total_collected={data['total_collected']}, total_donors={data['total_donors']}, total_donations={data['total_donations']}")
        
        return all_match
    except Exception as e:
        return log_test("Reports year 2025 test", False, f"Exception: {str(e)}")

def test_reports_year_2024():
    """Test B3: GET /api/reports?year=2024 returns specific totals"""
    print("\n=== TEST B3: Annual Reports Year 2024 ===")
    try:
        resp = requests.get(f"{BASE_URL}/reports?year=2024", timeout=10)
        if resp.status_code != 200:
            return log_test("Reports year 2024", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Verify specific totals
        expected = {
            "total_collected": 890000000,
            "total_donors": 2760,
            "total_donations": 4180
        }
        
        all_match = True
        for field, expected_value in expected.items():
            if field not in data:
                log_test(f"2024 has {field}", False, "Missing field")
                all_match = False
            elif data[field] != expected_value:
                log_test(f"2024 {field}", False, f"Expected {expected_value}, got {data[field]}")
                all_match = False
        
        if all_match:
            log_test("Reports year 2024 totals", True, 
                    f"total_collected={data['total_collected']}, total_donors={data['total_donors']}, total_donations={data['total_donations']}")
        
        return all_match
    except Exception as e:
        return log_test("Reports year 2024 test", False, f"Exception: {str(e)}")

def test_reports_year_2026_live():
    """Test B4: GET /api/reports?year=2026 returns live campaign-derived totals"""
    print("\n=== TEST B4: Annual Reports Year 2026 (Live) ===")
    try:
        resp = requests.get(f"{BASE_URL}/reports?year=2026", timeout=10)
        if resp.status_code != 200:
            return log_test("Reports year 2026", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Verify numeric totals exist and are > 0
        if "total_collected" not in data or not isinstance(data["total_collected"], (int, float)):
            return log_test("2026 total_collected", False, "Missing or non-numeric")
        
        if data["total_collected"] <= 0:
            return log_test("2026 total_collected > 0", False, f"Expected > 0, got {data['total_collected']}")
        
        log_test("2026 total_collected", True, f"Live total: {data['total_collected']}")
        
        # Verify by_program length === 8 (8 campaigns seeded)
        if "by_program" not in data:
            return log_test("2026 has by_program", False, "Missing by_program")
        
        by_program = data["by_program"]
        if not isinstance(by_program, list):
            return log_test("2026 by_program is array", False, f"Got {type(by_program)}")
        
        if len(by_program) != 8:
            return log_test("2026 by_program length", False, f"Expected 8 programs, got {len(by_program)}")
        
        log_test("2026 by_program", True, f"Contains {len(by_program)} programs (8 campaigns)")
        
        return True
    except Exception as e:
        return log_test("Reports year 2026 test", False, f"Exception: {str(e)}")

def test_reports_year_invalid():
    """Test B5: GET /api/reports?year=1999 returns 404 with years array"""
    print("\n=== TEST B5: Annual Reports Invalid Year (1999) ===")
    try:
        resp = requests.get(f"{BASE_URL}/reports?year=1999", timeout=10)
        if resp.status_code != 404:
            return log_test("Reports year 1999 status", False, f"Expected 404, got {resp.status_code}")
        
        log_test("Reports year 1999 returns 404", True, "Correct HTTP status")
        
        data = resp.json()
        if "years" not in data:
            return log_test("404 response includes years array", False, "Missing 'years' field")
        
        years = data["years"]
        if not isinstance(years, list) or len(years) == 0:
            return log_test("years array is non-empty", False, f"Got {type(years)}")
        
        log_test("404 response includes years array", True, f"years: {years}")
        
        return True
    except Exception as e:
        return log_test("Reports invalid year test", False, f"Exception: {str(e)}")

def test_donation_regression():
    """Test C: Light regression on POST /api/donations for non-kurban campaign"""
    print("\n=== TEST C: Donation Regression (Non-Kurban Campaign) ===")
    try:
        # Get campaign before donation
        resp = requests.get(f"{BASE_URL}/campaigns/wakaf-al-quran-santri-pelosok", timeout=10)
        if resp.status_code != 200:
            return log_test("Get campaign before", False, f"Status {resp.status_code}")
        
        campaign_before = resp.json()
        collected_before = campaign_before.get("collected_amount", 0)
        donor_count_before = campaign_before.get("donor_count", 0)
        log_test("Capture campaign state BEFORE", True, 
                f"collected={collected_before}, donor_count={donor_count_before}")
        
        # Create normal donation
        donation_data = {
            "campaign_slug": "wakaf-al-quran-santri-pelosok",
            "amount": 100000,
            "donor_name": "Fatimah Zahra",
            "donor_whatsapp": "08567891234"
        }
        
        resp = requests.post(f"{BASE_URL}/donations", json=donation_data, timeout=10)
        if resp.status_code != 200:
            return log_test("POST donation", False, f"Expected 200, got {resp.status_code}: {resp.text}")
        
        donation = resp.json()
        
        # Verify unique_code (100-999)
        unique_code = donation.get("unique_code")
        if not isinstance(unique_code, int) or unique_code < 100 or unique_code > 999:
            return log_test("unique_code range", False, f"Expected 100-999, got {unique_code}")
        
        log_test("unique_code", True, f"Generated: {unique_code}")
        
        # Verify total_amount = amount + unique_code
        expected_total = 100000 + unique_code
        if donation.get("total_amount") != expected_total:
            return log_test("total_amount calculation", False, 
                          f"Expected {expected_total}, got {donation.get('total_amount')}")
        
        log_test("total_amount", True, f"Correct: {donation.get('total_amount')} = 100000 + {unique_code}")
        
        # Verify status = 'pending'
        if donation.get("status") != "pending":
            return log_test("status", False, f"Expected 'pending', got {donation.get('status')}")
        
        log_test("status", True, "Correct: 'pending'")
        
        # Wait for DB update
        time.sleep(0.5)
        
        # Get campaign after donation
        resp = requests.get(f"{BASE_URL}/campaigns/wakaf-al-quran-santri-pelosok", timeout=10)
        if resp.status_code != 200:
            return log_test("Get campaign after", False, f"Status {resp.status_code}")
        
        campaign_after = resp.json()
        collected_after = campaign_after.get("collected_amount", 0)
        donor_count_after = campaign_after.get("donor_count", 0)
        
        # Verify collected_amount increased by 100000
        collected_diff = collected_after - collected_before
        if collected_diff != 100000:
            return log_test("collected_amount increment", False, 
                          f"Expected +100000, got +{collected_diff} (before: {collected_before}, after: {collected_after})")
        
        log_test("collected_amount increment", True, f"+100000 ({collected_before} → {collected_after})")
        
        # Verify donor_count increased by 1
        donor_diff = donor_count_after - donor_count_before
        if donor_diff != 1:
            return log_test("donor_count increment", False, 
                          f"Expected +1, got +{donor_diff} (before: {donor_count_before}, after: {donor_count_after})")
        
        log_test("donor_count increment", True, f"+1 ({donor_count_before} → {donor_count_after})")
        
        return True
    except Exception as e:
        return log_test("Donation regression test", False, f"Exception: {str(e)}")

def main():
    print("=" * 70)
    print("YABABERMA Backend API Test Suite")
    print("Testing: Kurban Quota, Annual Reports, Donation Regression")
    print("=" * 70)
    
    results = []
    
    # Test A: Kurban real-time quota
    results.append(("A1: Kurban Quota Structure", test_kurban_quota_structure()))
    results.append(("A2: Kurban Quota Donation Increment", test_kurban_quota_donation_increment()))
    results.append(("A3: Kurban Campaign Quota Migration", test_kurban_campaign_quota_migration()))
    
    # Test B: Annual reports
    results.append(("B1: Reports Default (all)", test_reports_default_all()))
    results.append(("B2: Reports Year 2025", test_reports_year_2025()))
    results.append(("B3: Reports Year 2024", test_reports_year_2024()))
    results.append(("B4: Reports Year 2026 (Live)", test_reports_year_2026_live()))
    results.append(("B5: Reports Invalid Year (1999)", test_reports_year_invalid()))
    
    # Test C: Donation regression
    results.append(("C: Donation Regression", test_donation_regression()))
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("=" * 70)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("=" * 70)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
