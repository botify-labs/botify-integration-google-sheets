/**
 * Return the result of an aggregation for latest project's analyses.
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {BQLAggsQuery} urlsAggsQuery BQL Aggregation Query to perform
 * @param {Number} nbAnalyses Number of analyses to get
 * @return {Array} The result of the aggregation.
 * @customfunction
 */
function BOTIFY_PROJECT_AGGREGATE_URLS(apiToken, username, projectSlug, urlsAggsQuery, nbAnalyses) {
  var result = [[]];

  // TEST urlsAggsQuery
  urlsAggsQuery = JSON.parse(urlsAggsQuery);
  if (urlsAggsQuery.aggs.length > 1) {
    throw new Error('ERROR: you cannot define more than 1 aggregation');
  }
  var requestAgg = urlsAggsQuery.aggs[0] || {};
  if (requestAgg.group_by && requestAgg.metrics && requestAgg.metrics.length > 1) {
    throw new Error('ERROR: you can define only one metrics with groupbys');
  }

  // FETCHING API
  var url = 'https://api.botify.com/v1/projects/' + username + '/' + projectSlug + '/urls/aggs';
  if (nbAnalyses) {
    url += '?nb_analyses=' + nbAnalyses;
  }
  var options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Token ' + apiToken,
      'Content-type': 'application/json',
      'X-Botify-Client': 'google-sheets',
    },
    'payload': JSON.stringify([urlsAggsQuery]),
  };
  var responses = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());

  // INSERT HEADERS
  if (requestAgg.group_by) {
    requestAgg.group_by.forEach(function (group) {
      if (group.range) { // Range group bY
        result[0].push(group.range.field);
      } else { // Simple group by
        result[0].push(group);
      }
    });
  } else {
    result[0].push('Metric');
    if (requestAgg.metrics) {
      requestAgg.metrics.forEach(function (metric, i) {
        if (typeof metric === "string") {
          result[i + 1] = [metric.toUpperCase()];
        } else {
          var operation = Object.keys(metric)[0];
          result[i + 1] = [operation.toUpperCase() + ' ' + metric[operation]];
        }
      });
    } else { // Default metric is count
      result[1] = ['count'];
    }
  }
    
  if (!responses[0]) return result;

  // APPEND ROW RESULTS
  var rowIds = [];
  responses[0].reverse();
  responses[0].forEach(function(response) {
    // 1 reponse by analysis
    var colIdx = result[0].push(response.analysis_slug) - 1; // Add analysis slug in first column
    var groups = (response.data.aggs[0] && response.data.aggs[0].groups) || response.data.aggs;
    groups.forEach(function(resultGroup) { // For each group by combinaison
      // Add group keys
      if (resultGroup.key) {
        var rowId = [];
        resultGroup.key.forEach(function(key, i) {
          if (typeof(key.from) !== "undefined" || typeof(key.to) !== "undefined") { // Range group key
            if (typeof(key.from) === "undefined") {
              rowId.push('< ' + key.to);
            } else if (typeof(key.to) === "undefined") {
              rowId.push('>= ' + key.from);
            } else {
              rowId.push(key.from + ' to ' + key.to);
            }
          } else { // Simple group key
            rowId.push(key);
          }
        });
        var rowIdx = rowIds.indexOf(rowId.join('#')) + 1;
        if (!rowIdx) {
          rowIdx = rowIds.push(rowId.join('#'));
          result[rowIdx] = rowId;
        }
        result[rowIdx][colIdx] = resultGroup.metrics[0];
      } else {
        resultGroup.metrics.forEach(function(metric, i) {
          result[i + 1][colIdx] = metric;
        });
      };
    });
  });

  // fill with 0
  for (var i = 0; i < result.length; i++) {
    for (var j = 0; j < result[0].length; j++) {
      if (typeof result[i][j] === 'undefined') {
        result[i][j] = 0;
      }
    }
  }

  return result;
}
