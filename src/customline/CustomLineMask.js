import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';

export default class LineMask {

  constructor(imageDimensions, line) {
    this.w = imageDimensions.naturalWidth;
    this.h = imageDimensions.naturalHeight;

    this.line = line;

    this.mask = document.createElementNS(SVG_NAMESPACE, 'path');
    this.mask.setAttribute('fill-rule', 'evenodd');
    this.mask.setAttribute('class', 'a9s-selection-mask');
    // mask for customLine <polygon  points="20,190 100,200 150,300 100,350 20,260" stroke="black" />
    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${this.getPath()}z`);
  }

  redraw = () => {
    this.mask.setAttribute('d', `M0 0 h${this.w} v${this.h} h-${this.w} z M${this.getPath()}z`);
  }

  get element() {
    return this.mask;
  }

  destroy = () =>
    this.mask.parentNode.removeChild(this.mask)

  getPath = () => {
    // returm path string
    var attr = this.line.getAttribute('points');
    var pathString = ""
    // replace all commas with spaces
    attr = attr.replace(/,/g, " ");
    pathString += attr;
    return pathString;

  }

}