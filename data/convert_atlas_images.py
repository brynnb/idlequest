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
    python data/convert_atlas_images.py
    # Or from data directory:
    python convert_atlas_images.py
"""

from PIL import Image
import os
from pathlib import Path


def convert_atlas_images():
    # Get the script's directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    input_dir = project_root / "data/rawatlasart"
    output_dir = project_root / "public/images/atlas_images"

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    for image_path in input_dir.glob("*"):
        if image_path.suffix.lower() in [".jpg", ".jpeg", ".png"]:
            with Image.open(image_path) as img:
                # Calculate new width while maintaining aspect ratio
                aspect_ratio = img.width / img.height
                new_height = 722
                new_width = int(aspect_ratio * new_height)

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


if __name__ == "__main__":
    convert_atlas_images()
