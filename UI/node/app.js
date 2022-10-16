const LedMatrix = require("easybotics-rpi-rgb-led-matrix")
const fs = require('fs')
const path = require('path')
const axios = require("axios")
const {
  trainName,
  trainName2,
  stationName,
  direction,
  stationId,
  textColor,
  circleColor,
  circleColor2,
  circleNumberColor,
  loadingTextColor,
  stop1Id,
  stop1Line,
  stop1Direction,
  stop2Id,
  stop2Line,
  stop2Direction
} = require('./config.json');
const matrix = new LedMatrix(32, 64, 1, 1, 100, 'adafruit-hat')
const fontPath = path.join(__dirname, '../fonts/tom-thumb.bdf')
require('dotenv').config()
const Mta = require('mta-gtfs')
const mta = new Mta({
  key: process.env.MTA_KEY,
  feed_id: 1
})

let loadInterval, drawInterval
let i = 0


// Time in minutes it takes to walk to the train station
// Don't show trains that are shorter than 9 minutes because
// we can't walk there to catch it fast enough
const minimumMins = 3

const getData = async () => {
  try {
    loading = true
    const [train1, train2] = await Promise.all([mta.schedule(stop1Id, stop1Line), mta.schedule(stop2Id, stop2Line)])
    // fill with empty data incase null (because node 10 doesn't support optional chaining)
    if (train1.schedule == undefined) { 
        train1.schedule = {[stop1Id]: {[stop1Direction]: []}}
    }
    if (train2.schedule == undefined) { 
        train2.schedule = {[stop2Id]: {[stop2Direction]: []}}
    }
    const data = train1.schedule[stop1Id][stop1Direction]
    const data2 = train2.schedule[stop2Id][stop2Direction]
    console.log(data)
    console.log(data2)
    loading = false
    return [data, data2]
  } catch (error) {
    console.log(error)
    loading = true
    console.log('connection error')
  }
}

getTrainMins = (times) => {
  const minsArr = times.map(o => {
    return getMinutesUntilEpochTime(o.arrivalTime)
  })
  return minsArr
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

drawDownArrow = (x, y, color) => {
  matrix.drawLine(x+1, y+0, x+1, y+4, ...color)
  matrix.drawLine(x, y+3, x+2, y+3, ...color)
}

getMinutesUntilEpochTime = (epochTime) => {
  date = new Date(epochTime*1000)
  difference = date - new Date()
  return parseInt(difference / 1000 / 60)
}

drawRows = (msTrain1, msTrain2) => {
  matrix.clear()
  minsTrain1 = msTrain1.map(x => x.toString()).join(",")

  minsTrain2 = msTrain2.map(x => x.toString()).join(",")

 // Top line
  drawTrainCircle(2, 4, circleColor)
  // Color q corner due to aliasing
  matrix.setPixel(6, 10, ...circleColor)
  matrix.drawText(5, 7, trainName, fontPath, ...circleNumberColor)
  matrix.drawText(14, 7, "72", fontPath, ...textColor)
  drawDownArrow(22, 6, textColor)
  matrix.drawText(33, 7, minsTrain1, fontPath, ...textColor)

  // Bottom line
  drawTrainCircle(2, 19, circleColor2)
  matrix.drawText(5, 22, trainName2, fontPath, ...circleNumberColor)
  matrix.drawText(14, 22, "68", fontPath, ...textColor)
  drawDownArrow(22, 21, textColor)
  matrix.drawText(33, 22, minsTrain2, fontPath, ...textColor)


  console.log(`${stationId} ${stationName} ${minsTrain1} min / ${stationId} ${stationName} ${minsTrain2} min`)

  matrix.update()
}

drawCanvas = async () => {
  try {
      console.log("about to get data")
      const [msArr, msArr2] = await getData()
      if (msArr && msArr2) {
        clearInterval(loadInterval)
        let timesArr1 = getTrainMins(msArr).filter(x => x >= minimumMins)
        let timesArr2 = getTrainMins(msArr2).filter(x => x >= minimumMins)
	drawRows(timesArr1.slice(0, 3), timesArr2.slice(0, 3))
      }
  } catch (e) {
      console.log(e)
  }
}

const init = () => {
  drawCanvas()
  drawInterval = setInterval(drawCanvas, 30000)
}

init()
