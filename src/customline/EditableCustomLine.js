import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { drawEmbeddedSVG, svgFragmentToShape, toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';
import Mask from './CustomLineMask';

const getPoints = shape => {
  // Could just be Array.from(shape.querySelector('.inner').points) but...
  // IE11 :-(
    // get all .a9s-path elements
  const innerElements = shape.querySelectorAll('.a9s-inner .a9s-path');
  //<path id="path2"  d='M100,100 L30, 200'   />
  const points = []
  // get points from paths
  var firstSecondPoint = innerElements[0].getAttribute('d').replace('L', '').replace('M', '').split(' ');
  points.push(firstSecondPoint[0].split(','))
  points.push(firstSecondPoint[1].split(','))
  for (var i = 1; i < innerElements.length; i++) {
    var pointsXYstring = innerElements[i].getAttribute('d').split(' ')[1].replace('L', '').split(',');
    
    points.push(pointsXYstring)
    
  }
  // var lastPoint = innerElements[innerElements.length -1].getAttribute('d').split(' ')[1].replace('L', '').split(',');
  // points.push(lastPoint);
  // const pointsXYstring = innerElement.getAttribute('d').replace(['M', 'L'], '').split(' ');
  // console.log(pointsXYstring)
  // pointsXYstring.forEach(function (point, index) {
  //   points.push(point.split(','))
  // });

  return points;
}

const getBBox = shape =>
  shape.querySelector('.a9s-inner').getBBox();

/**
 * An editable line shape.
 */
export default class EditableLine extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);
    this.svg.addEventListener('contextmenu', this.onRightClick);
    this.svg.addEventListener('auxclick', this.onAuxClick);

    // SVG markup for this class looks like this:
    //
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <line class="a9s-outer" ... />
    //     <line class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     ...
    //   </g>
    // </g>

    // 'g' for the editable line shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.shape = drawEmbeddedSVG(annotation);
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    //this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));

    //this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.setAttribute('data-id', annotation.id);
    this.elementGroup.appendChild(this.shape);

    this.handles = getPoints(this.shape).map(pt => {
      const handle = this.drawHandle(pt[0], pt[1]);
      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);
      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.shape, annotation, config.formatters);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;
  }

  onScaleChanged = () => 
    this.handles.map(this.scaleHandle);

  setPoints = (points) => {
    // Not using .toFixed(1) because that will ALWAYS
    // return one decimal, e.g. "15.0" (when we want "15")
    const round = num =>
      Math.round(10 * num) / 10;

    const outer = this.shape.querySelector('.a9s-outer');
    const inner_paths = this.shape.querySelectorAll(`.a9s-inner .a9s-path`);
    const outer_paths = this.shape.querySelectorAll(`.a9s-outer .a9s-path`);

    // example: <path id="path2"  d='M100,100 L30, 200'   />
    // separate points with space after batch of 2 points, Start with M, then L for each point, two points per path
    // 3 points makes 2 paths, 4 points makes 3 paths, 5 points makes 4 paths, etc
    var path_d = ""
    for (var i = 0; i < points.length - 1; i++) {
      
      
      path_d = `M${round(points[i].x)},${round(points[i].y)} L${round(points[i+1].x)},${round(points[i+1].y)}`
      // get the path element and update the d attribute
      inner_paths[i].setAttribute('d', path_d);
      outer_paths[i].setAttribute('d', path_d);
    }


    //this.mask.redraw();

    const { x, y, width, height } = outer.getBBox();
    setFormatterElSize(this.elementGroup, x, y, width, height);
  }

  onGrab = grabbedElem => evt => {
    if (evt.button !== 0) return;  // left click
    this.grabbedElem = grabbedElem;
    this.grabbedAt = this.getSVGPoint(evt);
  }

  onMouseMove = evt => {
    const constrain = (coord, delta, max) =>
      coord + delta < 0 ? -coord : (coord + delta > max ? max - coord : delta);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);
      if (this.grabbedElem === this.shape) {
        const { x, y, width, height } = getBBox(this.shape);

        const { naturalWidth, naturalHeight } = this.env.image;

        const dx = constrain(x, pos.x - this.grabbedAt.x, naturalWidth - width);
        const dy = constrain(y, pos.y - this.grabbedAt.y, naturalHeight - height);
        const updatedPoints = getPoints(this.shape).map(pt =>
          ({ x: parseFloat(pt[0]) + dx, y: parseFloat(pt[1]) + dy }));

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);
        updatedPoints.forEach((pt, idx) => this.setHandleXY(this.handles[idx], pt.x, pt.y));

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else {
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const updatedPoints = getPoints(this.shape).map((pt, idx) =>
          (idx === handleIdx) ? pos : {'x':parseFloat(pt[0]), 'y':parseFloat(pt[1])});

        this.setPoints(updatedPoints);
        this.setHandleXY(this.handles[handleIdx], pos.x, pos.y);

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  onRightClick = evt => {
    evt.preventDefault();
    evt.stopPropagation();
    const targetTag = evt.target.tagName
    const id = evt.target.id
    if (targetTag === 'path'){
      const textElement = evt.target.parentNode.querySelector('text');
      // get the textPath element with the href as id of the path element
      const textPath = textElement.querySelector(`textPath[href="#${id}"]`)

      this.emit('rightClickTextPath', textPath);
    }
    else if (targetTag === 'textPath'){
      this.emit('rightClickTextPath', evt.target);
    }
  }


  onAuxClick = evt => {
    return false
  }

  get element() {
    return this.elementGroup;
  }

  // TODO: update this for line svg Attributes, currently not being used
  updateState = annotation => {
    const points = svgFragmentToShape(annotation)
      .getAttribute('points')
      .split(' ') // Split x/y tuples
      .map(xy => { 
        const [ x, y ] = xy.split(',').map(str => parseFloat(str.trim()));
        return { x, y };
      });
    
    this.setPoints(points);
    points.forEach((pt, idx) => this.setHandleXY(this.handles[idx], pt.x, pt.y));
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    // destroy listeners
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('mouseup', this.onMouseUp);
    this.svg.removeEventListener('contextmenu', this.onRightClick);
    this.svg.removeEventListener('auxclick', this.onAuxClick);
    super.destroy();
  }

}
