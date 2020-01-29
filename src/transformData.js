import * as d3 from 'd3'

// TRANSFORMING THE DATA TO GROUP ON DATE
// Used the example code of Laurens
export function transformData (data) {
  let transformedData =  d3.nest()
    .key(function (d) { return d.century })
    .entries(data)
  transformedData.forEach(century => {
    century.amount = century.values.length
  })

  transformedData = transformedData.sort((a, b) => (a.key > b.key) ? 1 : -1)
  return transformedData
}
