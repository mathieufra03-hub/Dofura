path = r"C:\Users\mathi\Documents\dofura\frontend\src\App.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace(
    'const API = "http://localhost:8000"',
    'const API = "https://web-production-53f2b.up.railway.app"'
)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("OK — API Railway")