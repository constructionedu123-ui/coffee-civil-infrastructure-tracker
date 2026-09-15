import json, sqlite3, sys
sys.path.insert(0, ".")
from pipeline.normaliser import parse_budget

GEOJSON = "data/projects.geojson"
DB = "data/projects.sqlite"

with open(GEOJSON, encoding="utf-8") as f:
    gj = json.load(f)
features = gj["features"]
fixed = 0

for feat in features:
    p = feat["properties"]
    raw = p.get("budget_raw")
    existing = p.get("budget_idr")
    if not raw:
        continue
    new_val = parse_budget(raw)
    changed = (existing is None and new_val is not None) or \
              (existing is not None and new_val is None) or \
              (existing is not None and new_val is not None and abs(new_val - existing) > 0.001)
    if changed:
        name = p["project_name"][:55]
        if existing is not None and new_val is not None and abs(new_val - existing) > 0.01:
            print(f"FIX:  {name}")
            print(f"      raw={raw!r}  {existing:.3f}T -> {new_val:.3f}T")
        elif existing is not None and new_val is None:
            print(f"NULL: {name}  raw={raw!r}  was={existing:.3f}T")
        p["budget_idr"] = new_val
        fixed += 1

print(f"\nRe-parses applied: {fixed}")

budgets = sorted(
    [(p["properties"]["project_name"], p["properties"].get("budget_idr"))
     for p in features if p["properties"].get("budget_idr")],
    key=lambda x: -x[1]
)
print("\nTop 15 by CAPEX:")
for n, b in budgets[:15]:
    print(f"  {b:10.3f} T  {n[:65]}")

n_with = sum(1 for f in features if f["properties"].get("budget_idr"))
total = sum(f["properties"]["budget_idr"] for f in features if f["properties"].get("budget_idr"))
print(f"\nFINAL: {n_with} projects with CAPEX, Rp {total:,.3f} Triliun")

with open(GEOJSON, "w", encoding="utf-8") as f:
    json.dump(gj, f, ensure_ascii=False, separators=(",", ":"))
print("GeoJSON written.")

conn = sqlite3.connect(DB)
cur = conn.cursor()
rows = 0
for feat in features:
    p = feat["properties"]
    if p.get("project_id"):
        cur.execute("UPDATE projects SET budget_idr=?, budget_raw=? WHERE project_id=?",
            (p.get("budget_idr"), p.get("budget_raw"), p["project_id"]))
        if cur.rowcount: rows += 1
conn.commit(); conn.close()
print(f"SQLite updated: {rows} rows")
