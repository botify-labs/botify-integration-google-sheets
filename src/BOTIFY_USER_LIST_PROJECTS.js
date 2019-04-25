/**
 * Return the projects of a user
 * @param {String} username Username of the project owner
 * @param {Number} nbProjects [Optional] Number of projects to get (default: 30)
 * @return {Array} The list of projects.
 * @customfunction
 */
function BOTIFY_USER_LIST_PROJECTS(username, nbProjects) {
  var apiToken = getTokenFromProperties();
  // Support old token format
  // Old signature was BOTIFY_USER_LIST_PROJECTS(apiToken, username, (nbProjects))
  if (
    // If the user has given a token as the first argument, then the format is the old signature
    isToken(arguments[0])
  ) {
    // Only override the token if not present
    if (!apiToken) {
      apiToken = arguments[0];
    }
    // Override parameters in any case so they are correct
    username = arguments[1];
    nbProjects = arguments[2];
  }

  // PARAMS CHECKING
  if (!apiToken)
    throw new Error(
      "API Token is missing in the Addon configuration. Click on the Botify Addon item in the menu to add your token."
    );
  if (!username) throw new Error("username is missing in parameters");
  if (typeof nbProjects === "undefined") nbProjects = 30;

  var result = [];

  // INSERT HEADERS
  result.push([
    "Slug",
    "Name",
    "Last Analysis Slug",
    "Last Analysis Date",
    "Last Analysis URL"
  ]);

  // FETCHING API
  var queryParams = [];
  if (nbProjects) {
    queryParams.push("size=" + nbProjects);
  }

  var qs = queryParams.length > 0 ? "?" + queryParams.join("&") : "";
  var url = "https://api.botify.com/v1/projects/" + username + qs;
  var options = {
    method: "get",
    headers: {
      Authorization: "Token " + apiToken,
      "Content-type": "application/json",
      "X-Botify-Client": "google-sheets"
    }
  };

  var response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());

  if (response.error) {
    throw new Error("ERROR " + response.error.message);
  }

  // APPEND ROW RESULTS
  var projects = response.results;
  projects.forEach(function(project) {
    var lastAnalysis = project.last_analysis.name;
    result.push([
      project.slug,
      project.name,
      project.last_analysis.name,
      project.last_analysis.name
        ? project.last_analysis.name.slice(0, 4) +
          "/" +
          project.last_analysis.name.slice(4, 6) +
          "/" +
          project.last_analysis.name.slice(6, 8)
        : "",
      project.last_analysis.url
    ]);
  });

  return result;
}
