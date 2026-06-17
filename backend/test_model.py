"""
SAL-SHIELD Model Testing Script
Run this after training to evaluate both models properly

Usage:
    python test_model.py
"""

import os
import pickle
import json
import numpy as np

print("=" * 60)
print("SAL-SHIELD MODEL EVALUATION")
print("=" * 60)

# ─── TEST MODEL 2: IMAGE CLASSIFIER (CNN) ────────────────────────────────────
print("\n[ MODEL 2 — Tree Image Classifier (CNN) ]")

h5_path = 'models/tree_classifier.h5'
if not os.path.exists(h5_path):
    print("  ✗ tree_classifier.h5 not found")
    print("  → Run: python train_model.py (after collecting dataset/)")
else:
    try:
        import tensorflow as tf
        from PIL import Image
        from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

        model = tf.keras.models.load_model(h5_path)
        CLASSES = ['healthy', 'stressed', 'infected']
        IMG_SIZE = 224

        # Run on test set if it exists
        test_dir = 'dataset_test'
        if os.path.exists(test_dir):
            print(f"  Running on test set: {test_dir}/")
            y_true, y_pred = [], []

            for label_idx, label in enumerate(CLASSES):
                class_dir = os.path.join(test_dir, label)
                if not os.path.exists(class_dir):
                    continue
                files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))]
                print(f"  {label}: {len(files)} test images")

                for fname in files:
                    path = os.path.join(class_dir, fname)
                    try:
                        img = Image.open(path).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
                        arr = np.expand_dims(np.array(img) / 255.0, axis=0)
                        probs = model.predict(arr, verbose=0)[0]
                        y_pred.append(int(np.argmax(probs)))
                        y_true.append(label_idx)
                    except Exception as e:
                        continue

            if y_true:
                acc = accuracy_score(y_true, y_pred)
                print(f"\n  Accuracy: {acc*100:.1f}%")
                print("\n  Classification Report:")
                print(classification_report(y_true, y_pred, target_names=CLASSES))
                print("  Confusion Matrix:")
                print(confusion_matrix(y_true, y_pred))
                if acc >= 0.85:
                    print(f"\n  ✓ TARGET MET: {acc*100:.1f}% ≥ 85%")
                else:
                    print(f"\n  ✗ Below target: {acc*100:.1f}% — collect more training data")
        else:
            print("  No dataset_test/ directory found")
            print("  → Create dataset_test/ with same structure as dataset/ (keep ~20% of images aside)")

            # Quick test with a single image if provided
            test_img = input("\n  Enter path to a test tree image (or press Enter to skip): ").strip()
            if test_img and os.path.exists(test_img):
                img = Image.open(test_img).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
                arr = np.expand_dims(np.array(img) / 255.0, axis=0)
                probs = model.predict(arr, verbose=0)[0]
                label = CLASSES[int(np.argmax(probs))]
                conf = float(np.max(probs)) * 100
                print(f"\n  Prediction: {label.upper()} ({conf:.1f}% confidence)")
                print(f"  Probabilities: {dict(zip(CLASSES, [f'{p*100:.1f}%' for p in probs]))}")

    except Exception as e:
        print(f"  Error: {e}")


# ─── TEST MODEL 1: SBVI SATELLITE MODEL (RF + XGB) ──────────────────────────
print("\n[ MODEL 1 — SBVI Satellite Risk Model (RF + XGB) ]")

rf_path   = 'models/rf_model.pkl'
xgb_path  = 'models/xgb_model.pkl'
meta_path = 'models/model_meta.json'

if not os.path.exists(rf_path):
    print("  ✗ rf_model.pkl not found")
else:
    with open(rf_path, 'rb')  as f: rf  = pickle.load(f)
    with open(xgb_path, 'rb') as f: xgb = pickle.load(f)
    with open(meta_path)      as f: meta = json.load(f)

    print(f"  RF  accuracy: {meta['rf_accuracy']}%")
    print(f"  XGB accuracy: {meta['xgb_accuracy']}%")
    print(f"  Ensemble:     {meta['ensemble_accuracy']}%")
    print(f"  Trained on:   {meta['training_samples']} labeled pixels")
    print(f"  Top features: {meta['top_features'][:3]}")
    print(f"  SBVI formula: {meta['sbvi_formula']}")

    acc = meta['rf_accuracy']
    if acc >= 85:
        print(f"\n  ✓ TARGET MET: {acc}% ≥ 85%")
    else:
        print(f"\n  ✗ Below target: {acc}% — need FRI ground truth GPS data")
        print("  Current labels are SBVI pseudo-labels (formula output, not field verified)")
        print("  With 30+ FRI confirmed infected tree GPS points → expected accuracy: 80-90%")


# ─── SUMMARY ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

with open(meta_path) as f: meta = json.load(f)
print(f"""
Model 1 (SBVI Satellite): {meta['rf_accuracy']}%
  Formula: {meta['sbvi_formula']}
  Status:  {'✓ Ready' if meta['rf_accuracy'] >= 85 else '✗ Needs FRI ground truth'}

Model 2 (Image CNN):      {'Not trained' if not os.path.exists(h5_path) else 'See above'}
  To train: python train_model.py
  Dataset:  BarkVisionAI (healthy) + PlantDoc + Google Images
  Expected: 87-93% with 1500+ augmented images

Next step: python train_model.py
""")
