import cv2
import numpy as np
import sys
import urllib.request

image_path = sys.argv[1]

def analyze_sharpness(image_url):
    """Analyze image sharpness using Laplacian variance"""
    try:
        # Download and load image
        resp = urllib.request.urlopen(image_url)
        image = np.asarray(bytearray(resp.read()), dtype="uint8")
        image = cv2.imdecode(image, cv2.IMREAD_COLOR)
        
        if image is None:
            return 50.0  # Default score if image can't be loaded
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate Laplacian variance (measure of sharpness)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        
        # Normalize score (0-100)
        # Higher variance = sharper image
        # Typical values: 0-500 for blurry, 500-2000 for sharp
        score = min(100, max(0, (variance / 20)))  # Scale to 0-100
        
        return score
        
    except Exception as e:
        print(f"Error analyzing sharpness: {e}", file=sys.stderr)
        return 50.0  # Default score on error

# Run analysis
result = analyze_sharpness(image_path)
print(result)
