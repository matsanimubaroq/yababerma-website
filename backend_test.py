#!/usr/bin/env python3
"""
Backend API Test Suite for YABABERMA Donation Platform
Focus: MongoDB connection race-condition fix verification
"""

import asyncio
import aiohttp
import os
from typing import List, Dict, Any

BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
    
    def add_pass(self, test_name: str):
        self.passed.append(test_name)
        print(f"✅ PASS: {test_name}")
    
    def add_fail(self, test_name: str, reason: str):
        self.failed.append((test_name, reason))
        print(f"❌ FAIL: {test_name} - {reason}")
    
    def summary(self):
        total = len(self.passed) + len(self.failed)
        print(f"\n{'='*80}")
        print(f"TEST SUMMARY: {len(self.passed)}/{total} passed")
        print(f"{'='*80}")
        if self.failed:
            print("\nFAILED TESTS:")
            for name, reason in self.failed:
                print(f"  ❌ {name}: {reason}")
        return len(self.failed) == 0

results = TestResults()

async def test_concurrency_race_condition():
    """
    TEST 1: CONCURRENCY - Fire 20-30 concurrent requests to verify NO 500 errors
    This is the key regression check for the MongoDB connection race fix
    """
    print("\n" + "="*80)
    print("TEST 1: CONCURRENCY - MongoDB Race Condition Fix")
    print("="*80)
    
    endpoints = [
        "/campaigns",
        "/campaigns?featured=true",
        "/auth/me",
        "/news",
        "/stats",
        "/testimonials",
        "/gallery",
        "/campaigns/wakaf-al-quran-santri-pelosok",
    ]
    
    # Create 30 concurrent requests (mix of different endpoints)
    tasks = []
    async with aiohttp.ClientSession() as session:
        for i in range(30):
            endpoint = endpoints[i % len(endpoints)]
            url = f"{BASE_URL}{endpoint}"
            tasks.append(fetch_with_status(session, url, f"Request {i+1} ({endpoint})"))
        
        print(f"Firing {len(tasks)} concurrent requests...")
        responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Analyze results
    errors_500 = []
    errors_other = []
    success_200 = []
    
    for i, resp in enumerate(responses):
        if isinstance(resp, Exception):
            errors_other.append(f"Request {i+1}: {str(resp)}")
        elif resp['status'] == 500:
            errors_500.append(f"Request {i+1} ({resp['url']}): {resp.get('body', {})}")
        elif resp['status'] == 200:
            success_200.append(f"Request {i+1}")
        else:
            errors_other.append(f"Request {i+1}: Status {resp['status']}")
    
    print(f"\nResults: {len(success_200)} success, {len(errors_500)} 500-errors, {len(errors_other)} other errors")
    
    if errors_500:
        results.add_fail("Concurrency Test - NO 500 errors", f"Found {len(errors_500)} 500 errors: {errors_500[:3]}")
        return False
    elif len(success_200) < 25:  # Allow a few network hiccups
        results.add_fail("Concurrency Test - Success rate", f"Only {len(success_200)}/30 succeeded")
        return False
    else:
        results.add_pass(f"Concurrency Test - {len(success_200)}/30 requests succeeded with NO 500 errors")
        return True

async def fetch_with_status(session, url, label):
    """Helper to fetch and return status + body"""
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            body = await resp.json()
            return {'status': resp.status, 'url': url, 'body': body, 'label': label}
    except Exception as e:
        return {'status': 0, 'url': url, 'error': str(e), 'label': label}

async def test_seeding_integrity():
    """
    TEST 2: SEEDING INTEGRITY - Verify exact counts (no duplicates from double-seeding)
    """
    print("\n" + "="*80)
    print("TEST 2: SEEDING INTEGRITY")
    print("="*80)
    
    async with aiohttp.ClientSession() as session:
        # Test campaigns count
        async with session.get(f"{BASE_URL}/campaigns") as resp:
            campaigns = await resp.json()
            if len(campaigns) == 7:
                results.add_pass(f"Campaigns count: {len(campaigns)} (expected 7)")
            else:
                results.add_fail("Campaigns count", f"Expected 7, got {len(campaigns)}")
        
        # Test news count
        async with session.get(f"{BASE_URL}/news") as resp:
            news = await resp.json()
            if len(news) == 4:
                results.add_pass(f"News count: {len(news)} (expected 4)")
            else:
                results.add_fail("News count", f"Expected 4, got {len(news)}")
        
        # Test testimonials count
        async with session.get(f"{BASE_URL}/testimonials") as resp:
            testimonials = await resp.json()
            if len(testimonials) == 4:
                results.add_pass(f"Testimonials count: {len(testimonials)} (expected 4)")
            else:
                results.add_fail("Testimonials count", f"Expected 4, got {len(testimonials)}")
        
        # Test gallery count
        async with session.get(f"{BASE_URL}/gallery") as resp:
            gallery = await resp.json()
            if len(gallery) == 8:
                results.add_pass(f"Gallery count: {len(gallery)} (expected 8)")
            else:
                results.add_fail("Gallery count", f"Expected 8, got {len(gallery)}")

