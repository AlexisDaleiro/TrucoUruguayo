import json
import re
import unicodedata
from pathlib import Path
from PIL import Image

ROOT = Path("docs/entregas/play-store")
FORBIDDEN = re.compile(r"\b(?:apost(?:ar|a|as|ando|ado|amos)|pozo|gana plata|premio en dinero|casino|jackpot|cobrar)\b", re.I)

def fold(value):
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn")

texts = {}
for name, limit in (("titulo", 30), ("descripcion-corta", 80), ("descripcion-larga", 4000)):
    copy = (ROOT / f"{name}.txt").read_text(encoding="utf-8").strip()
    assert 0 < len(copy) <= limit, f"{name}: {len(copy)} caracteres, máximo {limit}"
    assert not FORBIDDEN.search(fold(copy)), f"Vocabulario reservado en {name}"
    texts[name] = len(copy)
locale = Path("locales/es-UY.json").read_text(encoding="utf-8")
assert not FORBIDDEN.search(fold(locale)), "Vocabulario reservado en el juego"

def image(name, size, format, mode, limit=None):
    path = ROOT / name
    with Image.open(path) as img:
        assert img.size == size and img.format == format and img.mode == mode, f"Formato inesperado: {name}"
        img.verify()
    byte_count = path.stat().st_size
    assert not limit or byte_count <= limit, f"Archivo demasiado pesado: {name}"
    return {"archivo": name, "pixels": list(size), "bytes": byte_count}

images = [
    image("icono-512.png", (512, 512), "PNG", "RGBA", 1024 * 1024),
    image("imagen-destacada-1024x500.png", (1024, 500), "PNG", "RGB", 15 * 1024 * 1024),
]
for pattern, count, dimensions in (
    ("telefono-*.jpg", 4, (1080, 1920)),
    ("tablet-7-*.jpg", 2, (1440, 2304)),
    ("tablet-10-*.jpg", 2, (2048, 1280)),
):
    files = sorted(ROOT.glob(pattern))
    assert len(files) == count, f"Faltan capturas: {pattern}"
    assert 320 <= min(dimensions) <= max(dimensions) <= 3840 and max(dimensions) <= min(dimensions) * 2
    images += [image(file.name, dimensions, "JPEG", "RGB") for file in files]

result = {"texto": texts, "vocabulario": "verificado", "archivos": images}
Path("docs/evidencia/play-store-fase-8.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Play Store: {len(images)} archivos, tres textos y vocabulario verificados")
