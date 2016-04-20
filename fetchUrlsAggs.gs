/**
 * Perform an aggregation on URLs of a given analyses and print result in a tab.
 * @param {String} Sheet name (tab)
 * @param {String} Botify API token
 * @param {String} Username of the project owner
 * @param {String} Project's slug of the analysis
 * @param {String} Analysis's slug
 * @param {BQLQueryAggs} BQL Aggregation Query to perform
 * @return {Array} The result of the aggregation.
 */
function fetchUrlsAggs(sheetName, apiToken, username, projectSlug, analysisSlug, request) {
  var sheet = spreadSheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadSheet.insertSheet(sheetName);
  }
  sheet.clear();
  insertUrlsAggsHeaders(sheet, request);
  return fetchUrlsAggsResults(sheet, apiToken, username, projectSlug, analysisSlug, request);


  function insertUrlsAggsHeaders(sheet, request) {
    var requestAgg = request.aggs[0];
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
        sheetHeaders.push(metric);
      });
    } else { // Default metric is count
      sheetHeaders.push('count');
    }
    // Insert Headers
    sheet.appendRow(sheetHeaders);
  }


  function fetchUrlsAggsResults(sheet, apiToken, username, projectSlug, analysisSlug, request) {
    // FETCHING API
    var url = 'https://api.botify.com/v1/analyses/' + username + '/' + projectSlug + '/' + analysisSlug + '/urls/aggs';
    var options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Token ' + apiToken,
        'Content-type': 'application/json',
      },
      'payload': JSON.stringify([request]),
    };
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());

    // APPEND ROW RESULTS
    if(result[0].status !== 200) {
      Logger.log(result);
      return null;
    }

    var groups = result[0].data.aggs[0].groups || result[0].data.aggs;
    groups.forEach(function(resultGroup) { // For each group by combinaison
      var sheetRow = [];
      // Add group keys
      if (resultGroup.key) {
        resultGroup.key.forEach(function(key) {
          sheetRow.push(key);
        });
      };
      // Add metrics
      if (resultGroup.metrics) {
        resultGroup.metrics.forEach(function(metric) {
          sheetRow.push(metric);
        });
      };
      // Insert row
      sheet.appendRow(sheetRow);
    });

    return result;
  }
}
