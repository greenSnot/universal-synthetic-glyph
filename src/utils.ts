import regression from 'regression';

import { TopLeftPoint, TopLeftBoundingBox } from './types';

export function point_to_arr(p: TopLeftPoint) {
  return [p.x, p.y];
}

export function resize_bounding_box(box: TopLeftBoundingBox, n: number) {
  return {
    offset_x: box.offset_x * n,
    offset_y: box.offset_y * n,
    width: box.width * n,
    height: box.height * n,
  };
}

export function deep_clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
  /*
  if (obj instanceof Array) {
    let res: any = [];
    for (let i in obj) {
      res[i].push(deep_clone(obj[i]));
    }
    return res;
  } else if (typeof obj === 'object') {
    let res: any = {};
    for (let i in obj) {
      res[i] = deep_clone(obj[i]);
    }
    return res;
  } else {
    return obj;
  }
  */
}

export function polynomial_regression(keypoints: TopLeftPoint[]) {
  const points_arr = keypoints.map(j => [j.x, j.y] as [number, number]);
  const order = points_arr.length - 1;
  return regression.polynomial(
    points_arr,
    { order },
  ).equation;
}

export function get_format(path: string) {
  return path.substr(path.lastIndexOf('.')).split('.')[1];
}

export function cross_product(x1: number, y1: number, x2: number, y2: number) {
  return x1 * y2 - y1 * x2;
}

export function dis_2d(x1: number, y1: number, x2 = 0, y2 = 0) {
  const t1 = x1 - x2;
  const t2 = y1 - y2;
  return Math.pow(t2 * t2 + t1 * t1, 0.5);
}

export function dis_to_line(x1: number, y1: number, x2: number, y2: number) {
  return - cross_product(x1, y1, x2, y2) / dis_2d(x2, y2);
}

export function forEach(t: any, f: Function) {
  for (let i = 0; i < t.length; ++i) {
    f(t[i], i);
  }
}

export function point_resize(p: TopLeftPoint, n: number) {
  p.x *= n;
  p.y *= n;
}

export function map(t: any, f: Function) {
  const res: any[] = [];
  forEach(t, (o: any, i: number) => {
    res.push(f(o, i));
  });
  return res;
}

export function filter(t: any, f: Function) {
  const res: any[] = [];
  forEach(t, (o: any, i: number) => {
    f(o, i) && res.push(o);
  });
  return res;
}

export const get_global_offset = (d: HTMLElement, root = document.body) => {
  let offset_x = 0;
  let offset_y = 0;
  while (d && d !== root) {
    offset_x += d.offsetLeft;
    offset_y += d.offsetTop;
    d = d.offsetParent as HTMLElement;
  }
  return {
    x: offset_x,
    y: offset_y,
  };
};