#!/usr/bin/env python
"""按 part-spec.json 的 bbox 用 MobileSAM 逐件切出掩膜。

用法：python cut_sam.py part-spec.json
输出：<outDir>/mask-<name>.png（白=部件）
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from mobile_sam import SamPredictor, sam_model_registry


def main() -> int:
    spec_path = sys.argv[1] if len(sys.argv) > 1 else "part-spec.json"
    here = os.path.dirname(os.path.abspath(spec_path))
    spec = json.load(open(spec_path, encoding="utf-8"))
    out_dir = os.path.normpath(os.path.join(here, spec["sam"]["outDir"]))
    ckpt = os.path.normpath(os.path.join(here, spec["sam"]["checkpoint"]))
    src = os.path.normpath(os.path.join(here, spec["source"]))
    os.makedirs(out_dir, exist_ok=True)

    image = Image.open(src).convert("RGB")
    predictor = SamPredictor(sam_model_registry["vit_t"](checkpoint=ckpt))
    predictor.model.eval()
    predictor.set_image(np.array(image))

    for part in spec["parts"]:
        box = np.array(part["box"], dtype=float)
        masks, scores, _ = predictor.predict(box=box, multimask_output=True)
        # 分数 >= 0.5 里面积最大的那张，避免只抓到局部
        cand = [(int(m.sum()), float(s), i) for i, (m, s) in enumerate(zip(masks, scores)) if s >= 0.5]
        if not cand:
            cand = [(int(masks[i].sum()), float(scores[i]), i) for i in range(3)]
        area, score, idx = max(cand, key=lambda t: t[0])
        mask = masks[idx]
        Image.fromarray((mask * 255).astype(np.uint8), mode="L").save(
            os.path.join(out_dir, f"mask-{part['name']}.png")
        )
        print(f"  {part['name']:12s} box={part['box']} px={area:7d} score={score:.3f}")
    print("done ->", out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
