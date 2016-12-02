/**
 * Return the latest analyses of a given project.
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug
 * @param {Number} nbAnalyses Number of analyses to get
 * @return {Array} The list of analyses.
 * @customfunction
 */
function BOTIFY_PROJECT_LIST_ANALYSES(apiToken, username, projectSlug, nbAnalyses) {
  var result = [];

  // INSERT HEADERS
  result.push([
    'slug',
    'name',
    'start URL',
    'status',
    'nbUrls',
    'report url',
  ]);

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
      'X-Botify-Client': "google-sheets",
    },
  };

  var response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());

  if(response.error) {
    throw new Error('ERROR ' + response.error.message);
  }

  // APPEND ROW RESULTS
  var analyses = response.results;
  analyses.forEach(function(analysis) {
    result.push([
      analysis.slug,
      analysis.name,
      analysis.config.start_urls[0],
      analysis.status,
      analysis.urls_done,
      analysis.url
    ]);
  });

  return result;
}
