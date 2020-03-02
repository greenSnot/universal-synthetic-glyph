import Segment from './segment';
import { TopLeftBoundingBox } from '../types';

export default class Stroke {
  segments: Segment[] = [];
  keypoints: number[];
  constructor(keypoints: number[], equations?: number[][]) {
    let i = 0;
    let j = 0;
    const len_keypoints = keypoints.length - 7;
    this.keypoints = keypoints;
    while (i < len_keypoints) {
      this.segments.push(new Segment(
        keypoints[i],
        keypoints[i + 1],
        keypoints[i + 2],
        keypoints[i + 3],
        keypoints[i + 4],
        keypoints[i + 5],
        keypoints[i + 6],
        keypoints[i + 7],
        equations && equations[j],
      ));
      ++j;
      i += 6;
    }
  }

  static from_gimp_bezier_stroke(bezier_stroke: number[], max_height: number) {
    const keypoints = bezier_stroke.splice(2, bezier_stroke.length - 4);
    return keypoints.map((i, idx) => idx % 2 ? max_height - i : i);
  }

  bounding_box(): TopLeftBoundingBox {
    let min_x = Infinity;
    let max_y = - Infinity;
    let max_x = - Infinity;
    let min_y = Infinity;
    this.segments.forEach(line_segment => {
      const bounding_box = line_segment.bounding_box()
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

  pixelize_merged() {
    const pixels: number[] = [];
    this.segments.forEach(i => i.pixelize(pixels));
    return pixels;
  }

  pixelize() {
    return this.segments.map(i => i.pixelize());
  }

  pixelize_with_scales() {
    return this.segments.map(i => i.pixelize_with_scales());
  }

  static get_pixel(pixels: number[], arc: number, completion: number, y_offset = 0) {
    const n_pixels = pixels.length / 2;
    const idx = Math.floor(completion * n_pixels);
    const idxa = idx * 2;
    const idxb = idxa + 1;
    return [pixels[idxa] + y_offset * Math.sin(arc), pixels[idxb] + y_offset * Math.cos(arc)];
  }

  static get_slopes(pixels: number[], n_pixels_ahead = 5) {
    const n_pixels = Math.floor(pixels.length / 2);
    n_pixels_ahead = Math.min(n_pixels_ahead, n_pixels);
    function do_get_slope(idx: number, n_pixels_ahead: number) {
      let x1 = pixels[(idx - n_pixels_ahead) * 2];
      const y1 = pixels[(idx - n_pixels_ahead) * 2 + 1];
      const x2 = pixels[idx * 2];
      const y2 = pixels[idx * 2 + 1];
      if (x2 == x1) {
        x1 += 0.001;
      }
      return (y2 - y1) / (x2 - x1);
    }

    const slopes = [0];
    for (let i = 1; i < n_pixels_ahead; ++i) {
      slopes.push(do_get_slope(i, i));
    }
    if (slopes.length > 1) {
      slopes[0] = slopes[1];
    }
    for (let i = n_pixels_ahead; i < n_pixels; ++i) {
      slopes.push(do_get_slope(i, n_pixels_ahead));
    }
    return slopes;
  }
}