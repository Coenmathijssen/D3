// Daan helped my rewrite the import to make it work in my code edittor
import * as d3 from 'd3'
import { feature } from 'topojson'
import { cleanDataYear } from './cleanDataYear.js'
import { transformData } from './transformData.js'

const { select, geoPath, geoNaturalEarth1 } = d3

const query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX edm: <http://www.europeana.eu/schemas/edm/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX hdlh: <https://hdl.handle.net/20.500.11840/termmaster>
PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX gn: <http://www.geonames.org/ontology#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT * WHERE {
     # alle subcategorieen van sieraden
     <https://hdl.handle.net/20.500.11840/termmaster13201> skos:narrower* ?type .
     ?type skos:prefLabel ?typeName .

     # geef alle sieraden in Oceanie, met plaatje en lat/long van de plaats
     ?cho dct:spatial ?place ;
         edm:object ?type ;
         edm:isShownBy ?imageLink .

     ?place skos:exactMatch/wgs84:lat ?lat .
     ?place skos:exactMatch/wgs84:long ?long .
     ?cho dc:title ?title .
     ?cho dc:description ?desc .
     ?cho dct:created ?date .
}
GROUP BY ?type
LIMIT 250`

const endpoint = 'https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-04/sparql'

const svg = select('svg')
const projection = geoNaturalEarth1()
const pathGenerator = geoPath().projection(projection)

setupMap()
drawMap()
plotLocations()

function setupMap () {
  svg
    .append('path')
    .attr('class', 'rectangle')
    .attr('d', pathGenerator({ type: 'Sphere' }))
}

function drawMap () {
  d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json').then(data => {
    const countries = feature(data, data.objects.countries)
    svg
      .selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', pathGenerator)
  })
}

function plotLocations () {
  fetch(endpoint + '?query=' + encodeURIComponent(query) + '&format=json')
    .then(res => res.json())
    .then(json => {
      let fetchedData = json.results.bindings

      fetchedData.forEach(item => {
        item.imageLink.value = item.imageLink.value.replace('http', 'https')
      })
      return fetchedData
    })
    .then(fetchedData => {
      let newData = cleanDataYear(fetchedData)
      let transformedData = transformData(newData)

      console.log('data: ', newData)
      console.log('transformed data: ', transformedData)

      // Define the div for the tooltip
      let div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

      // Run the render() function to render the data points
      render(svg, newData, div)
    })
}

// Render the data points
function render (selection, newData, div) {
  let g = selection
    .selectAll('rect')
    .data(newData)
    .enter()
    .append('g')
    .attr('class', 'group')

  // Append rectangles to group and run tooltip functions
  g.append('rect')
    .attr('class', 'data-point')
    .attr('rx', '8')
    .attr('width', '0')
    .attr('height', '0')
    .attr('x', function (d) {
      return projection([d.geoLocation.long, d.geoLocation.lat])[0]
    })
    .attr('y', function (d) {
      return projection([d.geoLocation.long, d.geoLocation.lat])[1]
    })
    .on('mouseover', result => { tooltipIn(result, div) })
    .on('mouseout', result => { tooltipOut(div) })
    .transition()
      .delay((d, i) => { return i * 10 })
      .duration(1500)
      .attr('width', '10')
      .attr('height', '10')

  // Append title to group
  g.append('foreignObject')
    .attr('class', 'title')
    .classed('title-active', false)
    .html(function (d) {
      let str = d.title
      // https://stackoverflow.com/questions/16313903/how-can-i-break-text-in-2-lines-in-d3-js
      // if (str.length > 20) {
      //  let txt1 = str.slice(0, 20)
      //   txt1 += "<br/>"
      //   let txt2 = str.slice(20, str.length)
      //   str = txt1+txt2
      //   console.log(str)
      // }
      return str
    })

  // Append image to group
  g.append('image')
    .attr('xlink:href', function (d) { return d.image })
    .attr('class', 'img')
    .classed('img-active', false)


  // Run function to transform the data point on click
  g.on('click', (selection, data) => { tranformDataPoint(selection, data) })

  g
    .exit()
    .remove()

  // Run function to append a close button to the svg
  createCloseButton()
}

// Function to append a close button to the svg
function createCloseButton () {
  svg
  .enter()
  .append('circle')
    .attr('class', 'close')
    .classed('close-active', false)
    .attr('r', '12')
    .attr('cx', '595')
    .attr('cy', '305')
    .on('click', (selection) => { resetDataPoint(selection) })
  .append('text')
    .text('x')
    .attr('class', 'close-text')
    .classed('close-active', false)
    .attr('x', '589')
    .attr('y', '311')
    .on('click', (selection) => { resetDataPoint(selection) })

  svg
    .exit()
    .remove()
}

// Display tooltip with title and place name
function tooltipIn (result, div) {
  div.html(result.title)
    .style('left', (d3.event.pageX + 25) + 'px')
    .style('top', (d3.event.pageY - 20) + 'px')
  div.transition()
    .duration(200)
    .style('opacity', 0.9)
}

// Bring opacity back to 0
function tooltipOut (div) {
  div.transition()
    .duration(500)
    .style('opacity', 0)
}

// Transform the selected data point to make square larger and make text and image appear
function tranformDataPoint (selected, data) {
  // https://stackoverflow.com/questions/38297185/get-reference-to-target-of-event-in-d3-in-high-level-listener
  console.log('clicked item ', d3.event.currentTarget)

  // Resetting all transformations before starting a new one
  resetDataPoint()

  let selection = d3.select(d3.event.currentTarget)
    .enter()

  // Tranform data point
  selection
    .select('rect')
    .classed('square-active', true)
    .transition()
    .duration(500)
    .attr('x', '400')
    .attr('y', '280')

  // Add title
  selection
    .select('foreignObject')
    .classed('title-active', true)
    .attr('x', '410')
    .attr('y', '290')

  // Add image
  selection
    .select('image')
    .classed('img-active', true)
    .attr('x', '410')
    // Checking if the title will take up 2 lines or 1 line and placing image accordingly
    .attr('y', function (d) {
      if (d.title.length > 20) {
        return 340
      } else {
        return 320
      }
    })

  // Function to transform the close button
  transformCloseButton()
}

// Change class and y and x axis in function
function transformCloseButton () {
  // Change class and y and x for the circle element
  d3.select('circle')
    .classed('close-active', false)
    .attr('r', '12')
    .attr('cx', '595')
    .attr('cy', '305')
    .classed('close-active', true)
    .transition()
      .duration(300)
      .attr('cx', '595')
      .attr('cy', '280')
      .delay(900)


  // Change class and y and x for the text element
  d3.select('.close-text')
    .classed('close-active', false)
    .attr('x', '589')
    .attr('y', '311')
    .classed('close-active', true)
    .transition()
      .duration(300)
      .attr('x', '589')
      .attr('y', '286')
      .delay(900)
}

function resetDataPoint () {
  console.log('running')

  svg.selectAll('rect')
    .classed('square-active', false)
    .transition()
    .duration(500)
    .attr('x', function (d) {
      return projection([d.geoLocation.long, d.geoLocation.lat])[0]
    })
    .attr('y', function (d) {
      return projection([d.geoLocation.long, d.geoLocation.lat])[1]
    })

  // Reset all text elements
  svg.selectAll('foreignObject')
    .classed('title-active', false)

  // Reset all image elements
  svg.selectAll('image')
    .classed('img-active', false)

  // Reset close button
  svg.selectAll('circle')
    .classed('close-active', false)
  svg.selectAll('.close-text')
    .classed('close-active', false)
}
