/* 2D VECTOR MATH
  The vector class is easy to use, but it is NOT optimized!
  (Each vector operation has computational overhead so that
   the different coordinates are updated and easy to use.)

  Examples of vectors:
    v1 = xy(3, 4)
    v2 = rth(6, Math.PI/2)    // equivalent to xy(0, 6)
    v3 = rth(6, radians(90))  // same as v2
  
  The vectors will automatically compute the coordinates
  in both rectangular and polar coordinate systems:
    v1.r  =>  5
    v2.y  =>  6
  
  Display vectors:
    v1.toString()           =>  "xy(3,4)"
    v2.toString()           =>  "rth(6,1.5707963267948966)"
    round(v2, 2).toString() =>  "rth(6,1.57)"
    
  Create new vectors with sundry vector operations:
    v4 = add(v1, v2);             v4 =>  xy(3, 10)
    v5 = scale(v1, 10);           v5 =>  xy(30, 40)
    v6 = rotate(v1, Math.PI);     v6 =>  rth(3, -4)
  (see code for full list of operations)
  
  Perform an operation directly on a vector:
    v1.subtract(xy(1, 1));        v1 =>  xy(2, 3)
    v2.yreflect();                v2 =>  rth(-6, 1.57...)
    
  Declare a vector to be constant; operations will not affect it:
    v7 = xy(7, 70); v7.add(v1);   v7 =>  xy(7, 70)  
*/


// CONVENTIONS:
// Everything in this script is for two dimensions 
// All angles are in radians, unless otherwise specified

// Modes (coordinate systems)
modes = {
  xy: ["xy", "x", "y"],
  rth: ["r\u03B8", "r", "th"]};

// 2D vectors
function vector(vec_params, mode) {
  vec_params._set_rth = function(r, th, override_constant) {
    if (this.constant && !override_constant) return;
    this.r = r;
    this.th = mod(th, 2*Math.PI);
    this._update_xy(override_constant);
  }
  vec_params._set_xy = function(x, y, override_constant) {
    if (this.constant && !override_constant) return;
    this.x = x;
    this.y = y;
    this._update_rth(override_constant);
  }
  vec_params._update_rth = function(override_constant) {
    if (this.constant && !override_constant) return;
    this.r = Math.sqrt(this.x*this.x + this.y*this.y);
    this.th = mod(Math.atan2(this.y, this.x), 2*Math.PI);
  }
  vec_params._update_xy = function(override_constant) {
    if (this.constant && !override_constant) return;
    this.x = this.r * Math.cos(this.th);
    this.y = this.r * Math.sin(this.th);
  }
  
  vec_params.add = function(v) {
    this._set_xy(this.x + v.x, this.y + v.y);
    return this;
  }
  vec_params.subtract = function(v) {
    this._set_xy(this.x - v.x, this.y - v.y);
    return this;
  }
  vec_params.neg = function() {
    this._set_rth(-this.r, this.th);
    return this;
  }
  vec_params.xshift = function(dx) {
    this._set_xy(this.x + dx, this.y);
    return this;
  }
  vec_params.yshift = function(dy) {
    this._set_xy(this.x, this.y + dy);
    return this;
  }
  vec_params.normalize = function(r) {
    if (r == null) r = 1;
    this._set_rth(r, this.th);
  }
  vec_params.scale = function(c) {
    this._set_rth(this.r * c, this.th);
    return this;
  }
  vec_params.rotate = function(radians) {
    this._set_rth(this.r, this.th + radians);
    return this;
  }
  vec_params.xreflect = function() {
    this._set_xy(this.x * -1, this.y);
    return this;
  }
  vec_params.yreflect = function() {
    this._set_xy(this.x, this.y * -1);
    return this;
  }
  vec_params.round = function(decimals) {
    this._set_xy(round(this.x, decimals), round(this.y, decimals), true);
  }
  vec_params.toString = function() {
    return this.mode[0] + "(" + vec_params[vec_params.mode[1]] + "," + vec_params[vec_params.mode[2]] + ")";
  }
  vec_params.marker = function(ctx) {
    marker(ctx, this)
  }
  vec_params.arrowOn = function(ctx, center, color) {
    if (!color) { color = 'white' };
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    if (!center) { center = xy(0, 0); }
    line(ctx, center, this);
    
    arrowhead1 = rth(-5, this.th);
    arrowhead1.rotate(radians(20));
    arrowhead1.add(this);
    
    arrowhead2 = rth(-5, this.th);
    arrowhead2.rotate(radians(-20));
    arrowhead2.add(this);
    
    ctx.beginPath()
    ctx.moveTo(arrowhead1.x, arrowhead1.y);
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(arrowhead2.x, arrowhead2.y);
    ctx.fill();
  }
  
  if (mode && !vec_params.mode) { vec_params.mode = mode; }
  if (vec_params.x!=null && vec_params.y!=null) {
    vec_params._set_xy(vec_params.x, vec_params.y, true);
    if (!vec_params.mode) { vec_params.mode = modes.xy; }
  }
  else if (vec_params.r!=null && vec_params.th!=null) {
    vec_params.th = mod(vec_params.th, 2*Math.PI);
    vec_params._set_rth(vec_params.r, vec_params.th, true)
    if (!vec_params.mode) { vec_params.mode = modes.rth; }
  }
  else {
    throw "argument error: a vector must be constructed with a complete set of coordinates."
  }
  
  return vec_params;
}
function xy(x, y, constant) { return vector({x:x, y:y, constant:constant}); }
function rth(r, th, constant) { return vector({r:r, th:th, constant:constant}); }

