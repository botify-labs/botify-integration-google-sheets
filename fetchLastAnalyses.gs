/**
 * Print the latest analyses in a tab.
 * @param {String} Sheet name (tab)
 * @param {String} Botify API token
 * @param {String} Username of the project owner
 * @param {String} Project's slug
 * @param {String} Number of analyses to retrieve
 * @return {Array} The list of analyses.
 */
function fetchLastAnalyses(sheetName, apiToken, username, projectSlug, nbAnalyses) {
  var sheet = spreadSheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadSheet.insertSheet(sheetName);
  }
  sheet.clear();
  insertLastAnalysesHeaders(sheet);
  return fetchLastAnalysesResults(sheet, apiToken, username, projectSlug, nbAnalyses);


  function insertLastAnalysesHeaders(sheet) {
    sheet.appendRow([
      'slug',
      'name',
      'url',
      'nbUrls',
    ]);
  }

  function fetchLastAnalysesResults(sheet, apiToken, username, projectSlug, nbAnalyses) {
    // FETCHING API
    var url = 'https://api.botify.com/v1/analyses/' + username + '/' + projectSlug;
    if (nbAnalyses) {
      url += '?size=' + nbAnalyses;
    }
    var options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Token ' + apiToken,
        'Content-type': 'application/json',
      },
    };

    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    var analyses = result.results;
    Logger.log(analyses);

    // APPEND ROW RESULTS
    analyses.forEach(function(analysis) { // For each group by combinaison
      sheet.appendRow([
        analysis.slug,
        analysis.name,
        analysis.url,
        analysis.urls_done
      ]);
    });

    return analyses;
  }
}