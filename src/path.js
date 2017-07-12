// Geometric objects

import BoundingBox from './bbox';

/**
 * A bézier path containing a set of path commands similar to a SVG path.
 * Paths can be drawn on a context using `draw`.
 * @exports opentype.Path
 * @class
 * @constructor
 */
function Path() {
    this.commands = [];
    this.fill = 'black';
    this.stroke = null;
    this.strokeWidth = 1;
}

/**
 * @param  {number} x
 * @param  {number} y
 */
Path.prototype.moveTo = function(x, y) {
    this.commands.push({
        type: 'M',
        x: x,
        y: y
    });
};

/**
 * @param  {number} x
 * @param  {number} y
 */
Path.prototype.lineTo = function(x, y) {
    this.commands.push({
        type: 'L',
        x: x,
        y: y
    });
};

/**
 * Draws cubic curve
 * @function
 * curveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control 1
 * @param  {number} y1 - y of control 1
 * @param  {number} x2 - x of control 2
 * @param  {number} y2 - y of control 2
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */

/**
 * Draws cubic curve
 * @function
 * bezierCurveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control 1
 * @param  {number} y1 - y of control 1
 * @param  {number} x2 - x of control 2
 * @param  {number} y2 - y of control 2
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 * @see curveTo
 */
Path.prototype.curveTo = Path.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
    this.commands.push({
        type: 'C',
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        x: x,
        y: y
    });
};

/**
 * Draws quadratic curve
 * @function
 * quadraticCurveTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control
 * @param  {number} y1 - y of control
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */

/**
 * Draws quadratic curve
 * @function
 * quadTo
 * @memberof opentype.Path.prototype
 * @param  {number} x1 - x of control
 * @param  {number} y1 - y of control
 * @param  {number} x - x of path point
 * @param  {number} y - y of path point
 */
Path.prototype.quadTo = Path.prototype.quadraticCurveTo = function(x1, y1, x, y) {
    this.commands.push({
        type: 'Q',
        x1: x1,
        y1: y1,
        x: x,
        y: y
    });
};

/**
 * Closes the path
 * @function closePath
 * @memberof opentype.Path.prototype
 */

/**
 * Close the path
 * @function close
 * @memberof opentype.Path.prototype
 */
Path.prototype.close = Path.prototype.closePath = function() {
    this.commands.push({
        type: 'Z'
    });
};

/**
 * Add the given path or list of commands to the commands of this path.
 * @param  {Array} pathOrCommands - another opentype.Path, an opentype.BoundingBox, or an array of commands.
 */
Path.prototype.extend = function(pathOrCommands) {
    if (pathOrCommands.commands) {
        pathOrCommands = pathOrCommands.commands;
    } else if (pathOrCommands instanceof BoundingBox) {
        const box = pathOrCommands;
        this.moveTo(box.x1, box.y1);
        this.lineTo(box.x2, box.y1);
        this.lineTo(box.x2, box.y2);
        this.lineTo(box.x1, box.y2);
        this.close();
        return;
    }

    Array.prototype.push.apply(this.commands, pathOrCommands);
};

/**
 * Calculate the bounding box of the path.
 * @returns {opentype.BoundingBox}
 */