// Comparative operators
function equals(v1, v2) { return (v1.x == v2.x && v1.y == v2.y); }

// Additive operators
function neg(v) { return xy(-v.x, -v.y); }
function add(v1, v2) { return xy(v1.x+v2.x, v1.y+v2.y); }
function subtract(v1, v2) { return xy(v1.x-v2.x, v1.y-v2.y); }
function xshift(v, x) { return xy(v.x+x, v.y); }
function yshift(v, y) { return xy(v.x, v.y+y); }
function xyshift(v, x, y) { return xy(v.x+x, v.y+y); }

// Multiplicative operators
function scale(v, c) { return xy(v.x*c, v.y*c); }
function xreflect(v) { return xy(-v.x, v.y); }
function yreflect(v) { return xy(v.x, -v.y); }
function xy_inv(v) { return xy(1/v.x, 1/v.y); }
function dot(vectors) {
  // TODO: generalize this so that it will take a list OR multiple arguments.
  // TODO: also, make it recursive.
  x = 1; y = 1;
  for (var i = 0; i < arguments.length; i++) {
    x *= arguments[i].x;
    y *= arguments[i].y;
  }
  return xy(x, y);
}

// Other operations
function rotate(v, radians) { 
  return rth(v.r, v.th + radians);
}
function distance(v1, v2) {
  return Math.abs(v1.r - v2.r);
}
function midpoint(v1, v2) {
  return scale(add(v1, v2), 0.5);
}

// Specific vectors (constants)
vzero = xy(0, 0, true);
vunit = { // Unit vectors
  x: xy(1, 0, true),  // x direction
  y: xy(0, 1, true),  // y direction
  r: function(th) {   // r direction (depends on angle)
    return xy(Math.cos(th), Math.sin(th), true);
  },
  th: function(th) {  // theta direction (depends on angle)
    return xy(-Math.sin(th), Math.cos(th), true);
  }
}


function randXY(v1, v2) {
  if (v2 == null) {
    return xy(Math.random()*v1.x, Math.random()*v1.y);
  }
  return xy(v1.x+Math.random()*(v2.x-v1.x), v1.y+Math.random()*(v2.y-v1.y));
}
function randAngle(r, th1, th2) {
  if (th1 == null && th2 == null) {
    th1 = 0;
    th2 = Math.PI*2;
  }
  else if (th2 == null) {
    th2 = th1;
    th1 = 0;
  }
  return rth(r, th1+Math.random()*(th2-th1));
}

// Convert between degrees and radians
function radians(deg) {
  return 2*Math.PI*deg/360;
}
function degrees(rad) {
  return 360*rad/(2*Math.PI);
}

// This is a better mod function. (returns x mod n)
// Javascript mod:  -1 % n     ==>  1
// This function:   mod(-1, n) ==>  n-1
function mod(x, n) {
  return n*(x/n - Math.floor(x/n))
}

// Wrapper for Math.round
function round(x, decimals) {
  if (decimals == null) decimals = 0;
  return Math.round(x*Math.pow(10, decimals))/Math.pow(10, decimals)
}

// This applies the round function to the X and Y coords of a vector
function vround(v, decimals) {
  return xy(round(v.x, decimals), round(v.y, decimals));
}


 normalize = function(v, r) {
    if (r == null) r = 1;
    return rth(r, v.th);s
  }