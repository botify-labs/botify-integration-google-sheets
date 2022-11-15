/**
 * Return the projects of a user
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {Number} nbProjects [Optional] Number of projects to get (default: 30)
 * @return {Array} The list of projects.
 * @customfunction
 */
function BOTIFY_USER_LIST_PROJECTS(apiToken, username, nbProjects) {
  // PARAMS CHECKING
  if (!apiToken) throw new Error("API Token is missing in parameters");
  if (!username) throw new Error("username is missing in parameters");
  if (typeof nbProjects === "undefined") nbProjects = 30;

  var result = [];

  // INSERT HEADERS
  result.push([
    'Slug',
    'Name',
  ]);

  // FETCHING API
  var queryParams = [];
  if (nbProjects) {
    queryParams.push('size=' + nbProjects);
  }

  var qs = queryParams.length > 0 ? ('?' + queryParams.join('&')) : '';
  var fetchProjectsUrl = 'https://api.botify.com/v1/profiles/' + username + '/projects'+ qs;
  var options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + apiToken,
      'Content-type': 'application/json',
      'X-Botify-Client': 'google-sheets',
    },
  };

  var response = JSON.parse(UrlFetchApp.fetch(fetchProjectsUrl, options).getContentText());

  if(!response.success) {
    throw new Error('ERROR ' + response.errors[0].message);
  }

  // APPEND ROW RESULTS
  var projects = response.data;
  projects.forEach(function(project) {
    result.push([
      project.slug,
      project.name,
    ]);
  });

  return result;
}
