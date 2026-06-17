import os
from PIL import Image

folders = [r'dataset\healthy', r'dataset\stressed', r'dataset\infected']
removed = 0

print("Scanning dataset folders for corrupted or invalid images...")

for folder in folders:
    if not os.path.exists(folder):
        print(f"Skipping missing folder: {folder}")
        continue
        
    print(f"Checking folder: {folder}...")
    for f in os.listdir(folder):
        path = os.path.join(folder, f)
        
        # Skip directories if any accidentally got in
        if os.path.isdir(path):
            continue
            
        try:
            # Try opening and verifying the image structure
            with Image.open(path) as img:
                img.verify()
        except Exception:
            # If PIL handles an UnidentifiedImageError, wipe it out
            try:
                os.remove(path)
                removed += 1
                print(f"   Removed corrupted file: {f}")
            except Exception as e:
                print(f"   Failed to delete {f}: {e}")

print("\n==================================================")
print(f"Done! Removed {removed} bad or corrupted files.")
print("==================================================")