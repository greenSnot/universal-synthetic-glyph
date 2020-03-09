import { observer } from 'mobx-react';
import { reaction } from 'mobx';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

import { Renderer } from './canvas_renderer';
import { PreviewContext } from './context';
import Strokes from '../graph/strokes';

export * from './context';

@observer
export class Preview extends React.Component<{
  ctx: PreviewContext,
}, {}> {
  ref = React.createRef<HTMLCanvasElement>();

  canvas_renderer: Renderer | undefined;

  componentDidMount() {
    this.canvas_renderer = new Renderer(this.props.ctx.size, this.ref.current!);
    reaction(() => this.props.ctx.size, () => {
      this.canvas_renderer && this.canvas_renderer.resize(this.props.ctx.size);
    });
    reaction(() => this.props.ctx.strokes, () => {
      this.update_preview();
    });
  }

  update_preview = () => {
    if (!this.canvas_renderer) {
      return;
    }
    const ctx = this.props.ctx;
    const zoom = ctx.zoom;
    const display_offset = ctx.display_offset;

    // const glyph = resources.glyphs[this.state.glyph_id];
    const strokes = ctx.strokes;
    if (strokes.length < 1) {
      this.canvas_renderer.clear();
      this.canvas_renderer.do_draw();
      return;
    }

    const strokes_obj = Strokes.from_glyph_strokes(strokes);
    const strokes_pixels_with_scales = strokes_obj.pixelize_with_scales();

    this.canvas_renderer.clear();

    // TODO: BoundingBox

    // TODO
    this.canvas_renderer.set_brush_textures(['./brush1.png']);

    strokes_pixels_with_scales.forEach(stroke => stroke.forEach(segment => {
      if (!this.canvas_renderer) {
        return;
      }
      // this.canvas_renderer.set_brush_textures(resources.brushes.default);
      const pixels = segment.pixels;
      const scales = segment.scales;
      const n_pixel = pixels.length / 2;
      for (let i = 0; i < n_pixel; ++i) {
        this.canvas_renderer.draw(
          (scales[i] || 1) * zoom / 32,
          0,
          pixels[i * 2] + display_offset.x * zoom,
          pixels[i * 2 + 1] + display_offset.y * zoom,
        );
      }
    }));

    const staff_interval = zoom;
    const staff_offset_y = display_offset.y * zoom;
    
    // this.canvas_renderer.draw_staff(staff_offset_y, staff_interval);
    this.canvas_renderer.do_draw();
  }

  render() {
    return <canvas ref={this.ref}/>
  }
}
