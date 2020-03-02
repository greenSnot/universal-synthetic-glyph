import Stroke from './stroke';
import { TopLeftBoundingBox, GlyphStroke, GlyphSegment } from '../types';

export default class Strokes {
  strokes: Stroke[] = [];
  constructor(strokes_keypoints: number[][], equations?: number[][][]) {
    this.strokes = strokes_keypoints.map((i, stroke_idx) => new Stroke(i, equations && equations[stroke_idx]));
  }

  static from_glyph_strokes(strokes: GlyphStroke[]) {
    const strokes_keypoints = [] as number[][];
    const equations = [] as number[][][];
    strokes.forEach(stroke => {
      const keypoints: number[] = [];
      let pre: GlyphSegment;
      stroke.segments.forEach((i, idx) => {
        idx > 0 && keypoints.push(
          pre.pivot_point.x,
          pre.pivot_point.y,
          pre.control_point_b.x,
          pre.control_point_b.y,
          i.control_point_a.x,
          i.control_point_a.y,
        );
        pre = i;
      });
      keypoints.push(
        stroke.segments[stroke.segments.length - 1].pivot_point.x,
        stroke.segments[stroke.segments.length - 1].pivot_point.y,
      );
      strokes_keypoints.push(keypoints);
      equations.push(stroke.segments.filter((s, seg_idx) => seg_idx !== 0).map(i => {
        return i.weight_graph ? i.weight_graph.equation : [];
      }));
    });

    return new Strokes(strokes_keypoints, equations);
  }

  bounding_box(): TopLeftBoundingBox {
    let min_x = Infinity;
    let max_y = - Infinity;
    let max_x = - Infinity;
    let min_y = Infinity;
    this.strokes.forEach(stroke => {
      const bounding_box = stroke.bounding_box();
      min_x = Math.min(min_x, bounding_box.offset_x)
      min_y = Math.min(min_y, bounding_box.offset_y)
      max_x = Math.max(max_x, bounding_box.offset_x + bounding_box.width)
      max_y = Math.max(max_y, bounding_box.offset_y + bounding_box.height)
    });
    return {
      offset_x: min_x,
      offset_y: min_y,
      width: max_x - min_x,
      height: max_y - min_y,
    };
  }

  pixelize() {
    return this.strokes.map(i => i.pixelize());
  }

  pixelize_with_scales() {
    return this.strokes.map(i => i.pixelize_with_scales());
  }
}