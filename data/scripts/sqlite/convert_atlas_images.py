"""
Installation:
    # Create and activate virtual environment
    python3 -m venv venv
    source venv/bin/activate  # On macOS/Linux
    venv\\Scripts\\activate   # On Windows
    
    # Install required package
    pip install Pillow

Usage:
    # Make sure virtual environment is activated
    # Run from project root:
    python data/scripts/convert_atlas_images.py
    # Or from scripts directory:
    python convert_atlas_images.py
"""

#the source for these images comes from "EverQuest Atlas: The Maps Of Myrist", which is available on archive.org at https://archive.org/details/ever-uest-atlas-the-maps-of-myrist/mode/2up
#screenshots were taken of each map by hand, they're not readily available in the format used by this script

from PIL import Image
import os
from pathlib import Path


def convert_atlas_images():
    # Get the script's directory
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent
    project_root = data_dir.parent

    input_dir = data_dir / "rawatlasart"
    output_dir = project_root / "public/images/atlas_images"

    print(f"Looking for images in: {input_dir}")
    print(f"Output directory: {output_dir}")

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    for image_path in input_dir.glob("*"):
        if image_path.suffix.lower() in [".jpg", ".jpeg", ".png"]:
            try:
                print(f"Processing: {image_path.name}")
                with Image.open(image_path) as img:
                    # Calculate new width while maintaining aspect ratio
                    aspect_ratio = img.width / img.height
                    new_height = 722
                    new_width = int(aspect_ratio * new_height)

                    print(
                        f"Resizing {image_path.name} from {img.width}x{img.height} to {new_width}x{new_height}"
                    )

                    # Resize image
                    resized_img = img.resize(
                        (new_width, new_height), Image.Resampling.LANCZOS
                    )

                    # Prepare output path with same filename
                    output_path = output_dir / image_path.name

                    # Save with optimized settings
                    if image_path.suffix.lower() in [".jpg", ".jpeg"]:
                        resized_img.save(output_path, "JPEG", quality=65, optimize=True)
                    else:
                        # Convert to RGB then to palette mode for maximum compression
                        resized_img = resized_img.convert("RGB").convert(
                            "P", palette=Image.Palette.ADAPTIVE, colors=216
                        )
                        resized_img.save(
                            output_path, "PNG", optimize=True, compress_level=9
                        )
                    print(f"Successfully saved: {output_path}")
            except Exception as e:
                print(f"Error processing {image_path.name}: {str(e)}")

    print("Conversion complete!")


if __name__ == "__main__":
    convert_atlas_images()
