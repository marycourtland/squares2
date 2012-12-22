// CanvasObject: a class for making 
// requires math2D.js

// Distance units are in pixels
// Time units are in ticks

num_canvas_objects = 0;
function CanvasObject(ctx, pos, points, id) {
  num_canvas_objects++;
  obj = {
    id: id? id : 'obj' + (num_canvas_objects-1).toString(),
    kind: "object",
    ctx: ctx,
    points: points,
    pos: pos,
    rotation: 0, // in degrees
    graphics: {
      color: "black",
      lineWidth: 2,
    },
    
    isKindOf: function(attribute) {
      if (attribute.toLowerCase() == 'object') return true;
      return this.kind.indexOf(attribute.toLowerCase()) != -1;
    },
    
    getPos: function() {
      return this.pos;
    },
    
    // Draw the object on the canvas
    draw: function() {
      this.pos.add(xy(0.5, 0.5));
      //this.ctx.lineWidth = 2;
      this.ctx.lineWidth = 0; //this.graphics.lineWidth;
      this.ctx.strokeStyle = this.graphics.color;
      this.ctx.fillStyle = this.graphics.outline_color? this.graphics.outline_color : this.graphics.color;
      this.ctx.beginPath();
      this.ctx.moveTo(this.pos.x+this.points[0].x, this.pos.y+this.points[0].y);
      var c0 = null;
      var c1 = null;
      for (var i=1; i < this.points.length; i++) {
        if (!this.points[i].length) {
          if (c0 && c1) {
            this.ctx.bezierCurveTo(this.pos.x+c0.x, this.pos.y+c0.y,
                              this.pos.x+c1.x, this.pos.y+c1.y,
                              this.pos.x+this.points[i].x, this.pos.y+this.points[i].y);
            //console.log("bz curve to " + this.points[i]);
          }
          else {
            //console.log("line to " + this.points[i])
            this.ctx.lineTo(this.pos.x+this.points[i].x, this.pos.y+this.points[i].y);
          }
          c0 = null;
          c1 = null;
        }
        else {
          //console.log("bz controls:  " + this.points[i][0] + " " + this.points[i][1]);
          c0 = this.points[i][0];
          c1 = this.points[i][1];
        }
            
      }
      this.ctx.lineTo(this.pos.x+this.points[0].x, this.pos.y+this.points[0].y);
      this.ctx.stroke();
      this.ctx.fill();
      this.ctx.closePath();
      this.pos.subtract(xy(0.5, 0.5));
    },
    
    move: function(displacement) {
      this.pos.add(displacement);
      this.pos.round(1);
    },
    
    rotate: function(degrees) {
      rad = radians(degrees);
      for (var i=0; i < this.points.length; i++) {
        if (this.points[i].length) {
          this.points[i][0].rotate(rad);
          this.points[i][1].rotate(rad);
        }
        else {
          this.points[i].rotate(rad);
        }
      }
      this.rotation += degrees;
    },
    
    rotateTo: function(degrees) {
      this.rotate(-this.rotation);
      this.rotate(degrees);
    },
    
    // Get the absolute coordinates of one of the object's vertices
    getPoint: function(i) {
      if (i>=this.points.length) {
        throw "out of bounds: " + i + " > " + this.points.length-1;
      }
      return add(this.points[i], this.pos);
    },
    
    // Returns true when the given point is inside the object's convex hull
    contains: function(p) {
      //console.log(""+this.pos);
      //console.log(""+p);
      //console.log("");
      //p.marker(ctx);
      //p = add(this.pos, neg(p));
      //v1 = add(this.getPoint(0), neg(p));
      //console.log(""+v1);
      angle = 0;
      angles = [];
      for (var i=0; i < this.points.length; i++) {
        angles.push(mod(add(this.getPoint(i), neg(p)).th, 360));
      }
      angles.sort(function(a1, a2){ return a1 - a2; });
      for (var i=1; i < this.points.length; i++) {
          a1 = angles[i-1];
          a2 = angles[i];
          if (a2-a1 > Math.PI) return false;
      }
      return (2*Math.PI-angles[this.points.length-1]+angles[0] <= Math.PI);
    },

    distanceTo: function(obj) {
      return Math.abs(subtract(this.pos, obj.pos).r);
    },
    
    isNear: function(obj, radius) {
      if (radius==null) radius = 30;
      return this.distanceTo(obj) <= radius;
    },
  
    // Input events
    onclick: function(evt) {},
    ondrag: function(evt) {},
    onmousedown: function(evt) {},
    onmouseup: function(evt) {},
    
    // The tick event
    tick: function() {
      //console.log(this.tickActions);
      for (var i=0; i < this.tickActions.length; i++) {
        this.tickActions[i].call(this);
      }
      
      // Temoporary code - to stop the object from moving past the bottom
      if (this.pos.y > 400) {
        //this.velocity = vzero;
        //this.pos = xy(this.pos.x, 400);
      }
    },
    tickActions: []
  }
  
  if (!ctx.canvas.objects) ctx.canvas.objects = [];
  ctx.canvas.objects.push(obj);
  return obj
}


