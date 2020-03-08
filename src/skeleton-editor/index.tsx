import * as React from 'react';
import { observer } from 'mobx-react';
import { reaction } from 'mobx';
import styled from 'styled-components';

import { SkeletonEditorContext as Context } from './context';
import { GlyphSegment, BottomLeftPoint, TopLeftPoint, TopLeftBoundingBox } from '../types';
import { get_global_offset, point_to_arr } from '../utils';
export * from './context';

const StyledEditor = styled.div`
  display: inline-block;
  border: 1px solid #aaa;
  position: relative;
`;

const StyledBtn = styled.div`
  margin-left: 5px;
  font-size: 12px;
  min-width: 40px;
  line-height: 20px;
  height: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
`;

const StyledBtns = styled.div`
  position: absolute;
  bottom: 2px;
  left: 0px;
  display: flex;
`;

const StyledKeyPoint = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  position: absolute;
  z-index: 3;
  background: #fff;
  box-shadow: 0 0 3px;
  transform: translateX(-50%) translateY(-50%);
  &:nth-child(3n) {
    background: rgba(125, 255, 0, 0.5);
  }
`;

function segments_to_points(segments: GlyphSegment[]) {
  const points: BottomLeftPoint[] = [];
  segments.forEach(i => points.push(i.control_point_a, i.pivot_point, i.control_point_b));
  return points;
}

function viewport_point_to_display_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  return {
    x: p.x / ctx.zoom + ctx.display_offset.x,
    y: p.y / ctx.zoom + ctx.display_offset.y,
  };
}

function page_point_to_display_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  return viewport_point_to_display_point({
    x: p.x - ctx.viewport_offset.x,
    y: p.y - ctx.viewport_offset.y,
  }, ctx);
}

function display_point_to_page_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  const t = display_point_to_viewport_point(p, ctx);
  return {
    x: t.x + ctx.viewport_offset.x,
    y: t.y + ctx.viewport_offset.y,
  };
}

function display_point_to_viewport_point(p: TopLeftPoint, ctx: Context): TopLeftPoint {
  return {
    x: (p.x - ctx.display_offset.x) * ctx.zoom,
    y: (p.y - ctx.display_offset.y) * ctx.zoom,
  };
}

function display_point_to_rendering_point(p: TopLeftPoint, ctx: Context): TopLeftPoint {
  const t = display_point_to_viewport_point(p, ctx);
  return {
    x: t.x * window.devicePixelRatio,
    y: t.y * window.devicePixelRatio,
  };
}

function page_point_in_viewport(p: TopLeftPoint, ctx: Context): boolean {
  return p.x >= ctx.viewport_offset.x &&
    p.y >= ctx.viewport_offset.y &&
    p.y <= ctx.viewport_offset.y + ctx.viewport_size.height &&
    p.x <= ctx.viewport_offset.x + ctx.viewport_size.width;
}

@observer
class KeyPoint extends React.Component<
  {
    display_point: TopLeftPoint;
    segment_idx: number;
    stroke_idx: number;
    ctx: Context;
    onChange: (new_display_point: TopLeftPoint) => void;
    onComplete: Function;
  },
  {}
> {
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
    this.props.onChange(page_point_to_display_point(page_point, this.props.ctx));
  };

  render() {
    const idx = this.props.segment_idx;
    const ctx = this.props.ctx;
    const page_point = display_point_to_page_point(this.props.display_point, ctx);
    return (
      <StyledKeyPoint
        key={idx}
        onMouseDown={e => {
          e.stopPropagation();
          ctx.active_segment_idx = Math.floor(idx / 3);
          ctx.active_stroke_idx = this.props.stroke_idx;
          document.addEventListener('mousemove', this.onMouseMove);
          document.addEventListener('mouseup', this.onMouseUp);
        }}
        style={{
          display: page_point_in_viewport(page_point, ctx) && (idx % 3 === 1 || (ctx.active_stroke_idx === this.props.stroke_idx && (Math.floor(idx / 3) === ctx.active_segment_idx || Math.floor(idx / 3) + 1 === ctx.active_segment_idx))) ? 'inline-block' : 'none',
          border: ctx.active_stroke_idx === this.props.stroke_idx && Math.floor(idx / 3) === ctx.active_segment_idx ? '1px solid #fff' : 'none',
          left: page_point.x - ctx.viewport_offset.x,
          top: page_point.y - ctx.viewport_offset.y,
        }}
      />
    );
  }
}

@observer
export class SkeletonEditor extends React.Component<
  {
    ctx: Context;
    onComplete: Function;
    onReady: Function;
    onSelectChange: (active_stroke_idx: number, active_segment_idx: number) => void;
  },
  {}
> {
  canvas_ref = React.createRef() as React.RefObject<HTMLCanvasElement>;

  mouse_down_display_point: BottomLeftPoint = { x: 0, y: 0 };

  componentDidMount() {
    this.update_offset();

    const store = this.props.ctx;
    reaction(
      () => store.active_segment_idx,
      () => {
        this.props.onSelectChange(store.active_stroke_idx, store.active_segment_idx);
        this.update_canvas();
      }
    );
    reaction(
      () => store.active_stroke_idx,
      () => {
        this.props.onSelectChange(store.active_stroke_idx, store.active_segment_idx);
        this.update_canvas();
      }
    );

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
    const ctx = this.props.ctx;
    const offset = get_global_offset(canvas);
    ctx.viewport_offset = offset;
  }
  update_canvas = () => {
    const canvas = this.canvas_ref.current;
    const ctx = this.props.ctx;
    if (!canvas) {
      return;
    }
    canvas.style.width = ctx.viewport_size.width + 'px';
    canvas.style.height = ctx.viewport_size.height + 'px';
    canvas.width = ctx.viewport_size.width * window.devicePixelRatio;
    canvas.height = ctx.viewport_size.height * window.devicePixelRatio;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);

    // staffs
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.lineWidth = 1;

    const c_top_left_x = viewport_point_to_display_point({ x: 0, y: 0 }, ctx).x;
    const c_bottom_right_x = viewport_point_to_display_point({ x: ctx.viewport_size.width, y: 0 }, ctx).x;
    for (let i = 0; i < ctx.n_lines; ++i) {
      const y = i * ctx.lines_total_height / (ctx.n_lines - 1);
      const p1 = display_point_to_rendering_point({ x: c_top_left_x, y }, ctx);
      const p2 = display_point_to_rendering_point({ x: c_bottom_right_x, y }, ctx);
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.stroke();
    }

    ctx.strokes.forEach((stroke, stroke_idx) => {
      const points = segments_to_points(stroke.segments);

      const n_segment = stroke.segments.length;
      for (let i = 0; i < n_segment - 1; ++i) {
        const p = points[i * 3 + 1];
        const control_point_a = points[i * 3 + 2];
        const control_point_b = points[i * 3 + 3];
        const next_p = points[i * 3 + 4];
        context.strokeStyle = stroke_idx === ctx.active_stroke_idx && i === ctx.active_segment_idx - 1 ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 255)';
        context.beginPath();

        (context.moveTo as any)(...point_to_arr(display_point_to_rendering_point(p, ctx)));
        (context.bezierCurveTo as any)(...point_to_arr(display_point_to_rendering_point(control_point_a, ctx)), ...point_to_arr(display_point_to_rendering_point(control_point_b, ctx)), ...point_to_arr(display_point_to_rendering_point(next_p, ctx)));
        context.stroke();
      }

      if (stroke_idx !== ctx.active_stroke_idx) {
        return;
      }

      for (let i = 0, j = ctx.active_segment_idx; i < 2; ++i) {
        const t = j * 3 - i * 3;
        if (t + 2 >= points.length || t < 0) break;
        const a = points[t];
        const b = points[t + 1];
        const c = points[t + 2];

        context.beginPath();
        (context.moveTo as any)(...point_to_arr(display_point_to_rendering_point(b, ctx)));
        (context.lineTo as any)(...point_to_arr(display_point_to_rendering_point(a, ctx)));
        (context.moveTo as any)(...point_to_arr(display_point_to_rendering_point(b, ctx)));
        (context.lineTo as any)(...point_to_arr(display_point_to_rendering_point(c, ctx)));
        context.stroke();
      }
    });

    // draw coordinates
    const base = 10;
    const h_interval = Math.pow(base, Math.floor(Math.log(ctx.display_size.height)/Math.log(base)));
    const w_interval = Math.pow(base, Math.floor(Math.log(ctx.display_size.width)/Math.log(base)));
    const n_sub_marks = 4;
    const w_marks: number[] = [];
    const h_marks: number[] = [];
    for (let i = ctx.display_offset.x - w_interval * 2, j = ctx.display_size.width + ctx.display_offset.x + w_interval * 2; i < j; i += w_interval) {
      if (w_marks.length) {
        const prev = w_marks[w_marks.length - 1];
        for (let k = 1; k < n_sub_marks; ++k) {
          w_marks.push(prev + k * w_interval / n_sub_marks);
        }
      }
      w_marks.push(i - (i % w_interval));
    }
    for (let i = ctx.display_offset.y - h_interval * 2, j = ctx.display_size.height + ctx.display_offset.y + h_interval * 2; i < j; i += h_interval) {
      if (h_marks.length) {
        const prev = h_marks[h_marks.length - 1];
        for (let k = 1; k < n_sub_marks; ++k) {
          h_marks.push(prev + k * h_interval / n_sub_marks);
        }
      }
      h_marks.push(i - (i % h_interval));
    }

    const dash_width = 4;
    const max_dash_height = 20;
    const min_dash_height = 10;
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.font = '12px Times New Roman';
    context.fillStyle = 'Black';
    const ratio = window.devicePixelRatio;
    for (let j = 0; j < w_marks.length; ++j) {
      const i = w_marks[j];
      const dash_height = j % n_sub_marks === 0 ? max_dash_height : min_dash_height;
      context.lineWidth = dash_height;
      context.beginPath();
      const a = display_point_to_rendering_point({
        x: i,
        y: ctx.display_offset.y,
      }, ctx);
      context.moveTo(a.x - dash_width / 2, a.y);
      context.lineTo(a.x + dash_width / 2, a.y);
      if (j % n_sub_marks === 0) {
        context.fillText(i.toFixed(2), a.x + dash_width, a.y + dash_height);
      }
      context.stroke();
    }
    for (let j = 0; j < h_marks.length; ++j) {
      const i = h_marks[j];
      const dash_height = j % n_sub_marks === 0 ? max_dash_height : min_dash_height;
      context.lineWidth = dash_height;
      context.beginPath();
      const a = display_point_to_rendering_point({
        x: ctx.display_offset.x,
        y: i,
      }, ctx);
      context.moveTo(a.x, a.y - dash_width / 2);
      context.lineTo(a.x, a.y + dash_width / 2);
      if (j % n_sub_marks === 0) {
        context.fillText(i.toFixed(2), a.x + dash_height, a.y + dash_width);
      }
      context.stroke();
    }

  };
  onMouseMove = (e: MouseEvent) => {
    const store = this.props.ctx;

    const new_display_point = page_point_to_display_point(
      {
        x: e.pageX,
        y: e.pageY,
      },
      store
    );
    const diff_x = new_display_point.x - this.mouse_down_display_point.x;
    const diff_y = new_display_point.y - this.mouse_down_display_point.y;
    const segments = store.strokes[store.active_stroke_idx].segments;
    const segment = segments[store.active_segment_idx];
    segment.control_point_a.x = this.mouse_down_display_point.x + diff_x;
    segment.control_point_a.y = this.mouse_down_display_point.y + diff_y;
    segment.control_point_b.x = this.mouse_down_display_point.x - diff_x;
    segment.control_point_b.y = this.mouse_down_display_point.y - diff_y;
    this.update_canvas();
  };
  onMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.on_complete();
  };

  on_complete() {
    this.props.onComplete();
  }

  render() {
    const ctx = this.props.ctx;
    return (
      <StyledEditor
        onWheel={e => {
          e.stopPropagation();
          e.preventDefault();
          const delta = e.deltaY;
          if (delta === 0) return;
          const page_point: TopLeftPoint = {
            x: e.pageX,
            y: e.pageY,
          };
          const old_display_point = page_point_to_display_point(page_point, ctx);
          if (delta < 0) {
            ctx.zoom *= ctx.zoom_in_factor;
          } else if (delta > 0) {
            ctx.zoom *= ctx.zoom_out_factor;
          }
          const new_display_point = page_point_to_display_point(page_point, ctx);

          const t = viewport_point_to_display_point({
            x: ctx.viewport_size.width,
            y: ctx.viewport_size.height,
          }, ctx);
          ctx.display_size = {
            width: t.x - ctx.display_offset.x,
            height: t.y - ctx.display_offset.y,
          };
          ctx.display_offset.x -= new_display_point.x - old_display_point.x;
          ctx.display_offset.y -= new_display_point.y - old_display_point.y;
          this.update_canvas();
          this.on_complete();
        }}
        style={{
          width: ctx.viewport_size.width,
          height: ctx.viewport_size.height,
        }}
        onMouseDown={e => {
          this.mouse_down_display_point = page_point_to_display_point(
            {
              x: e.pageX,
              y: e.pageY,
            },
            ctx
          );
          const x = this.mouse_down_display_point.x;
          const y = this.mouse_down_display_point.y;

          let stroke;
          const new_segment: GlyphSegment = {
            deviation_graph: {
              key_points: [],
              equation: [],
            },
            weight_graph: {
              key_points: [],
              equation: [],
            },
            control_point_a: { x, y },
            pivot_point: { x, y },
            control_point_b: { x, y },
          };
          if (!ctx.strokes.length) {
            ctx.active_stroke_idx = 0;
            stroke = { segments: [new_segment] };
            ctx.strokes.push(stroke);
          } else {
            stroke = ctx.strokes[ctx.active_stroke_idx];
            stroke.segments.push(new_segment);
          }

          ctx.active_segment_idx = stroke.segments.length - 1;
          this.update_canvas();
          this.on_complete();
          document.addEventListener('mouseup', this.onMouseUp);
          document.addEventListener('mousemove', this.onMouseMove);
        }}>
        <canvas ref={this.canvas_ref} />
        {ctx.strokes.map((stroke, stroke_idx) =>
          segments_to_points(stroke.segments).map((i, idx) => (
            <KeyPoint
              stroke_idx={stroke_idx}
              onComplete={() => this.on_complete()}
              onChange={new_display_point => {
                i.x = new_display_point.x;
                i.y = new_display_point.y;
                this.update_canvas();
              }}
              key={idx}
              segment_idx={idx}
              display_point={i}
              ctx={this.props.ctx}
            />
          ))
        )}
        <StyledBtns>
          <StyledBtn
            onMouseDown={e => e.stopPropagation()}
            onClick={() => {
              const store = this.props.ctx;
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
            }}>
            remove
          </StyledBtn>
          <StyledBtn
            onMouseDown={e => e.stopPropagation()}
            onClick={() => {
              const store = this.props.ctx;
              if (store.active_segment_idx < 1) {
                return;
              }
              const stroke = store.strokes[store.active_stroke_idx];
              const segments = stroke.segments.splice(store.active_segment_idx);
              store.strokes.push({
                segments,
              });
              store.active_stroke_idx = store.strokes.length - 1;
              store.active_segment_idx = 0;
              this.on_complete();
            }}>
            split
          </StyledBtn>
          <StyledBtn
            onMouseDown={e => e.stopPropagation()}
            onClick={() => {
              const strokes = this.props.ctx.strokes;
              const min_x = strokes.reduce(
                (m, i) =>
                  Math.min(
                    m,
                    i.segments.reduce((k, j) => Math.min(k, j.control_point_a.x, j.control_point_b.x, j.pivot_point.x), Infinity)
                  ),
                Infinity
              );
              const min_y = strokes.reduce(
                (m, i) =>
                  Math.min(
                    m,
                    i.segments.reduce((k, j) => Math.min(k, j.control_point_a.y, j.control_point_b.y, j.pivot_point.y), Infinity)
                  ),
                Infinity
              );
              const max_x = strokes.reduce(
                (m, i) =>
                  Math.max(
                    m,
                    i.segments.reduce((k, j) => Math.max(k, j.control_point_a.x, j.control_point_b.x, j.pivot_point.x), -Infinity)
                  ),
                -Infinity
              );
              const max_y = strokes.reduce(
                (m, i) =>
                  Math.max(
                    m,
                    i.segments.reduce((k, j) => Math.max(k, j.control_point_a.y, j.control_point_b.y, j.pivot_point.y), -Infinity)
                  ),
                -Infinity
              );
              const width = max_x - min_x;
              const height = max_y - min_y;
              const bounding_box: TopLeftBoundingBox = {
                offset_x: min_x,
                offset_y: min_y,
                width,
                height,
              };

              const ratio = Math.max(width, height) / Math.min(ctx.display_size.width, ctx.display_size.height);
              ctx.zoom /= ratio;
              ctx.display_offset = {
                x: bounding_box.offset_x,
                y: bounding_box.offset_y,
              };
              ctx.display_size = {
                width: ctx.display_size.width * ratio,
                height: ctx.display_size.height * ratio,
              };
              this.update_canvas();
              this.on_complete();
            }}>
            relocate
          </StyledBtn>
        </StyledBtns>
      </StyledEditor>
    );
  }
}
