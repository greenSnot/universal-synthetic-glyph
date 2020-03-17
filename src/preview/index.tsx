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
export class Preview extends React.Component<
  {
    ctx: PreviewContext;
    on_ready: Function;
  },
  {}
> {
  ref = React.createRef<HTMLCanvasElement>();

  canvas_renderer: Renderer | undefined;

  private needs_update = false;

  componentDidMount() {
    const ctx = this.props.ctx;
    this.canvas_renderer = new Renderer(ctx.viewport_size, this.ref.current!);
    reaction(
      () => ctx.viewport_size,
      () => {
        this.canvas_renderer!.resize_viewport_size(ctx.viewport_size);
        this.update_preview();
      }
    );
    reaction(
      () => ctx.strokes,
      () => {
        this.update_preview();
      }
    );
    reaction(
      () => ctx.display_offset,
      () => {
        this.canvas_renderer!.update_offset(ctx.display_offset);
        this.update_preview();
      }
    );
    reaction(
      () => ctx.zoom,
      () => {
        this.canvas_renderer!.update_scale(ctx.zoom);
        this.update_preview();
      }
    );
    this.props.on_ready();
  }

  update_preview = () => {
    this.needs_update = true;
    requestAnimationFrame(() => {
      if (this.needs_update) {
        this.do_update_preview();
        this.needs_update = false;
      }
    });
  };

  do_update_preview = () => {
    if (!this.canvas_renderer) {
      return;
    }
    const ctx = this.props.ctx;
    const zoom = ctx.zoom;

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

    strokes_pixels_with_scales.forEach(stroke =>
      stroke.forEach(segment => {
        // this.canvas_renderer.set_brush_textures(resources.brushes.default);
        const pixels = segment.pixels;
        const scales = segment.scales;
        const n_pixel = pixels.length / 2;
        for (let i = 0; i < n_pixel; ++i) {
          this.canvas_renderer!.draw(((scales[i] || 1)) / 32, 0, pixels[i * 2], pixels[i * 2 + 1]);
        }
      })
    );

    this.canvas_renderer.do_draw();
  };

  render() {
    return <canvas ref={this.ref} />;
  }
}
