import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

import {
  PolynomialCurveEditor,
  PolynomialCurveEditorContext,
  polynomial_regression,
  /*
  Size,
  Strokes,
  GlyphData,
  GlyphSegment,
  GlyphStroke,
  */
} from 'universal-synthetic-glyph';

/*
import {
  deep_clone,
  resize_glyph_strokes,
  resize_bounding_box,
} from 'universal-synthetic-glyph';

import { RendererWithStaffs, Renderer } from './renderer';

type State = {
  glyph_id: string,
}

enum EditorEvent {
  StorkesEditorReady,
  PolynomialCurveEditorReady,
}
*/

type State = {
  ready: boolean;
};

@observer
class Framework extends React.Component<{}, State> {
  polynomial_curve_editor_ctx = new PolynomialCurveEditorContext();
  componentDidMount() {
    const key_points = [{x: 0, y:0.3}, {x: 1, y: 0.5}];
    this.polynomial_curve_editor_ctx.key_points = key_points;
    this.polynomial_curve_editor_ctx.equation = polynomial_regression(key_points);
  }
  render() {
    return <PolynomialCurveEditor ctx={this.polynomial_curve_editor_ctx} on_key_points_changed={(idx, type) => {
      this.polynomial_curve_editor_ctx.equation = polynomial_regression(this.polynomial_curve_editor_ctx.key_points);
    }} />;
  }

  /*
  strokes_editor_store?: StrokeEditorStore;
  polynomial_curve_editor_store?: PolynomialCurveEditorStore;

  preview_renderer?: RendererWithStaffs;
  score_renderer?: Renderer;
  id = 'main';
  preview_canvas_placeholder_id = 'preview_canvas_placeholder_id';
  score_canvas_placeholder_id = 'score_canvas_placeholder_id';

  preview_size: Size = {
    width: 200,
    height: 200,
  };
  */

