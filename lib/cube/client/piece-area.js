cube.piece.type.area = function(board) {
  var timeout, dt0,
      data       = {},
      stacked    = {},
      properties = {},
      color      = d3.scale.category10(),
      empty      = function(){ return [{time: new Date(0), value: 0}, {time: new Date(), value: 0}]; },
      query;

  var area = cube.piece(board)
      .on("size", resize)
      .on("serialize", serialize)
      .on("deserialize", deserialize);

  var div = d3.select(area.node())
      .classed("area-graph", true);
  var header = div.select('.header');
  var content = div.select('.content');

  if (mode == "edit") {
    header.append("h3")
        .attr("class", "title")
        .text("Area Chart");
    header.append("div")
        .attr("class", "advanced")
        .attr("title", "Advanced Settings")
        .on("mouseup.advanced", toggleAdvanced);

    var query = content.append("textarea")
        .attr("class", "query")
        .attr("placeholder", "Query expression…")
        .on("keyup.area", querychange)
        .on("focus.area", area.focus)
        .on("blur.area", area.blur);

    var advanced = content.append("div")
        .attr("class", "advanced");
    
    advanced.append("h3")
        .text("Advanced Options");
    
    var time = advanced.append('div')
        .attr("class", "time")
        .text("Time Range: ");
    time.append("select").selectAll("option")
      .data([
        {description: "Seconds @ 10", value: 1e4},
        {description: "Minutes @ 5", value: 3e5},
        {description: "Hours", value: 36e5},
        {description: "Days", value: 864e5},
        {description: "Weeks", value: 6048e5},
        {description: "Months", value: 2592e6}
      ])
      .enter().append("option")
        .property("selected", function(d, i) { return i == 0; })
        .attr("value", cube_piece_areaValue)
        .text(function(d) { return d.description; });
    time.append("input")
      .property("value", 3600);
    time.selectAll("input,select")
        .on("change.area", area.edit)
        .on("focus.area", area.focus)
        .on("blur.area", area.blur);
    
    var unit = advanced.append("div")
        .text("Unit: ");
    unit.append("input")
        .attr("type", "text")
        .attr("class", "unit");

    var range = advanced.append("div")
        .text("Range: ");
    range.append("input")
        .attr("class", "range")
        .attr("type", "text")
        .attr("placeholder", "start, finish");

    var strokeColor = advanced.append("div")
        .text("Stroke color: ");
    strokeColor.append("input")
        .attr("class", "stroke")
        .attr("type", "text")
        .attr("placeholder", "#666666");
        
    var fillOpacity = advanced.append("div")
        .text("Opacity: ");
    fillOpacity.append("input")
        .attr("type", "text")
        .attr("class", "opacity")
        .attr("placeholder", "1");

    advanced.selectAll("input,select")
        .on("keyup.area", querychange)
        .on("focus.area", area.focus)
        .on("blur.area", area.blur);

  } else {

    var m = [6, 40, 45, 10], // top, right, bottom, left margins
        socket;

    var svg = content.append("svg:svg");

    var x = d3.time.scale(),
        y = d3.scale.linear(),
        xAxis = d3.svg.axis().scale(x).orient("bottom").tickSubdivide(true),
        yAxis = d3.svg.axis().scale(y).orient("right");

    var a = d3.svg.area()
        .interpolate("step-after")
        .x(function(d)  { return x(d.time);  })
        .y0(function(d) { return y(properties.range[0]||0);       })
        .y1(function(d) { return y(d.value > (properties.range[0]||0) ? d.value : properties.range[0]); });
        

    var g = svg.append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

    g.append("svg:g").attr("class", "y axis").call(yAxis);
    g.append("svg:g").attr("class", "x axis").call(xAxis);
    
    var l = svg.append("svg:g")
        .classed("legend", true)
  }
  
  function toggleAdvanced(){
    advanced.style("overflow", "hidden");
    if(parseInt(advanced.style("height")) == 0 || advanced.style("height") == "auto") {
      var height = advanced.style("display", "block").style("height", "auto").style("height");
      advanced.style("height", "0px").transition().style("height", height);
    } else {
      advanced.transition().style("height", "0px").each("end", function(){ advanced.style("display", "none"); })
    }
  }

  function resize() {
    var transition = area.transition(),
        innerSize  = area.innerSize();

    if (mode == "edit") {
      var innerSize = area.innerSize();

      transition.select(".query")
          .style("width",  innerSize[0] + "px")
          .style("height", innerSize[1] + "px");

    } else {
      var z = board.squareSize(),
          w = innerSize[0] - m[1] - m[3],
          h = innerSize[1] - m[0] - m[2];

      x.range([0, w]);
      y.range([h, 0]);

      // Adjust the ticks based on the current chart dimensions.
      xAxis.ticks(w / 80).tickSize(-h, 0);
      yAxis.ticks(h / 25).tickSize(-w, 0);

      transition.select("svg")
          .attr("width", w + m[1] + m[3])
          .attr("height", h + m[0] + m[2]);

     transition.selectAll("path.area")
         .attr("d", function(d){ return a(stacked[d]||[])||'M 0 0 z'; });

      transition.select(".x.axis")
          .attr("transform", "translate(0," + (h + 5) + ")")
          .call(xAxis)
        .select("path")
          .attr("transform", "translate(0," + (y(0) - h - 5) + ")");

      transition.select(".y.axis")
          .attr("transform", "translate(" + w + ",0)")
          .call(yAxis);
          
      transition.select("g.legend")
        .attr("transform", "translate(0, " + (h + m[0] + 30) +")");
    }
  }

  function redraw() {
    var keys = d3.keys(data).slice(0).reverse(), prev_val;
    stacked = {};

    for(var key in data){
      var prev_key = keys[keys.indexOf(key) - 1];
      stacked[key] = data[key].map(function(d, i){
        if(prev_key) {
          prev_val = data[prev_key].filter(function(datum){ return datum.time.getTime() === d.time.getTime(); });
          prev_val = prev_val.length ? prev_val[0].value : 0;
        } else { prev_val = 0; }
        return { value: prev_val + d.value, time: d.time };
      });
    }
    
    var z = board.squareSize(),
        h = area.size()[1] * z - m[0] - m[2],
        w = area.size()[0] * z - m[1] - m[3],
        min  = properties.range[0]||d3.min(d3.values(stacked).map(function(d){ return d3.min(d, cube_piece_areaValue)})),
        max  = properties.range[1]||d3.max(d3.values(stacked).map(function(d){ return d3.max(d, cube_piece_areaValue)}));

    if ((min < 0) && (max < 0)) max = 0;
    else if ((min > 0) && (max > 0)) min = 0;
    if(properties.range[0] > min) min = properties.range[0];
    y.domain([min, max]).nice();

    var areas = g.selectAll("path.area").data(keys.slice(0).reverse(), function(d){ return d; });
    areas.enter()
      .append("svg:path").attr("class", "area");
    areas.exit().remove();
    areas
      .attr("d", function(d){ return a(stacked[d]) })
      .style("fill",    color)
      .style("opacity", properties.fillOpacity||1)
      .style("stroke",  properties.strokeColor||'#666');
    
    var legend = l.selectAll("g.key").data(d3.keys(data), String),
        width = w / legend.data().length
    var keys = legend.enter()
          .append("svg:g")
          .classed("key", true);
    keys.append("svg:rect")
      .attr("height", 10)
      .attr("width",  10)
    keys.append("svg:text")
      .attr("x", 15)
    legend.exit().remove();
    
    legend.attr("transform", function(d, i, a){ return "translate(" +(i * width) + ", 0)"; })
      .selectAll("rect").style("fill", function(d){ return color(d); }).style("stroke", properties.strokeColor||"#666");
    legend.selectAll("text").text(function(d){ return d; }).attr('alignment-baseline', 'baseline')
    
    
    div.select(".y.axis").call(yAxis.tickFormat(cube_piece_format(y.domain(), properties.unit)));
    div.select(".x.axis").call(xAxis).select("path").attr("transform", "translate(0," + (y(0) - h - 5) + ")");
    resize();
    return true;
  }

  function querychange() {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(area.edit, 750);
  }
  
  function validColor(color){
    hex = d3.rgb(color).toString();
    return (hex != "#000000" || (/black|#0{3,6}/i.test(color)));
  }

  function serialize(json) {
    var step      = +time.select("select").property("value"),
        timeRange = time.select("input").property("value") * cube_piece_areaMultipler(step),
        stroke    = strokeColor.select("input").property("value");
  
    json.type   = "area";
    json.query  = query.property("value");
    json.time   = {range: timeRange, step: step};
    json.unit   = unit.select("input").property("value");
    json.range  = range.select("input").property("value").split(/, ?/);
    json.fillOpacity = fillOpacity.select("input").property("value");
    if(validColor(stroke)) json.strokeColor = stroke;
  }

  function deserialize(json) {
    if (mode == "edit") {
      query.property("value", json.query);
      time.select("input").property("value", json.time.range / cube_piece_areaMultipler(json.time.step));
      time.select("select").property("value", json.time.step);
      unit.select("input").property("value", json.unit||'');
      range.select("input").property("value", json.range||'');
      strokeColor.select("input").property("value", json.strokeColor||'');
      fillOpacity.select("input").property("value", json.fillOpacity);
    } else {
      var dt1 = json.time.step,
          t1 = new Date(Math.floor(Date.now() / dt1) * dt1),
          t0 = new Date(t1 - json.time.range),
          d0 = x.domain(),
          d1 = [t0, t1];

      properties.unit = json.unit;
      properties.range = json.range;
      properties.fillOpacity = json.fillOpacity;
      if(validColor(json.strokeColor)) properties.strokeColor = json.strokeColor;

      if (dt0 != dt1) {
        data = {};
        dt0 = dt1;
      }
      
      if(json.query !== query){
        query = json.query;
        stacked = data = {};
        keys = [];
        redraw();
      }

      if (d0 != d1 + "") {
        x.domain(d1);
        for(var group in data){
          var times = data[group].map(cube_piece_areaTime);
          data[group] = data[group].slice(d3.bisectLeft(times, t0), d3.bisectLeft(times, t1));
          data[group].push({time: t1, value: 0});
        }
      }

      resize();
      
      if (timeout) timeout = clearTimeout(timeout);
      if (socket) socket.close();
      socket = new WebSocket("ws://" + cube_host + "/1.0/metric/get");
      socket.onopen = load;
      socket.onmessage = store;
      
      function send(json){
        if(socket && socket.readyState == 1){
          try{
            socket.send(json);
          } catch (error) {
            console.log("Error sending to websocket: " + error);
            setTimeout(function(){ send(json); }, 100);
          }
        }
      }

      function load() {
        timeout = setTimeout(function() {
          send(JSON.stringify({
            expression: json.query,
            start: cube_time(t0),
            stop: cube_time(t1),
            step: dt1
          }));
          timeout = setTimeout(function() {
            deserialize(json);
          }, t1 - Date.now() + dt1 + 4500 + 1000 * Math.random());
        }, 500);
      }

      // TODO use a skip list to insert more efficiently
      // TODO compute contiguous segments on the fly
      function store(message) {
        var d = JSON.parse(message.data),
            g = d.group||'default';
        if(typeof data[g] === 'undefined') data[g] = [{time: new Date(Math.floor(Date.now() / json.time.step) * json.time.step), value: 0}];
        var i = d3.bisectLeft(data[g].map(cube_piece_areaTime), d.time = cube_time.parse(d.time));
        if (i < 0 || data[g][i].time - d.time) {
          if (d.value != null) {
            data[g].splice(i, 0, d);
          }
        } else if (d.value == null) {
          data[g].splice(i, 1);
        } else {
          data[g][i] = d;
        }
        redraw();
        //d3.timer(redraw);
      }
    }
  }

  area.copy = function() {
    return board.add(cube.piece.type.area);
  };

  resize();

  return area;
};

function cube_piece_areaTime(d) {
  return d.time;
}

function cube_piece_areaValue(d) {
  return d.value;
}

var cube_piece_formatNumber = d3.format(".2r");

function cube_piece_areaMultipler(step) {
  return step / (step === 1e4 ? 10
      : step === 3e5 ? 5
      : 1);
}

function cube_piece_format(domain, unit) {
  var prefix = d3.formatPrefix(Math.max(-domain[0], domain[1]), 2);
  return function(value) {
    return cube_piece_formatNumber(value * prefix.scale) + prefix.symbol + (unit||"");
  };
}
