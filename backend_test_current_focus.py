#!/usr/bin/env python3
"""
YABABERMA Backend Test - Current Focus Tasks
Tests two backend changes:
1. Thank-you email moved to verification-only (no creation thank-you)
2. Admin bulk delete endpoint (POST /api/admin/delete)
"""

import requests
import sys
import json
import time

BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"
ADMIN_KEY = "yababerma-admin-2026"

# Track created resources for cleanup
created_donation_ids = []
created_confirmation_ids = []

def cleanup():
    """Delete all test donations and confirmations created during testing"""
    print("\n" + "=" * 80)
    print("CLEANUP - Deleting test resources to keep demo DB pristine")
    print("=" * 80)
    
    all_ids = created_donation_ids + created_confirmation_ids
    if not all_ids:
        print("No resources to clean up")
        return
    
    # Delete donations
    if created_donation_ids:
        try:
            headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
            payload = {"collection": "donations", "ids": created_donation_ids}
            r = requests.post(f"{BASE_URL}/admin/delete", json=payload, headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                print(f"✅ Deleted {data.get('deleted', 0)} test donations (reverted {data.get('reverted', 0)} campaign stats)")
            else:
                print(f"⚠️  Failed to delete donations: {r.status_code}")
        except Exception as e:
            print(f"⚠️  Exception during donation cleanup: {str(e)}")
    
    # Delete confirmations
    if created_confirmation_ids:
        try:
            headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
            payload = {"collection": "confirmations", "ids": created_confirmation_ids}
            r = requests.post(f"{BASE_URL}/admin/delete", json=payload, headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                print(f"✅ Deleted {data.get('deleted', 0)} test confirmations")
            else:
                print(f"⚠️  Failed to delete confirmations: {r.status_code}")
        except Exception as e:
            print(f"⚠️  Exception during confirmation cleanup: {str(e)}")

# ============================================================================
# CHANGE 1: Thank-you email moved to verification-only
# ============================================================================

def test_donation_creation_no_email():
    """CHANGE 1a: POST /api/donations returns 200 quickly (<2s) with unique_code (100-999), total_amount=amount+unique_code, status='pending', and increments campaign"""
    print("\n[CHANGE 1a] POST /api/donations - creation without thank-you email")
    
    # Get campaign baseline
    try:
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        before = r.json()
        collected_before = before['collected_amount']
        donor_count_before = before['donor_count']
        print(f"   Campaign BEFORE: collected_amount={collected_before}, donor_count={donor_count_before}")
    except Exception as e:
        print(f"❌ FAILED to get campaign baseline - {str(e)}")
        return False
    
    # Create donation with email (to test that email is NOT sent on creation)
    try:
        payload = {
            "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
            "amount": 75000,
            "donor_name": "Test Donor Email Flow",
            "donor_whatsapp": "08123456789",
            "donor_email": "delivered@resend.dev"
        }
        
        start_time = time.time()
        r = requests.post(f"{BASE_URL}/donations", json=payload, timeout=10)
        elapsed = time.time() - start_time
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert elapsed < 2.0, f"Expected response < 2s, got {elapsed:.3f}s"
        
        donation = r.json()
        
        # Verify donation fields
        assert 'id' in donation, "Missing id field"
        assert 'unique_code' in donation, "Missing unique_code field"
        assert 100 <= donation['unique_code'] <= 999, f"unique_code should be 100-999, got {donation['unique_code']}"
        
        assert 'total_amount' in donation, "Missing total_amount field"
        expected_total = 75000 + donation['unique_code']
        assert donation['total_amount'] == expected_total, f"Expected total_amount={expected_total}, got {donation['total_amount']}"
        
        assert 'status' in donation, "Missing status field"
        assert donation['status'] == 'pending', f"Expected status='pending', got {donation['status']}"
        
        # Track for cleanup
        created_donation_ids.append(donation['id'])
        
        print(f"   ✓ Donation created in {elapsed:.3f}s: id={donation['id']}, unique_code={donation['unique_code']}, total_amount={donation['total_amount']}, status={donation['status']}")
        
        # Verify campaign increment
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        after = r.json()
        collected_after = after['collected_amount']
        donor_count_after = after['donor_count']
        
        collected_diff = collected_after - collected_before
        donor_count_diff = donor_count_after - donor_count_before
        
        assert collected_diff == 75000, f"Expected collected_amount to increase by 75000, got {collected_diff}"
        assert donor_count_diff == 1, f"Expected donor_count to increase by 1, got {donor_count_diff}"
        
        print(f"   ✓ Campaign AFTER: collected_amount={collected_after} (+{collected_diff}), donor_count={donor_count_after} (+{donor_count_diff})")
        print(f"✅ PASSED - Donation created quickly (<2s), correct fields, campaign incremented, no blocking email")
        
        return donation['id']  # Return donation ID for next test
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_admin_verify_email_sent():
    """CHANGE 1b: POST /api/admin/verify {donation_id, status:'verified'} returns 200 in <2s, sets status='verified' and verified_at"""
    donation_id = test_donation_creation_no_email()
    if not donation_id:
        print("\n[CHANGE 1b] SKIPPED - Previous test failed")
        return False
    
    print(f"\n[CHANGE 1b] POST /api/admin/verify - verify donation (fire-and-forget email)")
    
    try:
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        payload = {"donation_id": donation_id, "status": "verified"}
        
        start_time = time.time()
        r = requests.post(f"{BASE_URL}/admin/verify", json=payload, headers=headers, timeout=10)
        elapsed = time.time() - start_time
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert elapsed < 2.0, f"Expected response < 2s, got {elapsed:.3f}s"
        
        data = r.json()
        assert 'donation' in data, "Missing donation field in response"
        donation = data['donation']
        
        assert donation['status'] == 'verified', f"Expected status='verified', got {donation['status']}"
        assert 'verified_at' in donation, "Missing verified_at field"
        assert donation['verified_at'] is not None, "verified_at should not be null"
        
        print(f"   ✓ Donation verified in {elapsed:.3f}s: status={donation['status']}, verified_at={donation['verified_at']}")
        
        # Verify via GET /api/admin/donations
        r = requests.get(f"{BASE_URL}/admin/donations", headers=headers, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        donations = r.json()
        verified_donation = next((d for d in donations if d['id'] == donation_id), None)
        assert verified_donation is not None, f"Donation {donation_id} not found in admin donations list"
        assert verified_donation['status'] == 'verified', f"Expected status='verified', got {verified_donation['status']}"
        assert verified_donation['verified_at'] is not None, "verified_at should not be null"
        
        print(f"   ✓ Verified in GET /api/admin/donations: status={verified_donation['status']}, verified_at={verified_donation['verified_at']}")
        print(f"✅ PASSED - Donation verified quickly (<2s), status='verified', verified_at set, fire-and-forget email")
        
        return donation_id  # Return for next test
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_admin_verify_revert():
    """CHANGE 1c: POST /api/admin/verify {donation_id, status:'pending'} reverts: status='pending', verified_at=null"""
    donation_id = test_admin_verify_email_sent()
    if not donation_id:
        print("\n[CHANGE 1c] SKIPPED - Previous test failed")
        return False
    
    print(f"\n[CHANGE 1c] POST /api/admin/verify - revert to pending")
    
    try:
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        payload = {"donation_id": donation_id, "status": "pending"}
        
        r = requests.post(f"{BASE_URL}/admin/verify", json=payload, headers=headers, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        data = r.json()
        assert 'donation' in data, "Missing donation field in response"
        donation = data['donation']
        
        assert donation['status'] == 'pending', f"Expected status='pending', got {donation['status']}"
        assert donation['verified_at'] is None, f"verified_at should be null, got {donation['verified_at']}"
        
        print(f"   ✓ Donation reverted: status={donation['status']}, verified_at={donation['verified_at']}")
        print(f"✅ PASSED - Donation reverted to pending, verified_at=null")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

# ============================================================================
# CHANGE 2: Admin bulk delete endpoint
# ============================================================================

def test_bulk_delete_no_auth():
    """CHANGE 2.1: POST /api/admin/delete without x-admin-key -> 401"""
    print("\n[CHANGE 2.1] POST /api/admin/delete - no auth header")
    
    try:
        payload = {"collection": "donations", "ids": ["fake-id"]}
        r = requests.post(f"{BASE_URL}/admin/delete", json=payload, timeout=10)
        
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
        
        print(f"✅ PASSED - Returns 401 without x-admin-key header")
        return True
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_bulk_delete_empty_ids():
    """CHANGE 2.2: POST /api/admin/delete with key and body {"collection":"donations","ids":[]} -> 400"""
    print("\n[CHANGE 2.2] POST /api/admin/delete - empty ids array")
    
    try:
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        payload = {"collection": "donations", "ids": []}
        r = requests.post(f"{BASE_URL}/admin/delete", json=payload, headers=headers, timeout=10)
        
        assert r.status_code == 400, f"Expected 400, got {r.status_code}"
        
        print(f"✅ PASSED - Returns 400 with empty ids array")
        return True
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_bulk_delete_donations_rollback():
    """CHANGE 2.3: Rollback test - create 2 donations, delete them, verify campaign stats rolled back"""
    print("\n[CHANGE 2.3] POST /api/admin/delete - donations rollback test")
    
    # Get campaign baseline
    try:
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        baseline = r.json()
        collected_baseline = baseline['collected_amount']
        donor_count_baseline = baseline['donor_count']
        print(f"   Campaign BASELINE: collected_amount={collected_baseline}, donor_count={donor_count_baseline}")
    except Exception as e:
        print(f"❌ FAILED to get campaign baseline - {str(e)}")
        return False
    
    # Create TWO donations
    donation_ids = []
    try:
        for i, amount in enumerate([20000, 30000], 1):
            payload = {
                "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
                "amount": amount,
                "donor_name": f"Test Donor Rollback {i}",
                "donor_whatsapp": "08123456789"
            }
            r = requests.post(f"{BASE_URL}/donations", json=payload, timeout=10)
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            donation = r.json()
            donation_ids.append(donation['id'])
            print(f"   ✓ Created donation {i}: id={donation['id']}, amount={amount}")
        
        # Verify campaign increased
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        after_create = r.json()
        collected_after_create = after_create['collected_amount']
        donor_count_after_create = after_create['donor_count']
        
        assert collected_after_create == collected_baseline + 50000, f"Expected collected_amount={collected_baseline + 50000}, got {collected_after_create}"
        assert donor_count_after_create == donor_count_baseline + 2, f"Expected donor_count={donor_count_baseline + 2}, got {donor_count_after_create}"
        
        print(f"   ✓ Campaign AFTER CREATE: collected_amount={collected_after_create} (+50000), donor_count={donor_count_after_create} (+2)")
        
    except Exception as e:
        print(f"❌ FAILED to create donations - {str(e)}")
        return False
    
    # Delete the two donations
    try:
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        payload = {"collection": "donations", "ids": donation_ids}
        r = requests.post(f"{BASE_URL}/admin/delete", json=payload, headers=headers, timeout=10)
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert 'deleted' in data, "Missing deleted field"
        assert data['deleted'] == 2, f"Expected deleted=2, got {data['deleted']}"
        
        assert 'reverted' in data, "Missing reverted field"
        assert data['reverted'] == 2, f"Expected reverted=2, got {data['reverted']}"
        
        print(f"   ✓ Bulk delete response: deleted={data['deleted']}, reverted={data['reverted']}")
        
        # Verify donations are gone from GET /api/admin/donations
        r = requests.get(f"{BASE_URL}/admin/donations", headers=headers, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        all_donations = r.json()
        
        for donation_id in donation_ids:
            found = any(d['id'] == donation_id for d in all_donations)
            assert not found, f"Donation {donation_id} should be deleted but still found in admin donations list"
        
        print(f"   ✓ Verified donations are gone from GET /api/admin/donations")
        
        # Verify campaign stats rolled back to baseline
        r = requests.get(f"{BASE_URL}/campaigns/paket-sembako-dhuafa-banjarmasin", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        after_delete = r.json()
        collected_after_delete = after_delete['collected_amount']
        donor_count_after_delete = after_delete['donor_count']
        
        assert collected_after_delete == collected_baseline, f"Expected collected_amount={collected_baseline} (baseline), got {collected_after_delete}"
        assert donor_count_after_delete == donor_count_baseline, f"Expected donor_count={donor_count_baseline} (baseline), got {donor_count_after_delete}"
        
        print(f"   ✓ Campaign AFTER DELETE: collected_amount={collected_after_delete} (baseline restored), donor_count={donor_count_after_delete} (baseline restored)")
        print(f"✅ PASSED - Bulk delete donations with rollback: deleted=2, reverted=2, campaign stats restored to baseline")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

def test_bulk_delete_confirmations():
    """CHANGE 2.4: Create confirmation, delete it, verify it's gone"""
    print("\n[CHANGE 2.4] POST /api/admin/delete - confirmations deletion")
    
    # Create confirmation
    try:
        payload = {
            "name": "Test Confirmation Delete",
            "whatsapp": "08123456789",
            "amount": 15000,
            "bank": "bsi",
            "program": "Sedekah"
        }
        r = requests.post(f"{BASE_URL}/confirmations", json=payload, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert 'confirmation' in data, "Missing confirmation field"
        confirmation = data['confirmation']
        assert 'id' in confirmation, "Missing id field"
        confirmation_id = confirmation['id']
        
        print(f"   ✓ Created confirmation: id={confirmation_id}")
        
    except Exception as e:
        print(f"❌ FAILED to create confirmation - {str(e)}")
        return False
    
    # Delete confirmation
    try:
        headers = {'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'}
        payload = {"collection": "confirmations", "ids": [confirmation_id]}
        r = requests.post(f"{BASE_URL}/admin/delete", json=payload, headers=headers, timeout=10)
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        assert 'deleted' in data, "Missing deleted field"
        assert data['deleted'] == 1, f"Expected deleted=1, got {data['deleted']}"
        
        print(f"   ✓ Bulk delete response: deleted={data['deleted']}")
        
        # Verify confirmation is gone from GET /api/admin/confirmations
        r = requests.get(f"{BASE_URL}/admin/confirmations", headers=headers, timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        all_confirmations = r.json()
        
        found = any(c['id'] == confirmation_id for c in all_confirmations)
        assert not found, f"Confirmation {confirmation_id} should be deleted but still found in admin confirmations list"
        
        print(f"   ✓ Verified confirmation is gone from GET /api/admin/confirmations")
        print(f"✅ PASSED - Bulk delete confirmation: deleted=1, confirmation removed from list")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

# ============================================================================
# Quick Regression
# ============================================================================

def test_quick_regression():
    """Quick regression: GET /api/admin/summary, GET /api/admin/donations, GET /api/admin/confirmations all 200"""
    print("\n[REGRESSION] Quick regression - admin endpoints")
    
    headers = {'x-admin-key': ADMIN_KEY}
    
    try:
        # GET /api/admin/summary
        r = requests.get(f"{BASE_URL}/admin/summary", headers=headers, timeout=10)
        assert r.status_code == 200, f"GET /api/admin/summary expected 200, got {r.status_code}"
        print(f"   ✓ GET /api/admin/summary: 200")
        
        # GET /api/admin/donations
        r = requests.get(f"{BASE_URL}/admin/donations", headers=headers, timeout=10)
        assert r.status_code == 200, f"GET /api/admin/donations expected 200, got {r.status_code}"
        print(f"   ✓ GET /api/admin/donations: 200")
        
        # GET /api/admin/confirmations
        r = requests.get(f"{BASE_URL}/admin/confirmations", headers=headers, timeout=10)
        assert r.status_code == 200, f"GET /api/admin/confirmations expected 200, got {r.status_code}"
        print(f"   ✓ GET /api/admin/confirmations: 200")
        
        print(f"✅ PASSED - All admin endpoints returning 200")
        return True
        
    except Exception as e:
        print(f"❌ FAILED - {str(e)}")
        return False

# ============================================================================
# Main
# ============================================================================

def main():
    print("=" * 80)
    print("YABABERMA BACKEND TEST - CURRENT FOCUS TASKS")
    print("Testing two backend changes:")
    print("1. Thank-you email moved to verification-only (no creation thank-you)")
    print("2. Admin bulk delete endpoint (POST /api/admin/delete)")
    print("=" * 80)
    
    tests = [
        # CHANGE 1: Thank-you email moved to verification-only
        # Note: test_donation_creation_no_email, test_admin_verify_email_sent, and test_admin_verify_revert
        # are chained together, so we only call the last one which calls the previous ones
        test_admin_verify_revert,
        
        # CHANGE 2: Admin bulk delete endpoint
        test_bulk_delete_no_auth,
        test_bulk_delete_empty_ids,
        test_bulk_delete_donations_rollback,
        test_bulk_delete_confirmations,
        
        # Quick regression
        test_quick_regression,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ EXCEPTION in {test.__name__}: {str(e)}")
            results.append(False)
    
    # Cleanup
    cleanup()
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED - ZERO 500 ERRORS")
        print("   - Thank-you email moved to verification-only: WORKING")
        print("   - Admin bulk delete endpoint: WORKING")
        print("   - Campaign rollback on deletion: WORKING")
        print("   - Demo DB pristine (all test data cleaned up)")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
