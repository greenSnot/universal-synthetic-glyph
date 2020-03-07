import { observable } from 'mobx';
import { Size, TopLeftPoint, BottomLeftPoint, GlyphStroke } from '../types';

export class SkeletonEditorContext {
  @observable zoom = 1;
  @observable viewport_offset: TopLeftPoint = {
    x: 0,
    y: 0,
  };
  @observable viewport_size: Size = {
    width: 200,
    height: 200,
  };
  @observable canvas_center: BottomLeftPoint = {
    x: 0,
    y: 0,
  };
  @observable canvas_size: Size = {
    width: 200,
    height: 200,
  };
  @observable needs_update = false;
  @observable strokes: GlyphStroke[] = [];
  @observable active_stroke_idx = NaN;
  @observable active_segment_idx = NaN;

  @observable zoom_in_factor = 1.03;
  @observable zoom_out_factor = 0.97;
}