// Functions to give objects certain features

// Motion-related
function actuate(obj) { // Allow it to move & obey forces
  // todo: add mass or something (or include it in the vector field)
  obj.kind = "dynamic_" + obj.kind;
  obj.is_dynamic = true;
  obj.velocity = xy(0, 0);
  obj.frozen = false;
  obj.forces = {};
  
  obj.getVelocity = function() { return this.velocity; }
  
  obj.tickActions.push(function() {
    if (this.frozen) return;
    for (i in this.forces) {
      if (!this.forces[i]) continue;
      type = this.forces[i].type;
      
      if (type.length >= 4 && type.slice(0, 4) == 'temp') {
        this.forces[i].countdown -= 0;
        if (this.forces[i].countdown < 0) continue;
        type = type.replace('temp ', '');
      }
      
      if (type == 'effect') {
        this.forces[i].at(this);
      }
      else if (type == 'acceleration') {
        this.velocity.add(this.forces[i].at(this));
      }
      else if (type == 'velocity') {
        this.move(this.forces[i].at(this));
      }
    }
  })
  
  obj.tickActions.push(function() {
    if (this.frozen) return;
    this.move(obj.velocity);
  })
  
  obj.obey = function(id, vectorfield) { this.forces[id] = vectorfield;}
  obj.ignore = function(id) { if (!(id in this.forces)) return; delete this.forces[id];}
  
  obj.freeze = function(){ this.frozen = true; }
  obj.unfreeze = function(){ this.frozen = false; }
  
  return obj;
}

function handle(obj) {  // Allow the user to click & drag it
  obj.is_handled = true;
  obj.kind = "draggable_" + obj.kind;
  obj.onmousedown = function() {
    if (this.is_dynamic) this.freeze();
  }
  obj.ondrag = function() {
    this.move(mouse.velocity);
  }
  obj.onmouseup = function() {
    if(this.is_dynamic) {
      this.unfreeze();
    }
  }
  return obj;
}

function launch(obj) {  // Allow the user to "throw" it with the mouse
  obj.kind = "launchable_" + obj.kind
  if (!obj.is_handled) handle(obj);
  obj.is_launchable = true;
  obj.onmouseup = function() {
    if(this.is_dynamic) {
      this.velocity.add(mouse.velocity);
      this.unfreeze();
    }
  }
  return obj;
}


