/*
import { observable } from 'mobx';
import { Layout, Size } from '@shared/common';
import { GlyphStroke } from '@shared/glyph';
import { deep_clone, resize_glyph_strokes } from '@utils';

import cfg from '../cfg';

export default class StrokesEditorStore {
  @observable zoom = 1;
  @observable viewport_layout: Layout = {
    offset_x: 0, // relative to page
    offset_y: 0,
    width: 200,
    height: 200,
  };
  canvas_default_size: Size;
  @observable canvas_layout: Layout;
  @observable needs_update = false;
  @observable strokes: GlyphStroke[];
  @observable active_stroke_idx = 0;
  @observable active_segment_idx = 0;

  constructor(strokes: GlyphStroke[], public pixels_per_unit: number) {
    this.strokes = deep_clone(strokes) as GlyphStroke[];
    this.canvas_default_size = {
      width: this.viewport_layout.width / this.pixels_per_unit,
      height: this.viewport_layout.height / this.pixels_per_unit,
    };
    this.canvas_layout = { // unit should be staff_blank_height
      offset_x: 0,
      offset_y: (this.canvas_default_size.height / this.zoom - (cfg.n_staff - 1)) / 2,
      width: this.canvas_default_size.width / this.zoom,
      height: this.canvas_default_size.height / this.zoom,
    }
    resize_glyph_strokes(this.strokes, pixels_per_unit);
  }
}

*/