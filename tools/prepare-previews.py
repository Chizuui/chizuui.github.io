"""Generate bounded-resolution gallery textures; preserve original artwork.

Optional maintenance command: python tools/prepare-previews.py (requires Pillow).
"""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
output = root / "Assets" / "Preview"
output.mkdir(parents=True, exist_ok=True)
manifest = []
for source in sorted((root / "Assets" / "Poster").glob("*.webp")):
    with Image.open(source) as image:
        image.thumbnail((640, 800), Image.Resampling.LANCZOS)
        target = output / source.name
        image.save(target, "WEBP", quality=84, method=6)
        manifest.append({"file": target.relative_to(root).as_posix(),
                         "width": image.width, "height": image.height,
                         "bytes": target.stat().st_size})
(root / "tools" / "preview-manifest.json").write_text(
    json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"Generated {len(manifest)} previews, {sum(item['bytes'] for item in manifest)} bytes total.")
