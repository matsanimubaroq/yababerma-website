#!/usr/bin/env python3
"""
Backend testing for YABABERMA admin CMS (Phase 2)
Tests two current_focus tasks:
1. Home slider settings (GET /api/home-settings public, POST /api/admin/home-settings admin)
2. Admin single campaign GET for draft preview (GET /api/admin/campaigns/{id})
"""

import requests
import random
import string

# Configuration
BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"
ADMIN_KEY = "yababerma-admin-2026"
HEADERS_WITH_KEY = {"x-admin-key": ADMIN_KEY}

def generate_random_string(length=8):
    """Generate random string for unique test data"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def test_task1_home_slider_settings():
    """
    TASK 1: Home slider settings (GET /api/home-settings public, POST /api/admin/home-settings admin)
    """
    print("\n" + "="*80)
    print("TASK 1: Home slider settings")
    print("="*80)
    
    try:
        # Test 1.1: GET /api/home-settings (PUBLIC, no key) -> expect 200 with default values
        print("\n[1.1] GET /api/home-settings (PUBLIC, no key) -> expect 200 with default values")
        response = requests.get(f"{BASE_URL}/home-settings")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            # Validate response structure
            if 'slides' in data and 'duration_ms' in data:
                print("✅ PASS: Response has required fields (slides, duration_ms)")
                
                # Validate slides is array
                if isinstance(data['slides'], list):
                    print(f"✅ PASS: slides is array (length: {len(data['slides'])})")
                else:
                    print(f"❌ FAIL: slides should be array, got: {type(data['slides'])}")
                
                # Validate duration_ms is number
                if isinstance(data['duration_ms'], (int, float)):
                    print(f"✅ PASS: duration_ms is number: {data['duration_ms']}")
                    # By default should be 6000
                    if data['duration_ms'] == 6000:
                        print(f"✅ PASS: Default duration_ms is 6000")
                    else:
                        print(f"⚠️  INFO: duration_ms is {data['duration_ms']} (expected default 6000)")
                else:
                    print(f"❌ FAIL: duration_ms should be number, got: {type(data['duration_ms'])}")
            else:
                print(f"❌ FAIL: Response missing required fields. Got: {data.keys()}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
        
        # Test 1.2: POST /api/admin/home-settings WITHOUT x-admin-key -> expect 401
        print("\n[1.2] POST /api/admin/home-settings WITHOUT x-admin-key -> expect 401")
        test_body = {"slides": [], "duration_ms": 6000}
        response = requests.post(f"{BASE_URL}/admin/home-settings", json=test_body)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ PASS: Correctly returns 401 without admin key")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
        
        # Test 1.3: POST /api/admin/home-settings WITH key, body with 2 slides -> expect 200
        print("\n[1.3] POST /api/admin/home-settings WITH key, body with 2 slides -> expect 200")
        slides_body = {
            "slides": [
                {
                    "type": "banner",
                    "image": "/api/media/xyz",
                    "title": "Banner Uji",
                    "subtitle": "sub",
                    "badge": "Info",
                    "link": "https://yababerma.org"
                },
                {
                    "type": "campaign",
                    "slug": "wakaf-al-quran-santri-pelosok",
                    "title": "Wakaf Quran",
                    "subtitle": "desc",
                    "badge": "Wakaf",
                    "link": "/donasi/wakaf-al-quran-santri-pelosok"
                }
            ],
            "duration_ms": 10000
        }
        response = requests.post(f"{BASE_URL}/admin/home-settings", json=slides_body, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {data.keys()}")
            
            # Validate response structure
            if data.get('ok') == True:
                print("✅ PASS: Response has ok:true")
            else:
                print(f"❌ FAIL: Expected ok:true, got: {data.get('ok')}")
            
            # Validate slides array
            if 'slides' in data and isinstance(data['slides'], list):
                print(f"✅ PASS: Response has slides array (length: {len(data['slides'])})")
                
                if len(data['slides']) == 2:
                    print(f"✅ PASS: slides array has 2 items")
                    
                    # Validate each slide has an id field
                    for i, slide in enumerate(data['slides']):
                        if 'id' in slide:
                            print(f"✅ PASS: Slide {i+1} has id field: {slide['id']}")
                        else:
                            print(f"❌ FAIL: Slide {i+1} missing id field")
                        
                        # Validate type field
                        if i == 0 and slide.get('type') == 'banner':
                            print(f"✅ PASS: Slide 1 type is 'banner'")
                        elif i == 1 and slide.get('type') == 'campaign':
                            print(f"✅ PASS: Slide 2 type is 'campaign'")
                        else:
                            print(f"❌ FAIL: Slide {i+1} type is '{slide.get('type')}', expected {'banner' if i == 0 else 'campaign'}")
                else:
                    print(f"❌ FAIL: Expected 2 slides, got {len(data['slides'])}")
            else:
                print(f"❌ FAIL: Response missing slides array")
            
            # Validate duration_ms
            if data.get('duration_ms') == 10000:
                print(f"✅ PASS: duration_ms is 10000")
            else:
                print(f"❌ FAIL: Expected duration_ms 10000, got: {data.get('duration_ms')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
        
        # Test 1.4: GET /api/home-settings (public) again -> expect 200 with persisted slides
        print("\n[1.4] GET /api/home-settings (public) again -> expect 200 with persisted slides")
        response = requests.get(f"{BASE_URL}/home-settings")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: slides count={len(data.get('slides', []))}, duration_ms={data.get('duration_ms')}")
            
            # Validate slides persisted
            if len(data.get('slides', [])) == 2:
                print(f"✅ PASS: 2 slides persisted")
                
                # Validate each slide has id
                for i, slide in enumerate(data['slides']):
                    if 'id' in slide:
                        print(f"✅ PASS: Slide {i+1} has id: {slide['id']}")
                    else:
                        print(f"❌ FAIL: Slide {i+1} missing id")
            else:
                print(f"❌ FAIL: Expected 2 slides, got {len(data.get('slides', []))}")
            
            # Validate duration_ms persisted
            if data.get('duration_ms') == 10000:
                print(f"✅ PASS: duration_ms persisted as 10000")
            else:
                print(f"❌ FAIL: Expected duration_ms 10000, got: {data.get('duration_ms')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 1.5: CLEANUP - POST /api/admin/home-settings WITH key, reset to default
        print("\n[1.5] CLEANUP: POST /api/admin/home-settings WITH key, reset to default")
        reset_body = {"slides": [], "duration_ms": 6000}
        response = requests.post(f"{BASE_URL}/admin/home-settings", json=reset_body, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PASS: Reset successful")
            
            # Verify reset
            response = requests.get(f"{BASE_URL}/home-settings")
            if response.status_code == 200:
                data = response.json()
                if len(data.get('slides', [])) == 0 and data.get('duration_ms') == 6000:
                    print(f"✅ PASS: Verified reset - slides:[], duration_ms:6000")
                else:
                    print(f"⚠️  WARNING: Reset verification - slides:{len(data.get('slides', []))}, duration_ms:{data.get('duration_ms')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        print("\n" + "="*80)
        print("TASK 1 SUMMARY: Home slider settings tests completed")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ EXCEPTION in TASK 1: {str(e)}")
        import traceback
        traceback.print_exc()

def test_task2_admin_campaign_draft_preview():
    """
    TASK 2: Admin single campaign GET for draft preview (GET /api/admin/campaigns/{id})
    """
    print("\n" + "="*80)
    print("TASK 2: Admin single campaign GET for draft preview")
    print("="*80)
    
    created_campaign_id = None
    created_campaign_slug = None
    
    try:
        # Test 2.1: POST /api/admin/campaigns WITH key, create DRAFT (omit published)
        print("\n[2.1] POST /api/admin/campaigns WITH key, create DRAFT -> expect 200")
        random_suffix = generate_random_string()
        campaign_body = {
            "title": f"Draft Preview Test {random_suffix}",
            "category": "sedekah",
            "short_desc": "x"
            # NOTE: omit published field -> defaults to false (draft)
        }
        response = requests.post(f"{BASE_URL}/admin/campaigns", json=campaign_body, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaign = response.json()
            created_campaign_id = campaign.get('id')
            created_campaign_slug = campaign.get('slug')
            print(f"Campaign created:")
            print(f"  id: {created_campaign_id}")
            print(f"  slug: {created_campaign_slug}")
            print(f"  published: {campaign.get('published')}")
            
            # Validate published === false (draft)
            if campaign.get('published') == False:
                print(f"✅ PASS: Campaign is draft (published === false)")
            else:
                print(f"❌ FAIL: Expected published === false, got: {campaign.get('published')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        # Test 2.2: GET /api/admin/campaigns/{id} WITH key -> expect 200 with campaign + recent_donations
        print(f"\n[2.2] GET /api/admin/campaigns/{created_campaign_id} WITH key -> expect 200")
        response = requests.get(f"{BASE_URL}/admin/campaigns/{created_campaign_id}", headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaign = response.json()
            print(f"Campaign fields: {campaign.keys()}")
            
            # Validate campaign fields
            if campaign.get('title'):
                print(f"✅ PASS: Campaign has title: {campaign['title']}")
            else:
                print(f"❌ FAIL: Campaign missing title")
            
            if campaign.get('slug') == created_campaign_slug:
                print(f"✅ PASS: Campaign slug matches: {created_campaign_slug}")
            else:
                print(f"❌ FAIL: Campaign slug mismatch")
            
            if campaign.get('published') == False:
                print(f"✅ PASS: Campaign published === false (draft)")
            else:
                print(f"❌ FAIL: Expected published === false, got: {campaign.get('published')}")
            
            # Validate recent_donations array present
            if 'recent_donations' in campaign:
                if isinstance(campaign['recent_donations'], list):
                    print(f"✅ PASS: recent_donations array present (length: {len(campaign['recent_donations'])})")
                else:
                    print(f"❌ FAIL: recent_donations should be array, got: {type(campaign['recent_donations'])}")
            else:
                print(f"❌ FAIL: recent_donations field missing")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
        
        # Test 2.3: GET /api/admin/campaigns/{id} WITHOUT key -> expect 401
        print(f"\n[2.3] GET /api/admin/campaigns/{created_campaign_id} WITHOUT key -> expect 401")
        response = requests.get(f"{BASE_URL}/admin/campaigns/{created_campaign_id}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"✅ PASS: Correctly returns 401 without admin key")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
        
        # Test 2.4: GET /api/admin/campaigns/{unknown-id} WITH key -> expect 404
        print("\n[2.4] GET /api/admin/campaigns/{unknown-id} WITH key -> expect 404")
        response = requests.get(f"{BASE_URL}/admin/campaigns/unknown-random-id-12345", headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 404:
            print(f"✅ PASS: Correctly returns 404 for unknown campaign ID")
        else:
            print(f"❌ FAIL: Expected 404, got {response.status_code}")
        
        # Test 2.5: Confirm DRAFT stays hidden publicly
        print(f"\n[2.5] Confirm DRAFT stays hidden: GET /api/campaigns/{created_campaign_slug} (public) -> expect 404")
        response = requests.get(f"{BASE_URL}/campaigns/{created_campaign_slug}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 404:
            print(f"✅ PASS: Draft campaign correctly returns 404 on public endpoint")
        else:
            print(f"❌ FAIL: Expected 404 for draft on public endpoint, got {response.status_code}")
        
        # Test 2.6: CLEANUP - DELETE /api/admin/campaigns/{id} WITH key -> 200
        print(f"\n[2.6] CLEANUP: DELETE /api/admin/campaigns/{created_campaign_id} WITH key -> expect 200")
        response = requests.delete(f"{BASE_URL}/admin/campaigns/{created_campaign_id}", headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get('ok') == True and data.get('deleted') == 1:
                print(f"✅ PASS: Campaign deleted successfully")
                created_campaign_id = None  # Mark as cleaned up
            else:
                print(f"⚠️  WARNING: Unexpected delete response: {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 2.7: Confirm public GET /api/campaigns returns exactly 8 campaigns
        print("\n[2.7] Confirm public GET /api/campaigns returns exactly 8 campaigns")
        response = requests.get(f"{BASE_URL}/campaigns")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaigns = response.json()
            print(f"Public campaigns count: {len(campaigns)}")
            
            if len(campaigns) == 8:
                print(f"✅ PASS: Public campaigns count is exactly 8 (baseline intact)")
            else:
                print(f"⚠️  WARNING: Public campaigns count is {len(campaigns)}, expected 8")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        print("\n" + "="*80)
        print("TASK 2 SUMMARY: Admin campaign draft preview tests completed")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ EXCEPTION in TASK 2: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Cleanup on exception
        if created_campaign_id:
            print(f"\nAttempting cleanup: DELETE campaign {created_campaign_id}")
            try:
                requests.delete(f"{BASE_URL}/admin/campaigns/{created_campaign_id}", headers=HEADERS_WITH_KEY)
            except:
                pass

def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("YABABERMA ADMIN CMS (Phase 2) - Backend Testing")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Key: {ADMIN_KEY}")
    print("="*80)
    
    # Run Phase 2 tasks
    test_task1_home_slider_settings()
    test_task2_admin_campaign_draft_preview()
    
    print("\n" + "="*80)
    print("ALL BACKEND TESTS COMPLETED")
    print("="*80)

if __name__ == "__main__":
    main()
