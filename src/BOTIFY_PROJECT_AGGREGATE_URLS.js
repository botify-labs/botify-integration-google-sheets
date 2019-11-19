// noinspection JSUnusedGlobalSymbols
/**
 * Return the result of an aggregation for latest project's analyses.
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {BQLAggsQuery} urlsAggsQuery BQL Aggregation Query to perform
 * @param {Number} nbAnalyses [Optional] Number of analyses to get (default: 5)
 * @param {Boolean} errors [Optional] Return error messages (default: false)
 * @return {Array} The result of the aggregation.
 * @customfunction
 */
function BOTIFY_PROJECT_AGGREGATE_URLS(
  username,
  projectSlug,
  urlsAggsQuery,
  nbAnalyses,
  errors
) {
  var apiToken = getTokenFromProperties()
  // Support old token format
  // Old signature was BOTIFY_PROJECT_AGGREGATE_URLS(apiToken, username, projectSlug, urlsAggsQuery, (nbAnalyses))
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
    urlsAggsQuery = arguments[3]
    nbAnalyses = arguments[4]
    errors = arguments[5]
  }

  // PARAMS CHECKING
  if (!apiToken)
    throw new Error(
      "API Token is missing in the Addon configuration. Click on the Botify Addon item in the menu to add your token."
    )
  if (!username) throw new Error("username is missing in parameters")
  if (!projectSlug) throw new Error("projectSlug is missing in parameters")
  if (!urlsAggsQuery) throw new Error("urlsAggsQuery is missing in parameters")
  if (typeof nbAnalyses === "undefined") nbAnalyses = 5

  var result = [[]]

  // TEST urlsAggsQuery
  urlsAggsQuery = JSON.parse(urlsAggsQuery)
  if (urlsAggsQuery.aggs.length > 1) {
    throw new Error("ERROR: you cannot define more than 1 aggregation")
  }
  var requestAgg = urlsAggsQuery.aggs[0] || {}
  if (
    requestAgg.group_by &&
    requestAgg.metrics &&
    requestAgg.metrics.length > 1
  ) {
    throw new Error("ERROR: you can define only one metrics with groupbys")
  }

  // FETCHING API
  var url =
    "https://api.botify.com/v1/projects/" +
    username +
    "/" +
    projectSlug +
    "/urls/aggs"
  if (nbAnalyses) {
    url += "?nb_analyses=" + nbAnalyses
  }
  var options = {
    method: "post",
    headers: {
      Authorization: "Token " + apiToken,
      "Content-type": "application/json",
      "X-Botify-Client": "google-sheets"
    },
    payload: JSON.stringify([urlsAggsQuery])
  }
  var responses = JSON.parse(UrlFetchApp.fetch(url, options).getContentText())

  // INSERT HEADERS
  if (requestAgg.group_by) {
    requestAgg.group_by.forEach(function (group) {
      if (group.range) {
        // Range group by
        result[0].push(group.range.field)
      } else {
        // Simple group by
        result[0].push(group)
      }
    })
  } else {
    result[0].push("Metric")
    if (requestAgg.metrics) {
      requestAgg.metrics.forEach(function (metric, i) {
        if (typeof metric === "string") {
          result[i + 1] = [metric.toUpperCase()]
        } else {
          var operation = Object.keys(metric)[0]
          result[i + 1] = [operation.toUpperCase() + " " + metric[operation]]
        }
      })
    } else {
      // Default metric is count
      result[1] = ["count"]
    }
  }

  if (!responses[0]) return result
  var start = result[0].length  // Index of the first analysis result

  // APPEND ROW RESULTS
  var rowIds = []
  responses[0].reverse()
  responses[0].forEach(function (response) {
    // 1 response per analysis
    var colIdx = result[0].push(response.analysis_slug) - 1 // Add analysis slug in first column
    var groups =
      (response.data === undefined && []) ||
      (response.data.aggs[0] && response.data.aggs[0].groups) ||
      response.data.aggs
    groups.forEach(function (resultGroup) {
      // For each group by combination
      // Add group keys
      var rowId = []
      if (resultGroup.key) {
        rowId = extractRowKeys(resultGroup)
        var rowIdx = rowIds.indexOf(rowId.join("#")) + 1
        if (!rowIdx) {
          rowIdx = rowIds.push(rowId.join("#"))
          result[rowIdx] = rowId
        }
        result[rowIdx][colIdx] = resultGroup.metrics[0]
      } else {
        resultGroup.metrics.forEach(function (metric, i) {
          result[i + 1][colIdx] = metric
        })
      }
    })
  })

  // fill with 0
  for (var i = 0; i < result.length; i++) {
    for (var j = 0; j < result[0].length; j++) {
      if (typeof result[i][j] === "undefined") {
        result[i][j] = 0
      }
    }
  }

  // Append errors
  if (errors) {
    var errors_list = new Array(result[0].length)
    var have_errors = false
    responses[0].forEach(function (response, i) {
      if (response.error) {
        have_errors = true
        errors_list[start + i] = response.error.message  // in the corresponding analysis column
      }
    })
    if (have_errors) {
      result.push(errors_list)
    }
  }
  return result
}
