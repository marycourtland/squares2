// CanvasObject: a class for making 
// requires math2D.js

// Distance units are in pixels
// Time units are in ticks

function Maze(ctx, wall_array) {
  obj = {
    ctx: ctx,
    graphics: {
      color: "black",
      lineWidth: 2,
    },
    
    draw: function() {
      
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
      
    },
    tickActions: []
  }
  
  if (!ctx.canvas.objects) ctx.canvas.objects = [];
  ctx.canvas.objects.push(obj);
  return obj
}
