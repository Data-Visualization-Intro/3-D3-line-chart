# D3 - "Data Driven Documents."

In this module, we'll create a line chart that plots daily temperature.

Here's what our [line chart](https://dataviz-exercises.netlify.app/temperatures/index.html) will look like when we're finished.

The dataset we'll be analyzing contains 365 days of daily weather metrics. The file is in [JSON]() format and includes 2021 weather data for New York City from the Open Sky weather API.

Create `index.html` in the app folder and add a wrapper div and a link to D3 and `chart.js`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="wrapper"></div>

    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="chart.js"></script>
  </body>
</html>
```

## Loading the Data

In `chart.js` define a function named `drawLineChart()` and run it:

```js
async function drawLineChart() {
  document.body.innerText = d3.version;
}

drawLineChart();
```

The first step to visualizing any dataset is understanding its structure. To get a good look at our data we will load the JSON file that holds our data.

D3.js has methods for fetching and parsing files of different formats in the [d3-fetch module](https://github.com/d3/d3-fetch) - i.e. `d3.csv()`, `d3.json()`, and `d3.tsv()`.

Create a new variable `dataset` and use `d3.json()` to load the contents of our JSON file:

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");
  console.log(dataset);
}

drawLineChart();
```

Open `index.html` using Live Server and examine the console.

`await` is a JavaScript keyword pauses execution until a Promise is resolved.

Note that the `drawLineChart()` function declaration is preceded by the keyword `async`. `await` will only work within an function maked as `async`.

This means that any code after `await d3.json("./data/my_weather_data.json")` will run only after dataset is defined.

## Examine the Data

Our dataset is array of objects, with one object per day.

Send the first day to the console in tabular form:

`console.table(dataset[0])`

We'll start by looking at `temperatureMax` over time.

Our timeline will have two axes:

1. a y axis (vertical) on the left comprised of max temperature values
1. an x axis (horizontal) on the bottom comprised of dates

To grab the correct metrics from each data point, we'll use `accessor functions`.

Accessor functions convert a single data point into the metric value.

> Think of a dataset as a table. A data point would be a row in that table. In this case, a data point represents an object in our dataset array that holds the weather data for one day.

We'll create a yAccessor function that will take a data point and return the max temperature.

We will use `yAccessor` for plotting points on the y axis.

Looking at the data point in our console, we can see that a day's max temperature is located on the object's `temperatureMax` key. To access this value, our yAccessor function looks like this:

```js
const yAccessor = (d) => d.temperatureMax;
console.log(yAccessor); // yAccessor is a variable pointing to a function
console.log(yAccessor(dataset[0])); // is the first max temp in dataset
```

Next, we'll need an xAccessor function that will return a point's date, which we will use for plotting points on the x axis.

```js
const xAccessor = (d) => d.date;
console.log(xAccessor(dataset[0]));
```

The date value in our dataset is a string.

Unfortunately, this string won't work on our x axis. We know how far "2018-12-25" is from "2018-12-29" but a computer needs a date in a form it can work with.

JavaScript `Date` objects represent a single moment in time in a platform-independent format

We need to convert the dataset strings into JavaScript Dates. d3 has a [d3-time-format](https://github.com/d3/d3-time-format) module with methods for parsing and formatting dates.

The `d3.timeParse()` method:

- takes a string specifying a date format, and
- outputs a function that will parse dates of that format.

For example, `d3.timeParse("%Y")` will parse a string with just a year (eg. "2021").

Let's create a date parser function and use it to transform our date strings into date objects:

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);
  console.log(xAccessor(dataset[0]));
}

drawLineChart();
```

When we call `xAccessor(dataset[0])` we get the first day's date as a [JavaScript Date object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

### Why Accessor Functions?

Defining accessor functions are a best practice. Creating separate functions to read the values from our data points helps us in a many ways:

- Easy changes: every chart is likely to change — whether that change is due to business requirements, design, or data structure. These changing requirements are especially prevalent when creating dashboards with dynamic data, where you might need to handle a new edge case two months later. Having accessor functions in one place in a chart file makes them easy to update.
- Documentation: having these functions at the top of a file can give you a quick reminder of what metrics the chart is plotting and the structure of the data.
- Framing: sitting down with the data and planning what metrics you need to access is a great way to start making a chart. It prevents you from rushing in only to realize later that another type of chart would be better suited to the data.

## Chart Layout

When drawing a chart, there are two containers whose dimensions we need to define: the wrapper and the bounds.

![terminology](samples/images/terminology.png)

The wrapper contains the entire chart: the data elements, the axes, the labels, etc. Every SVG element will be contained inside here.

The bounds contain all of our data elements: in this case, our line.

This distinction will help us separate the amount of space we need for extraneous elements (axes, labels), and let us focus on our main task: plotting our data. One reason this is so important to define up front is the inconsistent and unfamiliar way SVG elements are sized.

When adding a chart to a webpage, we start with the amount of space we have available for the chart. Then we decide how much space we need for the margins, which will accommodate the chart axes and labels. What's left is how much space we have for our data elements.

We will rarely have the option to decide how large our timeline is and then build up from there. Our charts will need to be accommodating of window sizes, surrounding text, and more.

> A quick note on JavaScript objects:

```js
let arr = [1, "text", true];
console.log(obj[2]);
console.log(typeof obj[2]);

let obj = {
  a: 1,
  b: 2,
};

console.log(obj.a);

obj.c = 3;

delete obj.a;
```

Define a dimensions object that will contain the size of the wrapper and the margins. We'll have one margin defined for each side of the chart: top, right, bottom, and left.

```js
let dimensions = {
  width: window.innerWidth * 0.9,
  height: 400,
  margin: {
    top: 15,
    right: 15,
    bottom: 40,
    left: 60,
  },
};
```

We want a small top and right margin to give the chart some space and a larger bottom and left margin to create room for our axes.

Let's compute the size of our bounds and add that to our dimensions object.

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };

  // NEW
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  console.log(dimensions);
}

drawLineChart();
```

### Note on Variable Scope.

> We cannot access the dimensions variable in the browser's console because it is inside our `drawLineChart` function. Variables are [scoped](https://developer.mozilla.org/en-US/docs/Glossary/Scope) to the function. It is unnecessary here but if we wanted to make `dimensions` available in the console we could add it as shown:

```js
if (!window.dimensions) {
  window.dimensions = dimensions;
}
```

## Adding Elements

We'll use the #wrapper element to add elements to our page.

In previous lessons we used `document.querySelector()` to select an element on the page. D3's [d3-selection](https://github.com/d3/d3-selection) module has helper functions to select and modify the DOM.

`d3.select()` accepts a CSS selector and returns the first matching DOM element (if any):

`const wrapper = d3.select("#wrapper")`

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3.select("#wrapper");
  const svg = wrapper.append("svg");
  console.log(wrapper, svg);
}

drawLineChart();
```

```css
<style>
  svg {
    border: 1px solid #333;
  }
</style>
```

Unlike `document.querySelector` d3.select() returns a d3 selection object specially configured to work within the d3 system.

Expand the `_groups` key, and note that the linked element is our new <svg> element.

Hover over the <svg> element and the browser will highlight the corresponding DOM element on the webpage and show the element's size: 300px by 150px - the default size for SVG elements in Google Chrome.

SVG elements don't scale the way most DOM elements do — there are many rules that will be unfamiliar to an experienced web developer.

d3 selection objects have an `.attr()` method that will add or replace an attribute on the selected DOM element. The first argument is the attribute name and the second argument is the value.

```js
const wrapper = d3.select("#wrapper");
const svg = wrapper.append("svg");
svg.attr("width", dimensions.width);
svg.attr("height", dimensions.height);
```

> The value argument to .attr() can either be a constant (all we need right now) or a function, (which we'll need later).

### A Note on Style

Most d3-selection methods will return a selection object.

- any method that selects or creates a new object will return the new selection
- any method that manipulates the current selection will return the same selection

This allows us to keep our code concise by chaining. We can rewrite the above code as:

```js
const wrapper = d3.select("#wrapper");
const svg = wrapper
  .append("svg")
  .attr("width", dimensions.width)
  .attr("height", dimensions.height);
```

Since we're not going to re-use the svg variable, we can rewrite the above code as:

```js
const wrapper = d3
  .select("#wrapper")
  .append("svg")
  .attr("width", dimensions.width)
  .attr("height", dimensions.height);
```

The code so far:

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);
}

drawLineChart();
```

## Margins

We want our chart to respect the margins we specified.

Create a group - `<g>` - that shifts its contents using the CSS transform property to respect the top and left margins so we can deal with those in one place.

d3 selection objects have a `.style()` method for adding and modifying CSS styles. The .style() method is invoked similarly to .attr() and takes a key-value pair as its first and second arguments:

```js
const bounds = wrapper
  .append("g")
  .style(
    "transform",
    `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
  );
```

The <g> element size is 0px by 0px — instead of taking a width or height attribute, a <g> element will expand to fit its contents.

So far:

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

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
}

drawLineChart();
```

## Relative Scales

On our y axis, we want to plot the max temperature for every day.

Before we draw our chart, we need to decide what temperatures we want to visualize.

Do we need to plot temperatures over 1,000°F or under 0°F? We could hard-code a standard set of temperatures, but that range could be too large (making the data hard to see), or it could be too small or offset (cutting off the data).

Instead, let's use the actual range by finding the lowest and highest temperatures in our dataset.

> We've all seen over-dramatized timelines with a huge drop, only to realize that the change is relatively small. When defining an axis, we'll often want to start at 0 to show scale. We'll go over this more when we talk about types of data.

As an example, let's grab a sample day's data — say it has a maximum temperature of 55°F. We could draw our point 55 pixels above the bottom of the chart, but that won't scale with our boundedHeight.

If our lowest temperature is below 0 we would have to plot that value below the chart. Our y axis wouldn't be able to handle all of our temperature values.

To plot the max temperature values in the correct spot, we need to convert them into pixel space.

D3's [d3-scale](https://github.com/d3/d3-scale) module can create different types of scales.

_A scale is a function that converts values between two domains._

For our y axis, we want to convert values from the temperature domain to the pixel domain. If our chart needs to handle temperatures from 10°F to 100°F, a day with a max of 55°F will be halfway up the y axis.

Let's create a scale that converts those degrees into a y value. If our y axis is 200px tall, the y scale should convert 55°F into 100, the halfway point on the y axis.

