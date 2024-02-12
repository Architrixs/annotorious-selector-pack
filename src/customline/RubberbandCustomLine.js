import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import Mask from './CustomLineMask';


/**
 * A 'rubberband' selection tool for creating CustomLine drawing by
 * clicking and dragging.
 */
export default class RubberbandCustomLine {

  constructor(anchor, g, env) {
    // four digit random alphanumeric string
    this.randomShapeId = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
    this.points =  anchor
    //this.points.push([ anchor, anchor ])

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.CustomLine = document.createElementNS(SVG_NAMESPACE, 'g');
    this.CustomLine.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'g');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'g');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);
    

    //this.mask = new Mask(env.image, this.inner);

    // TODO optional: mask to dim the outside area
    // this.mask = new Mask(env.image, this.inner);

    this.CustomLine.appendChild(this.outer);
    this.CustomLine.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    //this.group.appendChild(this.mask.element);
    this.group.appendChild(this.CustomLine);

    g.appendChild(this.group);
  }

  setPoints = (points, action) => {
    const attr = points;
    // <path class="link" id="path1"  d='M0,0 L100, 100'></path>
    //     <path id="path2"  d='M100,100 L30, 200'   />
    //     <text >
          
    //       <textPath xlink:href="#path1" startOffset="40%">⬆️</textPath>
    //       <textPath xlink:href="#path2" startOffset="30%">⬆️</textPath>
    //     </text>
    //for two  points coming in this, we will add a path if it doesn't exist , or update the path if it does exist; before checking if the path has one or two points
    // if one point, we will add a point to the path, if two points we will add a new path to the polyline
    
    if (this.outer.childNodes.length === 0) {
      // add text svg
      const text = document.createElementNS(SVG_NAMESPACE, 'text');
      const textPath = document.createElementNS(SVG_NAMESPACE, 'textPath');
      textPath.setAttribute('class', 'a9s-text');
      textPath.setAttribute('id', `text1-${this.randomShapeId} up`);
      textPath.setAttribute('href', `#path1-${this.randomShapeId}`);
      textPath.setAttribute('startOffset', '50%');
      textPath.innerHTML = '⬆';

      text.appendChild(textPath);
      this.outer.appendChild(text);
      this.inner.appendChild(text.cloneNode(true));

      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      path.setAttribute('class', 'a9s-path');
      path.setAttribute('d', `M${attr[0]},${attr[1]} L${attr[0]},${attr[1]}`);
      path.setAttribute('id', `path1-${this.randomShapeId}`);
      this.outer.appendChild(path);
      this.inner.appendChild(path.cloneNode());

      
    }

    else{
      // check if the last path has one or two points, make path based that if two points make a single path.
      // get all path a9s-path svg from outer
      var pathsOuter = this.outer.querySelectorAll('.a9s-path');
      var pathsInner = this.inner.querySelectorAll('.a9s-path');
      const lastPathOuter = pathsOuter[pathsOuter.length-1];
      const lastPathInner = pathsInner[pathsInner.length-1];
      const textOuter = this.outer.querySelector('text');
      const textInner = this.inner.querySelector('text');
      const lastPathDOuter = lastPathOuter.getAttribute('d').split(' ')[0];
      const lastPathDInner = lastPathInner.getAttribute('d').split(' ')[0];
      //const lastPathPointsIncludesL = lastPathD.includes('L') 
      var incomingPointX = points[points.length-2];
      var incomingPointY = points[points.length-1];
      

      if (action === "update"){
        lastPathOuter.setAttribute('d', `${lastPathDOuter} L${incomingPointX},${incomingPointY}`);
        lastPathInner.setAttribute('d', `${lastPathDInner} L${incomingPointX},${incomingPointY}`);
      }
      else {
        // add point to last path, plus make new path that starts with last point
        var lastPointX = this.points[this.points.length-2];
        var lastPointY = this.points[this.points.length-1];
        // new path
        const path = document.createElementNS(SVG_NAMESPACE, 'path');
        path.setAttribute('class', 'a9s-path');
        path.setAttribute('d', `M${lastPointX},${lastPointY} L${incomingPointX},${incomingPointY}`);
        path.setAttribute('id', `path${this.outer.childNodes.length}-${this.randomShapeId}`);
        this.outer.appendChild(path);
        this.inner.appendChild(path.cloneNode());

        //add new textPath
        const textPath = document.createElementNS(SVG_NAMESPACE, 'textPath');
        textPath.setAttribute('class', 'a9s-text');
        textPath.setAttribute('id', `text${this.outer.childNodes.length-1}-${this.randomShapeId} up`);
        textPath.setAttribute('href', `#path${this.outer.childNodes.length -1}-${this.randomShapeId}`);
        textPath.setAttribute('startOffset', '50%');
        textPath.innerHTML = '⬆';
        textOuter.appendChild(textPath);
        textInner.appendChild(textPath.cloneNode(true));
      }
      
      

      // if (lastPathPointsIncludesL){
      //   // new path
      //   const path = document.createElementNS(SVG_NAMESPACE, 'path');
      //   path.setAttribute('class', 'a9s-path');
      //   path.setAttribute('d', `M${attr[0]},${attr[1]}`);
      //   path.setAttribute('id', `path${this.outer.childNodes.length+1}`);
      //   this.outer.appendChild(path);
      //   this.inner.appendChild(path.cloneNode());

      //   //add new textPath
      //   const textPath = document.createElementNS(SVG_NAMESPACE, 'textPath');
      //   textPath.setAttribute('class', 'a9s-text');
      //   textPath.setAttribute('id', `text${this.outer.childNodes.length+1}`);
      //   textPath.setAttribute('xlink:href', `#path${this.outer.childNodes.length+1}`);
      //   textPath.setAttribute('startOffset', '40%');
      //   textPath.innerHTML = '⬆️';
      //   text.appendChild(textPath);


      // }
      // else{
      //   // update path
      //   lastPath.setAttribute('d', `${lastPathD} L${attr[0]},${attr[1]}`);
      // }
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
    
    this.setPoints(rubberband, "update");
    //this.mask.redraw();
  }
  
  addPoint = xy => {
    // TODO: Don't add a new point if distance < 2 pixels
    if (this.points.length >= 2) {
      this.points.push(xy[0]);
      this.points.push(xy[1]);
      this.setPoints(this.points, "new");
    }
  }

  removeLastPath = () => {
    var pathsOuter = this.outer.querySelectorAll('.a9s-path');
    var pathsInner = this.inner.querySelectorAll('.a9s-path');

    // get the last path
    const lastPathOuter = pathsOuter[pathsOuter.length-1];
    const lastPathInner = pathsInner[pathsInner.length-1];

    // remove the last path
    lastPathOuter.remove();
    lastPathInner.remove();

    // remove the last textPath
    const textOuter = this.outer.querySelector('text');
    const textInner = this.inner.querySelector('text');
    const lastTextPathOuter = textOuter.lastChild;
    const lastTextPathInner = textInner.lastChild;
    lastTextPathOuter.remove();
    lastTextPathInner.remove();
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
    return this.CustomLine;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.CustomLine = null;    
    this.group = null;
  }

  toSelection = () =>
    new Selection({
      ...toSVGTarget(this.group, this.env.image),
      renderedVia: {
        name: 'customline'
      }
    });

}
