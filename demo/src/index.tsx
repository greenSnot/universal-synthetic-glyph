import { observer } from 'mobx-react';
import { reaction } from 'mobx';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

import {
  PolynomialCurveEditor,
  PolynomialCurveEditorContext,
  polynomial_regression,
  SkeletonEditor,
  SkeletonEditorContext,
  PreviewContext,
  deep_clone,
  Preview,
} from 'universal-synthetic-glyph';

const StyledApp = styled.div`
  background: #eee;
  display: flex;
`;

@observer
class App extends React.Component<{}, {}> {
  weight_editor_ctx = new PolynomialCurveEditorContext();
  deviation_editor_ctx = new PolynomialCurveEditorContext();
  skeleton_editor_ctx = new SkeletonEditorContext();
  preview_ctx = new PreviewContext();

  renderer_ready_resolve: Function | undefined;
  renderer_ready = new Promise(resolve => {
    this.renderer_ready_resolve = resolve;
  });

  componentDidMount() {
    const weight_key_points = [
      { x: 0, y: 0.3 },
      { x: 1, y: 0.5 },
    ];
    this.weight_editor_ctx.key_points = weight_key_points;
    this.weight_editor_ctx.equation = polynomial_regression(weight_key_points);

    const deviation_key_points = [
      { x: 0, y: 0.3 },
      { x: 1, y: 0.5 },
    ];
    this.deviation_editor_ctx.key_points = deviation_key_points;
    this.deviation_editor_ctx.equation = polynomial_regression(deviation_key_points);
  }
  render() {
    return (
      <StyledApp>
        <SkeletonEditor
          ctx={this.skeleton_editor_ctx}
          on_complete={() => {}}
          on_change={(ctx: Partial<SkeletonEditorContext>) => {
            if (ctx.strokes) {
              this.preview_ctx.strokes = deep_clone(ctx.strokes);
            }
            if (ctx.display_offset) {
              this.preview_ctx.display_offset = deep_clone(ctx.display_offset);
            }
            if (ctx.display_size) {
              this.preview_ctx.display_size = deep_clone(ctx.display_size);
            }
            if (ctx.viewport_size) {
              this.preview_ctx.viewport_size = deep_clone(ctx.viewport_size);
            }
            if (ctx.zoom !== undefined) {
              this.preview_ctx.zoom = ctx.zoom;
            }
          }}
          on_ready={() => {
            this.renderer_ready.then(() => {
              const ctx = this.skeleton_editor_ctx;
              this.preview_ctx.strokes = deep_clone(ctx.strokes);
              this.preview_ctx.display_offset = deep_clone(ctx.display_offset);
              this.preview_ctx.display_size = deep_clone(ctx.display_size);
              this.preview_ctx.viewport_size = deep_clone(ctx.viewport_size);
              this.preview_ctx.zoom = ctx.zoom;
            });
          }}
          on_select_change={() => {}}
        />
        <PolynomialCurveEditor
          ctx={this.weight_editor_ctx}
          on_key_points_changed={(idx, type) => {
            this.weight_editor_ctx.equation = polynomial_regression(this.weight_editor_ctx.key_points);
          }}
        />
        <PolynomialCurveEditor
          ctx={this.deviation_editor_ctx}
          on_key_points_changed={(idx, type) => {
            this.deviation_editor_ctx.equation = polynomial_regression(this.deviation_editor_ctx.key_points);
          }}
        />
        <Preview ctx={this.preview_ctx} on_ready={() => {
          this.renderer_ready_resolve!();
        }}/>
      </StyledApp>
    );
  }
}

if (!document.getElementById('app')) {
  const element = document.createElement('div');
  element.id = 'app';
  document.body.appendChild(element);
}
ReactDOM.render(<App />, document.getElementById('app'));
