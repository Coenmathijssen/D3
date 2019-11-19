import { cleanDataYear } from './cleanDataYear.js'

// Daan helped my rewrite the import to make it work in my code edittor
import * as d3 from 'd3'
import { feature } from 'topojson'
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
const circleDelay = 10
const circleSize = 8
const projection = geoNaturalEarth1()
const pathGenerator = geoPath().projection(projection)

setupMap()
drawMap()
plotLocations()

function setupMap() {
  svg
    .append('path')
    .attr('class', 'rectangle')
    .attr('d', pathGenerator({ type: 'Sphere' }))
}

function drawMap() {
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

function plotLocations() {
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

      svg
        .selectAll('circle')
        .data(newData)
        .enter()
        .append('image')
        .attr('xlink:href', d => d.image)
        .attr('class', 'circles')
        .attr('x', function (d) {
          return projection([d.geoLocation.long, d.geoLocation.lat])[0]
        })
        .attr('y', function (d) {
          return projection([d.geoLocation.long, d.geoLocation.lat])[1]
        })
        .attr('r', '0px')
        // Opacity is quite heavy on the rendering process so I've turned it off
        .attr('opacity', 0.5)
        .attr('r', '20px')
        .attr('class', 'img')
        .transition()
        .delay(function (d, i) { return i * circleDelay })
        .duration(1500)
        .ease(d3.easeBounce)
        .attr('r', circleSize + 'px')
    })
}

// TRANSFORMING THE DATA TO GROUP ON DATE
// Used the example code of Laurens
function transformData (data) {
  let transformedData =  d3.nest()
    .key(function (d) { return d.year })
    .entries(data)
  transformedData.forEach(year => {
    year.amount = year.values.length
  })
  return transformedData
}
