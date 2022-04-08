async function getResponse(path) {
  const response = await fetch(path);
  const data = await response.json();
  return data;
}

getResponse("./data/my_weather_data.json").then((data) => drawLineChart(data));

function drawLineChart(dataset) {
  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
    text: {
      x: 100,
      y: 100,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  if (!window.dimensions) {
    window.dimensions = dimensions;
  }

  //   const wrapper = d3.select("#wrapper");
  //   const svg = wrapper.append("svg");
  //   svg.attr("width", dimensions.width);
  //   svg.attr("height", dimensions.height);
  //   console.log(svg);

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  const freezingTemperaturePlacement = yScale(32);

  const freezingTemperatures = bounds
    .append("rect")
    .attr("x", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("y", freezingTemperaturePlacement)
    .attr("height", dimensions.boundedHeight - freezingTemperaturePlacement)
    .attr("fill", "#87ceeb")
    .attr("opacity", "0.5");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  //   const textEl = wrapper
  //     .append("text")
  //     .text(`.x:${dimensions.text.x}/y:${dimensions.text.y}`)
  //     .attr("x", dimensions.text.x)
  //     .attr("y", dimensions.text.y);

  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  const line = bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1);

  const yAxisGenerator = d3.axisLeft().scale(yScale);

  const yAxis = bounds
    .append("g")
    .call(yAxisGenerator)
    .style("color", "#666666");

  yAxisGenerator(yAxis);

  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .style("color", "#666666");
}
