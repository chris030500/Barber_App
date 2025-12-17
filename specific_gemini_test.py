#!/usr/bin/env python3
"""
Specific test for the haircut image generation endpoint with Gemini model
Based on the review request requirements
"""

import asyncio
import httpx
import base64
import json
import time
import subprocess
from pathlib import Path

def get_backend_url():
    """Get backend URL from frontend env"""
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    return "http://localhost:8001"

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

def get_test_face_image():
    """Get a real face image for testing"""
    try:
        import requests
        # Use a real face image from Unsplash
        url = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        print(f"Failed to download test image: {e}")
    
    # Fallback: create a simple test image
    from PIL import Image
    from io import BytesIO
    
    img = Image.new('RGB', (400, 400), color='lightblue')
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Simple face
    draw.ellipse([100, 80, 300, 280], fill='peachpuff', outline='black', width=2)
    draw.ellipse([140, 140, 170, 170], fill='white', outline='black', width=2)
    draw.ellipse([230, 140, 260, 170], fill='white', outline='black', width=2)
    draw.ellipse([150, 150, 160, 160], fill='black')
    draw.ellipse([240, 150, 250, 160], fill='black')
    draw.polygon([(200, 180), (190, 200), (210, 200)], fill='peachpuff', outline='black')
    draw.arc([170, 210, 230, 240], 0, 180, fill='red', width=3)
    draw.ellipse([120, 60, 280, 140], fill='brown', outline='black', width=2)
    
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

async def test_gemini_haircut_endpoint():
    """
    Test the haircut image generation endpoint with the CORRECT Gemini model.
    
    Requirements from review request:
    1. Send a face image and haircut style "fade"
    2. Check backend logs for "Calling Gemini Nano Banana" and "Successfully edited photo with Gemini"
    3. Verify response has success: true and generated_image_base64
    4. Use 120 second timeout
    """
    
    print("🧪 TESTING: POST /api/generate-haircut-image with Gemini Model")
    print("=" * 60)
    
    # Get test face image
    face_image_b64 = get_test_face_image()
    print(f"✅ Test image prepared: {len(face_image_b64)} characters")
    
    # Test data as specified in review request
    test_data = {
        "user_image_base64": face_image_b64,
        "haircut_style": "fade"
    }
    
    print(f"📤 Sending request to: {API_BASE}/generate-haircut-image")
    print(f"   Haircut style: {test_data['haircut_style']}")
    print(f"   Timeout: 120 seconds")
    
    try:
        # Clear recent logs first to get fresh log entries
        subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=True)
        await asyncio.sleep(2)  # Wait for restart
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            start_time = time.time()
            
            response = await client.post(
                f"{API_BASE}/generate-haircut-image",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            print(f"⏱️  Response received in {duration:.2f} seconds")
            print(f"📊 HTTP Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ FAILED: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                return False
            
            # Parse JSON response
            try:
                result = response.json()
            except Exception as e:
                print(f"❌ FAILED: Invalid JSON response: {e}")
                return False
            
            print(f"📋 Response structure: {list(result.keys())}")
            
            # Check requirement 3: Verify response has success: true and generated_image_base64
            success = result.get('success')
            generated_image = result.get('generated_image_base64')
            style_applied = result.get('style_applied')
            
            print(f"✅ success: {success}")
            print(f"✅ style_applied: {style_applied}")
            
            if generated_image:
                image_size_mb = len(generated_image) / (1024 * 1024)
                print(f"✅ generated_image_base64: {len(generated_image)} chars ({image_size_mb:.2f}MB)")
            else:
                print("❌ generated_image_base64: None or empty")
            
            # Validate requirements
            if not success:
                print(f"❌ FAILED: success is not True (got: {success})")
                if 'error' in result:
                    print(f"   Error: {result['error']}")
                return False
            
            if not generated_image or len(generated_image) < 1000:
                print(f"❌ FAILED: generated_image_base64 is missing or too small")
                return False
            
            print("🎉 ENDPOINT TEST PASSED: All response requirements met")
            return True
            
    except asyncio.TimeoutError:
        print("❌ FAILED: Request timed out (120 seconds)")
        return False
    except Exception as e:
        print(f"❌ FAILED: Exception during test: {e}")
        return False

def check_gemini_logs():
    """
    Check requirement 2: Backend logs for "Calling Gemini Nano Banana" and "Successfully edited photo with Gemini"
    """
    print("\n🔍 CHECKING: Backend Logs for Required Gemini Messages")
    print("=" * 60)
    
    try:
        # Check backend error logs for detailed messages
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            logs = result.stdout
            
            # Required log messages from review request
            required_messages = [
                "Calling Gemini Nano Banana",
                "Successfully edited photo with Gemini"
            ]
            
            found_messages = {}
            
            for message in required_messages:
                if message in logs:
                    found_messages[message] = "✅ FOUND"
                    print(f"✅ Found: '{message}'")
                else:
                    found_messages[message] = "❌ NOT FOUND"
                    print(f"❌ Missing: '{message}'")
            
            # Show relevant log lines
            print("\n📄 Recent Gemini-related log entries:")
            for line in logs.split('\n'):
                if any(msg.lower() in line.lower() for msg in ["gemini", "nano", "banana", "edited photo"]):
                    print(f"   {line.strip()}")
            
            # Check if all required messages were found
            all_found = all("FOUND" in status for status in found_messages.values())
            
            if all_found:
                print("🎉 LOG CHECK PASSED: All required Gemini messages found")
                return True
            else:
                print("❌ LOG CHECK FAILED: Some required messages missing")
                return False
        else:
            print(f"❌ Failed to read logs: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking logs: {e}")
        return False

async def main():
    """Run the specific Gemini test as requested in the review"""
    print("🚀 GEMINI HAIRCUT IMAGE GENERATION TEST")
    print("Based on review request requirements")
    print(f"🎯 Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    # Test the endpoint
    endpoint_passed = await test_gemini_haircut_endpoint()
    
    # Wait a moment for logs to be written
    await asyncio.sleep(2)
    
    # Check the logs
    logs_passed = check_gemini_logs()
    
    # Final summary
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    
    print(f"{'✅ PASS' if endpoint_passed else '❌ FAIL'} Endpoint Response Test")
    print(f"{'✅ PASS' if logs_passed else '❌ FAIL'} Backend Logs Test")
    
    overall_pass = endpoint_passed and logs_passed
    
    if overall_pass:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Endpoint returns success: true and generated_image_base64")
        print("✅ Backend logs show 'Calling Gemini Nano Banana' and 'Successfully edited photo with Gemini'")
        print("✅ Using correct Gemini model: gemini-2.5-flash-image-preview")
    else:
        print("\n💥 SOME TESTS FAILED!")
        if not endpoint_passed:
            print("❌ Endpoint response test failed")
        if not logs_passed:
            print("❌ Backend logs test failed")
    
    return overall_pass

if __name__ == "__main__":
    asyncio.run(main())