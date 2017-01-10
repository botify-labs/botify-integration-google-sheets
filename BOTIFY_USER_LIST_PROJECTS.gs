/**
 * Return the projects of a user
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {Number} nbProjects Number of projects to get
 * @return {Array} The list of projects.
 * @customfunction
 */
function BOTIFY_USER_LIST_PROJECTS(apiToken, username, nbProjects) {
  var result = [];

  // INSERT HEADERS
  result.push([
    'Slug',
    'Name',
    'Last Analysis Slug',
    'Last Analysis Date',
    'Last Analysis URL',
  ]);

  // FETCHING API
  var queryParams = [];
  if (nbProjects) {
    queryParams.push('size=' + nbProjects);
  }
  
  var qs = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
  var url = 'https://api.botify.com/v1/projects/' + username + qs;
  var options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Token ' + apiToken,
      'Content-type': 'application/json',
      'X-Botify-Client': 'google-sheets',
    },
  };

  var response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());

  if(response.error) {
    throw new Error('ERROR ' + response.error.message);
  }

  // APPEND ROW RESULTS
  var projects = response.results;
  projects.forEach(function(project) {
    var lastAnalysis = project.last_analysis.name;
    result.push([
      project.slug,
      project.name,
      project.last_analysis.name,
      project.last_analysis.name ? project.last_analysis.name.slice(0, 4) + '/' + project.last_analysis.name.slice(4, 6) + '/' + project.last_analysis.name.slice(6, 8) : '',
      project.last_analysis.url,
    ]);
  });

  return result;
}
