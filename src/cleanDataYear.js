// CLEANING ALL DATA
export function cleanDataYear (fetchedData) {
  console.log('oldData: ', fetchedData)
  let newData = fetchedData.map(item => {
    let itemDateValue = item.date.value

    // Transform all elements to uppercase
    item.date.value = item.date.value.toUpperCase()

    // Replace all bc and ad with an empty string and turn the corresponding properties into true
    item = replaceChrist(item)

    // Replace all unnecessary characters with an empty string
    item.date.value = cleanCharacter(item)

    // Replace all 'eeuwen' en 'centuries' with an empty string
    item = replaceCenturies(item)

    // Replace all left letters with an empty string
    item.date.value = replaceWithWhichString(item.date.value, /([a-zA-Z ])/g)

    // Clean data if they have this format: 12-03-1990, or this format: 1900-2000. Returns the (average) year
    item = convertToYear(item)


    // Convert all strings to numbers
    item = convertToNumber(item)

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
  })

  // delete all items which don't fit the format by now
  let finalArray = deleteUnformattedData(newData)

  finalArray = convertToCentury(finalArray)

  console.log('newData: ', finalArray)

  return finalArray
}



function deleteUnformattedData (array) {
  const finalArray = array.filter(item => {
    if (item.year.toString().length === 4 && item.year <= 2019 && item.year >= 0) {
            return item
        }
  })
  return finalArray
}

// Cleans all data which contain a before and after Christ.
// I create a property to the keep in mind that the year was before or after Christ. I will need this later in my data cleaning.
function replaceChrist (item) {
  let itemDate = item.date
  if (itemDate.value.includes('BC')) {
    itemDate.bc = true
    itemDate.value = itemDate.value.replace('BC', '')
  }
  if (itemDate.value.includes('AD')) {
    itemDate.ad = true
    itemDate.value = itemDate.value.replace('AD', '')
  } else {
    itemDate.bc = false
    itemDate.ad = false
  }
  item.date = itemDate
  return item
}

// Here I clean all weird characters which don't belong. I replace all with an empty string. I replace the '/' with a '-' to
// get a consistent format.
function cleanCharacter (item) {
  let itemDateValue = item.date.value

  // Replace the dot, (, ) and /
  itemDateValue = replaceWithWhichString(itemDateValue, /\./g)
  itemDateValue = replaceWithWhichString(itemDateValue, /[()]/g)
  itemDateValue = replaceWithWhichString(itemDateValue, /[()]/g)
  itemDateValue = replaceWithWhichString(itemDateValue, /\s/g)
  itemDateValue = replaceWithWhichString(itemDateValue, /\?/g)
  itemDateValue = replaceWithWhichString(itemDateValue, /\//g, '-')

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
               .replace("KWART", "")

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
  let itemDate = item.date
  if (itemDate.value.includes('EEEUW') || itemDate.value.includes('EEUW') || itemDate.value.includes('CENTURY')) {
    itemDate.value = itemDate.value.replace('EEEUW', '')
    itemDate.value = itemDate.value.replace('EEUW', '')
    itemDate.value = itemDate.value.replace('CENTURY', '')
    itemDate.century = true
  } else if (itemDate.value.includes('TH')) {
    itemDate.value = itemDate.value.replace(/\t.*/, '')
    itemDate.century = true
  } else {
    itemDate.century = false
  }
  item.date = itemDate
  return item
}

// Here I convert every workable/convertable date to a single year.
function convertToYear (item) {
  let itemDateValue = item.date.value

  // Here I check if the date has this format: '01-2005'. I only keep the year (last four numbers)
  if (itemDateValue.length === 7) {
    let splittedArray = itemDateValue.split('-')
    if (splittedArray[0] &&
     splittedArray[1] &&
      // https://stackoverflow.com/questions/14783196/how-to-check-in-javascript-that-a-string-contains-alphabetical-characters
      splittedArray[0].match(/[a-z]/) === null &&
      splittedArray[1].match(/[a-z]/) === null) {
      if (splittedArray[1].length === 4) {
        item.date.value = splittedArray[0]
      }
    }
  }

  // Here I check if the date has this format: '1-2-2005'. I only keep the year (last four numbers)
  if (itemDateValue.length === 8) {
    let splittedArray = itemDateValue.split('-')
    // Check if the array has 3 items, only contain numbers and if the last item in the array is a year
    if (splittedArray[0] &&
      splittedArray[1] &&
      splittedArray[2] &&
      splittedArray[0].match(/[a-z]/) === null &&
      splittedArray[1].match(/[a-z]/) === null &&
      splittedArray[2].match(/[a-z]/) === null) {
      if (splittedArray[2].length === 4) {
        item.date.value = splittedArray[2]
      }
    }
  }

  if (itemDateValue.length === 9) {
    let splittedArray = itemDateValue.split('-')
    // Here I check if the date has this format: '1900-2000'. I split the two, count them up and divide them by 2.
    // So I only keep one average number
    if (splittedArray[0] &&
      splittedArray[1] &&
      splittedArray[0].match(/[a-z]/) === null &&
      splittedArray[1].match(/[a-z]/) === null) {
      if (splittedArray[0].length === 4 && splittedArray[1].length === 4) {
        item.date.value = splitStringCalcAverage(itemDateValue)
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
        item.date.value = splittedArray[2]
      }
    }
  }

  // Here I check if the date has this format: '02-05-2000'. I only keep the year (last four numbers)
  if (itemDateValue.length === 10) {
    let splittedArray = itemDateValue.split('-')
    if (splittedArray[2] &&
      splittedArray[2].length === 4) {
      item.date.value = splittedArray[2]
    } // Check if first array item is a year and only contains numbers
    if (splittedArray[0].length === 4 &&
      splittedArray[0].match(/^[0-9]+$/) != null) {
      item.date.value = splittedArray[0]
    }
  }
  return item
}

// Merge the two arrays into one with the average function
function splitStringCalcAverage (item) {
  let splittedArray = item.split('-')
  return average(splittedArray[0], splittedArray[1])
}
// Wiebe helped me with this function
function average (a, b) {
  // Multiply by 1 to make sure it's a number
  return Math.round(((a * 1 + b * 1) / 2))
}

// Convert all left strings to number
function convertToNumber (item) {
  item.date.value = parseInt(item.date.value)
  return item
}

function convertToCentury (newData) {
  newData.forEach(item => {
    let string = item.year.toString()
    item.century = splitValue(string, 2)
    string = parseInt(string)
    return string
  })
  return newData
}

function splitValue (value, index) {
  return value.substring(0, index) + '00'
}
