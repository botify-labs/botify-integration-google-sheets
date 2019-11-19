// noinspection JSUnusedGlobalSymbols
/**
 * Return the result of the aggregation on URLs of a given analyses
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {BQLAggsQuery} urlsAggsQuery BQL Aggregation Query to perform
 * @param {Boolean} showHeaders [Optional] Show Groups and Metrics headers (default: true)
 * @return {Array} The result of the aggregation.
 * @customfunction
 */
function BOTIFY_ANALYSIS_AGGREGATE_URLS(
  username,
  projectSlug,
  analysisSlug,
  urlsAggsQuery,
  showHeaders
) {
  var apiToken = getTokenFromProperties()
  // Support old token format
  // Old signature was BOTIFY_ANALYSIS_AGGREGATE_URLS(apiToken, username, projectSlug, analysisSlug, urlsAggsQuery, showHeaders)
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
    urlsAggsQuery = arguments[4]
    showHeaders = arguments[5]
  }

  // PARAMS CHECKING
  if (!apiToken)
    throw new Error(
      "API Token is missing in the Addon configuration. Click on the Botify Addon item in the menu to add your token."
    )
  if (!username) throw new Error("username is missing in parameters")
  if (!projectSlug) throw new Error("projectSlug is missing in parameters")
  if (!analysisSlug) throw new Error("analysisSlug is missing in parameters")
  if (!urlsAggsQuery) throw new Error("urlsAggsQuery is missing in parameters")
  if (typeof showHeaders === "undefined") showHeaders = true

  var result = []
  urlsAggsQuery = JSON.parse(urlsAggsQuery)

  // INSERT HEADERS
  if (showHeaders) {
    var requestAgg = urlsAggsQuery.aggs[0]
    var sheetHeaders = []
    // Add groups fields Headers
    if (requestAgg.group_by) {
      requestAgg.group_by.forEach(function (group) {
        if (group.range) {
          // Range group bY
          sheetHeaders.push(group.range.field)
        } else {
          // Simple group by
          sheetHeaders.push(group)
        }
      })
    }
    // Add metrics Headers
    if (requestAgg.metrics) {
      requestAgg.metrics.forEach(function (metric) {
        if (typeof metric === "string") {
          sheetHeaders.push(metric.toUpperCase())
        } else {
          var operation = Object.keys(metric)[0]
          sheetHeaders.push(operation.toUpperCase() + " " + metric[operation])
        }
      })
    } else {
      // Default metric is count
      sheetHeaders.push("count")
    }
    result.push(sheetHeaders)
  }

  // FETCHING API
  var url =
    "https://api.botify.com/v1/analyses/" +
    username +
    "/" +
    projectSlug +
    "/" +
    analysisSlug +
    "/urls/aggs"
  var options = {
    method: "post",
    headers: {
      Authorization: "Token " + apiToken,
      "Content-type": "application/json",
      "X-Botify-Client": "google-sheets"
    },
    payload: JSON.stringify([urlsAggsQuery])
  }
  var response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText())
  if (response[0].error) {
    throw new Error("ERROR " + result[0].error.message)
  }

  // APPEND ROW RESULTS
  var groups = response[0].data.aggs[0].groups || response[0].data.aggs
  groups.forEach(function (resultGroup) {
    // For each group by combination
    // Add group keys
    var rowId = []
    if (resultGroup.key) {
      rowId = extractRowKeys(resultGroup)
    }
    // Add metrics
    if (resultGroup.metrics) {
      resultGroup.metrics.forEach(function (metric) {
        rowId.push(metric)
      })
    }
    // Insert row
    result.push(rowId)
  })

  return result
}
