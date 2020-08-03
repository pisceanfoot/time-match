const validatePattern = require('./pattern-validation')
const convertExpression = require('./convert-expression')
const tzOffset = require('tz-offset')

function matchPattern(pattern, value) {
  if (pattern.indexOf(',') !== -1) {
    var patterns = pattern.split(',')
    return patterns.indexOf(value.toString()) !== -1
  }
  return pattern === value.toString()
}

const PreDefinedPattern = {
  '@yearly': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
}

class TimeMatcher {
  constructor(pattern, timezone) {
    pattern = (pattern + '').trim()
    if (PreDefinedPattern[pattern]) {
      pattern = PreDefinedPattern[pattern]
    }

    const allPart = pattern.split(/\s+/)
    if (allPart.length == 5) {
      allPart.splice(0, 0, '0')
      pattern = '0 ' + pattern
    }

    const parsedParttern = convertExpression(allPart)

    this.pattern = pattern
    this.timezone = timezone
    this.expressions = parsedParttern.split(' ')

    validatePattern(allPart, this.expressions)
  }

  match(date) {
    if (this.timezone) {
      date = tzOffset.timeAt(date, this.timezone)
    }
    const runOnSecond = matchPattern(this.expressions[0], date.getSeconds())
    const runOnMinute = matchPattern(this.expressions[1], date.getMinutes())
    const runOnHour = matchPattern(this.expressions[2], date.getHours())
    let runOnDay = null

    // match last day of the month
    if (this.expressions[3] == -1) {
      const lastDayOfTheMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      )

      runOnDay = lastDayOfTheMonth.getDate() == date.getDate()
    } else {
      runOnDay = matchPattern(this.expressions[3], date.getDate())
    }

    const runOnMonth = matchPattern(this.expressions[4], date.getMonth() + 1)
    const runOnWeekDay = matchPattern(this.expressions[5], date.getDay())

    return (
      runOnSecond &&
      runOnMinute &&
      runOnHour &&
      runOnDay &&
      runOnMonth &&
      runOnWeekDay
    )
  }
}

module.exports = TimeMatcher
