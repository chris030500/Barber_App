#!/usr/bin/env python3
"""
Backend API Testing Suite for BarberShop App
Focus: Testing updated haircut image generation endpoint with GEMINI NANO BANANA
"""

import asyncio
import httpx
import base64
import json
import os
import time
from io import BytesIO
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get backend URL from frontend env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

def create_test_face_image():
    """Create a simple test face image as base64"""
    try:
        # Create a simple test image with some visual features
        img = Image.new('RGB', (400, 400), color='lightblue')
        
        # Add some basic features to make it look like a face
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Face outline (circle)
        draw.ellipse([100, 80, 300, 280], fill='peachpuff', outline='black', width=2)
        
        # Eyes
        draw.ellipse([140, 140, 170, 170], fill='white', outline='black', width=2)
        draw.ellipse([230, 140, 260, 170], fill='white', outline='black', width=2)
        draw.ellipse([150, 150, 160, 160], fill='black')  # Left pupil
        draw.ellipse([240, 150, 250, 160], fill='black')  # Right pupil
        
        # Nose
        draw.polygon([(200, 180), (190, 200), (210, 200)], fill='peachpuff', outline='black')
        
        # Mouth
        draw.arc([170, 210, 230, 240], 0, 180, fill='red', width=3)
        
        # Hair area (this is what should be modified)
        draw.ellipse([120, 60, 280, 140], fill='brown', outline='black', width=2)
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')
        
    except Exception as e:
        logger.error(f"Error creating test image: {e}")
        # Fallback: download a real face image
        return download_test_face_image()

def download_test_face_image():
    """Download a real face image for testing"""
    try:
        import requests
        url = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        logger.error(f"Error downloading test image: {e}")
    
    # Ultimate fallback: create minimal valid image
    img = Image.new('RGB', (200, 200), color='lightgray')
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

