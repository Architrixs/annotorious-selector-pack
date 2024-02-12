import Tool from '@recogito/annotorious/src/tools/Tool';
import RubberbandCustomLine from './RubberbandCustomLine';
import EditableCustomLine from './EditableCustomLine';

/**
 * A rubberband selector for CustomLine fragments.
 */
export default class RubberbandCustomLineTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);

    this._isDrawing = false;
    
    document.addEventListener('keydown', evt => {
      if (evt.key == "z" && evt.ctrlKey) {
        this.undo();
      }
      
      if (evt.key == 'n') {
        this.newPart();
      }
    });  
  }

  startDrawing = (x, y) => {
    this._isDrawing = true;
    
    this.attachListeners({
      mouseMove: this.onMouseMove,
      mouseUp: this.onMouseUp,
      dblClick: this.onDblClick
    });
    
    this.rubberband = new RubberbandCustomLine([ x, y ], this.g, this.env);
  }

  stop = () => {
    this.detachListeners();
    
    this._isDrawing = false;

    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }
  undo = () =>{
    if (this.rubberband){
      this.rubberband.undo();

    }
  }
  newPart = () =>{
    if (this.rubberband){
      this.rubberband.newPart();

    }
  }

  onMouseMove = (x, y) =>
    this.rubberband.dragTo([ x, y ]);

  onMouseUp = (x, y, evt) => {
    if (evt.altKey){
      this.onDblClick(evt);
    } else if (evt.ctrlKey) {
      this.rubberband.undo();
    } else{
      // TODO: see when this is useful
      // const { width, height } = this.rubberband.getBoundingClientRect();

      // const minWidth = this.config.minSelectionWidth || 4;
      // const minHeight = this.config.minSelectionHeight || 4;
      
      if (this.rubberband.points.length >= 2) {

        // dont add if the last point is too close to this one
        const lastPointX = this.rubberband.points[this.rubberband.points.length - 2]
        const lastPointY = this.rubberband.points[this.rubberband.points.length - 1]
        const dist = Math.sqrt((lastPointX - x) ** 2 + (lastPointY - y) ** 2)
        if (dist > 5){
          this.rubberband.addPoint([ x, y ]);
        }        

      }
    }
  }

  onDblClick = evt => {
    this.rubberband.removeLastPath();
    this._isDrawing = false;
    const shape = this.rubberband.element;
    shape.annotation = this.rubberband.toSelection();

    this.emit('complete', shape);
    this.stop();
  }
  

  get isDrawing() {
    return this._isDrawing;
  }

  get isDrawing() {
    return this._isDrawing;
  }

  createEditableShape = annotation => 
    new EditableCustomLine(annotation, this.g, this.config, this.env);

}

RubberbandCustomLineTool.identifier = 'customline';

RubberbandCustomLineTool.supports = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector)
    return selector.value?.match(/^<svg.*<g/g);
}