import cv2
import numpy as np
import sys
import urllib.request

image_path = sys.argv[1]

def analyze_exposure(image_url):
    resp = urllib.request.urlopen(image_url)
    image = np.asarray(bytearray(resp.read()), dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    
    # 2. Calculate average brightness (0-255)
    avg_brightness = np.mean(image)

    # 3. Calculate histogram (pixel intensity distribution)
    hist = cv2.calcHist([image], [0], None, [256], [0,256])

    # 4. Detect shadows (pixels below threshold, e.g. 40)
    shadow_threshold = 40
    shadow_pixels = np.sum(image < shadow_threshold)
    shadow_ratio = shadow_pixels / image.size

    # 5. Detect highlights (pixels above threshold, e.g. 220)
    highlight_threshold = 220
    highlight_pixels = np.sum(image > highlight_threshold)
    highlight_ratio = highlight_pixels / image.size

    score = 100 - abs(avg_brightness - 127.5)  # penalize darkness/brightness
    score -= shadow_ratio * 50                 # penalize heavy shadows
    score -= highlight_ratio * 50              # penalize overexposed regions
    score = max(0, min(score, 100))            # clamp to 0-100

    return score

# Usage


result = analyze_exposure(image_path)
print(result)
