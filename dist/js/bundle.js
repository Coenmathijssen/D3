(function (d3, topojson) {
  'use strict';

  // CLEANING ALL DATA
  function cleanDataYear (fetchedData) {
    console.log('oldData: ', fetchedData);
    let newData = fetchedData.map(item => {
      let itemDateValue = item.date.value;

      // Transform all elements to uppercase
      item.date.value = item.date.value.toUpperCase();

      // Replace all bc and ad with an empty string and turn the corresponding properties into true
      item = replaceChrist(item);

      // Replace all unnecessary characters with an empty string
      item.date.value = cleanCharacter(item);

      // Replace all 'eeuwen' en 'centuries' with an empty string
      item = replaceCenturies(item);

      // Replace all left letters with an empty string
      item.date.value = replaceWithWhichString(item.date.value, /([a-zA-Z ])/g);

      // Clean data if they have this format: 12-03-1990, or this format: 1900-2000. Returns the (average) year
      item = convertToYear(item);


      // Convert all strings to numbers
      item = convertToNumber(item);

      return {
        id: item.cho.value,
        image: item.imageLink.value,
        title: item.title.value,
        description: item.desc.value,
        year: item.date.value,
        century: item.date.value,
        dateInfo: {
          type: item.date.type,
          bc: item.date.bc,
          ad: item.date.ad,
          century: item.date.century
        },
        geoLocation: {
          long: item.long.value,
          lat: item.lat.value
        }
      }
    });

    // delete all items which don't fit the format by now
    let finalArray = deleteUnformattedData(newData);

    finalArray = convertToCentury(finalArray);

    console.log('newData: ', finalArray);

    return finalArray
  }



  function deleteUnformattedData (array) {
    const finalArray = array.filter(item => {
      if (item.year.toString().length === 4 && item.year <= 2019 && item.year >= 0) {
              return item
          }
    });
    return finalArray
  }

  // Cleans all data which contain a before and after Christ.
  // I create a property to the keep in mind that the year was before or after Christ. I will need this later in my data cleaning.
  function replaceChrist (item) {
    let itemDate = item.date;
    if (itemDate.value.includes('BC')) {
      itemDate.bc = true;
      itemDate.value = itemDate.value.replace('BC', '');
    }
    if (itemDate.value.includes('AD')) {
      itemDate.ad = true;
      itemDate.value = itemDate.value.replace('AD', '');
    } else {
      itemDate.bc = false;
      itemDate.ad = false;
    }
    item.date = itemDate;
    return item
  }

  // Here I clean all weird characters which don't belong. I replace all with an empty string. I replace the '/' with a '-' to
  // get a consistent format.
  function cleanCharacter (item) {
    let itemDateValue = item.date.value;

    // Replace the dot, (, ) and /
    itemDateValue = replaceWithWhichString(itemDateValue, /\./g);
    itemDateValue = replaceWithWhichString(itemDateValue, /[()]/g);
    itemDateValue = replaceWithWhichString(itemDateValue, /[()]/g);
    itemDateValue = replaceWithWhichString(itemDateValue, /\s/g);
    itemDateValue = replaceWithWhichString(itemDateValue, /\?/g);
    itemDateValue = replaceWithWhichString(itemDateValue, /\//g, '-');

    itemDateValue.replace("VOOR", "")
                 .replace("NA", "")
                 .replace("OF", "")
                 .replace("EERDER", "")
                 .replace("INOF", "")
                 .replace("INVOOR", "")
                 .replace("VOORIN", "")
                 .replace("INOPVOOR", "")
                 .replace("OFIN", "")
                 .replace("EIND", "")
                 .replace("BEGIN", "")
                 .replace("MOGELIJK", "")
                 .replace("ORGINEEL", "")
                 .replace("OFEERDER", "")
                 .replace("CA.", "")
                 .replace("CA", "")
                 .replace("EEUW", "")
                 .replace("HELFT", " ")
                 .replace("LAATSTE", "")
                 .replace("KWART", "");

    return itemDateValue
  }

  // A function for replacing a character with a string. The replaced string will be empty by default,
  // because this happens most of the time.
  function replaceWithWhichString (item, specialCharacter, replacedString = '') {
    return item.replace(specialCharacter, replacedString)
  }

  // Here I replace all years which has a century in them with an empty string. Again, I create a property to keep in mind
  // it had a century in it. I will need this later for the data cleaning
  function replaceCenturies (item) {
    let itemDate = item.date;
    if (itemDate.value.includes('EEEUW') || itemDate.value.includes('EEUW') || itemDate.value.includes('CENTURY')) {
      itemDate.value = itemDate.value.replace('EEEUW', '');
      itemDate.value = itemDate.value.replace('EEUW', '');
      itemDate.value = itemDate.value.replace('CENTURY', '');
      itemDate.century = true;
    } else if (itemDate.value.includes('TH')) {
      itemDate.value = itemDate.value.replace(/\t.*/, '');
      itemDate.century = true;
    } else {
      itemDate.century = false;
    }
    item.date = itemDate;
    return item
  }

  // Here I convert every workable/convertable date to a single year.
  function convertToYear (item) {
    let itemDateValue = item.date.value;

    // Here I check if the date has this format: '01-2005'. I only keep the year (last four numbers)
    if (itemDateValue.length === 7) {
      let splittedArray = itemDateValue.split('-');
      if (splittedArray[0] &&
       splittedArray[1] &&
        // https://stackoverflow.com/questions/14783196/how-to-check-in-javascript-that-a-string-contains-alphabetical-characters
        splittedArray[0].match(/[a-z]/) === null &&
        splittedArray[1].match(/[a-z]/) === null) {
        if (splittedArray[1].length === 4) {
          item.date.value = splittedArray[0];
        }
      }
    }

    // Here I check if the date has this format: '1-2-2005'. I only keep the year (last four numbers)
    if (itemDateValue.length === 8) {
      let splittedArray = itemDateValue.split('-');
      // Check if the array has 3 items, only contain numbers and if the last item in the array is a year
      if (splittedArray[0] &&
        splittedArray[1] &&
        splittedArray[2] &&
        splittedArray[0].match(/[a-z]/) === null &&
        splittedArray[1].match(/[a-z]/) === null &&
        splittedArray[2].match(/[a-z]/) === null) {
        if (splittedArray[2].length === 4) {
          item.date.value = splittedArray[2];
        }
      }
    }

    if (itemDateValue.length === 9) {
      let splittedArray = itemDateValue.split('-');
      // Here I check if the date has this format: '1900-2000'. I split the two, count them up and divide them by 2.
      // So I only keep one average number
      if (splittedArray[0] &&
        splittedArray[1] &&
        splittedArray[0].match(/[a-z]/) === null &&
        splittedArray[1].match(/[a-z]/) === null) {
        if (splittedArray[0].length === 4 && splittedArray[1].length === 4) {
          item.date.value = splitStringCalcAverage(itemDateValue);
        }
      }

      // Here I check if the date has this format: '02-4-2000' or this format '2-04-2000'. I only keep the year (last four numbers)
      if (splittedArray[0] &&
        splittedArray[1] &&
        splittedArray[2] &&
        splittedArray[0].match(/[a-z]/) === null &&
        splittedArray[1].match(/[a-z]/) === null &&
        splittedArray[2].match(/[a-z]/) === null) {
        if (splittedArray[2].length === 4) {
          item.date.value = splittedArray[2];
        }
      }
    }

    // Here I check if the date has this format: '02-05-2000'. I only keep the year (last four numbers)
    if (itemDateValue.length === 10) {
      let splittedArray = itemDateValue.split('-');
      if (splittedArray[2] &&
        splittedArray[2].length === 4) {
        item.date.value = splittedArray[2];
      } // Check if first array item is a year and only contains numbers
      if (splittedArray[0].length === 4 &&
        splittedArray[0].match(/^[0-9]+$/) != null) {
        item.date.value = splittedArray[0];
      }
    }
    return item
  }

  // Merge the two arrays into one with the average function
  function splitStringCalcAverage (item) {
    let splittedArray = item.split('-');
    return average(splittedArray[0], splittedArray[1])
  }
  // Wiebe helped me with this function
  function average (a, b) {
    // Multiply by 1 to make sure it's a number
    return Math.round(((a * 1 + b * 1) / 2))
  }

  // Convert all left strings to number
  function convertToNumber (item) {
    item.date.value = parseInt(item.date.value);
    return item
  }

  function convertToCentury (newData) {
    newData.forEach(item => {
      let string = item.year.toString();
      item.century = splitValue(string, 2);
      string = parseInt(string);
      return string
    });
    return newData
  }

  function splitValue (value, index) {
    return value.substring(0, index) + '00'
  }

  // TRANSFORMING THE DATA TO GROUP ON DATE
  // Used the example code of Laurens
  function transformData (data) {
    let transformedData =  d3.nest()
      .key(function (d) { return d.century })
      .entries(data);
    transformedData.forEach(century => {
      century.amount = century.values.length;
    });
    return transformedData
  }

  // Daan helped my rewrite the import to make it work in my code edittor

  const { select, geoPath, geoNaturalEarth1 } = d3;

  let transformedData = null;

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
LIMIT 250`;

  const endpoint = 'https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-04/sparql';

  const svgSecond = select('.svg-second');
  const projection = geoNaturalEarth1();
  const pathGenerator = geoPath().projection(projection);

  setupMap();
  drawMap();
  plotLocations();

  function setupMap () {
    svgSecond
      .append('path')
      .attr('class', 'rectangle')
      .attr('d', pathGenerator({ type: 'Sphere' }));
  }

  function drawMap () {
    d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json').then(data => {
      const countries = topojson.feature(data, data.objects.countries);
      svgSecond
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator);
    });
  }

  function plotLocations () {
    fetch(endpoint + '?query=' + encodeURIComponent(query) + '&format=json')
      .then(res => res.json())
      .then(json => {
        let fetchedData = json.results.bindings;

        fetchedData.forEach(item => {
          item.imageLink.value = item.imageLink.value.replace('http', 'https');
        });
        return fetchedData
      })
      .then(fetchedData => {
        let newData = cleanDataYear(fetchedData);
        transformedData = transformData(newData);

        console.log('transformed data: ', transformedData);

        // Define the div for the tooltip
        let div = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);

        // Run the render() function to render the data points
        render(svgSecond, newData, div);
      });
  }

  // Render the data points
  // function render (selection, newData, div) {
  //   // Run function to append the item container to the svg
  //   createItemContainer()

  //   // ENTER
  //   let svg = selection
  //     .selectAll('.data-point')
  //     .data(newData)

  //   svg.enter()
  //   .append('g')
  //   .attr('class', 'group')
  //     .on('mouseover', result => { tooltipIn(result, div) })
  //     .on('mouseout', result => { tooltipOut(div) })

  //   // UPDATE
  //   let groups = d3.selectAll('.group')

  //   // Append rectangles to group and run tooltip functions
  //   groups.append('rect')
  //     .attr('class', 'data-point')
  //     .attr('rx', '8')
  //     .attr('width', '0')
  //     .attr('height', '0')
  //     .attr('x', function (d) {
  //       return projection([d.geoLocation.long, d.geoLocation.lat])[0]
  //     })
  //     .attr('y', function (d) {
  //       return projection([d.geoLocation.long, d.geoLocation.lat])[1]
  //     })
  //     .on('mouseover', result => { tooltipIn(result, div) })
  //     .on('mouseout', result => { tooltipOut(div) })
  //     .transition()
  //       .delay((d, i) => { return i * 10 })
  //       .duration(1500)
  //       .attr('width', '10')
  //       .attr('height', '10')

  //   // Append title to group
  //   groups.append('foreignObject')
  //     .attr('class', 'title')
  //     .classed('title-active', false)
  //     .html(function (d) {
  //       return d.title
  //     })

  //   // Append image to group
  //   groups.append('image')
  //     .attr('xlink:href', function (d) { return d.image })
  //     .attr('class', 'img')
  //     .classed('img-active', false)

  //   console.log('svg: ', svg)

  //     // Run function to transform the data point on click
  //   groups.on('click', (selection, data) => { tranformDataPoint(selection, data) })
  //   groups.on('change', (selection, data) => { tranformDataPoint(selection, data) })


  //   // EXIT
  //   groups
  //     .exit()
  //     .remove()

  //   // Run function to append a close button to the svg
  //   createCloseButton()
  // }

  // Render the data points
  function render (selection, newData, div) {
    // Run function to append the item container to the svg
    createItemContainer();

    let points = selection
      .selectAll('.data-point')
      .data(newData);

    // Enter
    points.enter()
      .append('rect')
        .attr('class', 'data-point')
        .attr('rx', '8')
        .attr('width', '10')
        .attr('height', '10')
        .attr('x', function (d) {
          return projection([d.geoLocation.long, d.geoLocation.lat])[0]
        })
        .attr('y', function (d) {
          return projection([d.geoLocation.long, d.geoLocation.lat])[1]
        })
        .on('mouseover', result => { tooltipIn(result, div); })
        .on('mouseout', result => { tooltipOut(div); })
        .on('click', d => { infoAppear(d); });

    // Update
    points
      .attr('x', function (d) {
        return projection([d.geoLocation.long, d.geoLocation.lat])[0]
      })
      .attr('y', function (d) {
        return projection([d.geoLocation.long, d.geoLocation.lat])[1]
      })
      .on('mouseover', result => { tooltipIn(result, div); })
      .on('mouseout', result => { tooltipOut(div); });

    // EXIT
    points
      .exit()
      .remove();

    // Run function to append a close button to the svg
    createCloseButton();
  }

  function infoAppear (d) {
    console.log(d.image);

    let container = d3.select('.item-container')
      .classed('container-active', true)
      .transition()
      .duration(500);

    let information = select('.information');

    let svg = d3.selectAll('.svg-container');
    console.log(d.image);

    information
      .append('image')
      .attr('xlink:href', 'https://www.peoplechange.nl/wp-content/uploads/2017/04/placeholder.jpg')
      .attr('class', 'img')
      .classed('img-active', false);

    information
      .append('h2')
        .attr('class', 'title')
        .text(d.title);

    information
      .append('p')
        .attr('class', 'subtitle')
        .text(d.description);


    // Function to transform the close button
    transformCloseButton();
  }

  function createItemContainer () {
    svgSecond
      .append('div')
      .attr('class', 'item-container')
      .classed('container-active', false)
      .attr('x', '400')
      .attr('y', '270')
      .attr('rx', '8')
      .attr('height', '0');
  }

  // Function to append a close button to the svg
  function createCloseButton () {
    svgSecond
      .append('circle')
        .attr('class', 'close')
        .classed('close-active', false)
        .attr('r', '12')
        .attr('cx', '595')
        .attr('cy', '305')
        .on('click', (selection) => { resetDataPoint(); });

    svgSecond
      .append('text')
        .text('x')
        .attr('class', 'close-text')
        .classed('close-active', false)
        .attr('x', '589')
        .attr('y', '311')
        .on('click', (selection) => { resetDataPoint(); });
  }

  // Display tooltip with title and place name
  function tooltipIn (result, div) {
    div.html(result.title)
      .style('left', (d3.event.pageX + 25) + 'px')
      .style('top', (d3.event.pageY - 20) + 'px');
    div.transition()
      .duration(200)
      .style('opacity', 0.9);
  }

  // Bring opacity back to 0
  function tooltipOut (div) {
    div.transition()
      .duration(500)
      .style('opacity', 0);
  }

  // Change class and y and x axis in function
  function transformCloseButton () {
    // Change class and y and x for the circle element
    d3.select('.close')
      .classed('close-active', false)
      .attr('r', '12')
      .attr('cx', '595')
      .attr('cy', '305')
      .classed('close-active', true)
      .transition()
        .duration(300)
        .attr('cx', '595')
        .attr('cy', '280')
        .delay(500);


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
        .delay(500);
  }

  function resetDataPoint (data) {
     d3.select('.item-container')
      .classed('container-active', false)
      .transition()
      .duration(500)
      .attr('height', '0px');

    // Reset all text elements
    svgSecond.selectAll('foreignObject')
      .classed('title-active', false);

    // Reset all image elements
    svgSecond.selectAll('image')
      .classed('img-active', false);

      // Reset all image elements
    svgSecond.selectAll('.data-point')
      .classed('rect-active', false);

    // Reset close button
    svgSecond.selectAll('circle')
      .classed('close-active', false);
    svgSecond.selectAll('.close-text')
      .classed('close-active', false);
  }

  ////////////////// SPINNING WHEEL CODE /////////////////////////
  let padding =
  {
    top: 20,
    right: 40,
    bottom: 0,
    left: 0
  },
    w = 350 - padding.left - padding.right,
    h = 350 - padding.top - padding.bottom,
    r = Math.min(w, h) / 2,
    rotation = 0,
    oldrotation = 0,
    picked = 100000,
    oldpick = [];

  let categories = [
    { 'year': '11e eeuw', 'value': 1, run: function () { render(svgSecond, transformedData[3].values); } }, // padding
    { 'year': '12e eeuw', 'value': 1, run: function () { render(svgSecond, transformedData[1].values); } },
    { 'year': '18e eeuw', 'value': 1, run: function () { render(svgSecond, transformedData[2].values); } },
    { 'year': '19e eeuw', 'value': 1, run: function () { render(svgSecond, transformedData[0].values); } }
  ];

  let svgFirst = d3.select('#chart')
    .append('svg')
    .attr('class', 'spinning-wheel')
    .data([categories])
    .attr('width', w + padding.left + padding.right)
    .attr('height', h + padding.top + padding.bottom);

  let container = svgFirst.append('g')
    .attr('class', 'chartholder')
    .attr('transform', 'translate(' + (w / 2 + padding.left) + ',' + (h / 2 + padding.top) + ')');

  let vis = container
    .append('g');

  let pie = d3.pie().sort(null).value(function (d) { return +1 });

  // declare an arc generator function
  let arc = d3.arc()
    .innerRadius(0)
    .outerRadius(r);

  // select paths, use arc generator to draw
  let arcs = vis.selectAll('g.slice')
    .data(pie)
    .enter()
    .append('g')
    .attr('class', 'slice');

  // Check if number is even or uneven
  function evenOrOddColor (index, color1, color2) {
    if (index % 2 === 0) {
      return color1
    } else {
      return color2
    }
  }

  arcs.append('path')
    .attr('fill', function (d, i) {
      return evenOrOddColor(i, '#B0E0E6', '#ff7373')
    })
    .attr('d', function (d) { return arc(d) });

  // add the text
  arcs.append('text').attr('transform', function (d) {
    d.innerRadius = 0;
    d.outerRadius = r;
    d.angle = (d.startAngle + d.endAngle) / 2;
    return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')translate(' + (d.outerRadius - 10) +')'
  })
    .attr('text-anchor', 'end')
    .attr('class', 'spinning-wheel-text')
    .text(function (d, i) {
      return categories[i].year
    });

  container.on('click', spin);

  function spin (d) {
    container.on('click', null);

    // Reset all data so it doesn't exist when the data is updated
    resetDataPoint();

    // Check the previous pick and length of the categories
    console.log('OldPick: ' + oldpick.length, 'Data length: ' + categories.length);

    //all categories have been spinned
    if (oldpick.length === categories.length) {
      console.log('All categories spinned');
      container.on('click', null);
      return
    }

    // Calculate the rotation considering the previous rotation
    let ps = 360 / categories.length,
    rng = Math.floor((Math.random() * 2040) + 360);
    rotation = (Math.round(rng / ps) * ps);
    picked = Math.round(categories.length - (rotation % 360) / ps);
    picked = picked >= categories.length ? (picked % categories.length) : picked;

    console.log('picked: ', picked);

    if (oldpick.indexOf(picked) !== -1) {
      d3.select(this).call(spin);
      return
    } else {
      oldpick.push(picked);
    }

    rotation += 90 - Math.round(ps / 2);

    // Give it a rotation
    vis.transition()
      .duration(3000)
      .attrTween('transform', rotTween)
      .on('end', function () {
        // mark category as seen
        d3.select('.slice:nth-child(' + (picked + 1) + ') path')
          .attr('fill', '#B7B7B7');


        // Display category in browser
        d3.select('#question h1')
          .text(categories[picked].year);

        // Run function the update function
        categories[picked].run();


        // Set old rotation as current one
        oldrotation = rotation;

        // Spin when clicked on the container
        container.on('click', spin);
      });
  }

  // Create an arrow
  svgFirst.append('g')
    .attr('transform', 'translate(' + (w + padding.left + padding.right) + ',' + ((h / 2) + padding.top) + ')')
    .append('path')
    .attr('d', 'M-' + (r * 0.15) + ',0L0,' + (r * 0.05) + 'L0,-' + (r * 0.05) + 'Z')
    .style({ 'fill': 'black' });

  // Create spin circle
  container.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 40)
    .attr('class', 'circle-middle');

  // Create spin text
  container.append('text')
    .attr('x', 0)
    .attr('y', 12)
    .attr('text-anchor', 'middle')
    .attr('class', 'spin-text')
    .text('SPIN');

  // Rotate animation
  function rotTween (to) {
    var i = d3.interpolate(oldrotation % 360, rotation);
    return function (t) {
      return 'rotate(' + i(t) + ')'
    }
  }

}(d3, topojson));