  /**
   * init framework
   * init resources
   * init renderer
   * init editor
   * load score
   */
  /*
  async componentDidMount() {
    await init_resouces();
    await this.init_renderer();
    await this.init_editor();

    const glyphs = resources.glyphs;
    const first_glyph_id = Object.keys(glyphs)[0];
    this.set_glyph(first_glyph_id);

    // const score = new Score('./test/Sonate_No._14_Moonlight_1st_Movement.xml');
    const score = new Score('./test/multi-test.xml');

    (window as any).resources = resources;
  }

  async init_renderer() {
    this.preview_renderer = new RendererWithStaffs(this.preview_size);
    this.score_renderer = new Renderer({width: cfg.page_width, height: cfg.page_height});
    (document.getElementById(this.preview_canvas_placeholder_id) as HTMLDivElement).appendChild(
      this.preview_renderer.view as HTMLCanvasElement);
    (document.getElementById(this.score_canvas_placeholder_id) as HTMLDivElement).appendChild(
      this.score_renderer.view as HTMLCanvasElement);
  }

  async init_editor() {
    await new Promise(resolve => {
      this.strokes_editor_store = new StrokeEditorStore([], cfg.staff_blank_height);
      this.polynomial_curve_editor_store = new PolynomialCurveEditorStore();
      Promise.all([
      ]).then(resolve);
      this.forceUpdate();
    });
  }

  set_glyph(id: string) {
    if (!this.strokes_editor_store) {
      return;
    }
    const first_glyph = resources.glyphs[id];
    const strokes = deep_clone<GlyphStroke[]>(first_glyph.strokes);
    this.strokes_editor_store.strokes = strokes;
    this.update_preview();
    if (strokes.length && strokes[0].segments.length) {
      this.load_polynomial_curve(0, 0);
    }
    this.strokes_editor_store.needs_update = true;
    this.setState({
      glyph_id: id,
    });
  }

  update_preview = () => {
    if (!this.strokes_editor_store || !this.preview_renderer) {
      return;
    }
    const zoom = this.strokes_editor_store.zoom;
    const pixels_per_unit = this.strokes_editor_store.pixels_per_unit;
    const canvas_layout = this.strokes_editor_store.canvas_layout;

    // const glyph = resources.glyphs[this.state.glyph_id];
    const strokes = deep_clone(this.strokes_editor_store.strokes) as GlyphStroke[];
    if (strokes.length < 1) {
      this.preview_renderer.clear();
      this.preview_renderer.do_draw();
      return;
    }

    resize_glyph_strokes(strokes, pixels_per_unit * zoom);
    const strokes_obj = Strokes.from_glyph_strokes(strokes);
    const strokes_pixels_with_scales = strokes_obj.pixelize_with_scales();

    this.preview_renderer.clear();

    // TODO: BoundingBox

    strokes_pixels_with_scales.forEach(stroke => stroke.forEach(segment => {
      if (!this.preview_renderer) {
        return;
      }
      this.preview_renderer.set_brush_textures(resources.brushes.default);
      const pixels = segment.pixels;
      const scales = segment.scales;
      const n_pixel = pixels.length / 2;
      for (let i = 0; i < n_pixel; ++i) {
        this.preview_renderer.draw(
          scales[i] * zoom * pixels_per_unit / 32,
          0,
          pixels[i * 2] + canvas_layout.offset_x * pixels_per_unit * zoom,
          pixels[i * 2 + 1] + canvas_layout.offset_y * pixels_per_unit * zoom,
        );
      }
    }));

    const staff_interval = pixels_per_unit * zoom;
    const staff_offset_y = canvas_layout.offset_y * pixels_per_unit * zoom;
    
    this.preview_renderer.draw_staff(staff_offset_y, staff_interval);
    this.preview_renderer.do_draw();
  }

  get_bounding_box(normalized_strokes: GlyphStroke[]) {
    const strokes = deep_clone(normalized_strokes) as GlyphStroke[];
    resize_glyph_strokes(strokes, cfg.staff_blank_height);
    const strokes_obj = Strokes.from_glyph_strokes(strokes);
    return resize_bounding_box(strokes_obj.bounding_box(), 1 / cfg.staff_blank_height);
  }

  save() {
    if (!this.strokes_editor_store || !this.polynomial_curve_editor_store) {
      return;
    }
    const strokes = deep_clone(this.strokes_editor_store.strokes) as GlyphStroke[];

    const glyph_data: GlyphData = {
      strokes,
      bounding_box: this.get_bounding_box(strokes),
    };
    resources.glyphs[this.state.glyph_id] = glyph_data;
  }

  render() {
    return <div id={this.id} className={styles.app}>
      <div className={styles.componentEditor}>
        <div className={styles.header}>
          Component editor
          <select
            value={this.state.glyph_id}
            onChange={(e) => {
              const component_id = e.target.value;
              this.set_glyph(component_id);
            }}>
            {Object.keys(resources.glyphs).map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div id={this.preview_canvas_placeholder_id} style={{width: this.preview_size.width, height: this.preview_size.height}}/>
        <div>
          {this.strokes_editor_store && <StrokesEditor
            store={this.strokes_editor_store}
            onSelectChange={(active_stroke_idx, active_segment_idx) => {
              this.load_polynomial_curve(active_stroke_idx, active_segment_idx);
            }}
            onComplete={() => {
              this.save();
              this.update_preview();
            }}
          />}
        </div>
        <div>
          {this.polynomial_curve_editor_store && <PolynomialCurveEditor
            store={this.polynomial_curve_editor_store}
            onReady={() => this.emitter.emit(EditorEvent[EditorEvent.PolynomialCurveEditorReady])}
            onChange={(keypoints) => {
              if (!this.strokes_editor_store || !this.polynomial_curve_editor_store) {
                return;
              }
              const stroke = this.strokes_editor_store.strokes[this.strokes_editor_store.active_stroke_idx];
              const segment = stroke.segments[this.strokes_editor_store.active_segment_idx];
              const new_keypoints = deep_clone(keypoints);
              const equation = polynomial_regression(new_keypoints);
              segment.weight_graph = {
                keypoints: new_keypoints,
                equation,
              };
              this.polynomial_curve_editor_store.equation = equation;
              const pre = stroke.segments[this.strokes_editor_store.active_segment_idx - 1];
              const next = stroke.segments[this.strokes_editor_store.active_segment_idx + 1];
              if (pre && pre.weight_graph) {
                pre.weight_graph.keypoints[pre.weight_graph.keypoints.length - 1].y = new_keypoints[0].y;
                pre.weight_graph.equation = polynomial_regression(pre.weight_graph.keypoints);
              }
              if (next && next.weight_graph) {
                next.weight_graph.keypoints[0].y = new_keypoints[new_keypoints.length - 1].y;
                next.weight_graph.equation = polynomial_regression(next.weight_graph.keypoints);
              }
            }}
            onComplete={() => {
              this.save();
              this.update_preview();
            }} />}
        </div>
        <div>
          <button onClick={() => this.save()}>save</button>
        </div>
      </div>
      <div id={this.score_canvas_placeholder_id} className={styles.score}>
      </div>
    </div>;
  }

  load_polynomial_curve(stroke_idx: number, segment_idx: number) {
    if (!this.strokes_editor_store || !this.polynomial_curve_editor_store) {
      return;
    }
    this.polynomial_curve_editor_store.active_idx = 0;
    const stroke = this.strokes_editor_store.strokes[stroke_idx];
    const segment = stroke.segments[segment_idx];
    if (!segment.weight_graph) {
      const prev = segment_idx > 0 && stroke.segments[segment_idx - 1].weight_graph;
      let y = prev ? prev.keypoints[prev.keypoints.length - 1].y : 0.3;
      const keypoints = [{x: 0, y}, {x: 1, y: 0.3}];
      segment.weight_graph = {
        keypoints,
        equation: polynomial_regression(keypoints),
      };
    }
    this.polynomial_curve_editor_store.keypoints = segment.weight_graph.keypoints;
    this.polynomial_curve_editor_store.equation = segment.weight_graph.equation;
  }
  */
}

if (!document.getElementById('app')) {
  const ele = document.createElement('div');
  ele.id = 'app';
  document.body.appendChild(ele);
}
ReactDOM.render(<Framework />, document.getElementById('app'));
