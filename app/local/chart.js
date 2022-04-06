// let myWeatherData = [];

async function getResponse(path) {
  const response = await fetch(path);
  const data = await response.json();
  return data;
}

getResponse("./data/my_weather_data.json").then((data) => drawLineChart(data));

function drawLineChart(dataset) {
  //   myWeatherData = dataset;
  console.table(dataset[0]);
}
