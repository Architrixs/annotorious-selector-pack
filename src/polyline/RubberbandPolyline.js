import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import Mask from './PolylineMask';


/**
 * A 'rubberband' selection tool for creating Polyline drawing by
 * clicking and dragging.
 */
export default class RubberbandPolyline {

  constructor(anchor, g, env) {
    this.points =  anchor
    //this.points.push([ anchor, anchor ])

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.Polyline = document.createElementNS(SVG_NAMESPACE, 'g');
    this.Polyline.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'polyline');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'polyline');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);
    

    this.mask = new Mask(env.image, this.inner);

    // TODO optional: mask to dim the outside area
    // this.mask = new Mask(env.image, this.inner);

    this.Polyline.appendChild(this.outer);
    this.Polyline.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    this.group.appendChild(this.mask.element);
    this.group.appendChild(this.Polyline);

    g.appendChild(this.group);
  }

  setPoints = points => {
    const attr = points;// array of points [12,34]
    // set attribute for polyline svg element for outer and inner
    // example: <polyline  points="220,20 300,100 400,20" stroke="black" />
    var pointString = "" // separate points with space after batch of 2 points
    for (var i = 0; i < attr.length; i++) {
      if (i % 2 == 0) {
        pointString += attr[i] + ","
      } else {
        pointString += attr[i] + " "
      }
    }

    this.outer.setAttribute('points', pointString);
    this.inner.setAttribute('points', pointString);
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
    // TODO: Don't add a new point if distance < 2 pixels
    if (this.points.length >= 2) {
      this.points.push(xy[0]);
      this.points.push(xy[1]);
      this.setPoints(this.points);
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
    return this.Polyline;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.Polyline = null;    
    this.group = null;
  }

  toSelection = () =>
    new Selection({
      ...toSVGTarget(this.group, this.env.image),
      renderedVia: {
        name: 'polyline'
      }
    });

}
