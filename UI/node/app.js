const LedMatrix = require("easybotics-rpi-rgb-led-matrix")
const fs = require('fs')
const path = require('path')
const axios = require("axios")
const {
  trainName,
  stationName,
  direction,
  stationId,
  textColor,
  circleColor,
  circleNumberColor,
  loadingTextColor,
  url,
  url2
} = require('./config.json');
const matrix = new LedMatrix(32, 64, 1, 1, 100, 'adafruit-hat')
const fontPath = path.join(__dirname, '../fonts/tom-thumb.bdf')

let loadInterval, drawInterval
let i = 0


// Time in minutes it takes to walk to the train station
// Don't show trains that are shorter than 9 minutes because
// we can't walk there to catch it fast enough
const minimumMins = 1

const getData = async (url, url2) => {
  try {
    loading = true
    console.log("getting data: " + url + " " + url2)
    const responses = await Promise.all([axios.get(url), axios.get(url2)])
    const data = response.map(d => d.data)
    console.log("data: " + data)
    loading = false
    return data
  } catch (error) {
    loading = true
    console.log('connection error')
  }
}

getTrainMins = (times) => {
  const minsArr = times["S"].map(o => {
    return o.arrivalTime
  })
  return minsArr
}

drawLoading = () => {
  switch(i) {
    case (0):
      matrix.clear()
      matrix.drawText(16, 14, "Loading", fontPath, ...loadingTextColor)
      matrix.update()
      i = 1
      break;
    case (1):
      matrix.clear()
      matrix.drawText(16, 14, "Loading.", fontPath, ...loadingTextColor)
      matrix.update()
      i = 2
      break;
    case (2):
      matrix.clear()
      matrix.drawText(16, 14, "Loading..", fontPath, ...loadingTextColor)
      matrix.update()
      i = 3
      break;
    case (3):
    matrix.clear()
      matrix.drawText(16, 14, "Loading...", fontPath, ...loadingTextColor)
      matrix.update()
      i = 0
      break;
  }
}

drawTrainCircle = (x, y, color) => {
  // Draw circle with lines
  matrix.drawLine(x+2, y+0, x+6, y+0, ...color)
  matrix.drawLine(x+1, y+1, x+7, y+1, ...color)
  matrix.drawLine(x+0, y+2, x+8, y+2, ...color)
  matrix.drawLine(x+0, y+3, x+8, y+3, ...color)
  matrix.drawLine(x+0, y+4, x+8, y+4, ...color)
  matrix.drawLine(x+0, y+5, x+8, y+5, ...color)
  matrix.drawLine(x+0, y+6, x+8, y+6, ...color)
  matrix.drawLine(x+1, y+7, x+7, y+7, ...color)
  matrix.drawLine(x+2, y+8, x+6, y+8, ...color)
}

getMinutesUntilEpochTime = (epochTime) => {
  date = new Date(epochTime*1000)
  difference = date - new Date()
  return parseInt(difference / 1000 / 60)
}
drawRows = (msTrain1, msTrain2) => {
  matrix.clear()
  minsTrain1 = msTrain1.map(x => getMinutesUntilEpochTime(x).toString()).join(",")

  minsTrain2 = msTrain2.map(x => getMinutesUntilEpochTime(x).toString()).join(",")

 // Top line
  drawTrainCircle(2, 4, circleColor1)
  matrix.drawText(5, 7, trainName2, fontPath, ...circleNumberColor)
  matrix.drawText(14, 7, "72", fontPath, ...textColor)
  console.log(minsTrain1);
  matrix.drawText(30, 7, minsTrain1, fontPath, ...textColor)
  matrix.drawText(54, 7, "min", fontPath, ...textColor)

  // Bottom line
  drawTrainCircle(2, 19, circleColor2)
  matrix.drawText(5, 22, trainName2, fontPath, ...circleNumberColor)
  matrix.drawText(14, 22, "68", fontPath, ...textColor)
  matrix.drawText(47, 22, minsTrain2, fontPath, ...textColor)
  matrix.drawText(54, 22, "min", fontPath, ...textColor)


  console.log(`${stationId} ${stationName} ${minsTrain1} min / ${stationId} ${stationName} ${minsTrain2} min`)

  matrix.update()
}

drawCanvas = async () => {
  try {
      console.log("about to get data")
      const arrs = await getData(url, url2)
      const msArr = arrs[0]
      const msArr2 = arrs[1]
      console.log("got data")
      if (msArr && msArr2) {
        clearInterval(loadInterval)
        let timesArr1 = getTrainMins(msArr)
        timesArr1 = timesArr1.filter(x => x >= minimumMins)
        let timesArr2 = getTrainMins(msArr2)
        timesArr2 = timesArr1.filter(x => x >= minimumMins)
        console.log(timesArr1)
        console.log(timesArr2)
	drawRows(timesArr1.slice(0, 2), timesArr2.slice(0, 2))
      }
  } catch (e) {
      console.log(e)
  }
}

const init = () => {
  console.log('Init')
  console.log('Loading...')
  loadInterval = setInterval(drawLoading, 350)

  drawCanvas()
  drawInterval = setInterval(drawCanvas, 60000)
}

init()
