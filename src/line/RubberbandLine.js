import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import Mask from './LineMask';


/**
 * A 'rubberband' selection tool for creating Line drawing by
 * clicking and dragging.
 */
export default class RubberbandLine {

  constructor(anchor, g, env) {
    this.points =  anchor
    //this.points.push([ anchor, anchor ])

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.Line = document.createElementNS(SVG_NAMESPACE, 'g');
    this.Line.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'line');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'line');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);
    

    this.mask = new Mask(env.image, this.inner);

    // TODO optional: mask to dim the outside area
    // this.mask = new Mask(env.image, this.inner);

    this.Line.appendChild(this.outer);
    this.Line.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';
    console.log(this.mask)
    console.log(this.Line)
    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    this.group.appendChild(this.mask.element);
    this.group.appendChild(this.Line);

    g.appendChild(this.group);
  }

  setPoints = points => {
    const attr = points;
    // set attribute for line svg element for outer and inner
    // example: <line x1="0" y1="80" x2="100" y2="20" stroke="black" />
    this.outer.setAttribute('x1', attr[0]);
    this.inner.setAttribute('x1', attr[0]);
    this.outer.setAttribute('y1', attr[1]);
    this.inner.setAttribute('y1', attr[1]);
    if(attr.length > 2) {
    this.outer.setAttribute('x2', attr[2]);
    this.inner.setAttribute('x2', attr[2]);
    this.outer.setAttribute('y2', attr[3]);
    this.inner.setAttribute('y2', attr[3]);
    }
  }

  getBoundingClientRect = () =>
    this.outer.getBoundingClientRect();

  dragTo = xy => {
    // Make visible
    this.group.style.display = null;

    this.mousepos = xy;
    //console.log(xy);
    const rubberband = [ ...this.points, xy[0], xy[1] ];
    
    this.setPoints(rubberband);
    this.mask.redraw();
  }
  
  addPoint = xy => {
    // Don't add a new point if distance < 2 pixels
    if (this.points.length <= 2) {
      this.points[2] = xy[0];
      this.points[3] = xy[1];
      this.setPoints(this.points);
      this.setPerendicular(this.points);
    }
  }

  undo = () => {
    if (this.points[this.points.length - 1].length>2){
      this.points[this.points.length - 1].pop();
    } else {
      if (this.points.length>1){
        this.points.pop()
      }
    }
  }

  newPart = () => {
    this.points.push([]);
  }
 
  get element() {
    return this.Line;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.Line = null;    
    this.group = null;
  }

  toSelection = () =>
    new Selection({
      ...toSVGTarget(this.group, this.env.image),
      renderedVia: {
        name: 'line'
      }
    });

    setPerendicular = (points) => {
      //find midpoint
      var midpointX = (points[0] + points[2])/2
      var midpointY = (points[1] + points[3])/2
      //Calculate the angle of the main line
      var angle = Math.atan2(points[3] - points[1], points[2] - points[0]);
      // get perpendicular point at 90 degrees to the main line at the midpoint perpLength point far
      var perpLength = 100
      var perpX = midpointX + perpLength * Math.cos(angle - Math.PI / 2);
      var perpY = midpointY + perpLength * Math.sin(angle - Math.PI / 2);
  
      console.log(midpointX, midpointY, angle, perpX, perpY)
      // create the perpendicular line
      this.perp = document.createElementNS(SVG_NAMESPACE, 'line');
      this.perp.setAttribute('class', 'a9s-perp');
      this.perp.setAttribute('x1', midpointX);
      this.perp.setAttribute('y1', midpointY);
      this.perp.setAttribute('x2', perpX);
      this.perp.setAttribute('y2', perpY);
      // stroke="black" stroke-width="2" stroke-dasharray="5,5"\
      this.perp.setAttribute('stroke', 'black');
      this.perp.setAttribute('stroke-width', '2');
      this.perp.setAttribute('stroke-dasharray', '5,5');
      this.Line.appendChild(this.perp);
      this.group.appendChild(this.perp);
    }

}
