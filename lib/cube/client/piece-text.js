cube.piece.type.text = function(board) {
  var timeout;

  var text = cube.piece(board)
      .on("size", resize)
      .on("serialize", serialize)
      .on("deserialize", deserialize);

  var div = d3.select(text.node())
      .classed("text", true);
  var header = div.select('.header');
  var content = div.select('.content');

  if (mode == "edit") {
    header.append("h3")
        .attr("class", "title")
        .text("Text Label");

    var textarea = content.append("textarea")
        .attr("class", "content")
        .attr("placeholder", "Text content…")
        .on("keyup.text", textchange)
        .on("focus.text", text.focus)
        .on("blur.text", text.blur);
  }

  function resize() {
    var transition = text.transition(),
        innerSize = text.innerSize();

    if (mode == "edit") {
      transition.select(".content")
          .style("width", innerSize[0] + "px")
          .style("height", innerSize[1] + "px");
    }
  }

  function textchange() {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(text.edit, 750);
  }

  function serialize(json) {
    json.type = "text";
    json.content = textarea.property("value");
  }

  function deserialize(json) {
    if (mode == "edit") {
      textarea.property("value", json.content);
    } else {
      content.text(json.content);
    }
  }

  text.copy = function() {
    return board.add(cube.piece.type.text);
  };

  resize();

  return text;
};
