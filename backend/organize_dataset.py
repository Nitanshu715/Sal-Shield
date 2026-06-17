import os
import shutil

# Paths
plantdoc_train = r"D:\sal-shield\backend\PlantDoc-Dataset\train"
infected_dir = r"D:\sal-shield\backend\dataset\infected"

# Corrected exact folder names matching the PlantDoc repo
infected_targets = ['Apple Scab Leaf', 'grape leaf black rot', 'Apple rust leaf']

def copy_infected_images(target_folders, destination):
    count = 0
    os.makedirs(destination, exist_ok=True)
    for folder in target_folders:
        source_path = os.path.join(plantdoc_train, folder)
        if os.path.exists(source_path):
            for file in os.listdir(source_path):
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    src_file = os.path.join(source_path, file)
                    # Create a unique filename to prevent overwriting
                    dst_file = os.path.join(destination, f"plantdoc_{folder.replace(' ', '_')}_{file}")
                    shutil.copy(src_file, dst_file)
                    count += 1
        else:
            print(f"Warning: Folder not found: {source_path}")
    print(f"Successfully copied {count} images to {destination}")

print("Extracting missing infected images from PlantDoc...")
copy_infected_images(infected_targets, infected_dir)
print("Done updating!")