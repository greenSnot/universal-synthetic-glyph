import { observable } from 'mobx';
import { TopLeftPoint } from '../types';

export class PolynomialCurveEditorContext {
  @observable key_points: TopLeftPoint[] = [];
  @observable active_idx = NaN;
  @observable editing = false;
  @observable order = 0;
  @observable width = 200;
  @observable height = 200;
  @observable canvas_global_offset = {
    x: 0,
    y: 0,
  };
  @observable initial = 0.3; // 0 - 1
  @observable equation: number[] = [];
}
