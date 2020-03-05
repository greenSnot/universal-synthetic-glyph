import { observer } from 'mobx-react';
import { reaction } from 'mobx';
import * as React from 'react';
import styled from 'styled-components';

import { PolynomialCurveEditorContext as Context } from './context';
export * from './context';
import { TopLeftPoint } from '../types';
import { get_global_offset, deep_clone } from '../utils';

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
`;

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

@observer
class KeyPoint extends React.Component<{
  p: TopLeftPoint
  idx: number,
  ctx: Context,
}, {}> {
  render() {
    const idx = this.props.idx;
    const ctx = this.props.ctx;
    const p = this.props.p;
    return <StyledKeyPoint
      key={idx}
      onMouseDown={(e) => {
        ctx.active_idx = idx;
        ctx.editing = true;
      }}
      onMouseUp={() => {
        ctx.editing = false;
      }}
      style={{
        border: idx === ctx.active_idx ?
          '2px solid #666' : 'none',
        left: p.x * ctx.width,
        top: (1 - p.y) * ctx.height,
      }}
    />;
  }
}

export enum KeyPointDiffType {
  alter = 1,
  insert,
  delete,
}

@observer
export class PolynomialCurveEditor extends React.Component<{
  ctx: Context,
  on_key_points_changed: (idx: number, diff_type: KeyPointDiffType) => void,
}, {}> {
  canvas_ref = React.createRef() as React.RefObject<HTMLCanvasElement>;

  update_offset() {
    const canvas = this.canvas_ref.current;
    if (!canvas) {
      return;
    }
    this.props.ctx.canvas_global_offset = get_global_offset(canvas);
  }

  componentDidMount() {
    this.update_offset();
    const ctx = this.props.ctx;
    const canvas = this.canvas_ref.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    reaction(() => ctx.equation, () => {
      if (!context) {
        return;
      }
      context.clearRect(0, 0, ctx.width, ctx.height);

      let pre;
      const pow = Math.pow;
      const equation = ctx.equation;
      context.beginPath();
      for (let i = 0; i < ctx.width; ++i) {
        const x = i / ctx.width;
        const order = equation.length - 1;

        let y = equation[order];
        for (let j = 0; j < order; ++j) {
          y += equation[j] * pow(x, order - j);
        }
        const p = {
          x,
          y,
        };
        if (pre) {
          context.moveTo(pre.x * ctx.width, (1 - pre.y) * ctx.height);
          context.lineTo(p.x * ctx.width, (1 - p.y) * ctx.height);
        }
        pre = p;
      }
      context.stroke();

      // draw coordinates
      context.setLineDash([4, 2]);
      context.strokeStyle = 'rgb(0, 0, 0)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(0, ctx.height);
      context.moveTo(0, ctx.height);
      context.lineTo(ctx.width, ctx.height);
      context.stroke();

      context.font = '12px Times New Roman';
      context.fillStyle = 'Black';
      for (let i = 0; i <= 1; i += 0.2) {
        context.fillText(i.toFixed(1), 5, ctx.height * (1 - i));
        if (i === 0) {
          continue;
        }
        context.fillText(i.toFixed(1), ctx.width * i, ctx.height - 5);
      }
    });
  }

  onMouseMove = (e: MouseEvent) => {
    const ctx = this.props.ctx;
    if (isNaN(ctx.active_idx)) return;
    const key_point = ctx.key_points[ctx.active_idx];
    key_point.y = parseFloat((1 - (e.pageY - ctx.canvas_global_offset.y) / ctx.height).toFixed(3));
    const x = parseFloat(((e.pageX - ctx.canvas_global_offset.x) / ctx.width).toFixed(3));
    if (
      (ctx.active_idx > 0 ? x > ctx.key_points[ctx.active_idx - 1].x : true) &&
      (ctx.active_idx + 1 < ctx.key_points.length
        ? x < ctx.key_points[ctx.active_idx + 1].x
        : true)
    ) {
      key_point.x = x;
    }
    this.props.on_key_points_changed(this.props.ctx.active_idx, KeyPointDiffType.alter);
  }

  onMouseUp = (e: MouseEvent) => {
    if (this.props.ctx.editing) {
      this.props.on_key_points_changed(this.props.ctx.active_idx, KeyPointDiffType.alter);
    }
    this.props.ctx.editing = false;
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
  }

  render() {
    const ctx = this.props.ctx;
    return <StyledEditor
      style={{
        width: ctx.width,
        height: ctx.height,
      }}
      onMouseDown={(e) => {
        const x = parseFloat(((e.pageX - ctx.canvas_global_offset.x) / ctx.width).toFixed(3));
        const y = parseFloat((1 - (e.pageY - ctx.canvas_global_offset.y) / ctx.height).toFixed(3));
        if (x < 1 && x > 0) {
          if (!ctx.editing) {
            let idx = 0;
            for (; idx < ctx.key_points.length; ++idx) {
              if (ctx.key_points[idx].x > x) {
                break;
              }
            }
            this.props.ctx.active_idx = idx;
            this.props.ctx.key_points.splice(idx, 0, { x, y });
            this.props.ctx.editing = true;
            this.props.on_key_points_changed(idx, KeyPointDiffType.insert);
          }
          document.addEventListener('mouseup', this.onMouseUp);
          document.addEventListener('mousemove', this.onMouseMove);
        }
      }}
    >
      <canvas
        ref={this.canvas_ref}
        width={ctx.width}
        height={ctx.height}
      />
      {ctx.key_points.map((i, idx) => <KeyPoint
        key={idx}
        idx={idx}
        p={i}
        ctx={this.props.ctx}
      />)}
      <StyledBtns>
        <StyledBtn
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            const ctx = this.props.ctx;
            if (ctx.active_idx === 0 || ctx.active_idx === ctx.key_points.length - 1) {
              return;
            }
            ctx.key_points.splice(ctx.active_idx, 1);
            this.props.on_key_points_changed(ctx.active_idx, KeyPointDiffType.delete);
          }}
        >remove</StyledBtn>
      </StyledBtns>
    </StyledEditor>;
  }
}
