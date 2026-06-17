import os
import json

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

DATASET_DIR = 'dataset'
MODEL_DIR   = 'models'
IMG_SIZE    = 224
BATCH_SIZE  = 8
CLASSES     = ['healthy', 'stressed', 'infected']

os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading dataset...")

train_gen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=20,
    horizontal_flip=True,
    zoom_range=0.15,
    brightness_range=[0.8, 1.2]
).flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True,
    classes=CLASSES
)

val_gen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
).flow_from_directory(
    DATASET_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False,
    classes=CLASSES
)

print(f"Train: {train_gen.samples}  Val: {val_gen.samples}")
print(f"Classes: {train_gen.class_indices}")

# Build model
base = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)
base.trainable = False

x = base.output
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dense(128, activation='relu')(x)
x = layers.Dropout(0.4)(x)
out = layers.Dense(3, activation='softmax')(x)
model = Model(base.input, out)

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("\n========== PHASE 1 — Training head ==========")
model.fit(
    train_gen,
    epochs=8,
    validation_data=val_gen,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(
            patience=3,
            restore_best_weights=True,
            monitor='val_accuracy'
        )
    ],
    verbose=1
)

print("\n========== PHASE 2 — Fine tuning ==========")
base.trainable = True
for layer in base.layers[:-20]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(
    train_gen,
    epochs=10,
    validation_data=val_gen,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(
            patience=4,
            restore_best_weights=True,
            monitor='val_accuracy'
        ),
        tf.keras.callbacks.ModelCheckpoint(
            f'{MODEL_DIR}/tree_classifier.h5',
            save_best_only=True,
            monitor='val_accuracy',
            verbose=1
        )
    ],
    verbose=1
)

print("\nEvaluating...")
loss, acc = model.evaluate(val_gen, verbose=0)
print(f"\nFinal Validation Accuracy: {acc*100:.1f}%")

# Save accuracy to model_meta.json
meta_path = f'{MODEL_DIR}/model_meta.json'
if os.path.exists(meta_path):
    with open(meta_path) as f:
        meta = json.load(f)
    meta['cnn_accuracy'] = round(acc * 100, 1)
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)

print(f"\nModel saved to {MODEL_DIR}/tree_classifier.h5")
print("DONE — restart python app.py to activate real CNN predictions")