<svg width="400" height="500" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="400" height="500" fill="white"/>
<path d="M25.0099 101.142C24.3471 101.142 23.7467 100.972 23.2088 100.631C22.6747 100.286 22.2505 99.7803 21.9361 99.1136C21.6255 98.4432 21.4702 97.6212 21.4702 96.6477C21.4702 95.6477 21.6312 94.8163 21.9531 94.1534C22.2751 93.4867 22.7031 92.9886 23.2372 92.6591C23.7751 92.3258 24.3641 92.1591 25.0043 92.1591C25.4929 92.1591 25.9001 92.2424 26.2259 92.4091C26.5554 92.572 26.8205 92.7765 27.0213 93.0227C27.2259 93.2652 27.3812 93.5038 27.4872 93.7386H27.5611V89.3636H29.9759V101H27.5895V99.6023H27.4872C27.3736 99.8447 27.2126 100.085 27.0043 100.324C26.7997 100.559 26.5327 100.754 26.2031 100.909C25.8774 101.064 25.4796 101.142 25.0099 101.142ZM25.777 99.2159C26.1671 99.2159 26.4967 99.1098 26.7656 98.8977C27.0384 98.6818 27.2467 98.3807 27.3906 97.9943C27.5384 97.608 27.6122 97.1553 27.6122 96.6364C27.6122 96.1174 27.5402 95.6667 27.3963 95.2841C27.2524 94.9015 27.044 94.6061 26.7713 94.3977C26.4986 94.1894 26.1671 94.0852 25.777 94.0852C25.3793 94.0852 25.044 94.1932 24.7713 94.4091C24.4986 94.625 24.2921 94.9242 24.152 95.3068C24.0118 95.6894 23.9418 96.1326 23.9418 96.6364C23.9418 97.1439 24.0118 97.5928 24.152 97.983C24.2959 98.3693 24.5024 98.6723 24.7713 98.892C25.044 99.108 25.3793 99.2159 25.777 99.2159ZM35.9091 101.17C35.0265 101.17 34.2633 100.983 33.6193 100.608C32.9792 100.229 32.4848 99.7027 32.1364 99.0284C31.7879 98.3504 31.6136 97.5644 31.6136 96.6705C31.6136 95.7689 31.7879 94.9811 32.1364 94.3068C32.4848 93.6288 32.9792 93.1023 33.6193 92.7273C34.2633 92.3485 35.0265 92.1591 35.9091 92.1591C36.7917 92.1591 37.553 92.3485 38.1932 92.7273C38.8371 93.1023 39.3333 93.6288 39.6818 94.3068C40.0303 94.9811 40.2045 95.7689 40.2045 96.6705C40.2045 97.5644 40.0303 98.3504 39.6818 99.0284C39.3333 99.7027 38.8371 100.229 38.1932 100.608C37.553 100.983 36.7917 101.17 35.9091 101.17ZM35.9205 99.2955C36.322 99.2955 36.6572 99.1818 36.9261 98.9545C37.1951 98.7235 37.3977 98.4091 37.5341 98.0114C37.6742 97.6136 37.7443 97.161 37.7443 96.6534C37.7443 96.1458 37.6742 95.6932 37.5341 95.2955C37.3977 94.8977 37.1951 94.5833 36.9261 94.3523C36.6572 94.1212 36.322 94.0057 35.9205 94.0057C35.5152 94.0057 35.1742 94.1212 34.8977 94.3523C34.625 94.5833 34.4186 94.8977 34.2784 95.2955C34.142 95.6932 34.0739 96.1458 34.0739 96.6534C34.0739 97.161 34.142 97.6136 34.2784 98.0114C34.4186 98.4091 34.625 98.7235 34.8977 98.9545C35.1742 99.1818 35.5152 99.2955 35.9205 99.2955ZM41.7784 101V92.2727H44.0852V93.8125H44.1875C44.3693 93.3011 44.6723 92.8977 45.0966 92.6023C45.5208 92.3068 46.0284 92.1591 46.6193 92.1591C47.2178 92.1591 47.7273 92.3087 48.1477 92.608C48.5682 92.9034 48.8485 93.3049 48.9886 93.8125H49.0795C49.2576 93.3125 49.5795 92.9129 50.0455 92.6136C50.5152 92.3106 51.0701 92.1591 51.7102 92.1591C52.5246 92.1591 53.1856 92.4186 53.6932 92.9375C54.2045 93.4527 54.4602 94.1837 54.4602 95.1307V101H52.0455V95.608C52.0455 95.1231 51.9167 94.7595 51.6591 94.517C51.4015 94.2746 51.0795 94.1534 50.6932 94.1534C50.2538 94.1534 49.911 94.2936 49.6648 94.5739C49.4186 94.8504 49.2955 95.2159 49.2955 95.6705V101H46.9489V95.5568C46.9489 95.1288 46.8258 94.7879 46.5795 94.5341C46.3371 94.2803 46.017 94.1534 45.6193 94.1534C45.3504 94.1534 45.108 94.2216 44.892 94.358C44.6799 94.4905 44.5114 94.678 44.3864 94.9205C44.2614 95.1591 44.1989 95.4394 44.1989 95.7614V101H41.7784ZM58.8608 101.165C58.304 101.165 57.8078 101.068 57.3722 100.875C56.9366 100.678 56.5919 100.388 56.3381 100.006C56.0881 99.6193 55.9631 99.1383 55.9631 98.5625C55.9631 98.0777 56.0521 97.6705 56.2301 97.3409C56.4081 97.0114 56.6506 96.7462 56.9574 96.5455C57.2642 96.3447 57.6127 96.1932 58.0028 96.0909C58.3968 95.9886 58.8097 95.9167 59.2415 95.875C59.7491 95.822 60.1581 95.7727 60.4688 95.7273C60.7794 95.678 61.0047 95.6061 61.1449 95.5114C61.285 95.4167 61.3551 95.2765 61.3551 95.0909V95.0568C61.3551 94.697 61.2415 94.4186 61.0142 94.2216C60.7907 94.0246 60.4725 93.9261 60.0597 93.9261C59.6241 93.9261 59.2775 94.0227 59.0199 94.2159C58.7623 94.4053 58.5919 94.6439 58.5085 94.9318L56.2699 94.75C56.3835 94.2197 56.607 93.7614 56.9403 93.375C57.2737 92.9848 57.7036 92.6856 58.2301 92.4773C58.7604 92.2652 59.3741 92.1591 60.071 92.1591C60.5559 92.1591 61.0199 92.2159 61.4631 92.3295C61.91 92.4432 62.3059 92.6193 62.6506 92.858C62.9991 93.0966 63.2737 93.4034 63.4744 93.7784C63.6752 94.1496 63.7756 94.5947 63.7756 95.1136V101H61.4801V99.7898H61.4119C61.2718 100.062 61.0843 100.303 60.8494 100.511C60.6146 100.716 60.3324 100.877 60.0028 100.994C59.6733 101.108 59.2926 101.165 58.8608 101.165ZM59.554 99.4943C59.91 99.4943 60.2244 99.4242 60.4972 99.2841C60.7699 99.1402 60.9839 98.947 61.1392 98.7045C61.2945 98.4621 61.3722 98.1875 61.3722 97.8807V96.9545C61.2964 97.0038 61.1922 97.0492 61.0597 97.0909C60.9309 97.1288 60.785 97.1648 60.6222 97.1989C60.4593 97.2292 60.2964 97.2576 60.1335 97.2841C59.9706 97.3068 59.8229 97.3277 59.6903 97.3466C59.4063 97.3883 59.1581 97.4545 58.946 97.5455C58.7339 97.6364 58.5691 97.7595 58.4517 97.9148C58.3343 98.0663 58.2756 98.2557 58.2756 98.483C58.2756 98.8125 58.3949 99.0644 58.6335 99.2386C58.8759 99.4091 59.1828 99.4943 59.554 99.4943ZM65.6534 101V92.2727H68.0739V101H65.6534ZM66.8693 91.1477C66.5095 91.1477 66.2008 91.0284 65.9432 90.7898C65.6894 90.5473 65.5625 90.2576 65.5625 89.9205C65.5625 89.5871 65.6894 89.3011 65.9432 89.0625C66.2008 88.8201 66.5095 88.6989 66.8693 88.6989C67.2292 88.6989 67.536 88.8201 67.7898 89.0625C68.0473 89.3011 68.1761 89.5871 68.1761 89.9205C68.1761 90.2576 68.0473 90.5473 67.7898 90.7898C67.536 91.0284 67.2292 91.1477 66.8693 91.1477ZM72.4332 95.9545V101H70.0128V92.2727H72.3196V93.8125H72.4219C72.6151 93.3049 72.9389 92.9034 73.3935 92.608C73.848 92.3087 74.3991 92.1591 75.0469 92.1591C75.6529 92.1591 76.1813 92.2917 76.6321 92.5568C77.0829 92.822 77.4332 93.2008 77.6832 93.6932C77.9332 94.1818 78.0582 94.7652 78.0582 95.4432V101H75.6378V95.875C75.6416 95.3409 75.5052 94.9242 75.2287 94.625C74.9522 94.322 74.5715 94.1705 74.0866 94.1705C73.7609 94.1705 73.473 94.2405 73.223 94.3807C72.9768 94.5208 72.7836 94.7254 72.6435 94.9943C72.5071 95.2595 72.437 95.5795 72.4332 95.9545ZM9.72834 116V109.455H11.5437V116H9.72834ZM10.6403 108.611C10.3704 108.611 10.1388 108.521 9.94567 108.342C9.75533 108.161 9.66016 107.943 9.66016 107.69C9.66016 107.44 9.75533 107.226 9.94567 107.047C10.1388 106.865 10.3704 106.774 10.6403 106.774C10.9102 106.774 11.1403 106.865 11.3306 107.047C11.5238 107.226 11.6204 107.44 11.6204 107.69C11.6204 107.943 11.5238 108.161 11.3306 108.342C11.1403 108.521 10.9102 108.611 10.6403 108.611ZM14.8132 112.216V116H12.9979V109.455H14.728V110.609H14.8047C14.9496 110.229 15.1925 109.928 15.5334 109.706C15.8743 109.482 16.2876 109.369 16.7734 109.369C17.228 109.369 17.6243 109.469 17.9624 109.668C18.3004 109.866 18.5632 110.151 18.7507 110.52C18.9382 110.886 19.032 111.324 19.032 111.832V116H17.2166V112.156C17.2195 111.756 17.1172 111.443 16.9098 111.219C16.7024 110.991 16.4169 110.878 16.0533 110.878C15.8089 110.878 15.593 110.93 15.4055 111.036C15.2209 111.141 15.076 111.294 14.9709 111.496C14.8686 111.695 14.8161 111.935 14.8132 112.216ZM25.652 116.107C25.1548 116.107 24.7045 115.979 24.3011 115.723C23.9006 115.464 23.5824 115.085 23.3466 114.585C23.1136 114.082 22.9972 113.466 22.9972 112.736C22.9972 111.986 23.1179 111.362 23.3594 110.865C23.6009 110.365 23.9219 109.991 24.3224 109.744C24.7259 109.494 25.1676 109.369 25.6477 109.369C26.0142 109.369 26.3196 109.432 26.5639 109.557C26.8111 109.679 27.0099 109.832 27.1605 110.017C27.3139 110.199 27.4304 110.378 27.5099 110.554H27.5653V107.273H29.3764V116H27.5866V114.952H27.5099C27.4247 115.134 27.304 115.314 27.1477 115.493C26.9943 115.669 26.794 115.815 26.5469 115.932C26.3026 116.048 26.0043 116.107 25.652 116.107ZM26.2273 114.662C26.5199 114.662 26.767 114.582 26.9688 114.423C27.1733 114.261 27.3295 114.036 27.4375 113.746C27.5483 113.456 27.6037 113.116 27.6037 112.727C27.6037 112.338 27.5497 112 27.4418 111.713C27.3338 111.426 27.1776 111.205 26.973 111.048C26.7685 110.892 26.5199 110.814 26.2273 110.814C25.929 110.814 25.6776 110.895 25.473 111.057C25.2685 111.219 25.1136 111.443 25.0085 111.73C24.9034 112.017 24.8509 112.349 24.8509 112.727C24.8509 113.108 24.9034 113.445 25.0085 113.737C25.1165 114.027 25.2713 114.254 25.473 114.419C25.6776 114.581 25.929 114.662 26.2273 114.662ZM33.8519 116.128C33.1786 116.128 32.5991 115.991 32.1133 115.719C31.6303 115.443 31.2582 115.054 30.9968 114.551C30.7354 114.045 30.6048 113.447 30.6048 112.757C30.6048 112.084 30.7354 111.493 30.9968 110.984C31.2582 110.476 31.6261 110.08 32.1005 109.795C32.5778 109.511 33.1374 109.369 33.7795 109.369C34.2113 109.369 34.6133 109.439 34.9854 109.578C35.3604 109.714 35.6871 109.92 35.9656 110.196C36.2468 110.472 36.4656 110.818 36.6218 111.236C36.7781 111.651 36.8562 112.136 36.8562 112.693V113.192H31.3292V112.067H35.1474C35.1474 111.805 35.0906 111.574 34.9769 111.372C34.8633 111.17 34.7056 111.013 34.5039 110.899C34.305 110.783 34.0735 110.724 33.8093 110.724C33.5337 110.724 33.2894 110.788 33.0763 110.916C32.8661 111.041 32.7013 111.21 32.582 111.423C32.4627 111.634 32.4016 111.868 32.3988 112.126V113.196C32.3988 113.52 32.4585 113.8 32.5778 114.036C32.6999 114.271 32.8718 114.453 33.0934 114.581C33.315 114.709 33.5778 114.773 33.8817 114.773C34.0835 114.773 34.2681 114.744 34.4357 114.688C34.6033 114.631 34.7468 114.545 34.8661 114.432C34.9854 114.318 35.0763 114.179 35.1388 114.014L36.8178 114.125C36.7326 114.528 36.5579 114.881 36.2937 115.182C36.0323 115.48 35.6942 115.713 35.2795 115.881C34.8675 116.045 34.3917 116.128 33.8519 116.128ZM40.9897 118.591C40.4016 118.591 39.8974 118.51 39.4769 118.348C39.0593 118.189 38.7269 117.972 38.4798 117.696C38.2326 117.42 38.0721 117.111 37.9982 116.767L39.6772 116.541C39.7283 116.672 39.8093 116.794 39.9201 116.908C40.0309 117.021 40.1772 117.112 40.359 117.18C40.5437 117.251 40.7681 117.287 41.0323 117.287C41.4272 117.287 41.7525 117.19 42.0082 116.997C42.2667 116.807 42.396 116.487 42.396 116.038V114.841H42.3192C42.2397 115.023 42.1204 115.195 41.9613 115.357C41.8022 115.518 41.5977 115.651 41.3477 115.753C41.0977 115.855 40.7994 115.906 40.4528 115.906C39.9613 115.906 39.5138 115.793 39.1104 115.565C38.7099 115.335 38.3903 114.984 38.1516 114.513C37.9158 114.038 37.7979 113.439 37.7979 112.714C37.7979 111.973 37.9187 111.354 38.1602 110.857C38.4016 110.359 38.7227 109.987 39.1232 109.74C39.5266 109.493 39.9684 109.369 40.4485 109.369C40.815 109.369 41.1218 109.432 41.369 109.557C41.6161 109.679 41.815 109.832 41.9656 110.017C42.119 110.199 42.2369 110.378 42.3192 110.554H42.3874V109.455H44.19V116.064C44.19 116.621 44.0536 117.087 43.7809 117.462C43.5082 117.837 43.1303 118.118 42.6474 118.305C42.1673 118.496 41.6147 118.591 40.9897 118.591ZM41.0281 114.543C41.3207 114.543 41.5678 114.47 41.7695 114.325C41.9741 114.178 42.1303 113.967 42.2383 113.695C42.3491 113.419 42.4045 113.089 42.4045 112.706C42.4045 112.322 42.3505 111.99 42.2425 111.709C42.1346 111.425 41.9783 111.205 41.7738 111.048C41.5692 110.892 41.3207 110.814 41.0281 110.814C40.7298 110.814 40.4783 110.895 40.2738 111.057C40.0692 111.216 39.9144 111.437 39.8093 111.722C39.7042 112.006 39.6516 112.334 39.6516 112.706C39.6516 113.084 39.7042 113.411 39.8093 113.686C39.9173 113.959 40.0721 114.17 40.2738 114.321C40.4783 114.469 40.7298 114.543 41.0281 114.543ZM45.6346 116V109.455H47.3945V110.597H47.4627C47.582 110.19 47.7823 109.884 48.0636 109.676C48.3448 109.466 48.6687 109.361 49.0352 109.361C49.1261 109.361 49.2241 109.366 49.3292 109.378C49.4343 109.389 49.5266 109.405 49.6062 109.425V111.036C49.521 111.01 49.4031 110.987 49.2525 110.967C49.1019 110.947 48.9641 110.938 48.8391 110.938C48.5721 110.938 48.3335 110.996 48.1232 111.112C47.9158 111.226 47.7511 111.385 47.6289 111.589C47.5096 111.794 47.4499 112.03 47.4499 112.297V116H45.6346ZM53.223 116.128C52.5497 116.128 51.9702 115.991 51.4844 115.719C51.0014 115.443 50.6293 115.054 50.3679 114.551C50.1065 114.045 49.9759 113.447 49.9759 112.757C49.9759 112.084 50.1065 111.493 50.3679 110.984C50.6293 110.476 50.9972 110.08 51.4716 109.795C51.9489 109.511 52.5085 109.369 53.1506 109.369C53.5824 109.369 53.9844 109.439 54.3565 109.578C54.7315 109.714 55.0582 109.92 55.3366 110.196C55.6179 110.472 55.8366 110.818 55.9929 111.236C56.1491 111.651 56.2273 112.136 56.2273 112.693V113.192H50.7003V112.067H54.5185C54.5185 111.805 54.4616 111.574 54.348 111.372C54.2344 111.17 54.0767 111.013 53.875 110.899C53.6761 110.783 53.4446 110.724 53.1804 110.724C52.9048 110.724 52.6605 110.788 52.4474 110.916C52.2372 111.041 52.0724 111.21 51.9531 111.423C51.8338 111.634 51.7727 111.868 51.7699 112.126V113.196C51.7699 113.52 51.8295 113.8 51.9489 114.036C52.071 114.271 52.2429 114.453 52.4645 114.581C52.6861 114.709 52.9489 114.773 53.2528 114.773C53.4545 114.773 53.6392 114.744 53.8068 114.688C53.9744 114.631 54.1179 114.545 54.2372 114.432C54.3565 114.318 54.4474 114.179 54.5099 114.014L56.1889 114.125C56.1037 114.528 55.929 114.881 55.6648 115.182C55.4034 115.48 55.0653 115.713 54.6506 115.881C54.2386 116.045 53.7628 116.128 53.223 116.128ZM60.3949 116.128C59.7216 116.128 59.142 115.991 58.6562 115.719C58.1733 115.443 57.8011 115.054 57.5398 114.551C57.2784 114.045 57.1477 113.447 57.1477 112.757C57.1477 112.084 57.2784 111.493 57.5398 110.984C57.8011 110.476 58.169 110.08 58.6435 109.795C59.1207 109.511 59.6804 109.369 60.3224 109.369C60.7543 109.369 61.1563 109.439 61.5284 109.578C61.9034 109.714 62.2301 109.92 62.5085 110.196C62.7898 110.472 63.0085 110.818 63.1648 111.236C63.321 111.651 63.3991 112.136 63.3991 112.693V113.192H57.8722V112.067H61.6903C61.6903 111.805 61.6335 111.574 61.5199 111.372C61.4063 111.17 61.2486 111.013 61.0469 110.899C60.848 110.783 60.6165 110.724 60.3523 110.724C60.0767 110.724 59.8324 110.788 59.6193 110.916C59.4091 111.041 59.2443 111.21 59.125 111.423C59.0057 111.634 58.9446 111.868 58.9418 112.126V113.196C58.9418 113.52 59.0014 113.8 59.1207 114.036C59.2429 114.271 59.4148 114.453 59.6364 114.581C59.858 114.709 60.1207 114.773 60.4247 114.773C60.6264 114.773 60.8111 114.744 60.9787 114.688C61.1463 114.631 61.2898 114.545 61.4091 114.432C61.5284 114.318 61.6193 114.179 61.6818 114.014L63.3608 114.125C63.2756 114.528 63.1009 114.881 62.8366 115.182C62.5753 115.48 62.2372 115.713 61.8224 115.881C61.4105 116.045 60.9347 116.128 60.3949 116.128ZM70.0298 111.321L68.3679 111.423C68.3395 111.281 68.2784 111.153 68.1847 111.04C68.0909 110.923 67.9673 110.831 67.8139 110.763C67.6634 110.692 67.483 110.656 67.2727 110.656C66.9915 110.656 66.7543 110.716 66.5611 110.835C66.3679 110.952 66.2713 111.108 66.2713 111.304C66.2713 111.46 66.3338 111.592 66.4588 111.7C66.5838 111.808 66.7983 111.895 67.1023 111.96L68.2869 112.199C68.9233 112.33 69.3977 112.54 69.7102 112.83C70.0227 113.119 70.179 113.5 70.179 113.972C70.179 114.401 70.0526 114.777 69.7997 115.101C69.5497 115.425 69.206 115.678 68.7685 115.859C68.3338 116.038 67.8324 116.128 67.2642 116.128C66.3977 116.128 65.7074 115.947 65.1932 115.587C64.6818 115.223 64.3821 114.729 64.294 114.104L66.0795 114.01C66.1335 114.274 66.2642 114.476 66.4716 114.615C66.679 114.751 66.9446 114.82 67.2685 114.82C67.5866 114.82 67.8423 114.759 68.0355 114.636C68.2315 114.511 68.331 114.351 68.3338 114.155C68.331 113.99 68.2614 113.855 68.125 113.75C67.9886 113.642 67.7784 113.56 67.4943 113.503L66.3608 113.277C65.7216 113.149 65.2457 112.928 64.9332 112.612C64.6236 112.297 64.4688 111.895 64.4688 111.406C64.4688 110.986 64.5824 110.624 64.8097 110.32C65.0398 110.016 65.3622 109.781 65.777 109.616C66.1946 109.452 66.6832 109.369 67.2429 109.369C68.0696 109.369 68.7202 109.544 69.1946 109.893C69.6719 110.243 69.9503 110.719 70.0298 111.321ZM78.1903 109.659V110.946H76.9162V116.149C76.9162 116.899 76.7216 117.47 76.3324 117.862C75.946 118.257 75.402 118.455 74.7003 118.455C74.5554 118.455 74.4119 118.449 74.2699 118.438C74.1307 118.426 73.9815 118.403 73.8224 118.369L73.9077 116.959C73.9759 116.979 74.0668 116.994 74.1804 117.006C74.2969 117.02 74.392 117.027 74.4659 117.027C74.7358 117.027 74.9176 116.947 75.0114 116.788C75.108 116.632 75.1562 116.419 75.1562 116.149V110.946H74.1676V109.659H75.1562V109.122C75.1591 108.392 75.3736 107.837 75.7997 107.456C76.2259 107.072 76.8068 106.881 77.5426 106.881C77.7273 106.881 77.9063 106.893 78.0795 106.919C78.2557 106.942 78.4148 106.97 78.5568 107.004L78.3821 108.372C78.3054 108.355 78.223 108.342 78.1349 108.334C78.0497 108.322 77.9361 108.317 77.794 108.317C77.5213 108.317 77.3068 108.385 77.1506 108.521C76.9972 108.655 76.919 108.855 76.9162 109.122V109.659H78.1903Z" fill="black"/>
<path d="M302.966 101V92.2727H305.312V93.7955H305.403C305.563 93.2538 305.83 92.8447 306.205 92.5682C306.58 92.2879 307.011 92.1477 307.5 92.1477C307.621 92.1477 307.752 92.1553 307.892 92.1705C308.032 92.1856 308.155 92.2064 308.261 92.233V94.3807C308.148 94.3466 307.991 94.3163 307.79 94.2898C307.589 94.2633 307.405 94.25 307.239 94.25C306.883 94.25 306.564 94.3277 306.284 94.483C306.008 94.6345 305.788 94.8466 305.625 95.1193C305.466 95.392 305.386 95.7064 305.386 96.0625V101H302.966ZM311.751 101.165C311.195 101.165 310.698 101.068 310.263 100.875C309.827 100.678 309.482 100.388 309.229 100.006C308.979 99.6193 308.854 99.1383 308.854 98.5625C308.854 98.0777 308.943 97.6705 309.121 97.3409C309.299 97.0114 309.541 96.7462 309.848 96.5455C310.155 96.3447 310.503 96.1932 310.893 96.0909C311.287 95.9886 311.7 95.9167 312.132 95.875C312.64 95.822 313.049 95.7727 313.359 95.7273C313.67 95.678 313.895 95.6061 314.036 95.5114C314.176 95.4167 314.246 95.2765 314.246 95.0909V95.0568C314.246 94.697 314.132 94.4186 313.905 94.2216C313.681 94.0246 313.363 93.9261 312.95 93.9261C312.515 93.9261 312.168 94.0227 311.911 94.2159C311.653 94.4053 311.482 94.6439 311.399 94.9318L309.161 94.75C309.274 94.2197 309.498 93.7614 309.831 93.375C310.164 92.9848 310.594 92.6856 311.121 92.4773C311.651 92.2652 312.265 92.1591 312.962 92.1591C313.446 92.1591 313.911 92.2159 314.354 92.3295C314.801 92.4432 315.196 92.6193 315.541 92.858C315.89 93.0966 316.164 93.4034 316.365 93.7784C316.566 94.1496 316.666 94.5947 316.666 95.1136V101H314.371V99.7898H314.303C314.162 100.062 313.975 100.303 313.74 100.511C313.505 100.716 313.223 100.877 312.893 100.994C312.564 101.108 312.183 101.165 311.751 101.165ZM312.445 99.4943C312.801 99.4943 313.115 99.4242 313.388 99.2841C313.661 99.1402 313.875 98.947 314.03 98.7045C314.185 98.4621 314.263 98.1875 314.263 97.8807V96.9545C314.187 97.0038 314.083 97.0492 313.95 97.0909C313.821 97.1288 313.676 97.1648 313.513 97.1989C313.35 97.2292 313.187 97.2576 313.024 97.2841C312.861 97.3068 312.714 97.3277 312.581 97.3466C312.297 97.3883 312.049 97.4545 311.837 97.5455C311.625 97.6364 311.46 97.7595 311.342 97.9148C311.225 98.0663 311.166 98.2557 311.166 98.483C311.166 98.8125 311.286 99.0644 311.524 99.2386C311.767 99.4091 312.073 99.4943 312.445 99.4943ZM320.964 95.9545V101H318.544V92.2727H320.851V93.8125H320.953C321.146 93.3049 321.47 92.9034 321.925 92.608C322.379 92.3087 322.93 92.1591 323.578 92.1591C324.184 92.1591 324.713 92.2917 325.163 92.5568C325.614 92.822 325.964 93.2008 326.214 93.6932C326.464 94.1818 326.589 94.7652 326.589 95.4432V101H324.169V95.875C324.173 95.3409 324.036 94.9242 323.76 94.625C323.483 94.322 323.103 94.1705 322.618 94.1705C322.292 94.1705 322.004 94.2405 321.754 94.3807C321.508 94.5208 321.315 94.7254 321.175 94.9943C321.038 95.2595 320.968 95.5795 320.964 95.9545ZM332.429 104.455C331.645 104.455 330.973 104.347 330.412 104.131C329.855 103.919 329.412 103.629 329.082 103.261C328.753 102.894 328.539 102.481 328.44 102.023L330.679 101.722C330.747 101.896 330.855 102.059 331.003 102.21C331.151 102.362 331.346 102.483 331.588 102.574C331.834 102.669 332.134 102.716 332.486 102.716C333.012 102.716 333.446 102.587 333.787 102.33C334.132 102.076 334.304 101.65 334.304 101.051V99.4545H334.202C334.096 99.697 333.937 99.9261 333.724 100.142C333.512 100.358 333.24 100.534 332.906 100.67C332.573 100.807 332.175 100.875 331.713 100.875C331.058 100.875 330.461 100.723 329.923 100.42C329.389 100.114 328.963 99.6458 328.645 99.017C328.33 98.3845 328.173 97.5852 328.173 96.6193C328.173 95.6307 328.334 94.8049 328.656 94.142C328.978 93.4792 329.406 92.983 329.94 92.6534C330.478 92.3239 331.067 92.1591 331.707 92.1591C332.196 92.1591 332.605 92.2424 332.935 92.4091C333.264 92.572 333.529 92.7765 333.73 93.0227C333.935 93.2652 334.092 93.5038 334.202 93.7386H334.293V92.2727H336.696V101.085C336.696 101.828 336.514 102.449 336.151 102.949C335.787 103.449 335.283 103.824 334.639 104.074C333.999 104.328 333.262 104.455 332.429 104.455ZM332.48 99.0568C332.87 99.0568 333.2 98.9602 333.469 98.767C333.741 98.5701 333.95 98.2898 334.094 97.9261C334.241 97.5587 334.315 97.1193 334.315 96.608C334.315 96.0966 334.243 95.6534 334.099 95.2784C333.955 94.8996 333.747 94.6061 333.474 94.3977C333.202 94.1894 332.87 94.0852 332.48 94.0852C332.082 94.0852 331.747 94.1932 331.474 94.4091C331.202 94.6212 330.995 94.9167 330.855 95.2955C330.715 95.6742 330.645 96.1117 330.645 96.608C330.645 97.1117 330.715 97.5473 330.855 97.9148C330.999 98.2784 331.205 98.5606 331.474 98.7614C331.747 98.9583 332.082 99.0568 332.48 99.0568ZM342.599 101.17C341.702 101.17 340.929 100.989 340.281 100.625C339.637 100.258 339.141 99.7386 338.793 99.0682C338.444 98.3939 338.27 97.5966 338.27 96.6761C338.27 95.7784 338.444 94.9905 338.793 94.3125C339.141 93.6345 339.632 93.1061 340.264 92.7273C340.901 92.3485 341.647 92.1591 342.503 92.1591C343.079 92.1591 343.615 92.2519 344.111 92.4375C344.611 92.6193 345.046 92.8939 345.418 93.2614C345.793 93.6288 346.084 94.0909 346.293 94.6477C346.501 95.2008 346.605 95.8485 346.605 96.5909V97.2557H339.236V95.7557H344.327C344.327 95.4072 344.251 95.0985 344.099 94.8295C343.948 94.5606 343.738 94.3504 343.469 94.1989C343.204 94.0436 342.895 93.9659 342.543 93.9659C342.175 93.9659 341.849 94.0511 341.565 94.2216C341.285 94.3883 341.065 94.6136 340.906 94.8977C340.747 95.178 340.666 95.4905 340.662 95.8352V97.2614C340.662 97.6932 340.741 98.0663 340.901 98.3807C341.063 98.6951 341.293 98.9375 341.588 99.108C341.884 99.2784 342.234 99.3636 342.639 99.3636C342.908 99.3636 343.154 99.3258 343.378 99.25C343.601 99.1742 343.793 99.0606 343.952 98.9091C344.111 98.7576 344.232 98.572 344.315 98.3523L346.554 98.5C346.44 99.0379 346.207 99.5076 345.855 99.9091C345.507 100.307 345.056 100.617 344.503 100.841C343.954 101.061 343.319 101.17 342.599 101.17ZM302.724 116V109.455H304.54V116H302.724ZM303.636 108.611C303.366 108.611 303.135 108.521 302.942 108.342C302.751 108.161 302.656 107.943 302.656 107.69C302.656 107.44 302.751 107.226 302.942 107.047C303.135 106.865 303.366 106.774 303.636 106.774C303.906 106.774 304.136 106.865 304.327 107.047C304.52 107.226 304.616 107.44 304.616 107.69C304.616 107.943 304.52 108.161 304.327 108.342C304.136 108.521 303.906 108.611 303.636 108.611ZM307.809 112.216V116H305.994V109.455H307.724V110.609H307.801C307.946 110.229 308.189 109.928 308.529 109.706C308.87 109.482 309.284 109.369 309.77 109.369C310.224 109.369 310.62 109.469 310.958 109.668C311.297 109.866 311.559 110.151 311.747 110.52C311.934 110.886 312.028 111.324 312.028 111.832V116H310.213V112.156C310.216 111.756 310.113 111.443 309.906 111.219C309.699 110.991 309.413 110.878 309.049 110.878C308.805 110.878 308.589 110.93 308.402 111.036C308.217 111.141 308.072 111.294 307.967 111.496C307.865 111.695 307.812 111.935 307.809 112.216ZM316.236 118.455V109.455H318.026V110.554H318.107C318.186 110.378 318.301 110.199 318.452 110.017C318.605 109.832 318.804 109.679 319.049 109.557C319.296 109.432 319.603 109.369 319.969 109.369C320.446 109.369 320.887 109.494 321.29 109.744C321.694 109.991 322.016 110.365 322.257 110.865C322.499 111.362 322.62 111.986 322.62 112.736C322.62 113.466 322.502 114.082 322.266 114.585C322.033 115.085 321.715 115.464 321.311 115.723C320.911 115.979 320.462 116.107 319.965 116.107C319.613 116.107 319.313 116.048 319.066 115.932C318.821 115.815 318.621 115.669 318.465 115.493C318.309 115.314 318.189 115.134 318.107 114.952H318.051V118.455H316.236ZM318.013 112.727C318.013 113.116 318.067 113.456 318.175 113.746C318.283 114.036 318.439 114.261 318.644 114.423C318.848 114.582 319.097 114.662 319.39 114.662C319.685 114.662 319.935 114.581 320.14 114.419C320.344 114.254 320.499 114.027 320.604 113.737C320.712 113.445 320.766 113.108 320.766 112.727C320.766 112.349 320.713 112.017 320.608 111.73C320.503 111.443 320.348 111.219 320.144 111.057C319.939 110.895 319.688 110.814 319.39 110.814C319.094 110.814 318.844 110.892 318.64 111.048C318.438 111.205 318.283 111.426 318.175 111.713C318.067 112 318.013 112.338 318.013 112.727ZM323.83 116V109.455H325.645V116H323.83ZM324.742 108.611C324.472 108.611 324.24 108.521 324.047 108.342C323.857 108.161 323.762 107.943 323.762 107.69C323.762 107.44 323.857 107.226 324.047 107.047C324.24 106.865 324.472 106.774 324.742 106.774C325.012 106.774 325.242 106.865 325.432 107.047C325.625 107.226 325.722 107.44 325.722 107.69C325.722 107.943 325.625 108.161 325.432 108.342C325.242 108.521 325.012 108.611 324.742 108.611ZM328.616 109.455L329.818 111.743L331.05 109.455H332.912L331.016 112.727L332.963 116H331.109L329.818 113.737L328.548 116H326.673L328.616 112.727L326.741 109.455H328.616ZM336.739 116.128C336.065 116.128 335.486 115.991 335 115.719C334.517 115.443 334.145 115.054 333.884 114.551C333.622 114.045 333.491 113.447 333.491 112.757C333.491 112.084 333.622 111.493 333.884 110.984C334.145 110.476 334.513 110.08 334.987 109.795C335.464 109.511 336.024 109.369 336.666 109.369C337.098 109.369 337.5 109.439 337.872 109.578C338.247 109.714 338.574 109.92 338.852 110.196C339.134 110.472 339.352 110.818 339.509 111.236C339.665 111.651 339.743 112.136 339.743 112.693V113.192H334.216V112.067H338.034C338.034 111.805 337.977 111.574 337.864 111.372C337.75 111.17 337.592 111.013 337.391 110.899C337.192 110.783 336.96 110.724 336.696 110.724C336.42 110.724 336.176 110.788 335.963 110.916C335.753 111.041 335.588 111.21 335.469 111.423C335.349 111.634 335.288 111.868 335.286 112.126V113.196C335.286 113.52 335.345 113.8 335.464 114.036C335.587 114.271 335.759 114.453 335.98 114.581C336.202 114.709 336.464 114.773 336.768 114.773C336.97 114.773 337.155 114.744 337.322 114.688C337.49 114.631 337.634 114.545 337.753 114.432C337.872 114.318 337.963 114.179 338.026 114.014L339.705 114.125C339.619 114.528 339.445 114.881 339.18 115.182C338.919 115.48 338.581 115.713 338.166 115.881C337.754 116.045 337.278 116.128 336.739 116.128ZM342.743 107.273V116H340.928V107.273H342.743ZM349.643 111.321L347.981 111.423C347.953 111.281 347.892 111.153 347.798 111.04C347.704 110.923 347.581 110.831 347.427 110.763C347.277 110.692 347.096 110.656 346.886 110.656C346.605 110.656 346.368 110.716 346.174 110.835C345.981 110.952 345.885 111.108 345.885 111.304C345.885 111.46 345.947 111.592 346.072 111.7C346.197 111.808 346.412 111.895 346.716 111.96L347.9 112.199C348.537 112.33 349.011 112.54 349.324 112.83C349.636 113.119 349.792 113.5 349.792 113.972C349.792 114.401 349.666 114.777 349.413 115.101C349.163 115.425 348.819 115.678 348.382 115.859C347.947 116.038 347.446 116.128 346.877 116.128C346.011 116.128 345.321 115.947 344.806 115.587C344.295 115.223 343.995 114.729 343.907 114.104L345.693 114.01C345.747 114.274 345.877 114.476 346.085 114.615C346.292 114.751 346.558 114.82 346.882 114.82C347.2 114.82 347.456 114.759 347.649 114.636C347.845 114.511 347.944 114.351 347.947 114.155C347.944 113.99 347.875 113.855 347.738 113.75C347.602 113.642 347.392 113.56 347.108 113.503L345.974 113.277C345.335 113.149 344.859 112.928 344.547 112.612C344.237 112.297 344.082 111.895 344.082 111.406C344.082 110.986 344.196 110.624 344.423 110.32C344.653 110.016 344.975 109.781 345.39 109.616C345.808 109.452 346.297 109.369 346.856 109.369C347.683 109.369 348.333 109.544 348.808 109.893C349.285 110.243 349.564 110.719 349.643 111.321Z" fill="black"/>
<path d="M149.46 270.273C149.153 270.273 148.866 270.248 148.597 270.199C148.331 270.153 148.112 270.095 147.938 270.023L148.483 268.216C148.767 268.303 149.023 268.35 149.25 268.358C149.481 268.366 149.68 268.313 149.847 268.199C150.017 268.085 150.155 267.892 150.261 267.619L150.403 267.25L147.273 258.273H149.818L151.625 264.682H151.716L153.54 258.273H156.102L152.71 267.943C152.547 268.413 152.326 268.822 152.045 269.17C151.769 269.523 151.419 269.794 150.994 269.983C150.57 270.176 150.059 270.273 149.46 270.273ZM163.699 258.71C163.653 258.252 163.458 257.896 163.114 257.642C162.769 257.388 162.301 257.261 161.71 257.261C161.309 257.261 160.97 257.318 160.693 257.432C160.417 257.542 160.205 257.695 160.057 257.892C159.913 258.089 159.841 258.312 159.841 258.562C159.833 258.771 159.877 258.953 159.972 259.108C160.07 259.263 160.205 259.398 160.375 259.511C160.545 259.621 160.742 259.718 160.966 259.801C161.189 259.881 161.428 259.949 161.682 260.006L162.727 260.256C163.235 260.369 163.701 260.521 164.125 260.71C164.549 260.9 164.917 261.133 165.227 261.409C165.538 261.686 165.778 262.011 165.949 262.386C166.123 262.761 166.212 263.191 166.216 263.676C166.212 264.388 166.03 265.006 165.67 265.528C165.314 266.047 164.799 266.451 164.125 266.739C163.455 267.023 162.646 267.165 161.699 267.165C160.759 267.165 159.941 267.021 159.244 266.733C158.551 266.445 158.009 266.019 157.619 265.455C157.233 264.886 157.03 264.184 157.011 263.347H159.392C159.419 263.737 159.53 264.062 159.727 264.324C159.928 264.581 160.195 264.777 160.528 264.909C160.866 265.038 161.246 265.102 161.67 265.102C162.087 265.102 162.449 265.042 162.756 264.92C163.066 264.799 163.307 264.631 163.477 264.415C163.648 264.199 163.733 263.951 163.733 263.67C163.733 263.409 163.655 263.189 163.5 263.011C163.348 262.833 163.125 262.682 162.83 262.557C162.538 262.432 162.18 262.318 161.756 262.216L160.489 261.898C159.508 261.659 158.733 261.286 158.165 260.778C157.597 260.271 157.314 259.587 157.318 258.727C157.314 258.023 157.502 257.407 157.881 256.881C158.263 256.354 158.788 255.943 159.455 255.648C160.121 255.352 160.879 255.205 161.727 255.205C162.591 255.205 163.345 255.352 163.989 255.648C164.636 255.943 165.14 256.354 165.5 256.881C165.86 257.407 166.045 258.017 166.057 258.71H163.699ZM171.768 267.17C170.875 267.17 170.106 266.981 169.462 266.602C168.821 266.22 168.329 265.689 167.984 265.011C167.643 264.333 167.473 263.553 167.473 262.67C167.473 261.777 167.645 260.992 167.99 260.318C168.339 259.64 168.833 259.112 169.473 258.733C170.113 258.35 170.875 258.159 171.757 258.159C172.518 258.159 173.185 258.297 173.757 258.574C174.329 258.85 174.782 259.239 175.115 259.739C175.448 260.239 175.632 260.826 175.666 261.5H173.382C173.318 261.064 173.147 260.714 172.871 260.449C172.598 260.18 172.24 260.045 171.797 260.045C171.422 260.045 171.094 260.148 170.814 260.352C170.537 260.553 170.321 260.847 170.166 261.233C170.011 261.619 169.933 262.087 169.933 262.636C169.933 263.193 170.009 263.667 170.161 264.057C170.316 264.447 170.534 264.744 170.814 264.949C171.094 265.153 171.422 265.256 171.797 265.256C172.073 265.256 172.321 265.199 172.541 265.085C172.765 264.972 172.948 264.807 173.092 264.591C173.24 264.371 173.337 264.108 173.382 263.801H175.666C175.628 264.468 175.446 265.055 175.121 265.562C174.799 266.066 174.354 266.46 173.786 266.744C173.217 267.028 172.545 267.17 171.768 267.17ZM179.705 267.165C179.148 267.165 178.652 267.068 178.216 266.875C177.78 266.678 177.436 266.388 177.182 266.006C176.932 265.619 176.807 265.138 176.807 264.562C176.807 264.078 176.896 263.67 177.074 263.341C177.252 263.011 177.494 262.746 177.801 262.545C178.108 262.345 178.456 262.193 178.847 262.091C179.241 261.989 179.653 261.917 180.085 261.875C180.593 261.822 181.002 261.773 181.312 261.727C181.623 261.678 181.848 261.606 181.989 261.511C182.129 261.417 182.199 261.277 182.199 261.091V261.057C182.199 260.697 182.085 260.419 181.858 260.222C181.634 260.025 181.316 259.926 180.903 259.926C180.468 259.926 180.121 260.023 179.864 260.216C179.606 260.405 179.436 260.644 179.352 260.932L177.114 260.75C177.227 260.22 177.451 259.761 177.784 259.375C178.117 258.985 178.547 258.686 179.074 258.477C179.604 258.265 180.218 258.159 180.915 258.159C181.4 258.159 181.864 258.216 182.307 258.33C182.754 258.443 183.15 258.619 183.494 258.858C183.843 259.097 184.117 259.403 184.318 259.778C184.519 260.15 184.619 260.595 184.619 261.114V267H182.324V265.79H182.256C182.116 266.062 181.928 266.303 181.693 266.511C181.458 266.716 181.176 266.877 180.847 266.994C180.517 267.108 180.136 267.165 179.705 267.165ZM180.398 265.494C180.754 265.494 181.068 265.424 181.341 265.284C181.614 265.14 181.828 264.947 181.983 264.705C182.138 264.462 182.216 264.187 182.216 263.881V262.955C182.14 263.004 182.036 263.049 181.903 263.091C181.775 263.129 181.629 263.165 181.466 263.199C181.303 263.229 181.14 263.258 180.977 263.284C180.814 263.307 180.667 263.328 180.534 263.347C180.25 263.388 180.002 263.455 179.79 263.545C179.578 263.636 179.413 263.759 179.295 263.915C179.178 264.066 179.119 264.256 179.119 264.483C179.119 264.812 179.239 265.064 179.477 265.239C179.72 265.409 180.027 265.494 180.398 265.494ZM188.918 255.364V267H186.497V255.364H188.918ZM194.834 267.17C193.936 267.17 193.163 266.989 192.516 266.625C191.872 266.258 191.375 265.739 191.027 265.068C190.679 264.394 190.504 263.597 190.504 262.676C190.504 261.778 190.679 260.991 191.027 260.312C191.375 259.634 191.866 259.106 192.499 258.727C193.135 258.348 193.881 258.159 194.737 258.159C195.313 258.159 195.849 258.252 196.345 258.438C196.845 258.619 197.281 258.894 197.652 259.261C198.027 259.629 198.319 260.091 198.527 260.648C198.735 261.201 198.839 261.848 198.839 262.591V263.256H191.47V261.756H196.561C196.561 261.407 196.485 261.098 196.334 260.83C196.182 260.561 195.972 260.35 195.703 260.199C195.438 260.044 195.129 259.966 194.777 259.966C194.41 259.966 194.084 260.051 193.8 260.222C193.519 260.388 193.3 260.614 193.141 260.898C192.982 261.178 192.9 261.491 192.896 261.835V263.261C192.896 263.693 192.976 264.066 193.135 264.381C193.298 264.695 193.527 264.938 193.822 265.108C194.118 265.278 194.468 265.364 194.874 265.364C195.143 265.364 195.389 265.326 195.612 265.25C195.836 265.174 196.027 265.061 196.186 264.909C196.345 264.758 196.466 264.572 196.55 264.352L198.788 264.5C198.675 265.038 198.442 265.508 198.089 265.909C197.741 266.307 197.29 266.617 196.737 266.841C196.188 267.061 195.554 267.17 194.834 267.17Z" fill="black"/>
<rect x="96" y="86" width="40" height="305" fill="#C4C4C4"/>
<rect x="253" y="24" width="40" height="420" fill="#C4C4C4"/>
<path d="M298.707 33V31.6705L301.814 28.794C302.078 28.5384 302.3 28.3082 302.479 28.1037C302.661 27.8991 302.798 27.6989 302.892 27.5028C302.986 27.304 303.033 27.0895 303.033 26.8594C303.033 26.6037 302.974 26.3835 302.858 26.1989C302.741 26.0114 302.582 25.8679 302.381 25.7685C302.179 25.6662 301.95 25.6151 301.695 25.6151C301.428 25.6151 301.195 25.669 300.996 25.777C300.797 25.8849 300.643 26.0398 300.536 26.2415C300.428 26.4432 300.374 26.6832 300.374 26.9616H298.622C298.622 26.3906 298.751 25.8949 299.01 25.4744C299.268 25.054 299.631 24.7287 300.097 24.4986C300.563 24.2685 301.099 24.1534 301.707 24.1534C302.332 24.1534 302.876 24.2642 303.339 24.4858C303.805 24.7045 304.168 25.0085 304.426 25.3977C304.685 25.7869 304.814 26.233 304.814 26.7358C304.814 27.0653 304.749 27.3906 304.618 27.7116C304.49 28.0327 304.261 28.3892 303.932 28.7812C303.602 29.1705 303.138 29.6378 302.538 30.1832L301.264 31.4318V31.4915H304.929V33H298.707ZM309.688 33.1918C308.955 33.1889 308.324 33.0085 307.796 32.6506C307.27 32.2926 306.865 31.7741 306.581 31.0952C306.3 30.4162 306.161 29.5994 306.164 28.6449C306.164 27.6932 306.304 26.8821 306.586 26.2116C306.87 25.5412 307.275 25.0312 307.8 24.6818C308.328 24.3295 308.958 24.1534 309.688 24.1534C310.418 24.1534 311.046 24.3295 311.571 24.6818C312.1 25.0341 312.506 25.5455 312.79 26.2159C313.074 26.8835 313.215 27.6932 313.212 28.6449C313.212 29.6023 313.07 30.4205 312.786 31.0994C312.505 31.7784 312.101 32.2969 311.576 32.6548C311.05 33.0128 310.421 33.1918 309.688 33.1918ZM309.688 31.6619C310.188 31.6619 310.587 31.4105 310.885 30.9077C311.184 30.4048 311.331 29.6506 311.328 28.6449C311.328 27.983 311.26 27.4318 311.124 26.9915C310.99 26.5511 310.8 26.2202 310.553 25.9986C310.309 25.777 310.02 25.6662 309.688 25.6662C309.191 25.6662 308.793 25.9148 308.495 26.4119C308.196 26.9091 308.046 27.6534 308.043 28.6449C308.043 29.3153 308.11 29.875 308.243 30.3239C308.38 30.7699 308.571 31.1051 308.819 31.3295C309.066 31.5511 309.355 31.6619 309.688 31.6619ZM317.95 33.1918C317.217 33.1889 316.586 33.0085 316.058 32.6506C315.532 32.2926 315.127 31.7741 314.843 31.0952C314.562 30.4162 314.423 29.5994 314.425 28.6449C314.425 27.6932 314.566 26.8821 314.847 26.2116C315.131 25.5412 315.536 25.0312 316.062 24.6818C316.59 24.3295 317.219 24.1534 317.95 24.1534C318.68 24.1534 319.308 24.3295 319.833 24.6818C320.362 25.0341 320.768 25.5455 321.052 26.2159C321.336 26.8835 321.477 27.6932 321.474 28.6449C321.474 29.6023 321.332 30.4205 321.048 31.0994C320.766 31.7784 320.363 32.2969 319.837 32.6548C319.312 33.0128 318.683 33.1918 317.95 33.1918ZM317.95 31.6619C318.45 31.6619 318.849 31.4105 319.147 30.9077C319.445 30.4048 319.593 29.6506 319.59 28.6449C319.59 27.983 319.522 27.4318 319.386 26.9915C319.252 26.5511 319.062 26.2202 318.815 25.9986C318.57 25.777 318.282 25.6662 317.95 25.6662C317.452 25.6662 317.055 25.9148 316.756 26.4119C316.458 26.9091 316.308 27.6534 316.305 28.6449C316.305 29.3153 316.371 29.875 316.505 30.3239C316.641 30.7699 316.833 31.1051 317.08 31.3295C317.327 31.5511 317.617 31.6619 317.95 31.6619Z" fill="black"/>
<path d="M149.504 89.2727V98H147.659V91.0241H147.608L145.609 92.277V90.6406L147.77 89.2727H149.504ZM155 98.1918C154.267 98.1889 153.637 98.0085 153.108 97.6506C152.583 97.2926 152.178 96.7741 151.894 96.0952C151.613 95.4162 151.473 94.5994 151.476 93.6449C151.476 92.6932 151.617 91.8821 151.898 91.2116C152.182 90.5412 152.587 90.0312 153.113 89.6818C153.641 89.3295 154.27 89.1534 155 89.1534C155.73 89.1534 156.358 89.3295 156.884 89.6818C157.412 90.0341 157.819 90.5455 158.103 91.2159C158.387 91.8835 158.527 92.6932 158.525 93.6449C158.525 94.6023 158.382 95.4205 158.098 96.0994C157.817 96.7784 157.414 97.2969 156.888 97.6548C156.363 98.0128 155.733 98.1918 155 98.1918ZM155 96.6619C155.5 96.6619 155.9 96.4105 156.198 95.9077C156.496 95.4048 156.644 94.6506 156.641 93.6449C156.641 92.983 156.573 92.4318 156.436 91.9915C156.303 91.5511 156.113 91.2202 155.865 90.9986C155.621 90.777 155.333 90.6662 155 90.6662C154.503 90.6662 154.105 90.9148 153.807 91.4119C153.509 91.9091 153.358 92.6534 153.355 93.6449C153.355 94.3153 153.422 94.875 153.556 95.3239C153.692 95.7699 153.884 96.1051 154.131 96.3295C154.378 96.5511 154.668 96.6619 155 96.6619ZM163.262 98.1918C162.529 98.1889 161.898 98.0085 161.37 97.6506C160.844 97.2926 160.44 96.7741 160.156 96.0952C159.874 95.4162 159.735 94.5994 159.738 93.6449C159.738 92.6932 159.879 91.8821 160.16 91.2116C160.444 90.5412 160.849 90.0312 161.374 89.6818C161.903 89.3295 162.532 89.1534 163.262 89.1534C163.992 89.1534 164.62 89.3295 165.146 89.6818C165.674 90.0341 166.08 90.5455 166.364 91.2159C166.648 91.8835 166.789 92.6932 166.786 93.6449C166.786 94.6023 166.644 95.4205 166.36 96.0994C166.079 96.7784 165.675 97.2969 165.15 97.6548C164.624 98.0128 163.995 98.1918 163.262 98.1918ZM163.262 96.6619C163.762 96.6619 164.161 96.4105 164.46 95.9077C164.758 95.4048 164.906 94.6506 164.903 93.6449C164.903 92.983 164.835 92.4318 164.698 91.9915C164.565 91.5511 164.374 91.2202 164.127 90.9986C163.883 90.777 163.594 90.6662 163.262 90.6662C162.765 90.6662 162.367 90.9148 162.069 91.4119C161.771 91.9091 161.62 92.6534 161.617 93.6449C161.617 94.3153 161.684 94.875 161.817 95.3239C161.954 95.7699 162.146 96.1051 162.393 96.3295C162.64 96.5511 162.93 96.6619 163.262 96.6619Z" fill="black"/>
<path d="M151.933 299.119C151.297 299.119 150.73 299.01 150.233 298.791C149.739 298.57 149.348 298.266 149.061 297.879C148.777 297.49 148.631 297.041 148.622 296.533H150.48C150.491 296.746 150.561 296.933 150.689 297.095C150.82 297.254 150.993 297.378 151.209 297.466C151.425 297.554 151.668 297.598 151.938 297.598C152.219 297.598 152.467 297.548 152.683 297.449C152.899 297.349 153.068 297.212 153.19 297.036C153.313 296.859 153.374 296.656 153.374 296.426C153.374 296.193 153.308 295.987 153.178 295.808C153.05 295.626 152.865 295.484 152.624 295.382C152.385 295.28 152.101 295.229 151.771 295.229H150.957V293.874H151.771C152.05 293.874 152.295 293.825 152.509 293.729C152.724 293.632 152.892 293.499 153.011 293.328C153.131 293.155 153.19 292.953 153.19 292.723C153.19 292.504 153.138 292.312 153.033 292.148C152.93 291.98 152.786 291.849 152.598 291.756C152.413 291.662 152.197 291.615 151.95 291.615C151.7 291.615 151.472 291.661 151.264 291.751C151.057 291.839 150.891 291.966 150.766 292.131C150.641 292.295 150.574 292.489 150.565 292.71H148.797C148.805 292.207 148.949 291.764 149.227 291.381C149.506 290.997 149.881 290.697 150.352 290.482C150.827 290.263 151.362 290.153 151.959 290.153C152.561 290.153 153.088 290.263 153.54 290.482C153.991 290.7 154.342 290.996 154.592 291.368C154.845 291.737 154.97 292.152 154.967 292.612C154.97 293.101 154.818 293.509 154.511 293.835C154.207 294.162 153.811 294.369 153.322 294.457V294.526C153.964 294.608 154.453 294.831 154.788 295.195C155.126 295.555 155.294 296.007 155.291 296.55C155.294 297.047 155.151 297.489 154.861 297.875C154.574 298.261 154.178 298.565 153.672 298.787C153.166 299.009 152.587 299.119 151.933 299.119ZM156.618 299V297.67L159.724 294.794C159.988 294.538 160.21 294.308 160.389 294.104C160.571 293.899 160.708 293.699 160.802 293.503C160.896 293.304 160.943 293.089 160.943 292.859C160.943 292.604 160.885 292.384 160.768 292.199C160.652 292.011 160.493 291.868 160.291 291.768C160.089 291.666 159.86 291.615 159.605 291.615C159.338 291.615 159.105 291.669 158.906 291.777C158.707 291.885 158.554 292.04 158.446 292.241C158.338 292.443 158.284 292.683 158.284 292.962H156.532C156.532 292.391 156.662 291.895 156.92 291.474C157.179 291.054 157.541 290.729 158.007 290.499C158.473 290.268 159.01 290.153 159.618 290.153C160.243 290.153 160.787 290.264 161.25 290.486C161.716 290.705 162.078 291.009 162.336 291.398C162.595 291.787 162.724 292.233 162.724 292.736C162.724 293.065 162.659 293.391 162.528 293.712C162.4 294.033 162.172 294.389 161.842 294.781C161.512 295.17 161.048 295.638 160.449 296.183L159.174 297.432V297.491H162.839V299H156.618Z" fill="black"/>
<path d="M218.575 265.466V264.013L222.219 258.273H223.472V260.284H222.73L220.433 263.919V263.987H225.611V265.466H218.575ZM222.764 267V265.023L222.798 264.379V258.273H224.528V267H222.764ZM230.096 267.119C229.44 267.119 228.856 267.013 228.344 266.8C227.836 266.584 227.437 266.29 227.147 265.918C226.857 265.545 226.712 265.124 226.712 264.652C226.712 264.288 226.795 263.955 226.96 263.651C227.127 263.344 227.354 263.089 227.641 262.888C227.928 262.683 228.249 262.553 228.604 262.496V262.436C228.138 262.342 227.761 262.116 227.471 261.759C227.181 261.398 227.036 260.979 227.036 260.501C227.036 260.05 227.168 259.648 227.433 259.295C227.697 258.94 228.059 258.662 228.519 258.46C228.982 258.256 229.508 258.153 230.096 258.153C230.684 258.153 231.208 258.256 231.668 258.46C232.131 258.665 232.495 258.945 232.759 259.3C233.023 259.652 233.157 260.053 233.16 260.501C233.157 260.982 233.009 261.401 232.717 261.759C232.424 262.116 232.049 262.342 231.592 262.436V262.496C231.941 262.553 232.258 262.683 232.542 262.888C232.829 263.089 233.056 263.344 233.224 263.651C233.394 263.955 233.481 264.288 233.484 264.652C233.481 265.124 233.335 265.545 233.045 265.918C232.755 266.29 232.354 266.584 231.843 266.8C231.335 267.013 230.752 267.119 230.096 267.119ZM230.096 265.764C230.388 265.764 230.644 265.712 230.863 265.607C231.082 265.499 231.252 265.351 231.374 265.163C231.499 264.973 231.562 264.754 231.562 264.507C231.562 264.254 231.498 264.031 231.37 263.838C231.242 263.642 231.069 263.489 230.85 263.378C230.631 263.264 230.38 263.207 230.096 263.207C229.815 263.207 229.563 263.264 229.342 263.378C229.12 263.489 228.945 263.642 228.817 263.838C228.692 264.031 228.63 264.254 228.63 264.507C228.63 264.754 228.691 264.973 228.813 265.163C228.935 265.351 229.107 265.499 229.329 265.607C229.55 265.712 229.806 265.764 230.096 265.764ZM230.096 261.865C230.34 261.865 230.558 261.815 230.748 261.716C230.938 261.616 231.087 261.479 231.195 261.303C231.303 261.126 231.357 260.923 231.357 260.693C231.357 260.466 231.303 260.267 231.195 260.097C231.087 259.923 230.94 259.788 230.752 259.692C230.565 259.592 230.346 259.543 230.096 259.543C229.849 259.543 229.63 259.592 229.44 259.692C229.249 259.788 229.1 259.923 228.992 260.097C228.887 260.267 228.835 260.466 228.835 260.693C228.835 260.923 228.888 261.126 228.996 261.303C229.104 261.479 229.254 261.616 229.444 261.716C229.634 261.815 229.852 261.865 230.096 261.865ZM235.606 267.111C235.325 267.111 235.083 267.011 234.881 266.812C234.683 266.611 234.583 266.369 234.583 266.088C234.583 265.81 234.683 265.571 234.881 265.372C235.083 265.173 235.325 265.074 235.606 265.074C235.879 265.074 236.117 265.173 236.322 265.372C236.526 265.571 236.629 265.81 236.629 266.088C236.629 266.276 236.58 266.447 236.484 266.604C236.39 266.757 236.266 266.881 236.113 266.974C235.96 267.065 235.79 267.111 235.606 267.111ZM241.006 267.119C240.35 267.119 239.766 267.013 239.255 266.8C238.746 266.584 238.347 266.29 238.057 265.918C237.767 265.545 237.623 265.124 237.623 264.652C237.623 264.288 237.705 263.955 237.87 263.651C238.037 263.344 238.265 263.089 238.551 262.888C238.838 262.683 239.159 262.553 239.515 262.496V262.436C239.049 262.342 238.671 262.116 238.381 261.759C238.091 261.398 237.946 260.979 237.946 260.501C237.946 260.05 238.078 259.648 238.343 259.295C238.607 258.94 238.969 258.662 239.429 258.46C239.892 258.256 240.418 258.153 241.006 258.153C241.594 258.153 242.118 258.256 242.578 258.46C243.042 258.665 243.405 258.945 243.669 259.3C243.934 259.652 244.067 260.053 244.07 260.501C244.067 260.982 243.919 261.401 243.627 261.759C243.334 262.116 242.959 262.342 242.502 262.436V262.496C242.851 262.553 243.168 262.683 243.452 262.888C243.739 263.089 243.966 263.344 244.134 263.651C244.304 263.955 244.391 264.288 244.394 264.652C244.391 265.124 244.245 265.545 243.955 265.918C243.665 266.29 243.265 266.584 242.753 266.8C242.245 267.013 241.662 267.119 241.006 267.119ZM241.006 265.764C241.299 265.764 241.554 265.712 241.773 265.607C241.992 265.499 242.162 265.351 242.284 265.163C242.409 264.973 242.472 264.754 242.472 264.507C242.472 264.254 242.408 264.031 242.28 263.838C242.152 263.642 241.979 263.489 241.76 263.378C241.542 263.264 241.29 263.207 241.006 263.207C240.725 263.207 240.473 263.264 240.252 263.378C240.03 263.489 239.855 263.642 239.728 263.838C239.603 264.031 239.54 264.254 239.54 264.507C239.54 264.754 239.601 264.973 239.723 265.163C239.846 265.351 240.017 265.499 240.239 265.607C240.461 265.712 240.716 265.764 241.006 265.764ZM241.006 261.865C241.25 261.865 241.468 261.815 241.658 261.716C241.848 261.616 241.998 261.479 242.105 261.303C242.213 261.126 242.267 260.923 242.267 260.693C242.267 260.466 242.213 260.267 242.105 260.097C241.998 259.923 241.85 259.788 241.662 259.692C241.475 259.592 241.256 259.543 241.006 259.543C240.759 259.543 240.54 259.592 240.35 259.692C240.159 259.788 240.01 259.923 239.902 260.097C239.797 260.267 239.745 260.466 239.745 260.693C239.745 260.923 239.799 261.126 239.907 261.303C240.015 261.479 240.164 261.616 240.354 261.716C240.544 261.815 240.762 261.865 241.006 261.865Z" fill="black"/>
<path d="M302.129 443.192C301.396 443.189 300.766 443.009 300.237 442.651C299.712 442.293 299.307 441.774 299.023 441.095C298.741 440.416 298.602 439.599 298.605 438.645C298.605 437.693 298.746 436.882 299.027 436.212C299.311 435.541 299.716 435.031 300.241 434.682C300.77 434.33 301.399 434.153 302.129 434.153C302.859 434.153 303.487 434.33 304.013 434.682C304.541 435.034 304.947 435.545 305.232 436.216C305.516 436.884 305.656 437.693 305.653 438.645C305.653 439.602 305.511 440.42 305.227 441.099C304.946 441.778 304.543 442.297 304.017 442.655C303.491 443.013 302.862 443.192 302.129 443.192ZM302.129 441.662C302.629 441.662 303.028 441.411 303.327 440.908C303.625 440.405 303.773 439.651 303.77 438.645C303.77 437.983 303.702 437.432 303.565 436.991C303.432 436.551 303.241 436.22 302.994 435.999C302.75 435.777 302.462 435.666 302.129 435.666C301.632 435.666 301.234 435.915 300.936 436.412C300.638 436.909 300.487 437.653 300.484 438.645C300.484 439.315 300.551 439.875 300.685 440.324C300.821 440.77 301.013 441.105 301.26 441.33C301.507 441.551 301.797 441.662 302.129 441.662Z" fill="black"/>
<path d="M147.504 381.273V390H145.659V383.024H145.608L143.609 384.277V382.641L145.77 381.273H147.504ZM153 390.192C152.267 390.189 151.637 390.009 151.108 389.651C150.583 389.293 150.178 388.774 149.894 388.095C149.613 387.416 149.473 386.599 149.476 385.645C149.476 384.693 149.617 383.882 149.898 383.212C150.182 382.541 150.587 382.031 151.113 381.682C151.641 381.33 152.27 381.153 153 381.153C153.73 381.153 154.358 381.33 154.884 381.682C155.412 382.034 155.819 382.545 156.103 383.216C156.387 383.884 156.527 384.693 156.525 385.645C156.525 386.602 156.382 387.42 156.098 388.099C155.817 388.778 155.414 389.297 154.888 389.655C154.363 390.013 153.733 390.192 153 390.192ZM153 388.662C153.5 388.662 153.9 388.411 154.198 387.908C154.496 387.405 154.644 386.651 154.641 385.645C154.641 384.983 154.573 384.432 154.436 383.991C154.303 383.551 154.113 383.22 153.865 382.999C153.621 382.777 153.333 382.666 153 382.666C152.503 382.666 152.105 382.915 151.807 383.412C151.509 383.909 151.358 384.653 151.355 385.645C151.355 386.315 151.422 386.875 151.556 387.324C151.692 387.77 151.884 388.105 152.131 388.33C152.378 388.551 152.668 388.662 153 388.662Z" fill="black"/>
<path d="M241.966 24.2569C242.108 23.7232 241.791 23.1754 241.257 23.0336L232.559 20.7215C232.025 20.5796 231.478 20.8972 231.336 21.431C231.194 21.9647 231.511 22.5124 232.045 22.6543L239.777 24.7095L237.721 32.441C237.58 32.9748 237.897 33.5225 238.431 33.6644C238.965 33.8063 239.512 33.4886 239.654 32.9548L241.966 24.2569ZM141.502 82.865L241.502 24.865L240.498 23.135L140.498 81.135L141.502 82.865Z" fill="black"/>
<path d="M241.416 433.909C241.918 433.68 242.139 433.087 241.909 432.584L238.168 424.399C237.938 423.897 237.345 423.676 236.842 423.905C236.34 424.135 236.119 424.728 236.349 425.23L239.675 432.506L232.399 435.832C231.897 436.062 231.676 436.655 231.905 437.158C232.135 437.66 232.728 437.881 233.23 437.651L241.416 433.909ZM138.651 395.937L240.651 433.937L241.349 432.063L139.349 394.063L138.651 395.937Z" fill="black"/>
<path d="M242.927 276.375C243.134 275.863 242.887 275.28 242.375 275.073L234.031 271.7C233.519 271.493 232.936 271.74 232.729 272.252C232.522 272.764 232.769 273.347 233.281 273.554L240.698 276.552L237.7 283.969C237.493 284.481 237.74 285.064 238.252 285.271C238.764 285.478 239.347 285.231 239.554 284.719L242.927 276.375ZM143.391 318.921L242.391 276.921L241.609 275.079L142.609 317.079L143.391 318.921Z" fill="black"/>
</svg>