Path.prototype.getBoundingBox = function() {
    const box = new BoundingBox();

    let startX = 0;
    let startY = 0;
    let prevX = 0;
    let prevY = 0;
    for (let i = 0; i < this.commands.length; i++) {
        const cmd = this.commands[i];
        switch (cmd.type) {
            case 'M':
                box.addPoint(cmd.x, cmd.y);
                startX = prevX = cmd.x;
                startY = prevY = cmd.y;
                break;
            case 'L':
                box.addPoint(cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
            case 'Q':
                box.addQuad(prevX, prevY, cmd.x1, cmd.y1, cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
            case 'C':
                box.addBezier(prevX, prevY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                prevX = cmd.x;
                prevY = cmd.y;
                break;
            case 'Z':
                prevX = startX;
                prevY = startY;
                break;
            default:
                throw new Error('Unexpected path command ' + cmd.type);
        }
    }
    if (box.isEmpty()) {
        box.addPoint(0, 0);
    }
    return box;
};

/**
 * Draw the path to a 2D context.
 * @param {CanvasRenderingContext2D} ctx - A 2D drawing context.
 */
Path.prototype.draw = function(ctx) {
    ctx.beginPath();
    for (let i = 0; i < this.commands.length; i += 1) {
        const cmd = this.commands[i];
        if (cmd.type === 'M') {
            ctx.moveTo(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
            ctx.lineTo(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
            ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
            ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
            ctx.closePath();
        }
    }

    if (this.fill) {
        ctx.fillStyle = this.fill;
        ctx.fill();
    }

    if (this.stroke) {
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    }
};

/**
 * Convert the Path to a string of path data instructions
 * See http://www.w3.org/TR/SVG/paths.html#PathData
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {string}
 */
Path.prototype.toPathData = function(decimalPlaces) {
    decimalPlaces = decimalPlaces !== undefined ? decimalPlaces : 2;

    function floatToString(v) {
        if (Math.round(v) === v) {
            return '' + Math.round(v);
        } else {
            return v.toFixed(decimalPlaces);
        }
    }

    function packValues() {
        let s = '';
        for (let i = 0; i < arguments.length; i += 1) {
            const v = arguments[i];
            if (v >= 0 && i > 0) {
                s += ' ';
            }

            s += floatToString(v);
        }

        return s;
    }

    let d = '';
    for (let i = 0; i < this.commands.length; i += 1) {
        const cmd = this.commands[i];
        if (cmd.type === 'M') {
            d += 'M' + packValues(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
            d += 'L' + packValues(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
            d += 'C' + packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
            d += 'Q' + packValues(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
            d += 'Z';
        }
    }

    return d;
};

/**
 * Convert the path to an SVG <path> element, as a string.
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {string}
 */
Path.prototype.toSVG = function(decimalPlaces) {
    let svg = '<path d="';
    svg += this.toPathData(decimalPlaces);
    svg += '"';
    if (this.fill && this.fill !== 'black') {
        if (this.fill === null) {
            svg += ' fill="none"';
        } else {
            svg += ' fill="' + this.fill + '"';
        }
    }

    if (this.stroke) {
        svg += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"';
    }

    svg += '/>';
    return svg;
};

/**
 * Convert the path to a DOM element.
 * @param  {number} [decimalPlaces=2] - The amount of decimal places for floating-point values
 * @return {SVGPathElement}
 */
Path.prototype.toDOMElement = function(decimalPlaces) {
    const temporaryPath = this.toPathData(decimalPlaces);
    const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    newPath.setAttribute('d', temporaryPath);

    return newPath;
};

/**
 * Interpolates the path with the given options
 * @param  {number} [lineSamples=5] - The number of samples to interpolate from a line command
 * @param  {number} [curveSamples=10] - The number of samples to interpolate from a curve command
 * @return {array} - The interpolated points
 */
Path.prototype.interpolate = function(lineSamples, curveSamples){

    if(lineSamples == undefined)
        lineSamples = 5;
    if(curveSamples == undefined)
        curveSamples = 10;

    var points = [];
    var k = 0;
    var step_fn = function(command, state, t){
        switch (command.type) {
            case "M": state.lastX = command.x, state.lastY = command.y; return false;
            case "L": this.interpolatePoints(state.lastX, state.lastY, command.x, command.y, t, state.current); return true;
            case "Q": this.interpolateQuadraticBezier(state.lastX, state.lastY, command.x1, command.y1, command.x, command.y, t, state.current); return true;
            case "C": this.interpolateCubicBezier(state.lastX, state.lastY, command.x1, command.y1, command.x2, command.y2, command.x, command.y, t, state.current); return true;
            case "Z": this.interpolatePoints(state.lastX, state.lastY, this.commands[0].x, this.commands[0].y, t, state.current); return true;
        }
    }.bind(this);

    var state = { lastX: 0, lastY: 0, current: { x: 0, y: 0 } };

    for (var c = 0; c < this.commands.length; c++) {
        var command = this.commands[c];
        var samples = (command.type == "M" || command.type == "Z" ? 1 : (command.type == "L" ? lineSamples : curveSamples));

        for (var i = 0 ; i <= samples; i++) {
            if(step_fn(command, state, i/samples)){
                var dx = Math.abs(state.lastX - state.current.x);
                var dy = Math.abs(state.lastY - state.current.y);
                var d = Math.sqrt(dx*dx+dy*dy);
                if(d > 5){
                    points[k] = state.current.x;
                    points[k+1] = state.current.y;
                    state.lastX = state.current.x;
                    state.lastY = state.current.y;
                    k += 2;
                }
            }
        }
    }
    
    return points;
};


/**
 * Computes point between two points at t
 * @param  {number} x0 - x of start point
 * @param  {number} y0 - y of start point
 * @param  {number} x1 - x of end point
 * @param  {number} y1 - y of end point
 * @param  {number} t - curve time[0,1]
 * @param  {number} [out=undefined] - optional out point
 */
Path.prototype.interpolatePoints = function interpolatePoints(x0, y0, x1, y1, t, out) {
    if (out === undefined)
        out = {};
    out.x = (1 - t) * x0 + t * x1;
    out.y = (1 - t) * y0 + t * y1;
    return out;
}
/**
 * Computes point along a quadratic bezier curve at t
 * @param  {number} x0 - x of start point
 * @param  {number} y0 - y of start point
 * @param  {number} x1 - x of control point 
 * @param  {number} y1 - y of control point 
 * @param  {number} x2 - x of end point
 * @param  {number} y2 - y of end point
 * @param  {number} t - curve time[0,1]
 * @param  {number} [out=undefined] - optional out point
 */
Path.prototype.interpolateQuadraticBezier = function interpolateQuadraticBezier(x0, y0, x1, y1, x2, y2, t, out) {
    if (out === undefined)
        out = {};
    out.x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
    out.y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
    return out;
}

/**
 * Computes point along a cubic bezier curve at t
 * @param  {number} x0 - x of start point
 * @param  {number} y0 - y of start point
 * @param  {number} x1 - x of control point 1
 * @param  {number} y1 - y of control point 1
 * @param  {number} x2 - x of control point 2
 * @param  {number} y2 - y of control point 2
 * @param  {number} x3 - x of end point
 * @param  {number} y3 - y of end point
 * @param  {number} t - curve time[0,1]
 * @param  {number} [out=undefined] - optional out point
 */
Path.prototype.interpolateCubicBezier = function interpolateCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, t, out) {
    if (out === undefined)
        out = {};
    out.x = (1 - t) * (1 - t) * (1 - t) * x0 + 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t * x3;
    out.y = (1 - t) * (1 - t) * (1 - t) * y0 + 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t * y3;
    return out;
}
export default Path;
