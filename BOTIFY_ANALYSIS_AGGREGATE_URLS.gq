/**
 * Return the result of the aggregation on URLs of a given analyses
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {BQLAggsQuery} urlsAggsQuery BQL Aggregation Query to perform
 * @param {Boolean} showHeaders Show Groups and Metrics headers (default to true)
 * @return {Array} The result of the aggregation.
 * @customfunction
 */
function BOTIFY_ANALYSIS_AGGREGATE_URLS(apiToken, username, projectSlug, analysisSlug, urlsAggsQuery, showHeaders) {
  var result = [];

  urlsAggsQuery = JSON.parse(urlsAggsQuery);
  if (typeof showHeaders === "undefined") {
    showHeaders = true;
  }

  // INSERT HEADERS
  if (showHeaders) {
    var requestAgg = urlsAggsQuery.aggs[0];
    var sheetHeaders = [];
    // Add groups fields Headers
    if (requestAgg.group_by) {
      requestAgg.group_by.forEach(function (group) {
        if (group.range) { // Range group bY
          sheetHeaders.push(group.range.field);
        } else { // Simple group by
          sheetHeaders.push(group);
        }
      });
    }
    // Add metrics Headers
    if (requestAgg.metrics) {
      requestAgg.metrics.forEach(function (metric) {
        if (typeof metric === "string") {
          sheetHeaders.push(metric.toUpperCase());
        } else {
          var operation = Object.keys(metric)[0];
          sheetHeaders.push(operation.toUpperCase() + ' ' + metric[operation]);
        }
      });
    } else { // Default metric is count
      sheetHeaders.push('count');
    }
    result.push(sheetHeaders);
  }

  // FETCHING API
  var url = 'https://api.botify.com/v1/analyses/' + username + '/' + projectSlug + '/' + analysisSlug + '/urls/aggs';
  var options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Token ' + apiToken,
      'Content-type': 'application/json',
    },
    'payload': JSON.stringify([urlsAggsQuery]),
  };
  var response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());

  if(response[0].error) {
    throw new Error('ERROR ' + result[0].error.message);
  }

  // APPEND ROW RESULTS
  var groups = response[0].data.aggs[0].groups || response[0].data.aggs;
  groups.forEach(function(resultGroup) { // For each group by combinaison
    var sheetRow = [];
    // Add group keys
    if (resultGroup.key) {
      resultGroup.key.forEach(function(key) {
        if (typeof(key.from) !== "undefined" || typeof(key.to) !== "undefined") { // Range group key
          if (typeof(key.from) === "undefined") {
            sheetRow.push('< ' + key.to);
          } else if (typeof(key.to) === "undefined") {
            sheetRow.push('>= ' + key.from);
          } else {
            sheetRow.push(key.from + ' to ' + key.to);
          }
        } else { // Simple group key
          sheetRow.push(key);
        }
      });
    };
    // Add metrics
    if (resultGroup.metrics) {
      resultGroup.metrics.forEach(function(metric) {
        sheetRow.push(metric);
      });
    };
    // Insert row
    result.push(sheetRow);
  });

  return result;
}
