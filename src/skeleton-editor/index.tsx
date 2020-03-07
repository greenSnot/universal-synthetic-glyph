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

function viewport_point_to_canvas_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  // TODO
  return p;
}

function page_point_to_canvas_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  // TODO
  return p;
}

function canvas_point_to_page_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  // TODO
  return p;
}

function canvas_point_to_rendering_point(p: TopLeftPoint, ctx: Context): BottomLeftPoint {
  // TODO
  return p;
}

function page_point_in_viewport(p: TopLeftPoint, ctx: Context): boolean {
  return false;
}

@observer
class KeyPoint extends React.Component<
  {
    canvas_point: TopLeftPoint;
    segment_idx: number;
    stroke_idx: number;
    store: Context;
    onChange: (new_canvas_point: TopLeftPoint) => void;
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
    this.props.onChange(page_point_to_canvas_point(page_point, this.props.store));
  };

  render() {
    const idx = this.props.segment_idx;
    const store = this.props.store;
    const page_point = canvas_point_to_page_point(this.props.canvas_point, store);
    return (
      <StyledKeyPoint
        key={idx}
        onMouseDown={e => {
          e.stopPropagation();
          store.active_segment_idx = Math.floor(idx / 3);
          store.active_stroke_idx = this.props.stroke_idx;
          document.addEventListener('mousemove', this.onMouseMove);
          document.addEventListener('mouseup', this.onMouseUp);
        }}
        style={{
          display: page_point_in_viewport(page_point, store) && (idx % 3 === 1 || (store.active_stroke_idx === this.props.stroke_idx && (Math.floor(idx / 3) === store.active_segment_idx || Math.floor(idx / 3) + 1 === store.active_segment_idx))) ? 'inline-block' : 'none',
          border: store.active_stroke_idx === this.props.stroke_idx && Math.floor(idx / 3) === store.active_segment_idx ? '1px solid #fff' : 'none',
          left: page_point.x - store.viewport_offset.x,
          top: page_point.y - store.viewport_offset.y,
        }}/>
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

  mouse_down_canvas_point: BottomLeftPoint = { x: 0, y: 0 };

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
    reaction(
      () => store.needs_update === true,
      () => {
        store.needs_update = false;
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

    const n_staff = 5;
    const c_top_left = viewport_point_to_canvas_point({ x: 0, y: 0 }, ctx);
    const c_bottom_right = viewport_point_to_canvas_point({ x: ctx.viewport_size.width, y: ctx.viewport_size.height }, ctx);
    for (let i = 0; i < n_staff; ++i) {
      const y = i;
      const p1 = canvas_point_to_rendering_point({ x: c_top_left.x, y }, ctx);
      const p2 = canvas_point_to_rendering_point({ x: c_bottom_right.x, y }, ctx);
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

        (context.moveTo as any)(...point_to_arr(canvas_point_to_rendering_point(p, ctx)));
        (context.bezierCurveTo as any)(...point_to_arr(canvas_point_to_rendering_point(control_point_a, ctx)), ...point_to_arr(canvas_point_to_rendering_point(control_point_b, ctx)), ...point_to_arr(canvas_point_to_rendering_point(next_p, ctx)));
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
        (context.moveTo as any)(...point_to_arr(canvas_point_to_rendering_point(b, ctx)));
        (context.lineTo as any)(...point_to_arr(canvas_point_to_rendering_point(a, ctx)));
        (context.moveTo as any)(...point_to_arr(canvas_point_to_rendering_point(b, ctx)));
        (context.lineTo as any)(...point_to_arr(canvas_point_to_rendering_point(c, ctx)));
        context.stroke();
      }
    });

    // draw coordinates
    context.setLineDash([4, 2]);
    context.strokeStyle = 'rgb(0, 0, 0)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, ctx.viewport_size.width * window.devicePixelRatio);
    context.moveTo(0, 0);
    context.lineTo(ctx.viewport_size.height * window.devicePixelRatio, 0);
    context.stroke();

    context.font = '12px Times New Roman';
    context.fillStyle = 'Black';
    for (let i = 0; i <= 1; i += 0.2) {
      const x = i * ctx.viewport_size.width;
      const y = i * ctx.viewport_size.height;
      const canvas_point = viewport_point_to_canvas_point({ x, y }, ctx);
      context.fillText(canvas_point.y.toFixed(1), 5 * window.devicePixelRatio, y * window.devicePixelRatio);
      if (i === 0) {
        continue;
      }
      context.fillText(canvas_point.x.toFixed(1), x * window.devicePixelRatio, 12 * window.devicePixelRatio);
    }
  };
  onMouseMove = (e: MouseEvent) => {
    const store = this.props.ctx;

    const new_canvas_point = page_point_to_canvas_point(
      {
        x: e.pageX,
        y: e.pageY,
      },
      store
    );
    const diff_x = new_canvas_point.x - this.mouse_down_canvas_point.x;
    const diff_y = new_canvas_point.y - this.mouse_down_canvas_point.y;
    const segments = store.strokes[store.active_stroke_idx].segments;
    const segment = segments[store.active_segment_idx];
    segment.control_point_a.x = this.mouse_down_canvas_point.x + diff_x;
    segment.control_point_a.y = this.mouse_down_canvas_point.y + diff_y;
    segment.control_point_b.x = this.mouse_down_canvas_point.x - diff_x;
    segment.control_point_b.y = this.mouse_down_canvas_point.y - diff_y;
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
          const old_canvas_point = page_point_to_canvas_point(page_point, ctx);
          if (delta < 0) {
            ctx.zoom *= ctx.zoom_in_factor;
          } else if (delta > 0) {
            ctx.zoom *= ctx.zoom_out_factor;
          }
          const new_canvas_point = page_point_to_canvas_point(page_point, ctx);
          ctx.canvas_center.x += new_canvas_point.x - old_canvas_point.x;
          ctx.canvas_center.y += new_canvas_point.y - old_canvas_point.y;
          this.update_canvas();
          this.on_complete();
        }}
        style={{
          width: ctx.viewport_size.width,
          height: ctx.viewport_size.height,
        }}
        onMouseDown={e => {
          this.mouse_down_canvas_point = page_point_to_canvas_point(
            {
              x: e.pageX,
              y: e.pageY,
            },
            ctx
          );
          const x = this.mouse_down_canvas_point.x;
          const y = this.mouse_down_canvas_point.y;

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
          debugger
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
              onChange={new_canvas_point => {
                i.x = new_canvas_point.x;
                i.y = new_canvas_point.y;
                this.update_canvas();
              }}
              key={idx}
              segment_idx={idx}
              canvas_point={i}
              store={this.props.ctx}
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

              const canvas_width = Math.max(width, height);
              const canvas_height = Math.max(width, height);
              ctx.zoom = 1;
              ctx.canvas_center = {
                x: -bounding_box.offset_x,
                y: -bounding_box.offset_y,
              };
              ctx.canvas_size = {
                width: canvas_width,
                height: canvas_height,
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

