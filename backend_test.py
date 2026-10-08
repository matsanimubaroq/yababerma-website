#!/usr/bin/env python3
"""
Backend testing for YABABERMA admin CMS (Phase 1)
Tests three current_focus tasks:
1. Media upload & serve
2. Program/Campaign CMS CRUD
3. Public published filter + manual campaign numbers
"""

import requests
import io
import random
import string
from PIL import Image

# Configuration
BASE_URL = "https://yababerma-donasi.preview.emergentagent.com/api"
ADMIN_KEY = "yababerma-admin-2026"
HEADERS_WITH_KEY = {"x-admin-key": ADMIN_KEY}

def generate_random_string(length=8):
    """Generate random string for unique test data"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def create_small_png():
    """Create a small valid PNG image (10x10 colored square)"""
    img = Image.new('RGB', (10, 10), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf

def create_small_pdf():
    """Create a minimal valid PDF"""
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF
"""
    return io.BytesIO(pdf_content)

def test_task1_media_upload_and_serve():
    """
    TASK 1: Media upload & serve (POST /api/admin/upload, GET /api/media/{id})
    """
    print("\n" + "="*80)
    print("TASK 1: Media upload & serve")
    print("="*80)
    
    media_ids_to_cleanup = []
    
    try:
        # Test 1.1: POST /api/admin/upload WITHOUT x-admin-key -> expect 401
        print("\n[1.1] POST /api/admin/upload WITHOUT x-admin-key -> expect 401")
        png_buf = create_small_png()
        files = {'file': ('test.png', png_buf, 'image/png')}
        response = requests.post(f"{BASE_URL}/admin/upload", files=files)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ PASS: Correctly returns 401 without admin key")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
        
        # Test 1.2: POST /api/admin/upload WITH key, PNG image -> expect 200
        print("\n[1.2] POST /api/admin/upload WITH key, PNG image -> expect 200")
        png_buf = create_small_png()
        files = {'file': ('test.png', png_buf, 'image/png')}
        response = requests.post(f"{BASE_URL}/admin/upload", files=files, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            # Validate response structure
            if all(k in data for k in ['ok', 'id', 'url', 'filename', 'content_type', 'size']):
                print("✅ PASS: Response has all required fields")
                
                # Validate url format
                if data['url'].startswith('/api/media/'):
                    print(f"✅ PASS: URL format correct: {data['url']}")
                    media_ids_to_cleanup.append(data['id'])
                    png_media_url = data['url']
                    png_media_id = data['id']
                else:
                    print(f"❌ FAIL: URL should start with '/api/media/', got: {data['url']}")
                    return
                
                # Validate content_type
                if data['content_type'] == 'image/png':
                    print(f"✅ PASS: Content-Type is image/png")
                else:
                    print(f"⚠️  WARNING: Content-Type is {data['content_type']}, expected image/png")
                
                # Test 1.3: GET the returned url (public, no key) -> expect 200 with image/png
                print(f"\n[1.3] GET {png_media_url} (public, no key) -> expect 200 with image/png")
                response = requests.get(f"{BASE_URL.replace('/api', '')}{png_media_url}")
                print(f"Status: {response.status_code}")
                print(f"Content-Type: {response.headers.get('Content-Type')}")
                print(f"Content-Length: {len(response.content)}")
                
                if response.status_code == 200:
                    if 'image/png' in response.headers.get('Content-Type', ''):
                        if len(response.content) > 0:
                            print("✅ PASS: Media served correctly with image/png and non-empty body")
                        else:
                            print("❌ FAIL: Response body is empty")
                    else:
                        print(f"❌ FAIL: Expected Content-Type image/png, got {response.headers.get('Content-Type')}")
                else:
                    print(f"❌ FAIL: Expected 200, got {response.status_code}")
            else:
                print(f"❌ FAIL: Response missing required fields. Got: {data.keys()}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        # Test 1.4: POST /api/admin/upload WITH key, PDF file -> expect 200
        print("\n[1.4] POST /api/admin/upload WITH key, PDF file -> expect 200")
        pdf_buf = create_small_pdf()
        files = {'file': ('test.pdf', pdf_buf, 'application/pdf')}
        response = requests.post(f"{BASE_URL}/admin/upload", files=files, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get('url', '').startswith('/api/media/'):
                print(f"✅ PASS: PDF uploaded successfully, URL: {data['url']}")
                media_ids_to_cleanup.append(data['id'])
                pdf_media_url = data['url']
                
                # GET the PDF url -> expect 200 with application/pdf
                print(f"\n[1.4b] GET {pdf_media_url} -> expect 200 with application/pdf")
                response = requests.get(f"{BASE_URL.replace('/api', '')}{pdf_media_url}")
                print(f"Status: {response.status_code}")
                print(f"Content-Type: {response.headers.get('Content-Type')}")
                print(f"Content-Length: {len(response.content)}")
                
                if response.status_code == 200:
                    if 'application/pdf' in response.headers.get('Content-Type', ''):
                        if len(response.content) > 0:
                            print("✅ PASS: PDF served correctly with application/pdf and non-empty body")
                        else:
                            print("❌ FAIL: Response body is empty")
                    else:
                        print(f"❌ FAIL: Expected Content-Type application/pdf, got {response.headers.get('Content-Type')}")
                else:
                    print(f"❌ FAIL: Expected 200, got {response.status_code}")
            else:
                print(f"❌ FAIL: Invalid URL format: {data.get('url')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
        
        # Test 1.5: POST >10MB file -> expect 400 (optional, skipping to avoid large file generation)
        print("\n[1.5] POST >10MB file -> expect 400 (SKIPPED - not feasible to generate large file)")
        print("⚠️  SKIPPED: Size guard test not performed")
        
        print("\n" + "="*80)
        print("TASK 1 SUMMARY: Media upload & serve tests completed")
        print(f"Media IDs created (for cleanup): {media_ids_to_cleanup}")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ EXCEPTION in TASK 1: {str(e)}")
        import traceback
        traceback.print_exc()

def test_task2_campaign_cms_crud():
    """
    TASK 2: Program/Campaign CMS CRUD
    """
    print("\n" + "="*80)
    print("TASK 2: Program/Campaign CMS CRUD")
    print("="*80)
    
    created_campaign_id = None
    created_campaign_slug = None
    
    try:
        # Test 2.1: GET /api/admin/campaigns WITHOUT key -> 401
        print("\n[2.1] GET /api/admin/campaigns WITHOUT key -> expect 401")
        response = requests.get(f"{BASE_URL}/admin/campaigns")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ PASS: Correctly returns 401 without admin key")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
        
        # Test 2.1b: GET /api/admin/campaigns WITH key -> 200 array
        print("\n[2.1b] GET /api/admin/campaigns WITH key -> expect 200 array")
        response = requests.get(f"{BASE_URL}/admin/campaigns", headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            campaigns = response.json()
            print(f"✅ PASS: Returns {len(campaigns)} campaigns (includes all campaigns)")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 2.2: POST /api/admin/campaigns WITH key (omit published) -> expect 200 with draft
        print("\n[2.2] POST /api/admin/campaigns WITH key (omit published) -> expect 200")
        random_suffix = generate_random_string()
        campaign_body = {
            "title": f"Test Program CMS {random_suffix}",
            "category": "wakaf",
            "short_desc": "desc",
            "story": "Para 1\nPara 2",
            "target_amount": 1000000,
            "collected_amount": 250000,
            "donor_count": 12,
            "video_url": "https://youtu.be/dQw4w9WgXcQ"
            # NOTE: omit published field
        }
        response = requests.post(f"{BASE_URL}/admin/campaigns", json=campaign_body, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaign = response.json()
            print(f"Response keys: {campaign.keys()}")
            
            # Validate slug is generated and non-empty
            if campaign.get('slug'):
                print(f"✅ PASS: Slug generated: {campaign['slug']}")
                created_campaign_slug = campaign['slug']
                created_campaign_id = campaign.get('id')
            else:
                print(f"❌ FAIL: Slug is empty or missing")
            
            # Validate published === false (draft)
            if campaign.get('published') == False:
                print(f"✅ PASS: published === false (draft)")
            else:
                print(f"❌ FAIL: published should be false, got: {campaign.get('published')}")
            
            # Validate story is stored as ARRAY of 2 items
            if isinstance(campaign.get('story'), list):
                if len(campaign['story']) == 2:
                    print(f"✅ PASS: story stored as array with 2 items: {campaign['story']}")
                else:
                    print(f"⚠️  WARNING: story is array but has {len(campaign['story'])} items, expected 2")
            else:
                print(f"❌ FAIL: story should be array, got: {type(campaign.get('story'))}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        # Test 2.3: DRAFT HIDDEN - GET /api/campaigns (public) must NOT contain the new slug
        print(f"\n[2.3] DRAFT HIDDEN: GET /api/campaigns (public) must NOT contain slug '{created_campaign_slug}'")
        response = requests.get(f"{BASE_URL}/campaigns")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaigns = response.json()
            slugs = [c.get('slug') for c in campaigns]
            print(f"Public campaigns count: {len(campaigns)}")
            
            if created_campaign_slug not in slugs:
                print(f"✅ PASS: Draft campaign NOT in public list (as expected)")
            else:
                print(f"❌ FAIL: Draft campaign SHOULD NOT be in public list")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 2.3b: GET /api/campaigns/{slug} (public) must return 404 for draft
        print(f"\n[2.3b] GET /api/campaigns/{created_campaign_slug} (public) -> expect 404 for draft")
        response = requests.get(f"{BASE_URL}/campaigns/{created_campaign_slug}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 404:
            print(f"✅ PASS: Draft campaign returns 404 (as expected)")
        else:
            print(f"❌ FAIL: Expected 404 for draft, got {response.status_code}")
        
        # Test 2.4: POST /api/admin/campaigns WITH key but NO title -> expect 400
        print("\n[2.4] POST /api/admin/campaigns WITH key but NO title -> expect 400")
        response = requests.post(f"{BASE_URL}/admin/campaigns", json={"category": "sedekah"}, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 400:
            print(f"✅ PASS: Correctly returns 400 when title is missing")
        else:
            print(f"❌ FAIL: Expected 400, got {response.status_code}")
        
        # Test 2.5: PUT /api/admin/campaigns/{id} WITH key, body {"published":true} -> 200
        print(f"\n[2.5] PUT /api/admin/campaigns/{created_campaign_id} WITH key, publish it -> expect 200")
        response = requests.put(f"{BASE_URL}/admin/campaigns/{created_campaign_id}", json={"published": True}, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaign = response.json()
            if campaign.get('published') == True:
                print(f"✅ PASS: Campaign published successfully")
            else:
                print(f"❌ FAIL: published should be true, got: {campaign.get('published')}")
            
            # Now GET /api/campaigns (public) MUST contain the slug
            print(f"\n[2.5b] GET /api/campaigns (public) MUST now contain slug '{created_campaign_slug}'")
            response = requests.get(f"{BASE_URL}/campaigns")
            
            if response.status_code == 200:
                campaigns = response.json()
                slugs = [c.get('slug') for c in campaigns]
                
                if created_campaign_slug in slugs:
                    print(f"✅ PASS: Published campaign NOW in public list")
                else:
                    print(f"❌ FAIL: Published campaign SHOULD be in public list")
            
            # GET /api/campaigns/{slug} MUST return 200 with video_url and story array
            print(f"\n[2.5c] GET /api/campaigns/{created_campaign_slug} MUST return 200")
            response = requests.get(f"{BASE_URL}/campaigns/{created_campaign_slug}")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                campaign = response.json()
                if campaign.get('video_url'):
                    print(f"✅ PASS: video_url present: {campaign['video_url']}")
                else:
                    print(f"⚠️  WARNING: video_url missing")
                
                if isinstance(campaign.get('story'), list) and len(campaign['story']) == 2:
                    print(f"✅ PASS: story array length 2")
                else:
                    print(f"⚠️  WARNING: story array length is {len(campaign.get('story', []))}")
            else:
                print(f"❌ FAIL: Expected 200, got {response.status_code}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 2.6: PUT /api/admin/campaigns/{unknown-id} -> expect 404
        print("\n[2.6] PUT /api/admin/campaigns/{unknown-id} -> expect 404")
        response = requests.put(f"{BASE_URL}/admin/campaigns/unknown-id-12345", json={"published": True}, headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 404:
            print(f"✅ PASS: Correctly returns 404 for unknown campaign ID")
        else:
            print(f"❌ FAIL: Expected 404, got {response.status_code}")
        
        # Test 2.7: DELETE /api/admin/campaigns/{id} WITH key -> 200 {ok:true, deleted:1}
        print(f"\n[2.7] DELETE /api/admin/campaigns/{created_campaign_id} WITH key -> expect 200")
        response = requests.delete(f"{BASE_URL}/admin/campaigns/{created_campaign_id}", headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if data.get('ok') == True and data.get('deleted') == 1:
                print(f"✅ PASS: Campaign deleted successfully")
                created_campaign_id = None  # Mark as cleaned up
            else:
                print(f"❌ FAIL: Expected {{ok:true, deleted:1}}, got: {data}")
            
            # Confirm GET /api/campaigns no longer contains the slug
            print(f"\n[2.7b] Confirm GET /api/campaigns no longer contains slug '{created_campaign_slug}'")
            response = requests.get(f"{BASE_URL}/campaigns")
            
            if response.status_code == 200:
                campaigns = response.json()
                slugs = [c.get('slug') for c in campaigns]
                
                if created_campaign_slug not in slugs:
                    print(f"✅ PASS: Deleted campaign NOT in public list")
                else:
                    print(f"❌ FAIL: Deleted campaign SHOULD NOT be in public list")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # CLEANUP: Ensure public GET /api/campaigns returns exactly 8
        print("\n[2.8] CLEANUP: Ensure GET /api/campaigns returns exactly 8")
        response = requests.get(f"{BASE_URL}/campaigns")
        
        if response.status_code == 200:
            campaigns = response.json()
            print(f"Public campaigns count: {len(campaigns)}")
            
            if len(campaigns) == 8:
                print(f"✅ PASS: Public campaigns count is exactly 8 (baseline restored)")
            else:
                print(f"⚠️  WARNING: Public campaigns count is {len(campaigns)}, expected 8")
        
        print("\n" + "="*80)
        print("TASK 2 SUMMARY: Campaign CMS CRUD tests completed")
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

def test_task3_manual_numbers():
    """
    TASK 3: Public published filter + MANUAL numbers (no auto-increment)
    """
    print("\n" + "="*80)
    print("TASK 3: Public published filter + MANUAL numbers")
    print("="*80)
    
    donation_id = None
    
    try:
        # Test 3.1: GET /api/campaigns -> expect exactly 8 published campaigns
        print("\n[3.1] GET /api/campaigns -> expect exactly 8 published campaigns")
        response = requests.get(f"{BASE_URL}/campaigns")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaigns = response.json()
            print(f"Public campaigns count: {len(campaigns)}")
            
            if len(campaigns) == 8:
                print(f"✅ PASS: Exactly 8 published campaigns (seeded ones with no published field still show)")
            else:
                print(f"❌ FAIL: Expected 8 campaigns, got {len(campaigns)}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 3.2: Pick an existing campaign, capture numbers, POST donation, confirm UNCHANGED
        print("\n[3.2] Pick campaign 'paket-sembako-dhuafa-banjarmasin', test MANUAL numbers")
        campaign_slug = "paket-sembako-dhuafa-banjarmasin"
        
        # Get campaign BEFORE donation
        response = requests.get(f"{BASE_URL}/campaigns/{campaign_slug}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            campaign_before = response.json()
            collected_before = campaign_before.get('collected_amount')
            donor_count_before = campaign_before.get('donor_count')
            print(f"Campaign BEFORE donation:")
            print(f"  collected_amount: {collected_before}")
            print(f"  donor_count: {donor_count_before}")
            
            # POST donation
            print(f"\n[3.2b] POST /api/donations to '{campaign_slug}' with amount=50000")
            donation_body = {
                "campaign_slug": campaign_slug,
                "amount": 50000,
                "donor_name": "Tester Manual",
                "donor_whatsapp": "08123456789",
                "message": "",
                "payment_method": "bsi"
            }
            response = requests.post(f"{BASE_URL}/donations", json=donation_body)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                donation = response.json()
                donation_id = donation.get('id')
                print(f"Donation created:")
                print(f"  id: {donation_id}")
                print(f"  unique_code: {donation.get('unique_code')}")
                print(f"  total_amount: {donation.get('total_amount')}")
                print(f"  status: {donation.get('status')}")
                
                # Validate unique_code is 100-999
                unique_code = donation.get('unique_code')
                if 100 <= unique_code <= 999:
                    print(f"✅ PASS: unique_code {unique_code} is in range 100-999")
                else:
                    print(f"❌ FAIL: unique_code {unique_code} is NOT in range 100-999")
                
                # Validate total_amount = amount + unique_code
                expected_total = 50000 + unique_code
                if donation.get('total_amount') == expected_total:
                    print(f"✅ PASS: total_amount {donation.get('total_amount')} = amount + unique_code")
                else:
                    print(f"❌ FAIL: total_amount should be {expected_total}, got {donation.get('total_amount')}")
                
                # Validate status = pending
                if donation.get('status') == 'pending':
                    print(f"✅ PASS: status is 'pending'")
                else:
                    print(f"❌ FAIL: status should be 'pending', got {donation.get('status')}")
                
                # Get campaign AFTER donation
                print(f"\n[3.2c] GET /api/campaigns/{campaign_slug} AFTER donation")
                response = requests.get(f"{BASE_URL}/campaigns/{campaign_slug}")
                
                if response.status_code == 200:
                    campaign_after = response.json()
                    collected_after = campaign_after.get('collected_amount')
                    donor_count_after = campaign_after.get('donor_count')
                    print(f"Campaign AFTER donation:")
                    print(f"  collected_amount: {collected_after}")
                    print(f"  donor_count: {donor_count_after}")
                    
                    # Confirm UNCHANGED (manual mode)
                    if collected_after == collected_before and donor_count_after == donor_count_before:
                        print(f"✅ PASS: Campaign numbers UNCHANGED (manual mode working)")
                    else:
                        print(f"❌ FAIL: Campaign numbers CHANGED (should be manual mode)")
                        print(f"  collected_amount: {collected_before} -> {collected_after}")
                        print(f"  donor_count: {donor_count_before} -> {donor_count_after}")
                else:
                    print(f"❌ FAIL: Expected 200, got {response.status_code}")
            else:
                print(f"❌ FAIL: Expected 200, got {response.status_code}")
                print(f"Response: {response.text}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 3.3: POST /api/admin/delete -> expect 200 {deleted:1, reverted:0}
        if donation_id:
            print(f"\n[3.3] POST /api/admin/delete with donation_id={donation_id}")
            delete_body = {
                "collection": "donations",
                "ids": [donation_id]
            }
            response = requests.post(f"{BASE_URL}/admin/delete", json=delete_body, headers=HEADERS_WITH_KEY)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {data}")
                
                if data.get('deleted') == 1 and data.get('reverted') == 0:
                    print(f"✅ PASS: Donation deleted with reverted=0 (manual mode)")
                    donation_id = None  # Mark as cleaned up
                else:
                    print(f"❌ FAIL: Expected {{deleted:1, reverted:0}}, got: {data}")
                
                # Confirm campaign numbers STILL unchanged
                print(f"\n[3.3b] Confirm campaign numbers STILL unchanged after delete")
                response = requests.get(f"{BASE_URL}/campaigns/{campaign_slug}")
                
                if response.status_code == 200:
                    campaign_final = response.json()
                    collected_final = campaign_final.get('collected_amount')
                    donor_count_final = campaign_final.get('donor_count')
                    print(f"Campaign AFTER delete:")
                    print(f"  collected_amount: {collected_final}")
                    print(f"  donor_count: {donor_count_final}")
                    
                    if collected_final == collected_before and donor_count_final == donor_count_before:
                        print(f"✅ PASS: Campaign numbers STILL unchanged (manual mode working)")
                    else:
                        print(f"❌ FAIL: Campaign numbers changed after delete")
            else:
                print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # Test 3.4: Quick regression - zero 500s
        print("\n[3.4] Quick regression: GET /api/kurban/quota, /api/prayers, /api/admin/summary")
        
        # GET /api/kurban/quota (3 options)
        print("\n[3.4a] GET /api/kurban/quota -> expect 200 with 3 options")
        response = requests.get(f"{BASE_URL}/kurban/quota")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            options = data.get('options', [])
            print(f"Kurban options count: {len(options)}")
            
            if len(options) == 3:
                print(f"✅ PASS: Kurban quota returns 3 options")
            else:
                print(f"❌ FAIL: Expected 3 options, got {len(options)}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # GET /api/prayers (>=8 items)
        print("\n[3.4b] GET /api/prayers -> expect 200 with >=8 items")
        response = requests.get(f"{BASE_URL}/prayers")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            prayers = response.json()
            print(f"Prayers count: {len(prayers)}")
            
            if len(prayers) >= 8:
                print(f"✅ PASS: Prayers returns >= 8 items")
            else:
                print(f"❌ FAIL: Expected >= 8 items, got {len(prayers)}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        # GET /api/admin/summary with key (200)
        print("\n[3.4c] GET /api/admin/summary with x-admin-key -> expect 200")
        response = requests.get(f"{BASE_URL}/admin/summary", headers=HEADERS_WITH_KEY)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Admin summary keys: {data.keys()}")
            print(f"✅ PASS: Admin summary returns 200")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
        
        print("\n" + "="*80)
        print("TASK 3 SUMMARY: Manual numbers tests completed")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ EXCEPTION in TASK 3: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Cleanup on exception
        if donation_id:
            print(f"\nAttempting cleanup: DELETE donation {donation_id}")
            try:
                delete_body = {"collection": "donations", "ids": [donation_id]}
                requests.post(f"{BASE_URL}/admin/delete", json=delete_body, headers=HEADERS_WITH_KEY)
            except:
                pass

def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("YABABERMA ADMIN CMS (Phase 1) - Backend Testing")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Key: {ADMIN_KEY}")
    print("="*80)
    
    # Run all three tasks
    test_task1_media_upload_and_serve()
    test_task2_campaign_cms_crud()
    test_task3_manual_numbers()
    
    print("\n" + "="*80)
    print("ALL BACKEND TESTS COMPLETED")
    print("="*80)

if __name__ == "__main__":
    main()
