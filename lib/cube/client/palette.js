cube.palette = function(board) {
  var palette = {},
      ul = d3.select(document.createElement("ul")),
      size = [8, 1.5];
      
  var type = ul
    .selectAll(".piece-type")
      .data(d3.entries(cube.piece.type))
    .enter().append("li")
      .attr("class", "piece-type")
      .on("mousedown", mousedown)
      .on("mousemove", function(){ d3.event.preventDefault(); });
      
  d3.select(board.node())
      .on("mousedown.palette", add);
  d3.select(window)
      .on("mousemove.palette", check_bounds);
  var palette_button = d3.select('#palette')
      .on("mousedown.palette", add);
      
  type.text(function(d) { return d.key; });

  function resize() {
    var squareSize = board.squareSize();
    type.attr("style", "width: " + squareSize * size[0] + "px; height: " + squareSize * size[1] + "px; line-height: "+ squareSize * size[1] +"px;");
  }

  function mousedown(d) {
    var piece = board.add(d.value),
        pieceSize = piece.size(),
        squareSize = board.squareSize(),
        position = [parseInt(d3.select(ul.node().parentNode).style("left")), parseInt(d3.select(ul.node().parentNode).style("top"))];
    piece.position([
      Math.ceil(position[0] / squareSize),
      Math.ceil(position[1] / squareSize)
    ]);
    remove();

    // Simulate mousedown on the piece to start dragging.
    var div = d3.select(piece.node());
    div.each(div.on(d3.event.type + ".piece"));
    
    d3.event.stopPropagation();
  }
  
  function add(){
    d3.event.preventDefault();
    var svg = board.node(),
        squareSize = board.squareSize(),
        boardSize  = board.size(),
        mouse      = d3.mouse(board.node()),
        position   = [Math.floor(mouse[0] / squareSize), Math.floor(mouse[1] / squareSize)],
        entries    = d3.entries(cube.piece.type).length,
        width      = size[0] * squareSize + 2,
        height     = size[1] * squareSize * entries + entries * 2,
        left, top;
    if(d3.event.target === palette_button.node()){
      var left = (boardSize[0] * squareSize) - width + 5,
          top  = -50;
    } else {
      if(mouse[0] < 0 || mouse[0] > (boardSize[0] * squareSize) || mouse[1] < 0 || mouse[1] > (boardSize[1] * squareSize)) return;
      
      left    = position[0] * squareSize,
      top     = position[1] * squareSize;
      if(left + width  > (boardSize[0] * squareSize)) left = (boardSize[0] * squareSize) - width;
      if(top  + height > (boardSize[1] * squareSize)) top  = (boardSize[1] * squareSize) - height;
    }
    
    remove();
    d3.select(svg.parentNode).append("div")
      .attr("class", "palette")
      .attr("style", "height: " + height + "px; width: " + width + "px; display: block; position: absolute; left:"+ left +"px; top:" + top + "px;")
      .node()
        .appendChild(ul.node());
  }
  
  function check_bounds(){
    if(d3.selectAll(".palette").empty()) return;
    var mouse      = d3.mouse(ul.node()),
        squareSize = board.squareSize(),
        tolerance  = 1;
    if(mouse[0] < -tolerance || mouse[0] > (size[0] * squareSize + tolerance) || mouse[1] < -tolerance || mouse[1] > (size[1] * squareSize * d3.entries(cube.piece.type).length + tolerance)) remove();
  }
  
  function remove(){
    d3.selectAll(".palette").remove();
  }

  palette.node = function() {
    return ul.node();
  };

  resize();

  return palette;
};