// Allow the user to move it around w/ keys
// Smooth motion
function navigate(obj, keydirs, speed, freeze) {  
  obj.kind = "navigated_" + obj.kind;
  obj.is_navigated = true;
  obj.navigation = [];
  if (speed == null) obj.speed = 3;
  else obj.speed = speed;
  obj.tickActions.push(function() {
    if (this.navigation.length == 0) return;
    dx = xy(0, 0);
    for (var i=0; i < this.navigation.length; i++) {
      if (this.navigation[i] == 'left') dx.add(xy(-1, 0));
      if (this.navigation[i] == 'right') dx.add(xy(1, 0));
      if (this.navigation[i] == 'up') dx.add(xy(0, -1));
      if (this.navigation[i] == 'down') dx.add(xy(0, 1));
    }
    dx.normalize(this.speed);
    obj.move(dx);
  });
  
  window.addEventListener("keydown", function(event) {
    key = getKeyFromEvent(event);
    if (key in keydirs) {
      for (var i=0; i < obj.navigation.length; i++) {
        if (obj.navigation[i] == keydirs[key]) return;
      }
      obj.navigation.push(keydirs[key]);
      if (obj.is_dynamic && freeze) obj.freeze();
    }
  }, false);
  window.addEventListener("keyup", function(event) {
    key = getKeyFromEvent(event);
    if (obj.navigation.indexOf(keydirs[key]) != -1)
      obj.navigation.splice(obj.navigation.indexOf(keydirs[key]), 1);
    if (obj.navigation.length == 0 && obj.unfreeze) obj.unfreeze();
  });
  return obj;
}
// Discrete motion
/*
function navigate(obj, keydirs, speed, freeze) {  
  obj.kind = "navigated_" + obj.kind;
  obj.is_navigated = true;
  obj.navigation = [];
  if (speed == null) obj.speed = 3;
  else obj.speed = speed;
  obj.tickActions.push(function() {
    if (this.navigation.length == 0) return;
    dx = xy(0, 0);
    for (var i=0; i < this.navigation.length; i++) {
      if (this.navigation[i] == 'left') dx.add(xy(-1, 0));
      if (this.navigation[i] == 'right') dx.add(xy(1, 0));
      if (this.navigation[i] == 'up') dx.add(xy(0, -1));
      if (this.navigation[i] == 'down') dx.add(xy(0, 1));
    }
    dx.normalize(this.speed);
    obj.move(dx);
  });
  window.addEventListener("keydown", function(event) {
    key = getKeyFromEvent(event);
    if (key in keydirs) key = keydirs[key];
    if (key == 'left') obj.move(xy(-block_size.x, 0));
    if (key == 'right') obj.move(xy(block_size.x, 0));
    if (key == 'up') obj.move(xy(0, -block_size.y));
    if (key == 'down') obj.move(xy(0, block_size.y));
  });
  return obj;
}*/

function point(obj) {
  // TODO
}

// Game-related
function character(obj) {
  if (obj.kind.indexOf("object") != -1) {
    obj.kind = obj.kind.replace("object", "character");
  }
  else obj.kind = obj.kind + "_character";
  obj.inventory = [];
  obj.holds = function(item, offset) {
    if (offset == null) offset = xy(-20, 0);
    item.hold_offset = offset;
    item.ignore('held');
    item.obey('held', heldBy(obj, offset));
    this.inventory.push(item);
  }
  obj.drops = function(item, relocation) {
    if (this.inventory.indexOf(item) == -1) return;
    item.ignore('held');
    this.inventory.splice(this.inventory.indexOf(item), 1);
    if (relocation != null) {
      item.move(relocation);
    }
  }
  obj.switchHands = function() {
    if (this.inventory.length == 0) return;
    this.inventory[0].hold_offset.xreflect();
    this.inventory[0].ignore('held');
    this.inventory[0].obey('held', heldBy(obj, this.inventory[0].hold_offset));
  }
  
  obj.comment = null;
  obj.commentOffset = null;
  obj.say = function(txt, offset) {
    duration = 2;
    obj.comment = txt;
    obj.comment_offset = offset? offset : xy(25, -5);
    setTimeout(function() { obj.comment = null; }, duration*1000);
  }
  obj.draw_before_comment = obj.draw;
  obj.draw = function() {
    this.draw_before_comment();
    if (obj.comment != null) {
      newFontSize(12);
      text(obj.comment, add(obj.pos, obj.comment_offset), 'sw');
      newFontSize(20);
    }
  }
  return obj
}

// Other
function showImages(obj, images, keep_shape) {
  obj.kind = "imaged_" + obj.kind;
  if (keep_shape !=null) obj.draw_shape = obj.draw
  obj.draw = function() {
      if (keep_shape != null) obj.draw_shape();
      for (var i=0; i < images.length; i++) {
        if (images[i].length && images[i].length>0) {
          img = images[i][0];
          if (images[i].length >= 2) offset = images[i][1];
          else offset = xy(0, 0);
        }
        else {
          img = images[i];
          offset = xy(0, 0);
        }
        ctx.drawImage(img, round(this.pos.x + offset.x, 0), round(this.pos.y + offset.y, 0));
        
      }
  }
  return obj
}

function bindClick(obj, callback) {
  obj.onclick = callback;
  return obj
}
function bindKey(obj, key, callback) {
  window.addEventListener("keypress", function(event) {
    if (getKeyFromEvent(event) == key) callback(event);
  });
  return obj;
}