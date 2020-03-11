import { observable } from 'mobx';
import { Size, TopLeftPoint, BottomLeftPoint, GlyphStroke } from '../types';

const default_viewport_width = 200;
const default_viewport_height = 200;
const default_zoom = 0.75;
const default_lines_total_height = 100;

export class SkeletonEditorContext {
  @observable n_lines = 5;
  @observable lines_total_height = default_lines_total_height;
  @observable zoom = default_zoom;
  @observable viewport_offset: TopLeftPoint = {
    x: 0,
    y: 0,
  };
  @observable viewport_size: Size = {
    width: default_viewport_width,
    height: default_viewport_height,
  };
  @observable display_offset: TopLeftPoint = {
    x: 0,
    y: - (default_viewport_height / default_zoom - default_lines_total_height) / 2,
  };

  @observable display_size: Size = {
    width: default_viewport_width / default_zoom,
    height: default_viewport_height / default_zoom,
  };
  @observable strokes: GlyphStroke[] = [];

  @observable active_stroke_idx = NaN;
  @observable active_segment_idx = NaN;

  @observable zoom_in_factor = 1.03;
  @observable zoom_out_factor = 0.97;
}
