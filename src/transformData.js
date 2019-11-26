import * as d3 from 'd3'

// TRANSFORMING THE DATA TO GROUP ON DATE
// Used the example code of Laurens
export function transformData (data) {
  let transformedData =  d3.nest()
    .key(function (d) { return d.year })
    .entries(data)
  transformedData.forEach(year => {
    year.amount = year.values.length
  })
  return transformedData
}
