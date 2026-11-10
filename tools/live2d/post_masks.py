#!/usr/bin/env python
"""掩膜后处理 + 派生层：去碎块 / 膨胀 / 头发闭运算补孔 / 补洞层 / 闭眼层。

用法：python post_masks.py part-spec.json
输出：<outDir>/part-<name>.png 与 <outDir>/anchored/part-<name>.png
      （anchored 版本四角有 alpha=1 的锚点像素，防止 PSD2Live 导入时裁边居中）
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

MIN_PART_PX = 150


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(radius):
        out = (
            out
            | np.roll(out, 1, 0)
            | np.roll(out, -1, 0)
            | np.roll(out, 1, 1)
            | np.roll(out, -1, 1)
        )
    return out


def erode(mask: np.ndarray, radius: int) -> np.ndarray:
    return ~dilate(~mask, radius)


def components(mask: np.ndarray):
    """4/8 邻域连通块生成器（逐个 yield 像素索引列表）"""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        queue = deque([(sy, sx)])
        seen[sy, sx] = True
        comp = []
        while queue:
            y, x = queue.popleft()
            comp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
        yield comp


def drop_small(mask: np.ndarray, min_px: int) -> tuple[np.ndarray, int]:
    out = mask.copy()
    removed = 0
    for comp in components(mask):
        if len(comp) < min_px:
            for y, x in comp:
                out[y, x] = False
            removed += len(comp)
    return out, removed


def fill_holes(mask: np.ndarray) -> np.ndarray:
    """从画布边界灌水，灌不到的透明区即内部孔洞"""
    h, w = mask.shape
    bg = ~mask
    seed = np.zeros_like(bg)
    seed[0, :] |= bg[0, :]
    seed[-1, :] |= bg[-1, :]
    seed[:, 0] |= bg[:, 0]
    seed[:, -1] |= bg[:, -1]
    cur = seed.copy()
    while True:
        nxt = dilate(cur, 1) & bg
        if (nxt == cur).all():
            break
        cur = nxt
    return mask | (bg & ~cur)


class Workspace:
    def __init__(self, spec_path: str):
        self.here = os.path.dirname(os.path.abspath(spec_path))
        self.spec = json.load(open(spec_path, encoding="utf-8"))
        self.out = os.path.normpath(os.path.join(self.here, self.spec["sam"]["outDir"]))
        self.anchored = os.path.join(self.out, "anchored")
        os.makedirs(self.anchored, exist_ok=True)
        self.src = os.path.normpath(os.path.join(self.here, self.spec["source"]))
        self.rgba = np.array(Image.open(self.src).convert("RGBA"))
        self.h, self.w = self.rgba.shape[:2]
        self.alpha = self.rgba[:, :, 3] > 20
        self.base: dict[str, np.ndarray] = {}

    def load_mask(self, name: str) -> np.ndarray:
        return np.array(Image.open(os.path.join(self.out, f"mask-{name}.png")).convert("L")) > 127

    def save(self, name: str, mask: np.ndarray) -> None:
        part = self.rgba.copy()
        part[:, :, 3] = np.where(mask, part[:, :, 3], 0)
        for y, x in ((0, 0), (0, self.w - 1), (self.h - 1, 0), (self.h - 1, self.w - 1)):
            part[y, x, 3] = 1  # 锚点：防导入裁边居中
        img = Image.fromarray(part, mode="RGBA")
        img.save(os.path.join(self.out, f"part-{name}.png"))
        img.save(os.path.join(self.anchored, f"part-{name}.png"))
        Image.fromarray((mask * 255).astype(np.uint8), mode="L").save(os.path.join(self.out, f"mask-{name}.png"))


def main() -> int:
    spec_path = sys.argv[1] if len(sys.argv) > 1 else "part-spec.json"
    ws = Workspace(spec_path)

    # 1) 逐部件：去碎块 + 膨胀/闭运算
    for part in ws.spec["parts"]:
        name = part["name"]
        m = ws.load_mask(name)
        ws.base[name] = m
        m, removed = drop_small(m, MIN_PART_PX)
        if part.get("close"):
            m = erode(dilate(m, int(part["close"])), int(part["close"]))
        if part.get("fillHoles"):
            m = fill_holes(m)
        d = int(part.get("dilate", 0))
        if d:
            m = dilate(m, d) & ws.alpha
        ws.save(name, m)
        print(f"  {name:12s} dilate={d} close={part.get('close', 0)} removed={removed:5d} px={int(m.sum())}")

    derived = ws.spec.get("derived", {})

    # 2) 补洞层：未覆盖像素 - 轮廓外带
    res_cfg = derived.get("residual") or {}
    if res_cfg.get("enabled"):
        union = np.zeros((ws.h, ws.w), dtype=bool)
        for m in ws.base.values():
            union |= m
        silhouette = ws.alpha & ~erode(ws.alpha, 3)
        band = dilate(silhouette, int(res_cfg.get("edgeBandPx", 6)))
        residual = ws.alpha & ~union & ~band
        residual, removed = drop_small(residual, int(res_cfg.get("minComponentPx", 300)))
        ws.save("residual", residual)
        print(f"  residual     removed={removed:5d} px={int(residual.sum())}")

    # 3) 闭眼层：眼区肤色补片 + 眼睑弧线
    ec_cfg = derived.get("eyeClose") or {}
    if ec_cfg.get("enabled"):
        eye = ws.load_mask(ec_cfg.get("fromPart", "eyes"))
        eye = dilate(eye, int(ec_cfg.get("patchGrowPx", 2)))
        ys, xs = np.nonzero(eye)
        if not len(xs):
            print("  eye_close    跳过：眼掩膜为空")
        else:
            x0, x1, y1 = int(xs.min()), int(xs.max()), int(ys.max())
            lum = 0.299 * ws.rgba[:, :, 0] + 0.587 * ws.rgba[:, :, 1] + 0.114 * ws.rgba[:, :, 2]
            cheek = np.zeros((ws.h, ws.w), dtype=bool)
            cheek[y1 + 8 : y1 + 26, x0 : x1 + 1] = True
            cand = cheek & (ws.rgba[:, :, 3] > 200) & (lum > 170)
            skin = (
                tuple(int(v) for v in np.median(ws.rgba[cand][:, :3], axis=0))
                if cand.sum() > 100
                else (250, 232, 226)
            )
            ratio = float(ec_cfg.get("lidLineHeightRatio", 0.62))
            thick = int(ec_cfg.get("lidLineThickness", 5))
            line = np.zeros((ws.h, ws.w), dtype=bool)
            for x in range(x0, x1 + 1):
                col = np.nonzero(eye[:, x])[0]
                if not len(col):
                    continue
                top, bot = int(col.min()), int(col.max())
                t = (x - x0) / max(1, x1 - x0)
                y = int(top + (bot - top) * ratio - 3 * np.sin(np.pi * t))
                line[max(0, y - thick // 2) : y + thick // 2 + 1, x] = True
            out = np.zeros((ws.h, ws.w, 4), dtype=np.uint8)
            out[eye] = (*skin, 255)
            out[line & eye] = (74, 74, 117, 255)
            for y, x in ((0, 0), (0, ws.w - 1), (ws.h - 1, 0), (ws.h - 1, ws.w - 1)):
                out[y, x, 3] = 1
            img = Image.fromarray(out, mode="RGBA")
            img.save(os.path.join(ws.out, "part-eye_close.png"))
            img.save(os.path.join(ws.anchored, "part-eye_close.png"))
            print(f"  eye_close    skin={skin} px={int(eye.sum())}")

    print("done ->", ws.anchored)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
