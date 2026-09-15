import json
with open("data/projects.geojson", encoding="utf-8") as f:
    gj = json.load(f)
checks = ["kulon progo", "kediri", "ameroro"]
print("Verification of target projects:")
for feat in gj["features"]:
    p = feat["properties"]
    name_l = p["project_name"].lower()
    if any(c in name_l for c in checks):
        b = p.get("budget_idr")
        r = p.get("budget_raw", "")
        print(f"  {str(b):<10} T  raw={r!r:<35}  {p['project_name'][:60]}")
