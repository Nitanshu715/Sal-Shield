import os
import requests

# Set the path to your actual working directory on D drive
base_dir = r"D:\sal-shield\backend\dataset\healthy"
os.makedirs(base_dir, exist_ok=True)

# Broadened API URL to pull globally/nationally across multiple pages if needed
url = "https://api.inaturalist.org/v1/observations?taxon_id=133379&per_page=200&quality_grade=any"

print("Connecting to iNaturalist to pull healthy Sal tree images...")
try:
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}).json()
    results = response.get('results', [])
    
    if not results:
        print("No results found with primary taxon ID. Trying keyword fallback...")
        fallback_url = "https://api.inaturalist.org/v1/observations?q=Shorea%20robusta&per_page=100"
        response = requests.get(fallback_url, headers={'User-Agent': 'Mozilla/5.0'}).json()
        results = response.get('results', [])

    count = 0
    for obs in results:
        # Check standard photos array
        photos = obs.get('photos', []) or obs.get('observation_photos', [])
        if photos:
            # Handle different nested structures from the API
            photo_obj = photos[0] if isinstance(photos[0], dict) else photos[0].get('photo', {})
            img_url = photo_obj.get('url', '')
            
            if img_url:
                # Upgrade standard thumbnail square URL to medium resolution
                img_url = img_url.replace('square', 'medium')
                try:
                    img_data = requests.get(img_url, timeout=10).content
                    filename = os.path.join(base_dir, f"sal_healthy_{count}.jpg")
                    with open(filename, 'wb') as f:
                        f.write(img_data)
                    count += 1
                    print(f"Downloaded ({count}): {filename}")
                    
                    if count >= 200:  # Cap it once we hit our target
                        break
                except Exception:
                    continue
                    
    print(f"\nDone! Successfully downloaded {count} healthy Sal tree images directly to your D drive folder.")
except Exception as e:
    print(f"Error connecting to API: {e}")