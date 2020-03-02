/*
import React from 'react';

import Store from './strokesEditorStore';
import { TopLeftPoint, TopLeftBoundingBox } from './types/common';

import { get_global_offset, point_to_arr } from '@utils';
import { GlyphSegment } from '@shared/glyph';

const zoom_in_factor = 1.03;
const zoom_out_factor = 0.97;

function segments_to_points(segments: GlyphSegment[]) {
  const points: TopLeftPoint[] = [];
  segments.forEach(i => points.push(i.control_point_a, i.pivot_point, i.control_point_b));
  return points;
}

function page_point_to_canvas_point(p: TopLeftPoint, store: Store): TopLeftPoint {
  return {
    x: ((p.x - store.viewport_layout.offset_x) / store.zoom) / store.pixels_per_unit - store.canvas_layout.offset_x,
    y: ((p.y - store.viewport_layout.offset_y) / store.zoom) / store.pixels_per_unit - store.canvas_layout.offset_y,
  };
}

function page_point_in_viewport(p: TopLeftPoint, store: Store) {
  return p.x >= store.viewport_layout.offset_x &&
    p.y >= store.viewport_layout.offset_y &&
    p.y <= store.viewport_layout.offset_y + store.viewport_layout.height &&
    p.x <= store.viewport_layout.offset_x + store.viewport_layout.width;
}

function canvas_point_to_page_point(p: TopLeftPoint, store: Store): TopLeftPoint {
  return {
    x: store.viewport_layout.offset_x + (store.zoom * (p.x + store.canvas_layout.offset_x) * store.pixels_per_unit),
    y: store.viewport_layout.offset_y + (store.zoom * (p.y + store.canvas_layout.offset_y) * store.pixels_per_unit),
  };
}

function canvas_point_to_rendering_point(p: TopLeftPoint, store: Store): TopLeftPoint {
  return {
    x: (store.zoom * (p.x + store.canvas_layout.offset_x) * store.pixels_per_unit) * window.devicePixelRatio,
    y: (store.zoom * (p.y + store.canvas_layout.offset_y) * store.pixels_per_unit) * window.devicePixelRatio,
  };
}

function viewport_point_to_canvas_point(p: TopLeftPoint, store: Store): TopLeftPoint {
  return {
    x: p.x / store.viewport_layout.width * store.canvas_default_size.width / store.zoom - store.canvas_layout.offset_x,
    y: p.y / store.viewport_layout.height * store.canvas_default_size.height / store.zoom - store.canvas_layout.offset_y,
  };
}

@observer
class Keypoint extends React.Component<{
  canvas_point: TopLeftPoint
  segment_idx: number,
  stroke_idx: number,
  store: Store,
  onChange: (new_canvas_point: TopLeftPoint) => void,
  onComplete: Function,
}, {}> {
  onMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.props.onComplete();
  };

  onMouseMove = (e: MouseEvent) => {
    const page_point: TopLeftPoint = {
      x: e.pageX,
      y: e.pageY,
    };
    this.props.onChange(page_point_to_canvas_point(page_point, this.props.store));
  };

  render() {
    const idx = this.props.segment_idx;
    const store = this.props.store;
    const page_point = canvas_point_to_page_point(this.props.canvas_point, store);
    return <div
      key={idx}
      className={styles.keypoint}
      onMouseDown={(e) => {
        e.stopPropagation();
        store.active_segment_idx = Math.floor(idx / 3);
        store.active_stroke_idx = this.props.stroke_idx;
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
      }}
      style={{
        display: page_point_in_viewport(page_point, store) && (
          idx % 3 === 1 ||
          (store.active_stroke_idx === this.props.stroke_idx && (
            Math.floor(idx / 3) === store.active_segment_idx ||
            Math.floor(idx / 3) + 1 === store.active_segment_idx
          ))
        ) ? 'inline-block' : 'none',
        border: store.active_stroke_idx === this.props.stroke_idx && Math.floor(idx / 3) === store.active_segment_idx ?
          '1px solid #fff' : 'none',
        left: page_point.x - store.viewport_layout.offset_x,
        top: page_point.y - store.viewport_layout.offset_y,
      }}
    ></div>;
  }
}

@observer
class BezierEditor extends React.Component<{
  store: Store,
  onComplete: Function,
  onReady: Function,
  onSelectChange: (active_stroke_idx: number, active_segment_idx: number) => void,
}, {}> {
  canvas_ref = React.createRef() as React.RefObject<HTMLCanvasElement>;

  mouse_down_canvas_point: TopLeftPoint = {x: 0, y: 0};

  componentDidMount() {
    this.update_offset();

    const store = this.props.store;
    reaction(() => store.active_segment_idx, () => {
      this.props.onSelectChange(store.active_stroke_idx, store.active_segment_idx);
      this.update_canvas();
    });
    reaction(() => store.active_stroke_idx, () => {
      this.props.onSelectChange(store.active_stroke_idx, store.active_segment_idx);
      this.update_canvas();
    });
    reaction(() => store.needs_update === true, () => {
      store.needs_update = false;
      this.update_canvas();
    });

    this.update_canvas();
    this.props.onReady();
  }
  componentDidUpdate() {
    this.update_offset();
  }
  update_offset() {
    const canvas = this.canvas_ref.current;
    if (!canvas) {
      return;
    }
    const store = this.props.store;
    const offset = get_global_offset(canvas);
    store.viewport_layout.offset_x = offset.x;
    store.viewport_layout.offset_y = offset.y;
  }
  update_canvas = () => {
    const canvas = this.canvas_ref.current;
    const store = this.props.store;
    if (!canvas) {
      return;
    }
    canvas.style.width = store.viewport_layout.width + 'px';
    canvas.style.height = store.viewport_layout.height + 'px';
    canvas.width = store.viewport_layout.width * window.devicePixelRatio;
    canvas.height = store.viewport_layout.height * window.devicePixelRatio;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);

    // staffs
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.lineWidth = 1;

    const n_staff = 5;
    const c_top_left = viewport_point_to_canvas_point({ x: 0, y: 0 }, store);
    const c_bottom_right = viewport_point_to_canvas_point({ x: store.viewport_layout.width, y: store.viewport_layout.height }, store);
    for (let i = 0; i < n_staff; ++i) {
      const y = i;
      const p1 = canvas_point_to_rendering_point({x: c_top_left.x, y}, store);
      const p2 = canvas_point_to_rendering_point({x: c_bottom_right.x, y}, store);
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.stroke();
    }

    store.strokes.forEach((stroke, stroke_idx) => {
      const points = segments_to_points(stroke.segments);

      const n_segment = stroke.segments.length;
      for (let i = 0; i < n_segment - 1; ++i) {
        const p = points[i * 3 + 1];
        const control_point_a = points[i * 3 + 2];
        const control_point_b = points[i * 3 + 3];
        const next_p = points[i * 3 + 4];
        context.strokeStyle = stroke_idx === store.active_stroke_idx && i === store.active_segment_idx - 1 ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 255)';
        context.beginPath();

        (context.moveTo as any)(...point_to_arr(canvas_point_to_rendering_point(p, store)));
        (context.bezierCurveTo as any)(
          ...point_to_arr(canvas_point_to_rendering_point(control_point_a, store)),
          ...point_to_arr(canvas_point_to_rendering_point(control_point_b, store)),
          ...point_to_arr(canvas_point_to_rendering_point(next_p, store)),
        );
        context.stroke();
      }

      if (stroke_idx !== store.active_stroke_idx) {
        return;
      }

      for (let i = 0, j = store.active_segment_idx; i < 2; ++i) {
        const t = j * 3 - i * 3;
        if (t + 2 >= points.length || t < 0) break;
        const a = points[t];
        const b = points[t + 1];
        const c = points[t + 2];

        context.beginPath();
        (context.moveTo as any)(...point_to_arr(canvas_point_to_rendering_point(b, store)));
        (context.lineTo as any)(...point_to_arr(canvas_point_to_rendering_point(a, store)));
        (context.moveTo as any)(...point_to_arr(canvas_point_to_rendering_point(b, store)));
        (context.lineTo as any)(...point_to_arr(canvas_point_to_rendering_point(c, store)));
        context.stroke();
      }
    });

    // draw coordinates
    context.setLineDash([4, 2]);
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, store.viewport_layout.width * window.devicePixelRatio);
    context.moveTo(0, 0);
    context.lineTo(store.viewport_layout.height * window.devicePixelRatio, 0);
    context.stroke();

    context.font = '12px Times New Roman';
    context.fillStyle = 'Black';
    for (let i = 0; i <= 1; i += 0.2) {
      const x = i * store.viewport_layout.width;
      const y = i * store.viewport_layout.height;
      const canvas_point = viewport_point_to_canvas_point({x, y}, store);
      context.fillText(canvas_point.y.toFixed(1), 5 * window.devicePixelRatio, y * window.devicePixelRatio);
      if (i === 0) {
        continue;
      }
      context.fillText(canvas_point.x.toFixed(1), x * window.devicePixelRatio, 12 * window.devicePixelRatio);
    }
  };
  onMouseMove = (e: MouseEvent) => {
    const store = this.props.store;

    const new_canvas_point = page_point_to_canvas_point({
      x: e.pageX,
      y: e.pageY,
    }, store);
    const diff_x = new_canvas_point.x - this.mouse_down_canvas_point.x;
    const diff_y = new_canvas_point.y - this.mouse_down_canvas_point.y;
    const segments = store.strokes[store.active_stroke_idx].segments;
    const segment = segments[store.active_segment_idx];
    segment.control_point_a.x = this.mouse_down_canvas_point.x + diff_x;
    segment.control_point_a.y = this.mouse_down_canvas_point.y + diff_y;
    segment.control_point_b.x = this.mouse_down_canvas_point.x - diff_x;
    segment.control_point_b.y = this.mouse_down_canvas_point.y - diff_y;
    this.update_canvas();
  }
  onMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.on_complete();
  }

  on_complete() {
    this.props.onComplete();
  }

  render() {
    const store = this.props.store;
    return <div
      className={styles.bezierEditor}
      onWheel={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const delta = e.deltaY;
        if (delta === 0) return;
        const page_point: TopLeftPoint = {
          x: e.pageX,
          y: e.pageY,
        };
        const old_canvas_point = page_point_to_canvas_point(page_point, store);
        if (delta < 0) {
          store.zoom *= zoom_in_factor;
        } else if (delta > 0) {
          store.zoom *= zoom_out_factor;
        }
        const new_canvas_point = page_point_to_canvas_point(page_point, store);
        store.canvas_layout.offset_x += new_canvas_point.x - old_canvas_point.x;
        store.canvas_layout.offset_y += new_canvas_point.y - old_canvas_point.y;
        this.update_canvas();
        this.on_complete();
      }}
      style={{
        width: store.viewport_layout.width,
        height: store.viewport_layout.height,
      }}
      onMouseDown={(e) => {
        this.mouse_down_canvas_point = page_point_to_canvas_point({
          x: e.pageX,
          y: e.pageY,
        }, store);
        const x = this.mouse_down_canvas_point.x;
        const y = this.mouse_down_canvas_point.y;

        let stroke;
        const new_segment: GlyphSegment = {
          control_point_a: { x, y },
          pivot_point: { x, y },
          control_point_b: { x, y },
        };
        if (!store.strokes.length) {
          store.active_stroke_idx = 0;
          stroke = {segments: [new_segment]};
          store.strokes.push(stroke);
        } else {
          stroke = store.strokes[store.active_stroke_idx]
          stroke.segments.push(new_segment);
        }

        store.active_segment_idx = stroke.segments.length - 1;
        this.update_canvas();
        this.on_complete();
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove);
      }}
    >
      <canvas
        ref={this.canvas_ref}
      />
      {store.strokes.map(
        (stroke, stroke_idx) => segments_to_points(stroke.segments).map((i, idx) =>
          <Keypoint
            stroke_idx={stroke_idx}
            onComplete={() => this.on_complete()}
            onChange={(new_canvas_point) => {
              i.x = new_canvas_point.x;
              i.y = new_canvas_point.y;
              this.update_canvas();
            }}
            key={idx}
            segment_idx={idx}
            canvas_point={i}
            store={this.props.store}
          />
        ))}
      <div className={styles.buttons}>
        <div
          className={styles.btn}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            const store = this.props.store;
            const stroke = store.strokes[store.active_stroke_idx];
            if (!stroke) {
              return;
            }
            stroke.segments.splice(store.active_segment_idx, 1);
            if (stroke.segments.length === 0) {
              store.strokes.splice(store.active_stroke_idx, 1);
              store.active_stroke_idx--;
              store.active_segment_idx = 0;
              this.update_canvas();
              this.props.onComplete();
              return;
            }
            store.active_segment_idx = stroke.segments.length - 1;
            this.update_canvas();
            this.on_complete();
          }}
        >remove</div>
        <div
          className={styles.btn}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            const store = this.props.store;
            if (store.active_segment_idx < 1) {
              return;
            }
            const stroke = store.strokes[store.active_stroke_idx];
            const segments = stroke.segments.splice(store.active_segment_idx)
            store.strokes.push({
              segments,
            });
            store.active_stroke_idx = store.strokes.length - 1;
            store.active_segment_idx = 0;
            this.on_complete();
          }}
        >split</div>
        <div
          className={styles.btn}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            const strokes = this.props.store.strokes;
            const min_x = strokes.reduce((m, i) => Math.min(m, i.segments.reduce((k, j) => Math.min(k, j.control_point_a.x, j.control_point_b.x, j.pivot_point.x), Infinity)), Infinity);
            const min_y = strokes.reduce((m, i) => Math.min(m, i.segments.reduce((k, j) => Math.min(k, j.control_point_a.y, j.control_point_b.y, j.pivot_point.y), Infinity)), Infinity);
            const max_x = strokes.reduce((m, i) => Math.max(m, i.segments.reduce((k, j) => Math.max(k, j.control_point_a.x, j.control_point_b.x, j.pivot_point.x), - Infinity)), - Infinity);
            const max_y = strokes.reduce((m, i) => Math.max(m, i.segments.reduce((k, j) => Math.max(k, j.control_point_a.y, j.control_point_b.y, j.pivot_point.y), - Infinity)), - Infinity);
            const width = max_x - min_x;
            const height = max_y - min_y;
            const bounding_box: TopLeftBoundingBox = {
              offset_x: min_x,
              offset_y: min_y,
              width,
              height,
            };

            const canvas_width = Math.max(width, height);
            const canvas_height = Math.max(width, height);
            store.zoom = store.canvas_default_size.width / canvas_width;
            store.canvas_layout = {
              offset_x: - bounding_box.offset_x,
              offset_y: - bounding_box.offset_y,
              width: canvas_width,
              height: canvas_height,
            };
            this.update_canvas();
            this.on_complete();
          }}
          >relocate</div>
      </div>
    </div>;
  }
}

export default BezierEditor;

*/