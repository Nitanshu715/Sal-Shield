"""
SAL-SHIELD Dataset Builder
Automatically downloads tree health images from iNaturalist API

Usage:
    pip install requests pillow
    python collect_dataset.py

This builds the dataset/ folder structure needed by train_model.py
"""

import os
import time
import json
import requests
from pathlib import Path
from PIL import Image
from io import BytesIO

DATASET_DIR = Path('dataset')
CLASSES = {
    'healthy': [
        # iNaturalist search terms for healthy Sal trees
        'Shorea robusta',
        'Shorea robusta tree',
    ],
    'infected': [
        # Bark beetle damage — visually similar to Sal borer
        'Hoplocerambyx spinicornis',
        'bark beetle damage tree',
        'Cerambycidae bark damage',
    ],
    'stressed': [
        # Stressed / yellowing forest trees
        'tree canopy stress',
        'forest disease tree',
    ]
}

TARGET_PER_CLASS = 150   # images to collect per class
IMG_SIZE = 256           # save at this resolution

def download_inaturalist(taxon_name, label, max_results=50):
    """Download observation photos from iNaturalist API"""
    print(f"  Fetching '{taxon_name}' from iNaturalist...")
    save_dir = DATASET_DIR / label
    save_dir.mkdir(parents=True, exist_ok=True)

    page = 1
    downloaded = 0
    existing = len(list(save_dir.glob('*.jpg')))

    while downloaded < max_results:
        url = "https://api.inaturalist.org/v1/observations"
        params = {
            'q': taxon_name,
            'has[]': 'photos',
            'quality_grade': 'research',
            'per_page': 30,
            'page': page,
            'order': 'desc',
            'order_by': 'votes'
        }
        try:
            resp = requests.get(url, params=params, timeout=15)
            data = resp.json()
        except Exception as e:
            print(f"    API error: {e}")
            break

        results = data.get('results', [])
        if not results:
            break

        for obs in results:
            photos = obs.get('photos', [])
            if not photos:
                continue
            photo_url = photos[0].get('url', '')
            if not photo_url:
                continue
            # Get medium size
            photo_url = photo_url.replace('square', 'medium')
            fname = save_dir / f"{label}_{existing + downloaded:04d}.jpg"
            if fname.exists():
                downloaded += 1
                continue
            try:
                img_resp = requests.get(photo_url, timeout=10)
                img = Image.open(BytesIO(img_resp.content)).convert('RGB')
                img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
                img.save(fname, 'JPEG', quality=90)
                downloaded += 1
                if downloaded % 10 == 0:
                    print(f"    {label}: {existing + downloaded} images")
                time.sleep(0.3)  # be polite to API
            except Exception as e:
                continue

            if downloaded >= max_results:
                break
        page += 1
        time.sleep(1)

    print(f"  ✓ {label}: collected {downloaded} new images")
    return downloaded


def augment_dataset():
    """
    Augment small dataset to hit target count.
    Applies: rotation, flip, brightness, contrast
    """
    import random

    for label in ['healthy', 'stressed', 'infected']:
        save_dir = DATASET_DIR / label
        existing = list(save_dir.glob('*.jpg'))
        count = len(existing)
        needed = max(0, TARGET_PER_CLASS - count)

        if needed == 0:
            print(f"  {label}: already has {count} images ✓")
            continue

        print(f"  {label}: augmenting {count} → {TARGET_PER_CLASS} images...")
        aug_count = 0

        while aug_count < needed:
            src = random.choice(existing)
            try:
                img = Image.open(src).convert('RGB')

                # Random augmentation
                ops = random.randint(1, 4)
                if ops >= 1:
                    angle = random.uniform(-25, 25)
                    img = img.rotate(angle, fillcolor=(128, 128, 128))
                if ops >= 2 and random.random() > 0.5:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT)
                if ops >= 3:
                    from PIL import ImageEnhance
                    brightness = random.uniform(0.7, 1.3)
                    img = ImageEnhance.Brightness(img).enhance(brightness)
                if ops >= 4:
                    from PIL import ImageEnhance
                    contrast = random.uniform(0.8, 1.2)
                    img = ImageEnhance.Contrast(img).enhance(contrast)

                fname = save_dir / f"{label}_aug_{aug_count:04d}.jpg"
                img.save(fname, 'JPEG', quality=85)
                aug_count += 1
            except Exception:
                continue

        print(f"  ✓ {label}: {TARGET_PER_CLASS} total images ready")


def print_summary():
    print("\n" + "="*50)
    print("DATASET SUMMARY")
    print("="*50)
    total = 0
    for label in ['healthy', 'stressed', 'infected']:
        d = DATASET_DIR / label
        count = len(list(d.glob('*.jpg'))) if d.exists() else 0
        status = "✓ Ready" if count >= TARGET_PER_CLASS else f"⚠ Need {TARGET_PER_CLASS - count} more"
        print(f"  {label:12s}: {count:4d} images  {status}")
        total += count
    print(f"  {'TOTAL':12s}: {total:4d} images")
    print("\nNext step: python train_model.py")


if __name__ == '__main__':
    print("SAL-SHIELD Dataset Builder")
    print("="*50)

    # Download from iNaturalist
    print("\nDownloading from iNaturalist...")
    for label, queries in CLASSES.items():
        for query in queries:
            existing = len(list((DATASET_DIR / label).glob('*.jpg'))) if (DATASET_DIR / label).exists() else 0
            if existing >= TARGET_PER_CLASS:
                print(f"  {label} already has {existing} images, skipping")
                break
            remaining = TARGET_PER_CLASS - existing
            download_inaturalist(query, label, max_results=min(50, remaining))

    # Augment to hit target
    print("\nAugmenting dataset...")
    augment_dataset()

    print_summary()