async def test_donation_flow_regression():
    """
    TEST 3: DONATION FLOW REGRESSION - Verify donation creation and campaign increment
    """
    print("\n" + "="*80)
    print("TEST 3: DONATION FLOW REGRESSION")
    print("="*80)
    
    campaign_slug = "paket-sembako-dhuafa-banjarmasin"
    
    async with aiohttp.ClientSession() as session:
        # Get campaign BEFORE donation
        async with session.get(f"{BASE_URL}/campaigns/{campaign_slug}") as resp:
            if resp.status != 200:
                results.add_fail("Donation Flow - Get campaign before", f"Status {resp.status}")
                return
            campaign_before = await resp.json()
            collected_before = campaign_before['collected_amount']
            donor_count_before = campaign_before['donor_count']
            print(f"Campaign BEFORE: collected={collected_before}, donors={donor_count_before}")
        
        # Create donation
        donation_data = {
            "campaign_slug": campaign_slug,
            "amount": 50000,
            "donor_name": "Ahmad Tester",
            "donor_whatsapp": "081234567890",
            "donor_email": "ahmad.test@example.com",
            "payment_method": "bca",
            "message": "Semoga berkah"
        }
        
        async with session.post(f"{BASE_URL}/donations", json=donation_data) as resp:
            if resp.status != 200:
                body = await resp.text()
                results.add_fail("Donation Flow - Create donation", f"Status {resp.status}, body: {body}")
                return
            donation = await resp.json()
            
            # Verify donation fields
            if not (100 <= donation['unique_code'] <= 999):
                results.add_fail("Donation Flow - unique_code range", f"Got {donation['unique_code']}, expected 100-999")
            else:
                results.add_pass(f"Donation unique_code: {donation['unique_code']} (100-999)")
            
            expected_total = 50000 + donation['unique_code']
            if donation['total_amount'] != expected_total:
                results.add_fail("Donation Flow - total_amount", f"Expected {expected_total}, got {donation['total_amount']}")
            else:
                results.add_pass(f"Donation total_amount: {donation['total_amount']} (amount + unique_code)")
            
            if donation['status'] != 'pending':
                results.add_fail("Donation Flow - status", f"Expected 'pending', got {donation['status']}")
            else:
                results.add_pass(f"Donation status: {donation['status']}")
        
        # Wait a moment for DB update
        await asyncio.sleep(0.5)
        
        # Get campaign AFTER donation
        async with session.get(f"{BASE_URL}/campaigns/{campaign_slug}") as resp:
            if resp.status != 200:
                results.add_fail("Donation Flow - Get campaign after", f"Status {resp.status}")
                return
            campaign_after = await resp.json()
            collected_after = campaign_after['collected_amount']
            donor_count_after = campaign_after['donor_count']
            print(f"Campaign AFTER: collected={collected_after}, donors={donor_count_after}")
        
        # Verify increments
        collected_diff = collected_after - collected_before
        donor_diff = donor_count_after - donor_count_before
        
        if collected_diff == 50000:
            results.add_pass(f"Campaign collected_amount increased by {collected_diff}")
        else:
            results.add_fail("Campaign collected_amount increment", f"Expected +50000, got +{collected_diff}")
        
        if donor_diff == 1:
            results.add_pass(f"Campaign donor_count increased by {donor_diff}")
        else:
            results.add_fail("Campaign donor_count increment", f"Expected +1, got +{donor_diff}")

async def test_negative_cases():
    """
    TEST 4: NEGATIVE CASES - Verify error handling still works
    """
    print("\n" + "="*80)
    print("TEST 4: NEGATIVE CASES")
    print("="*80)
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Donation with amount < 1000
        async with session.post(f"{BASE_URL}/donations", json={
            "campaign_slug": "paket-sembako-dhuafa-banjarmasin",
            "amount": 500,
            "donor_name": "Test",
            "donor_whatsapp": "08123"
        }) as resp:
            if resp.status == 400:
                results.add_pass("Negative: Donation amount < 1000 returns 400")
            else:
                results.add_fail("Negative: Donation amount < 1000", f"Expected 400, got {resp.status}")
        
        # Test 2: Newsletter with invalid email
        async with session.post(f"{BASE_URL}/newsletter", json={"email": "invalid"}) as resp:
            if resp.status == 400:
                results.add_pass("Negative: Newsletter invalid email returns 400")
            else:
                results.add_fail("Negative: Newsletter invalid email", f"Expected 400, got {resp.status}")
        
        # Test 3: Auth /me without cookie
        async with session.get(f"{BASE_URL}/auth/me") as resp:
            if resp.status == 200:
                body = await resp.json()
                if body.get('user') is None:
                    results.add_pass("Negative: GET /auth/me without cookie returns {user: null}")
                else:
                    results.add_fail("Negative: GET /auth/me without cookie", f"Expected user=null, got {body}")
            else:
                results.add_fail("Negative: GET /auth/me without cookie", f"Expected 200, got {resp.status}")
        
        # Test 4: Auth session without session_id
        async with session.post(f"{BASE_URL}/auth/session", json={}) as resp:
            if resp.status == 400:
                results.add_pass("Negative: POST /auth/session without session_id returns 400")
            else:
                results.add_fail("Negative: POST /auth/session without session_id", f"Expected 400, got {resp.status}")

async def main():
    print("="*80)
    print("YABABERMA Backend API Test Suite")
    print("Focus: MongoDB Connection Race-Condition Fix Verification")
    print("="*80)
    
    # Run all tests
    await test_concurrency_race_condition()
    await test_seeding_integrity()
    await test_donation_flow_regression()
    await test_negative_cases()
    
    # Print summary
    all_passed = results.summary()
    
    if all_passed:
        print("\n🎉 ALL TESTS PASSED - MongoDB race condition fix verified!")
        return 0
    else:
        print("\n⚠️  SOME TESTS FAILED - See details above")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
