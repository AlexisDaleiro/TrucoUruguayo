import hashlib
import json
import sys
import zipfile
from pathlib import Path

root = Path(sys.argv[1])
result = {"githubRun": int(sys.argv[2]), "package": "uy.trucodeboliche.app", "targetSdk": 36}
for extension in ("aab", "apk"):
    files = list(root.rglob("*." + extension))
    if len(files) != 1:
        raise SystemExit(f"Se esperaba un único archivo .{extension}: {files}")
    path = files[0]
    prefix = "base/" if extension == "aab" else ""
    expected = {
        prefix + ("manifest/AndroidManifest.xml" if extension == "aab" else "AndroidManifest.xml"),
        prefix + "assets/public/index.html",
        prefix + "assets/capacitor.plugins.json",
    }
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() or not expected.issubset(archive.namelist()):
            raise SystemExit(f"El archivo {path.name} tiene entradas dañadas o incompletas")
        entries = archive.namelist()
        if extension == "aab" and any(name.startswith("META-INF/") and name.endswith((".RSA", ".EC", ".DSA")) for name in entries):
            raise SystemExit("El AAB de CI debe quedar sin firma de subida")
        plugin_config = json.loads(archive.read(prefix + "assets/capacitor.plugins.json"))
    result[extension] = {
        "name": path.name,
        "bytes": path.stat().st_size,
        "sha256": hashlib.file_digest(path.open("rb"), "sha256").hexdigest(),
        "plugins": [item["pkg"] for item in plugin_config],
    }
output = Path("docs/evidencia/android-fase-7.json")
output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(output.read_text(encoding="utf-8"))
