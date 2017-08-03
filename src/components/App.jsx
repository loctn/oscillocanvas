import React, { Component } from 'react';
import P from 'prop-types';
import CSSModules from 'react-css-modules';

import data from '~/data/data.json';
import styles from './App.css';


class App extends Component {
  static propTypes = {
    styles: P.object,
    initialScale: P.number,
    minScale: P.number,
    maxScale: P.number,
    pointRadius: P.number
  }

  static defaultProps = {
    initialScale: 3,
    minScale: 1,
    maxScale: 10,
    pointRadius: 3
  }

  componentDidMount() {
    // We pull the canvas dimensions and drawing color from CSS to keep styling in one place
    const computedStyle = getComputedStyle(this.canvas);

    this.width = parseInt(computedStyle.width.replace('px', ''));
    this.height = parseInt(computedStyle.height.replace('px', ''));
    
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.strokeStyle = computedStyle.color;
    
    this.rescale();
    this.redraw();

    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('mouseup', this.handleWindowMouseUp);
  }

  get widthPercent() {
    return 1 / this.scale;
  }

  get scale() {
    return this.scaleValue;
  }

  set scale(percent) {
    this.scaleValue = Math.max(
      this.props.minScale,
      Math.min(this.props.maxScale, percent)
    );
  }

  get leftPercent() {
    return this.leftPercentValue;
  }

  set leftPercent(percent) {
    this.leftPercentValue = Math.max(0, Math.min(1 - this.widthPercent, percent));
  }

  percentToPoint(percent) {
    return percent * data.length;
  }

  pointToPercent(point) {
    return point / data.length;
  }

  drawPoint(x, y) {
    const canvasX = x;
    const canvasY = this.height / 2 - y;
    this.ctx.moveTo(canvasX + this.props.pointRadius, canvasY);
    this.ctx.arc(canvasX, canvasY, this.props.pointRadius, 0, 2 * Math.PI);
  }

  moveWindow(leftPercent, deltaX) {
    const deltaPercent = deltaX / (this.width * this.scale);
    this.leftPercent = leftPercent - deltaPercent;
    this.redraw();
  }

  rescale(mouseX = 0, mousePercent = 0, deltaScale = 0) {
    this.scale = this.scale - deltaScale || this.props.initialScale;
    this.leftPercent = mousePercent - this.widthPercent * mouseX / this.width;
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.beginPath();

    let p = Math.ceil(this.percentToPoint(this.leftPercent));
    let percent = this.pointToPercent(p);

    while (p < data.length && percent < this.leftPercent + this.widthPercent) {
      this.drawPoint(
        this.width * (percent - this.leftPercent) / this.widthPercent,
        (this.height / 2) * (data[p] / 100)
      );
      percent = this.pointToPercent(++p);
    }

    this.ctx.stroke();
    this.ctx.closePath();
  }

  handleMouseDown = event => {
    this.isDragging = true;
    this.startDragX = event.nativeEvent.clientX;
    this.startLeftPercent = this.leftPercent;
    this.prevDragEntry = { time: Date.now(), x: this.startDragX };
  }

  handleWindowMouseMove = event => {
    if (!this.isDragging) return;
    this.prevDragEntry = this.dragEntry;
    this.dragEntry = { time: Date.now(), x: event.clientX };
    this.moveWindow(this.startLeftPercent, event.clientX - this.startDragX);
  }

  handleWindowMouseUp = () => {
    this.isDragging = false;
    if (!this.prevDragEntry) return;  // prevent momentum on outside clicks

    let speed = (this.dragEntry.x - this.prevDragEntry.x) / (this.dragEntry.time - this.prevDragEntry.time);
    let prevTime = Date.now();

    const doMomentum = () => {
      const now = Date.now();
      let dist = speed;
      
      for (let i = 0; i < now - prevTime; i++) {
        speed *= 0.99;
        dist += speed;
      }
      
      this.moveWindow(this.leftPercent, dist);
      prevTime = now;

      if (Math.abs(speed) >= 0.1 && !this.isDragging) {
        requestAnimationFrame(doMomentum);
      }
    };

    requestAnimationFrame(doMomentum);
    this.prevDragEntry = null;
  }

  handleWheel = event => {
    const mouseX = event.nativeEvent.offsetX;
    const mousePercent = this.leftPercent + this.widthPercent * mouseX / this.width;
    const scaleDelta = 0.1 * event.nativeEvent.deltaY / 100;  // positive deltaY is scroll down

    this.rescale(mouseX, mousePercent, scaleDelta);
    this.redraw();
  }

  render() {
    return (
      <canvas styleName="component"
        ref={canvas => this.canvas = canvas}
        onMouseDown={this.handleMouseDown}
        onWheel={this.handleWheel}
        ></canvas>
    );
  }
}


export default CSSModules(App, styles);