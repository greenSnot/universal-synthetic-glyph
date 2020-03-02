import { TopLeftBoundingBox } from '../types';

/*
bezier: single cubic bezier
bezier_stroke: continuous cubic bezier
curve_pixels: pixelized bezier_stroke
curves: curve_pixels[]
beziers: bezier_stroke[]
*/
function quadratic_bezier(i: number, a: number, control: number, b: number) {
  return (1 - i) * (1 - i) * a + 2 * i * (1 - i) * control + i * i * b
}

function cubic_bezier(i: number, a: number, c1: number, c2: number, b: number) {
  return (1 - i) * quadratic_bezier(i, a, c1, c2) + i * quadratic_bezier(i, c1, c2, b)
}

let last_x = 0;
let last_y = 0;
export default class Segment {
  cubic_bezier: number[];
  euqation: number[];
  constructor(ax: number, ay: number, c1x: number, c1y: number, c2x: number, c2y: number, bx: number, by: number, equation: number[] = [0, 0.3]) {
    this.euqation = equation;
    this.cubic_bezier = [ax, ay, bx, by, c1x, c1y, c2x, c2y];
  }

  pixelize_with_scales() {
    const pixels = this.pixelize();
    const n_pixel = pixels.length;
    const order = this.euqation.length - 1;
    const equation = this.euqation;
    const scales: number[] = [];
    const pow = Math.pow;
    for (let i = 0; i < n_pixel; i += 2) {
      const progress = i / n_pixel;
      let scale = equation[order];
      for (let j = 0; j < order; ++j) {
        scale += equation[j] * pow(progress, order - j);
      }
      scales.push(scale);
    }
    return {
      pixels,
      scales,
    };
  }

  pixelize(target?: number[]) {
    const [ax, ay, bx, by, c1x, c1y, c2x, c2y] = this.cubic_bezier
    if (target) {
      target.push(ax, ay);
    }
    const q = target || [ax, ay];
    last_x = ax
    last_y = ay
    function dis(a: number, b: number, c: number, d: number) {
      return (a - c) * (a - c) + (b - d) * (b - d);
    }
    function candidates_push(x: number, y: number) {
      let flag = false;
      let tx = last_x
      let ty = last_y
      if (x - tx > 1) {
        tx += 1;
        flag = true;
      } else if (tx - x > 1) {
        tx -= 1;
        flag = true;
      }
      if (y - ty > 1) {
        ty += 1;
        flag = true;
      } else if (ty - y > 1) {
        ty -= 1;
        flag = true;
      }
      if (flag) {
        q.push(tx);
        q.push(ty);
      }
      q.push(x);
      q.push(y);
      last_x = x;
      last_y = y;
    }

    function dfs(x1: number, y1: number, x2: number, y2: number, low: number, high: number) {
      const t = (low + high) / 2.0;
      const x = (1 - t) * quadratic_bezier(t, ax, c1x, c2x) + t * quadratic_bezier(t, c1x, c2x, bx);
      const y = (1 - t) * quadratic_bezier(t, ay, c1y, c2y) + t * quadratic_bezier(t, c1y, c2y, by);
      const trend_low = dis(x, y, x1, y1) < 1;
      const trend_high = dis(x, y, x2, y2) < 1;
      if (trend_low || trend_high) {
        return;
      }
      dfs(x1, y1, x, y, low, t);
      candidates_push(x, y);
      dfs(x, y, x2, y2, t, high);
    }
    dfs(ax, ay, bx, by, 0, 1.0);
    return q;
  }

  bounding_box(): TopLeftBoundingBox {
    const [ax, ay, bx, by, c1x, c1y, c2x, c2y] = this.cubic_bezier;
    const PX = [ax, c1x, c2x, bx];
    const PY = [ay, c1y, c2y, by];
    const p = (x: number, y: number) => ({ X: x, Y: y });
    const P = [p(ax, ay), p(c1x, c1y), p(c2x, c2y), p(bx, by)];

    function evalBez(poly: number[], t: number) {
      return poly[0] * (1 - t) * (1 - t) * (1 - t) + 3 * poly[1] * t * (1 - t) * (1 - t) + 3 * poly[2] * t * t * (1 - t) + poly[3] * t * t * t
    }

    let a = 3 * P[3].X - 9 * P[2].X + 9 * P[1].X - 3 * P[0].X
    if (a == 0) {
      a = 0.000001;
    }
    let b = 6 * P[0].X - 12 * P[1].X + 6 * P[2].X;
    let c = 3 * P[1].X - 3 * P[0].X;
    let disc = b * b - 4 * a * c;
    let xl = P[0].X;
    let xh = P[0].X;
    if (P[3].X < xl) {
      xl = P[3].X;
    }
    if (P[3].X > xh) {
      xh = P[3].X;
    }
    if (disc >= 0) {
      const t1 = (-b + Math.sqrt(disc)) / (2 * a);
      if (t1 > 0 && t1 < 1) {
        const x1 = evalBez(PX, t1);
        if (x1 < xl) {
          xl = x1;
        }
        if (x1 > xh) {
          xh = x1;
        }
      }

      const t2 = (-b - Math.sqrt(disc)) / (2 * a);
      if (t2 > 0 && t2 < 1) {
        const x2 = evalBez(PX, t2);
        if (x2 < xl) {
          xl = x2;
        }
        if (x2 > xh) {
          xh = x2
        }
      }
    }

    a = 3 * P[3].Y - 9 * P[2].Y + 9 * P[1].Y - 3 * P[0].Y;
    b = 6 * P[0].Y - 12 * P[1].Y + 6 * P[2].Y;
    c = 3 * P[1].Y - 3 * P[0].Y;
    disc = b * b - 4 * a * c;
    let yl = P[0].Y;
    let yh = P[0].Y;
    if (P[3].Y < yl) {
      yl = P[3].Y
    }
    if (P[3].Y > yh) {
      yh = P[3].Y
    }
    if (disc >= 0) {
      a = a || 0.0001;
      const t1 = (-b + Math.sqrt(disc)) / (2 * a);

      if (t1 > 0 && t1 < 1) {
        const y1 = evalBez(PY, t1)
        yl = y1 < yl ? y1 : yl;
        yh = y1 > yh ? y1 : yh;
      }

      const t2 = (-b - Math.sqrt(disc)) / (2 * a);

      if (t2 > 0 && t2 < 1) {
        const y2 = evalBez(PY, t2);
        if (y2 < yl) {
          yl = y2
        }
        if (y2 > yh) {
          yh = y2;
        }
      }
    }

    const height = Math.abs(yl - yh);
    return {
      offset_x: xl,
      offset_y: yh - height,
      height,
      width: Math.abs(xh - xl),
    };
  }
}