async def test_generate_haircut_image_gemini():
    """Test the updated generate-haircut-image endpoint with Gemini Nano Banana"""
    logger.info("🧪 Testing POST /api/generate-haircut-image with Gemini Nano Banana")
    
    try:
        # Create test image
        test_image_b64 = create_test_face_image()
        logger.info(f"Created test image, size: {len(test_image_b64)} characters")
        
        # Test data
        test_data = {
            "user_image_base64": test_image_b64,
            "haircut_style": "fade"
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info("Sending request to generate-haircut-image endpoint...")
            start_time = time.time()
            
            response = await client.post(
                f"{API_BASE}/generate-haircut-image",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            end_time = time.time()
            duration = end_time - start_time
            
            logger.info(f"Response received in {duration:.2f} seconds")
            logger.info(f"Status Code: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"❌ FAILED: HTTP {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
            
            # Parse response
            try:
                data = response.json()
            except Exception as e:
                logger.error(f"❌ FAILED: Invalid JSON response: {e}")
                return False
            
            # Validate response structure
            required_fields = ['success', 'generated_image_base64', 'style_applied']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                logger.error(f"❌ FAILED: Missing fields: {missing_fields}")
                return False
            
            # Check success status
            if not data.get('success'):
                logger.error(f"❌ FAILED: success=false, error: {data.get('error', 'Unknown error')}")
                return False
            
            # Validate generated image
            generated_image = data.get('generated_image_base64')
            if not generated_image or len(generated_image) < 1000:
                logger.error(f"❌ FAILED: Invalid or too small generated image: {len(generated_image) if generated_image else 0} chars")
                return False
            
            # Validate style applied
            style_applied = data.get('style_applied')
            if style_applied != 'fade':
                logger.error(f"❌ FAILED: Wrong style applied: {style_applied}, expected: fade")
                return False
            
            # Log success details
            image_size_mb = len(generated_image) / (1024 * 1024)
            logger.info(f"✅ PASSED: Generate Haircut Image endpoint working correctly")
            logger.info(f"  - success: {data['success']}")
            logger.info(f"  - generated_image_base64: {len(generated_image)} chars ({image_size_mb:.2f}MB)")
            logger.info(f"  - style_applied: {style_applied}")
            logger.info(f"  - processing_time: {duration:.2f}s")
            
            return True
            
    except asyncio.TimeoutError:
        logger.error("❌ FAILED: Request timeout (120s)")
        return False
    except Exception as e:
        logger.error(f"❌ FAILED: Exception during test: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def test_multiple_haircut_styles():
    """Test multiple haircut styles to ensure Gemini works with different styles"""
    logger.info("🧪 Testing multiple haircut styles with Gemini")
    
    styles_to_test = ["fade", "undercut", "pompadour"]
    test_image_b64 = create_test_face_image()
    
    results = {}
    
    for style in styles_to_test:
        logger.info(f"Testing style: {style}")
        
        try:
            test_data = {
                "user_image_base64": test_image_b64,
                "haircut_style": style
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{API_BASE}/generate-haircut-image",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('generated_image_base64'):
                        results[style] = "✅ PASSED"
                        logger.info(f"  {style}: SUCCESS")
                    else:
                        results[style] = f"❌ FAILED: {data.get('error', 'Unknown error')}"
                        logger.error(f"  {style}: FAILED - {data.get('error')}")
                else:
                    results[style] = f"❌ FAILED: HTTP {response.status_code}"
                    logger.error(f"  {style}: FAILED - HTTP {response.status_code}")
                    
        except Exception as e:
            results[style] = f"❌ FAILED: {str(e)}"
            logger.error(f"  {style}: FAILED - {str(e)}")
    
    # Summary
    passed = sum(1 for result in results.values() if "PASSED" in result)
    total = len(results)
    
    logger.info(f"Multiple styles test: {passed}/{total} passed")
    for style, result in results.items():
        logger.info(f"  {style}: {result}")
    
    return passed == total

async def check_backend_logs_for_gemini():
    """Check backend logs for Gemini-specific messages"""
    logger.info("🧪 Checking backend logs for Gemini messages")
    
    try:
        import subprocess
        
        # Check supervisor logs for backend
        result = subprocess.run(
            ["tail", "-n", "100", "/var/log/supervisor/backend.out.log"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            logs = result.stdout
            
            # Look for Gemini-specific log messages
            gemini_messages = [
                "Calling Gemini Nano Banana",
                "Successfully edited photo with Gemini",
                "Gemini response - Text:",
                "Gemini response - Images:"
            ]
            
            found_messages = []
            for message in gemini_messages:
                if message in logs:
                    found_messages.append(message)
            
            if found_messages:
                logger.info(f"✅ Found Gemini log messages: {found_messages}")
                return True
            else:
                logger.warning("⚠️  No Gemini-specific log messages found in recent logs")
                logger.info("Recent backend logs:")
                for line in logs.split('\n')[-20:]:  # Show last 20 lines
                    if line.strip():
                        logger.info(f"  {line}")
                return False
        else:
            logger.error(f"Failed to read backend logs: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Error checking backend logs: {e}")
        return False

async def test_api_health():
    """Test basic API health"""
    logger.info("🧪 Testing API health")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{API_BASE}/")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ API Health: {data}")
                return True
            else:
                logger.error(f"❌ API Health failed: HTTP {response.status_code}")
                return False
                
    except Exception as e:
        logger.error(f"❌ API Health failed: {e}")
        return False

async def main():
    """Run all backend tests"""
    logger.info("=" * 60)
    logger.info("🚀 BACKEND TESTING SUITE - GEMINI HAIRCUT IMAGE GENERATION")
    logger.info("=" * 60)
    logger.info(f"Backend URL: {BASE_URL}")
    logger.info(f"API Base: {API_BASE}")
    
    tests = [
        ("API Health Check", test_api_health),
        ("Generate Haircut Image (Gemini)", test_generate_haircut_image_gemini),
        ("Multiple Haircut Styles", test_multiple_haircut_styles),
        ("Backend Logs Check", check_backend_logs_for_gemini),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        logger.info(f"\n📋 Running: {test_name}")
        try:
            result = await test_func()
            results[test_name] = "✅ PASSED" if result else "❌ FAILED"
        except Exception as e:
            logger.error(f"❌ Test '{test_name}' failed with exception: {e}")
            results[test_name] = f"❌ FAILED: {str(e)}"
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 TEST RESULTS SUMMARY")
    logger.info("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        logger.info(f"{result} {test_name}")
        if "PASSED" in result:
            passed += 1
    
    logger.info(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 ALL TESTS PASSED!")
        return True
    else:
        logger.error(f"💥 {total - passed} TESTS FAILED!")
        return False

if __name__ == "__main__":
    asyncio.run(main())