<!-- ![scale](samples/images/scale-temp-px.png) -->

> Test d3 scales by coding this in the play ground:

```js
var x = d3.scaleLinear().domain([10, 130]).range([0, 300]);

var linearScale = d3.scaleLinear().domain([0, 100]).range([0, 600]).clamp(true);

console.log(linearScale(-20));
console.log(linearScale(50));
console.log(linearScale(105));

console.log(linearScale.invert(300));
```

> And try `x(20)`, `x(50)` and `x(130)` in the browser console. Remove it once done.

`d3-scale` can handle many different types of scales. We want to use `d3.scaleLinear()` because our y axis values will be numbers that increase linearly. To create a new scale, we create an instance of d3.scaleLinear().

Our scale needs two pieces of information:

1. the domain: the minimum and maximum input values
2. the range: the minimum and maximum output values

Let's start with the domain. We'll need to create an array of the smallest and largest numbers our y axis will need to handle — in this case the lowest and highest max temperature in our dataset.

The [d3-array](https://github.com/d3/d3-array) module has a `d3.extent()` method for grabbing those numbers. `d3.extent()` takes two parameters:

1. an array of data points
2. an accessor function which defaults to an identity function (d => d)

Let's test this out by logging `d3.extent(dataset, yAccessor)` to the console. The output should be an array of two values: the minimum and maximum temperature in our dataset.

Let's plug that into our scale's domain:

```js
const yScale = d3.scaleLinear().domain(d3.extent(dataset, yAccessor));
```

Next we to specify the range. The range is the highest and lowest number we want our scale to output — in this case, the maximum & minimum number of pixels our point will be from the x axis.

We will use our `boundedHeight` to stay within our margins. Remember, SVG y-values count from top to bottom so we want our range to start at the top.

```js
const yScale = d3
  .scaleLinear()
  .domain(d3.extent(dataset, yAccessor))
  .range([dimensions.boundedHeight, 0]);
```

Let's test it by logging some values to the console. At what y value is the freezing point on our chart?

`console.log(yScale(32))`

The outputted number should tell us how far away the freezing point will be from the bottom of the y axis.

Let's visualize this by adding a rectangle covering all temperatures below freezing using the SVG <rect> element. We need to give it four attributes: x, y, width, and height.

```js
const freezingTemperaturePlacement = yScale(32);
const freezingTemperatures = bounds
  .append("rect")
  .attr("x", 0)
  .attr("width", dimensions.boundedWidth)
  .attr("y", freezingTemperaturePlacement)
  .attr("height", dimensions.boundedHeight - freezingTemperaturePlacement);
```

The black rectangle spans the width of our bounds.

Make it a light blue to connote freezing and decrease its visual importance.

```js
const freezingTemperatures = bounds
  .append("rect")
  .attr("x", 0)
  .attr("width", dimensions.boundedWidth)
  .attr("y", freezingTemperaturePlacement)
  .attr("height", dimensions.boundedHeight - freezingTemperaturePlacement)
  .attr("fill", "#87ceed");
```

Look at the rectangle in the Elements panel to see how the .attr() methods manipulated it.

```js
<rect
  x="0"
  width="735.9"
  y="264.34844192634563"
  height="80.65155807365437"
  fill="#87ceed"
></rect>
```

> Some SVG styles can be set with either a CSS style or an attribute value such as fill, stroke, and stroke-width. It's up to you whether you want to set them with .style() or .attr(). Once we're familiar with styling our charts, we'll apply classes using `.attr("class", "class-name")` and add styles using CSS.

> We're using .attr() to set the fill because an attribute has a lower CSS precedence than linked stylesheets, which will let us overwrite the value. If we used `.style()` we'd be setting an inline style which would require an `!important` CSS declaration to override.

## JavaScript Dates and Scales

Run the below in the playground:

```js
var timeScale = d3
  .scaleTime()
  .domain([new Date(2021, 0, 1), new Date()])
  .range([0, 100]);

console.log(timeScale(new Date(2021, 0, 15)));
console.log(timeScale(new Date(2021, 3, 15)));
console.log(timeScale(new Date()));

console.log(timeScale.invert(50));
```

Create a scale for the x axis. This will look like our y axis but, since we're working with date objects, we'll use a time scale which knows how to handle date objects.

```js
const xScale = d3
  .scaleTime()
  .domain(d3.extent(dataset, xAccessor))
  .range([0, dimensions.boundedWidth]);
```

Final:

```js
async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

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

  // 4. Create scales

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
    .attr("fill", "#e0f3f3");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);
}

drawLineChart();
```

## Drawing the Timeline

The timeline itself will be a single path SVG element. Path elements take a d (data) attribute that creates the shape.

[d3-shape](https://github.com/d3/d3-shape) has a `d3.line()` method that creates a generator that converts data points into a d string:

`const lineGenerator = d3.line()`

Our generator needs two pieces of information:

1. how to find an x axis value, and
2. how to find a y axis value.

We set these values with the x and y method, respectively, which each take one parameter: a function to convert a data point into an x or y value.

We want to use our accessor functions, but _our accessor functions return the unscaled value_.

We'll transform our data point with both the accessor function and the scale to get the scaled value in pixel space.

```js
const lineGenerator = d3
  .line()
  .x((d) => xScale(xAccessor(d)))
  .y((d) => yScale(yAccessor(d)));
```

Now we're ready to add the path element to our bounds.

`const line = bounds.append("path")`

Feed our dataset to our line generator to create the d attribute and tell the line what shape to be.

```js
const line = bounds.append("path").attr("d", lineGenerator(dataset));
```

We have a chart with a line showing our max temperature for the whole year.

SVG elements default to a black fill and no stroke, which is why we see this dark filled-in shape.

```js
const line = bounds
  .append("path")
  .attr("d", lineGenerator(dataset))
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2);
```

Code so far:

```js
import * as d3 from "d3";

async function drawLineChart() {
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

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

  // 4. Create scales

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
    .attr("fill", "#e0f3f3");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  // 5. Draw data

  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  const line = bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);
}

drawLineChart();
```

## Drawing the Axes

Start with the y axis.

d3's [d3-axis](https://github.com/d3/d3-axis) module has axis generator methods which will draw an axis for the given scale.

Unlike the methods we've used before, d3 axis generators will append multiple elements to the page.

There is one method for each orientation, which will specify the placement of labels and tick marks:

- axisTop
- axisRight
- axisBottom
- axisLeft

Following common convention, we want the labels of our y axis to be to the left of the axis line, so we'll use `d3.axisLeft()` and pass it our yScale.

```js
const yAxisGenerator = d3.axisLeft().scale(yScale);
```

When we call our axis generator, it will create a lot of elements — let's create a g element to hold all of those elements and keep our DOM organized. Then we'll pass that new element to our yAxisGenerator function to tell it where to draw our axis.

```js
const yAxis = bounds.append("g");

yAxisGenerator(yAxis);
```

This method works but it will break up our chained methods. To fix this, d3 selections have a .`call()` method that will execute the provided function with the selection as the first parameter.

We use `.call()` to:

- prevent saving our selection as a variable
- preserve the selection for additional chaining

Note that this code does exactly the same thing as the snippet above - we pass the function `yAxisGenerator` to `.call()`, which then runs the function.

```js
const yAxis = bounds.append("g").call(yAxisGenerator);
```

The small lines perpendicular to the axis are called tick marks. D3 has made behind-the-scenes decisions about how many tick marks to make and how far apart to draw them. We'll customize this in later sessions.

Create the x axis in the same way, this time using `d3.axisBottom()`.

```js
const xAxisGenerator = d3.axisBottom().scale(xScale);
```

Create another <g> element and draw our axis.

```js
const xAxis = bounds.append("g").call(xAxisGenerator);
```

We could `.call()` our x axis directly on our bounds:

`const xAxis = bounds.call(xAxisGenerator)`

This would create our axis directly under our bounds (in the DOM).

However, it's a good idea to create a <g> element to contain our axis elements for three reasons:

1. to keep our DOM organized, for debugging or exporting
2. if we want to remove or update our axis, we'll want an easy way to target all of the elements
3. modifying our whole axis at once, for example when we want to move it around.

The axis looks right, but it's in the wrong place.

Why didn't `.axisBottom()` draw the axis in the right place? d3's axis generator functions know where to place the tick marks and tick labels relative to the axis line, but they have no idea where to place the axis itself.

To move the x axis to the bottom, we can shift the x axis group, similar to how we shifted our chart bounds using a CSS transform.

```js
const xAxis = bounds
  .append("g")
  .call(xAxisGenerator)
  .style("transform", `translateY(${dimensions.boundedHeight}px)`);
```

Final:

```js
async function drawLineChart() {
  // 1. Access data
  const dataset = await d3.json("./data/my_weather_data.json");

  const yAccessor = (d) => d.temperatureMax;
  const dateParser = d3.timeParse("%Y-%m-%d");
  const xAccessor = (d) => dateParser(d.date);

  // 2. Create chart dimensions

  let dimensions = {
    width: window.innerWidth * 0.9,
    height: 400,
    margin: {
      top: 15,
      right: 15,
      bottom: 40,
      left: 60,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

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

  // 4. Create scales

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
    .attr("fill", "#e0f3f3");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  // 5. Draw data

  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  const line = bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "#af9358")
    .attr("stroke-width", 2);

  // 6. Draw peripherals

  const yAxisGenerator = d3.axisLeft().scale(yScale);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const xAxisGenerator = d3.axisBottom().scale(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);
}
drawLineChart();
```

## Instructor Notes

### Quantize Scales

```js
(function () {
  var body = document.querySelector("body");
  body.style["fontFamily"] = "monospace";
  body.style["fontSize"] = "2em";
  console.log = function (x) {
    body.innerText += x + "\n";
  };
})();

var quantizeScale = d3
  .scaleQuantize()
  .domain([0, 100])
  .range(["red", "white", "green"]);

console.log(quantizeScale(22));
console.log(quantizeScale(50));
console.log(quantizeScale(88));

console.log(quantizeScale.invertExtent("white"));
```

### Ordinal Scales

```js
(function () {
  var body = document.querySelector("body");
  body.style["fontFamily"] = "monospace";
  body.style["fontSize"] = "2em";
  console.log = function (x) {
    body.innerText += x + "\n";
  };
})();

var ordinalScale = d3
  .scaleOrdinal()
  .domain(["poor", "good", "great"])
  .range(["red", "white", "green"]);

console.log(ordinalScale("good"));
console.log(ordinalScale("great"));
console.log(ordinalScale("poor"));
```

### Load and Inspect Data

Review this.

```js
(function () {
  var body = document.querySelector("body");
  body.style["fontFamily"] = "monospace";
  body.style["fontSize"] = "2em";
  console.log = function (x) {
    body.innerText += x + "\n";
  };
})();

d3.json("data/data.json", function (data) {
  var extent = d3.extent(data, function (d) {
    return d.age;
  });
  console.log(extent);

  var scale = d3.scaleLinear().domain(extent).range([0, 600]);

  console.log(scale(37));

  var ages = d3.set(data, function (d) {
    return d.age;
  });
  console.log(ages.values());
});
```

### Select DOM Elements

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Egghead D3 v4</title>
    <script src="//d3js.org/d3.v4.min.js"></script>
    <style>
      div {
        display: inline-block;
        border: 1px solid black;
      }
      a {
        display: block;
      }
    </style>
  </head>
  <body>
    <div class="title">
      <a href="#">About</a>
      <a href="#">Products</a>
      <a href="#">Contact</a>
    </div>

    <a class="action" href="#">Buy Now</a>

    <script>
      var div = d3.select("div");
      console.log(div.nodes());

      var divLinks = div.selectAll("a");
      console.log(divLinks.nodes());

      var secondLink = d3.selectAll("a:nth-child(2)");
      console.log(secondLink.nodes());

      var allLinks = d3.selectAll(document.links);
      console.log(allLinks.size());
    </script>
  </body>
</html>
```

### Modify DOM Elements

Review with getter and setter methods, coding style (chaining) and additional methods (style etc.)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Egghead D3 v4</title>
    <script src="//d3js.org/d3.v4.min.js"></script>
    <style>
      div {
        display: inline-block;
        border: 1px solid black;
      }
      a {
        display: block;
      }
      .red {
        color: red;
      }
    </style>
  </head>
  <body>
    <div class="title">
      <a href="#">About</a>
      <a href="#">Products</a>
      <a href="#">Contact</a>
    </div>

    <a class="action" href="#">Buy Now</a>

    <script>
      d3.selectAll("a:nth-child(2)")
        .attr("href", "http://google.com")
        .classed("red", true)
        .html("Inventory <b>SALE</b>");
    </script>
  </body>
</html>
```

### Create New Elements

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Egghead D3 v4</title>
    <script src="//d3js.org/d3.v4.min.js"></script>
    <style>
      div {
        display: inline-block;
        border: 1px solid black;
      }
      a {
        display: block;
      }
      .red {
        color: red;
      }
    </style>
  </head>
  <body>
    <div class="title">
      <a href="#">About</a>
      <a href="#">Products</a>
      <a href="#">Contact</a>
    </div>

    <a class="action" href="#">Buy Now</a>

    <script>
      // prettier-ignore
      d3.select(".title")
        .append("div")
          .style("color", "red")
          .html("Inventory <b>SALE</b>")
        .append("button")
          .style("display", "block")
          .text("submit");
    </script>
  </body>
</html>
```
