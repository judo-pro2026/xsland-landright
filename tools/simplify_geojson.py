#!/usr/bin/env python3
"""
簡化 world.geojson 的座標點數（Douglas-Peucker），
目的：這個地圖只需要「清楚看出國界形狀、判斷是哪個國家」，
不需要 Google Map 那種道路等級的精細度。

保護機制：
- 面積很小的國家（如 Andorra、Monaco、San Marino 這類迷你國）用很小的容忍值，
  避免簡化後整個形狀被削到只剩幾個點、變形或消失。
- 點數本來就很少的環（<=8 個點）直接跳過，不需要再簡化。
- 每個 ring 至少保留 4 個點（3 個角 + 首尾閉合點），避免變成退化圖形。
"""
import json
import math

SRC = "../data/world.geojson"
DST = "../data/world.geojson"

# 一般國家的簡化容忍值（單位：度，約等於幾公里等級）
DEFAULT_TOLERANCE = 0.03
# 迷你國家（bbox 對角線小於這個度數，約 150km）改用比例式的極小容忍值
MICRO_BBOX_DEG = 1.5
MICRO_TOLERANCE_DIVISOR = 400  # tolerance = bbox_diag / 400
MICRO_TOLERANCE_FLOOR = 0.0003


def perpendicular_distance(pt, start, end):
    x, y = pt
    x1, y1 = start
    x2, y2 = end
    if (x1, y1) == (x2, y2):
        return math.hypot(x - x1, y - y1)
    num = abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1)
    den = math.hypot(y2 - y1, x2 - x1)
    return num / den


def rdp(points, tolerance):
    if len(points) < 3:
        return points
    dmax = 0.0
    index = 0
    start, end = points[0], points[-1]
    for i in range(1, len(points) - 1):
        d = perpendicular_distance(points[i], start, end)
        if d > dmax:
            index = i
            dmax = d
    if dmax > tolerance:
        left = rdp(points[: index + 1], tolerance)
        right = rdp(points[index:], tolerance)
        return left[:-1] + right
    else:
        return [start, end]


def simplify_ring(ring, tolerance):
    if len(ring) <= 8:
        return ring
    simplified = rdp(ring, tolerance)
    # 確保閉合 + 至少 4 個點（3 角 + 收尾）
    if simplified[0] != simplified[-1]:
        simplified.append(simplified[0])
    if len(simplified) < 4:
        return ring
    return simplified


def bbox_diag(coords_flat):
    xs = [p[0] for p in coords_flat]
    ys = [p[1] for p in coords_flat]
    return math.hypot(max(xs) - min(xs), max(ys) - min(ys))


def flatten_polygon(poly):
    return [pt for ring in poly for pt in ring]


def simplify_geometry(geom):
    gtype = geom["type"]
    if gtype == "Polygon":
        flat = flatten_polygon(geom["coordinates"])
        diag = bbox_diag(flat)
        tol = (
            max(MICRO_TOLERANCE_FLOOR, diag / MICRO_TOLERANCE_DIVISOR)
            if diag < MICRO_BBOX_DEG
            else DEFAULT_TOLERANCE
        )
        geom["coordinates"] = [simplify_ring(r, tol) for r in geom["coordinates"]]
    elif gtype == "MultiPolygon":
        new_polys = []
        for poly in geom["coordinates"]:
            flat = flatten_polygon(poly)
            diag = bbox_diag(flat)
            tol = (
                max(MICRO_TOLERANCE_FLOOR, diag / MICRO_TOLERANCE_DIVISOR)
                if diag < MICRO_BBOX_DEG
                else DEFAULT_TOLERANCE
            )
            new_polys.append([simplify_ring(r, tol) for r in poly])
        geom["coordinates"] = new_polys
    return geom


def count_vertices(geom):
    gtype = geom["type"]
    if gtype == "Polygon":
        return sum(len(r) for r in geom["coordinates"])
    elif gtype == "MultiPolygon":
        return sum(len(r) for poly in geom["coordinates"] for r in poly)
    return 0


def main():
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)

    before_total = 0
    after_total = 0
    report = []

    for feature in data["features"]:
        geom = feature["geometry"]
        before = count_vertices(geom)
        feature["geometry"] = simplify_geometry(geom)
        after = count_vertices(feature["geometry"])
        before_total += before
        after_total += after
        if before > 500:
            report.append((feature.get("id"), before, after))

    with open(DST, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print(f"總頂點數：{before_total:,} -> {after_total:,}（減少 {(1 - after_total/before_total)*100:.1f}%）")
    print()
    print("簡化前點數 > 500 的國家（前20名，依簡化後點數排序）：")
    report.sort(key=lambda x: -x[1])
    for code, b, a in report[:20]:
        print(f"  {code}: {b:,} -> {a:,}")


if __name__ == "__main__":
    main()
