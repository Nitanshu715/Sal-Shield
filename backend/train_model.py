"""
SAL-SHIELD Tree Health Classifier
Train MobileNetV2 on tree health dataset

Requirements:
    pip install tensorflow pillow numpy scikit-learn matplotlib

Dataset structure expected:
    dataset/
        healthy/      ← photos of healthy Sal trees
        stressed/     ← photos of stressed/early damage
        infected/     ← photos of confirmed Sal borer infected trees

Usage:
    python train_model.py

Output:
    models/tree_classifier.h5     ← drop this into backend/models/
    models/tree_classifier.tflite ← lighter version for edge deployment
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import json

# ─── CONFIG ──────────────────────────────────────────────────────────────────

DATASET_DIR   = 'dataset'
MODEL_DIR     = 'models'
IMG_SIZE      = 224
BATCH_SIZE    = 16
EPOCHS_FROZEN = 10    # train only new head first
EPOCHS_FINE   = 10    # then unfreeze top layers
CLASSES       = ['healthy', 'stressed', 'infected']

os.makedirs(MODEL_DIR, exist_ok=True)

# ─── DATA AUGMENTATION ───────────────────────────────────────────────────────
# Augmentation is critical since we have limited real images
# It creates variations: rotated, flipped, brightness-shifted versions

train_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.7, 1.3],   # simulate different lighting in forests
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

train_gen = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    classes=CLASSES
)

val_gen = val_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
    classes=CLASSES
)

print(f"\nTraining samples : {train_gen.samples}")
print(f"Validation samples: {val_gen.samples}")
print(f"Classes: {train_gen.class_indices}\n")

# ─── MODEL ───────────────────────────────────────────────────────────────────
# MobileNetV2 — lightweight, runs on CPU, good accuracy
# Pretrained on ImageNet so it already understands textures, edges, colors
# We just teach it the difference between our 3 tree classes

base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False   # freeze base first

# Add classification head
x = base_model.output
x = layers.GlobalAveragePooling2D()(x)
x = layers.BatchNormalization()(x)
x = layers.Dense(256, activation='relu')(x)
x = layers.Dropout(0.4)(x)
x = layers.Dense(128, activation='relu')(x)
x = layers.Dropout(0.3)(x)
output = layers.Dense(len(CLASSES), activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

# ─── PHASE 1: TRAIN HEAD ONLY ─────────────────────────────────────────────
print("=" * 50)
print("PHASE 1 — Training classification head")
print("=" * 50)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks_phase1 = [
    tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor='val_accuracy'),
    tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2, min_lr=1e-6)
]

history1 = model.fit(
    train_gen,
    epochs=EPOCHS_FROZEN,
    validation_data=val_gen,
    callbacks=callbacks_phase1,
    verbose=1
)

# ─── PHASE 2: FINE-TUNE TOP LAYERS ────────────────────────────────────────
print("\n" + "=" * 50)
print("PHASE 2 — Fine-tuning top layers of base model")
print("=" * 50)

# Unfreeze top 30 layers of MobileNetV2
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),  # lower LR for fine-tuning
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks_phase2 = [
    tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor='val_accuracy'),
    tf.keras.callbacks.ReduceLROnPlateau(factor=0.3, patience=3, min_lr=1e-7),
    tf.keras.callbacks.ModelCheckpoint(
        f'{MODEL_DIR}/tree_classifier_best.h5',
        save_best_only=True,
        monitor='val_accuracy',
        verbose=1
    )
]

history2 = model.fit(
    train_gen,
    epochs=EPOCHS_FINE,
    validation_data=val_gen,
    callbacks=callbacks_phase2,
    verbose=1
)

# ─── SAVE MODEL ──────────────────────────────────────────────────────────────
model.save(f'{MODEL_DIR}/tree_classifier.h5')
print(f"\nModel saved → {MODEL_DIR}/tree_classifier.h5")

# Save class labels
with open(f'{MODEL_DIR}/classes.json', 'w') as f:
    json.dump(CLASSES, f)

# ─── EVALUATE ────────────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("EVALUATION")
print("=" * 50)

val_gen.reset()
preds = model.predict(val_gen, verbose=0)
pred_classes = np.argmax(preds, axis=1)
true_classes = val_gen.classes[:len(pred_classes)]

print("\nClassification Report:")
print(classification_report(true_classes, pred_classes, target_names=CLASSES))

# Confusion matrix
cm = confusion_matrix(true_classes, pred_classes)
print("Confusion Matrix:")
print(cm)

# Final accuracy
val_loss, val_acc = model.evaluate(val_gen, verbose=0)
print(f"\nFinal Validation Accuracy: {val_acc*100:.1f}%")

# ─── EXPORT TO TFLITE (optional, for edge/mobile) ─────────────────────────
try:
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    with open(f'{MODEL_DIR}/tree_classifier.tflite', 'wb') as f:
        f.write(tflite_model)
    print(f"TFLite model saved → {MODEL_DIR}/tree_classifier.tflite")
except Exception as e:
    print(f"TFLite export skipped: {e}")

# ─── PLOT TRAINING CURVES ─────────────────────────────────────────────────
all_acc = history1.history['accuracy'] + history2.history['accuracy']
all_val_acc = history1.history['val_accuracy'] + history2.history['val_accuracy']

plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(all_acc, label='Train Accuracy')
plt.plot(all_val_acc, label='Val Accuracy')
plt.axvline(len(history1.history['accuracy']), color='gray', linestyle='--', label='Fine-tune start')
plt.title('Model Accuracy')
plt.legend()
plt.grid(True)

all_loss = history1.history['loss'] + history2.history['loss']
all_val_loss = history1.history['val_loss'] + history2.history['val_loss']

plt.subplot(1, 2, 2)
plt.plot(all_loss, label='Train Loss')
plt.plot(all_val_loss, label='Val Loss')
plt.title('Model Loss')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig(f'{MODEL_DIR}/training_curves.png', dpi=150)
print(f"Training curves saved → {MODEL_DIR}/training_curves.png")

print("\n✓ Done. Drop tree_classifier.h5 into backend/models/ to activate real predictions.")
