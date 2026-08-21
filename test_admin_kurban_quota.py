#!/usr/bin/env python3
"""
Backend API Test Suite for YABABERMA - Admin Kurban Quota Management
Tests admin-protected endpoints for kurban quota management
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

def test_admin_kurban_get_unauthorized():
    """Test 1: GET /api/admin/kurban WITHOUT x-admin-key header -> expect 401"""
    print("\n=== TEST 1: GET /api/admin/kurban WITHOUT x-admin-key (expect 401) ===")
    try:
        resp = requests.get(f"{BASE_URL}/admin/kurban", timeout=10)
        if resp.status_code != 401:
            return log_test("GET /api/admin/kurban without header", False, 
                          f"Expected 401, got {resp.status_code}")
        
        log_test("GET /api/admin/kurban without header returns 401", True, 
                "Correctly unauthorized")
        return True
    except Exception as e:
        return log_test("GET /api/admin/kurban unauthorized test", False, f"Exception: {str(e)}")

def test_admin_kurban_get_authorized():
    """Test 2: GET /api/admin/kurban WITH correct header -> expect 200 with 3 options"""
    print("\n=== TEST 2: GET /api/admin/kurban WITH x-admin-key (expect 200) ===")
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        resp = requests.get(f"{BASE_URL}/admin/kurban", headers=headers, timeout=10)
        
        if resp.status_code != 200:
            return log_test("GET /api/admin/kurban with header", False, 
                          f"Expected 200, got {resp.status_code}: {resp.text}")
        
        log_test("GET /api/admin/kurban returns 200", True, "Authorized successfully")
        
        data = resp.json()
        if "options" not in data:
            return log_test("Response has 'options' key", False, "Missing 'options' key")
        
        options = data["options"]
        if not isinstance(options, list):
            return log_test("options is array", False, f"Expected array, got {type(options)}")
        
        if len(options) != 3:
            return log_test("options count", False, f"Expected 3 options, got {len(options)}")
        
        log_test("options count", True, f"Exactly 3 options returned")
        
        # Check for required keys
        required_keys = ["kambing", "sapi-patungan", "sapi-utuh"]
        option_keys = [opt["key"] for opt in options]
        if set(option_keys) != set(required_keys):
            return log_test("option keys", False, f"Expected {required_keys}, got {option_keys}")
        
        log_test("option keys", True, f"All required keys present: {required_keys}")
        
        # Verify each option has required fields
        all_valid = True
        for opt in options:
            required_fields = ["key", "name", "unit", "price", "quota", "sold_base"]
            for field in required_fields:
                if field not in opt:
                    log_test(f"Option {opt.get('key', 'unknown')} field {field}", False, "Missing field")
                    all_valid = False
                    continue
                
                # Check numeric fields
                if field in ["price", "quota", "sold_base"]:
                    if not isinstance(opt[field], (int, float)):
                        log_test(f"Option {opt['key']} field {field}", False, 
                               f"Expected numeric, got {type(opt[field])}")
                        all_valid = False
                
                # Check string fields
                if field in ["key", "name", "unit"]:
                    if not isinstance(opt[field], str):
                        log_test(f"Option {opt['key']} field {field}", False, 
                               f"Expected string, got {type(opt[field])}")
                        all_valid = False
        
        if all_valid:
            log_test("All options have required fields", True, 
                    "key, name, unit, price (numeric), quota (numeric), sold_base (numeric)")
        
        return all_valid
    except Exception as e:
        return log_test("GET /api/admin/kurban authorized test", False, f"Exception: {str(e)}")

def test_admin_kurban_quota_update():
    """Test 3: POST /api/admin/kurban-quota WITH correct header and valid body"""
    print("\n=== TEST 3: POST /api/admin/kurban-quota WITH x-admin-key and valid body ===")
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        
        # Update kambing quota to 60 and sold_base to 20
        body = {
            "options": [
                {"key": "kambing", "quota": 60, "sold_base": 20}
            ]
        }
        
        resp = requests.post(f"{BASE_URL}/admin/kurban-quota", headers=headers, json=body, timeout=10)
        
        if resp.status_code != 200:
            return log_test("POST /api/admin/kurban-quota", False, 
                          f"Expected 200, got {resp.status_code}: {resp.text}")
        
        log_test("POST /api/admin/kurban-quota returns 200", True, "Update successful")
        
        data = resp.json()
        if "options" not in data:
            return log_test("Response has 'options' key", False, "Missing 'options' key")
        
        options = data["options"]
        kambing = next((opt for opt in options if opt["key"] == "kambing"), None)
        
        if not kambing:
            return log_test("Find kambing in response", False, "kambing option not found")
        
        # Verify kambing has quota=60 and sold_base=20
        if kambing.get("quota") != 60:
            return log_test("kambing.quota", False, f"Expected 60, got {kambing.get('quota')}")
        
        if kambing.get("sold_base") != 20:
            return log_test("kambing.sold_base", False, f"Expected 20, got {kambing.get('sold_base')}")
        
        log_test("kambing updated correctly", True, "quota=60, sold_base=20")
        
        # Verify other options unchanged (sapi-patungan quota 70, sapi-utuh quota 10)
        sapi_patungan = next((opt for opt in options if opt["key"] == "sapi-patungan"), None)
        sapi_utuh = next((opt for opt in options if opt["key"] == "sapi-utuh"), None)
        
        if not sapi_patungan or not sapi_utuh:
            return log_test("Find other options", False, "sapi-patungan or sapi-utuh not found")
        
        # Note: We're not checking exact values for sapi-patungan and sapi-utuh as they might have been modified
        # in previous tests. We just verify they exist and have numeric quota.
        if not isinstance(sapi_patungan.get("quota"), (int, float)):
            return log_test("sapi-patungan.quota is numeric", False, 
                          f"Expected numeric, got {type(sapi_patungan.get('quota'))}")
        
        if not isinstance(sapi_utuh.get("quota"), (int, float)):
            return log_test("sapi-utuh.quota is numeric", False, 
                          f"Expected numeric, got {type(sapi_utuh.get('quota'))}")
        
        log_test("Other options present", True, 
                f"sapi-patungan quota={sapi_patungan.get('quota')}, sapi-utuh quota={sapi_utuh.get('quota')}")
        
        # Wait a moment for DB to update
        time.sleep(0.5)
        
        # Verify persistence with GET /api/admin/kurban
        resp = requests.get(f"{BASE_URL}/admin/kurban", headers=headers, timeout=10)
        if resp.status_code != 200:
            return log_test("GET /api/admin/kurban after update", False, f"Status {resp.status_code}")
        
        data = resp.json()
        options = data.get("options", [])
        kambing = next((opt for opt in options if opt["key"] == "kambing"), None)
        
        if not kambing:
            return log_test("Verify persistence (GET /api/admin/kurban)", False, "kambing not found")
        
        if kambing.get("quota") != 60 or kambing.get("sold_base") != 20:
            return log_test("Verify persistence (GET /api/admin/kurban)", False, 
                          f"Expected quota=60, sold_base=20, got quota={kambing.get('quota')}, sold_base={kambing.get('sold_base')}")
        
        log_test("Persistence verified (GET /api/admin/kurban)", True, 
                "kambing quota=60, sold_base=20 persisted")
        
        # Verify public endpoint reflects new quota
        resp = requests.get(f"{BASE_URL}/kurban/quota", timeout=10)
        if resp.status_code != 200:
            return log_test("GET /api/kurban/quota after update", False, f"Status {resp.status_code}")
        
        data = resp.json()
        options = data.get("options", [])
        kambing = next((opt for opt in options if opt["key"] == "kambing"), None)
        
        if not kambing:
            return log_test("Verify public endpoint (GET /api/kurban/quota)", False, "kambing not found")
        
        if kambing.get("quota") != 60:
            return log_test("Verify public endpoint quota", False, 
                          f"Expected quota=60, got {kambing.get('quota')}")
        
        # Verify remaining calculation: remaining = max(quota - sold, 0)
        sold = kambing.get("sold", 0)
        remaining = kambing.get("remaining", 0)
        expected_remaining = max(60 - sold, 0)
        
        if remaining != expected_remaining:
            return log_test("Verify remaining calculation", False, 
                          f"Expected remaining={expected_remaining} (60 - {sold}), got {remaining}")
        
        log_test("Public endpoint reflects new quota", True, 
                f"kambing.quota=60, sold={sold}, remaining={remaining} (correctly calculated)")
        
        return True
    except Exception as e:
        return log_test("POST /api/admin/kurban-quota update test", False, f"Exception: {str(e)}")

def test_admin_kurban_quota_post_unauthorized():
    """Test 4: POST /api/admin/kurban-quota WITHOUT x-admin-key header -> expect 401"""
    print("\n=== TEST 4: POST /api/admin/kurban-quota WITHOUT x-admin-key (expect 401) ===")
    try:
        body = {
            "options": [
                {"key": "kambing", "quota": 100, "sold_base": 50}
            ]
        }
        
        resp = requests.post(f"{BASE_URL}/admin/kurban-quota", json=body, timeout=10)
        
        if resp.status_code != 401:
            return log_test("POST /api/admin/kurban-quota without header", False, 
                          f"Expected 401, got {resp.status_code}")
        
        log_test("POST /api/admin/kurban-quota without header returns 401", True, 
                "Correctly unauthorized")
        return True
    except Exception as e:
        return log_test("POST /api/admin/kurban-quota unauthorized test", False, f"Exception: {str(e)}")

def test_admin_kurban_quota_invalid_body():
    """Test 5: POST /api/admin/kurban-quota WITH correct header but invalid body -> expect 400"""
    print("\n=== TEST 5: POST /api/admin/kurban-quota WITH x-admin-key but invalid body (expect 400) ===")
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        
        # Invalid body: options is not an array
        body = {"options": "notarray"}
        
        resp = requests.post(f"{BASE_URL}/admin/kurban-quota", headers=headers, json=body, timeout=10)
        
        if resp.status_code != 400:
            return log_test("POST /api/admin/kurban-quota with invalid body", False, 
                          f"Expected 400, got {resp.status_code}")
        
        log_test("POST /api/admin/kurban-quota with invalid body returns 400", True, 
                "Correctly rejected invalid body")
        return True
    except Exception as e:
        return log_test("POST /api/admin/kurban-quota invalid body test", False, f"Exception: {str(e)}")

def test_admin_kurban_quota_reset():
    """CLEANUP: Reset kambing to quota=50, sold_base=18 (demo baseline)"""
    print("\n=== CLEANUP: Reset kambing to demo baseline (quota=50, sold_base=18) ===")
    try:
        headers = {"x-admin-key": ADMIN_KEY}
        
        # Reset kambing to baseline
        body = {
            "options": [
                {"key": "kambing", "quota": 50, "sold_base": 18}
            ]
        }
        
        resp = requests.post(f"{BASE_URL}/admin/kurban-quota", headers=headers, json=body, timeout=10)
        
        if resp.status_code != 200:
            return log_test("CLEANUP: POST /api/admin/kurban-quota", False, 
                          f"Expected 200, got {resp.status_code}: {resp.text}")
        
        log_test("CLEANUP: POST /api/admin/kurban-quota returns 200", True, "Reset successful")
        
        data = resp.json()
        options = data.get("options", [])
        kambing = next((opt for opt in options if opt["key"] == "kambing"), None)
        
        if not kambing:
            return log_test("CLEANUP: Find kambing in response", False, "kambing option not found")
        
        if kambing.get("quota") != 50 or kambing.get("sold_base") != 18:
            return log_test("CLEANUP: kambing reset", False, 
                          f"Expected quota=50, sold_base=18, got quota={kambing.get('quota')}, sold_base={kambing.get('sold_base')}")
        
        log_test("CLEANUP: kambing reset to baseline", True, "quota=50, sold_base=18")
        
        return True
    except Exception as e:
        return log_test("CLEANUP: Reset test", False, f"Exception: {str(e)}")

def main():
    print("=" * 70)
    print("YABABERMA Backend API Test Suite")
    print("Testing: Admin Kurban Quota Management")
    print("=" * 70)
    
    results = []
    
    # Test 1: GET without x-admin-key -> 401
    results.append(("Test 1: GET /api/admin/kurban without x-admin-key (401)", 
                   test_admin_kurban_get_unauthorized()))
    
    # Test 2: GET with x-admin-key -> 200 with 3 options
    results.append(("Test 2: GET /api/admin/kurban with x-admin-key (200)", 
                   test_admin_kurban_get_authorized()))
    
    # Test 3: POST with x-admin-key and valid body -> 200, verify persistence
    results.append(("Test 3: POST /api/admin/kurban-quota update (200)", 
                   test_admin_kurban_quota_update()))
    
    # Test 4: POST without x-admin-key -> 401
    results.append(("Test 4: POST /api/admin/kurban-quota without x-admin-key (401)", 
                   test_admin_kurban_quota_post_unauthorized()))
    
    # Test 5: POST with x-admin-key but invalid body -> 400
    results.append(("Test 5: POST /api/admin/kurban-quota invalid body (400)", 
                   test_admin_kurban_quota_invalid_body()))
    
    # CLEANUP: Reset to baseline
    results.append(("CLEANUP: Reset kambing to baseline (quota=50, sold_base=18)", 
                   test_admin_kurban_quota_reset()))
    
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
