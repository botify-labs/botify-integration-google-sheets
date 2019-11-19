// noinspection JSUnusedGlobalSymbols
/**
 * Return the requested fields of a given URL
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {Range} urls Urls to get detail on
 * @param {Range} fields Range of fields to fetch (ex A1:A4)
 * @param {Boolean} showHeaders [Optional] Show Groups and Metrics headers (default: true)
 * @return {Array} The value of the fields
 * @customfunction
 */
function BOTIFY_ANALYSIS_GET_URLS_DETAIL(
  username,
  projectSlug,
  analysisSlug,
  urls,
  fields,
  showHeaders
) {
  var apiToken = getTokenFromProperties()
  // Support old token format
  // Old signature was BOTIFY_ANALYSIS_GET_URLS_DETAIL(apiToken, username, projectSlug, analysisSlug, urls, fields, showHeaders)
  if (
    // If the user has given a token as the first argument, then the format is the old signature
    isToken(arguments[0])
  ) {
    // Only override the token if not present
    if (!apiToken) {
      apiToken = arguments[0]
    }
    // Override parameters in any case so they are correct
    username = arguments[1]
    projectSlug = arguments[2]
    analysisSlug = arguments[3]
    urls = arguments[4]
    fields = arguments[5]
    showHeaders = arguments[6]
  }

  // PARAMS CHECKING
  if (!apiToken)
    throw new Error(
      "API Token is missing in the Addon configuration. Click on the Botify Addon item in the menu to add your token."
    )
  if (!username) throw new Error("username is missing in parameters")
  if (!projectSlug) throw new Error("projectSlug is missing in parameters")
  if (!analysisSlug) throw new Error("analysisSlug is missing in parameters")
  if (!urls) throw new Error("urls list is missing in parameters")
  if (!fields) throw new Error("fields list is missing in parameters")
  if (typeof showHeaders === "undefined") showHeaders = true

  var timeStartFunc = new Date().getTime()

  var MAX_EXECUTION_DURATION = 28000 // A google sheet macro must respond with in 30 seconds (with 2 seconds margin).
  var BATCH_SIZE = 500
  var MAX_CALL_FREQUENCY = (60 * 1000) / 100 + 100 // 100 calls by minute (100ms margin)

  var result = []

  // PREPARE INPUTS
  if (fields.map) {
    // fields is a range (only a range row is supported)
    fields = fields[0].filter(function (v) {
      return !!v
    }) // remove empty fields
  } else {
    fields = [fields]
  }

  if (urls.map) {
    // urls is a range (only a range column is supported)
    var tempUrls = []
    for (var i = 0; i < urls.length; i++) {
      if (urls[i][0]) {
        tempUrls.push(urls[i][0])
      }
    }
    urls = tempUrls
  } else {
    // urls is a single cell
    urls = [urls]
  }

  // INSERT HEADERS
  if (showHeaders) {
    result.push(fields)
  }

  // FETCHING API
  var chunks = chunkArray(urls, BATCH_SIZE)

  for (i = 0; i < chunks.length; i++) {
    var timeStart = new Date().getTime()

    var apiurl =
      "https://api.botify.com/v1/analyses/" +
      username +
      "/" +
      projectSlug +
      "/" +
      analysisSlug +
      "/urls?size=" +
      BATCH_SIZE
    var options = {
      method: "post",
      headers: {
        Authorization: "Token " + apiToken,
        "Content-type": "application/json",
        "X-Botify-Client": "google-sheets"
      },
      payload: JSON.stringify({
        fields: fields.concat("url"),
        filters: {
          or: chunks[i].map(function (url) {
            return {
              field: "url",
              value: url
            }
          })
        }
      })
    }
    var response = JSON.parse(
      UrlFetchApp.fetch(apiurl, options).getContentText()
    ).results

    for (var j = 0; j < chunks[i].length; j++) {
      var url = chunks[i][j]

      // Find item (because results are not returned in the order we asked)
      var item = null
      for (var k = 0; k < response.length; k++) {
        if (response[k].url === url) {
          item = response[k]
          break
        }
      }

      // Get requested fields
      var row = []
      fields.forEach(function (field) {
        if (item) {
          var val = get(item, field)
          row.push(val)
        } else {
          // No result for the given URL
          row.push("NOT FOUND")
        }
      })
      result.push(row)
    }

    var executionDuration = new Date().getTime() - timeStartFunc
    if (executionDuration > MAX_EXECUTION_DURATION) {
      // Return within MAX_EXECUTION_DURATION even if everything has not been fetched.
      return result
    }

    // Handle API rate limit
    var timeEnd = new Date().getTime()
    var sleepDuration = MAX_CALL_FREQUENCY - (timeEnd - timeStart)
    if (sleepDuration > 0) {
      Utilities.sleep(sleepDuration)
    }
  }

  return result
}

function get(obj, path) {
  path = path.split(".")
  for (var i = 0; i < path.length; i++) {
    obj = obj[path[i]]
    if (typeof obj === "undefined") {
      return null
    }
  }
  return isObject(obj) ? JSON.stringify(obj) : obj
}

function chunkArray(array, size) {
  var chunks = []
  for (var i = 0; i < array.length; i++) {
    var idx = Math.floor(i / size)
    if (!chunks[idx]) {
      chunks[idx] = []
    }
    chunks[idx].push(array[i])
  }
  return chunks
}

function isObject(value) {
  var type = typeof value
  return value != null && (type === "object" || type === "function")
}
