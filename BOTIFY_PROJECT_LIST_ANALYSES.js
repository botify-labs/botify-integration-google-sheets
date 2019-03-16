/**
 * Return the latest analyses of a given project.
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug
 * @param {Number} nbAnalyses [Optional] Number of analyses to get (default: 20)
 * @param {Boolean} onlySuccess [Optional] List only successfully finished analyses (default: true)
 * @return {Array} The list of analyses.
 * @customfunction
 */
function BOTIFY_PROJECT_LIST_ANALYSES(
  username,
  projectSlug,
  nbAnalyses,
  onlySuccess
) {
  var apiToken = getTokenFromProperties();
  // Support old token format
  // Old signature was BOTIFY_PROJECT_LIST_ANALYSES(apiToken, username, projectSlug, (nbAnalyses), (onlySuccess))
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
    projectSlug = arguments[2];
    nbAnalyses = arguments[3];
    onlySuccess = arguments[4];
  }

  // PARAMS CHECKING
  if (!apiToken)
    throw new Error(
      "API Token is missing in the Addon configuration. Click on the Botify Addon item in the menu to add your token."
    );
  if (!username) throw new Error("username is missing in parameters");
  if (!projectSlug) throw new Error("projectSlug is missing in parameters");
  if (typeof nbAnalyses === "undefined") nbAnalyses = 20;
  if (typeof onlySuccess === "undefined") onlySuccess = true;

  var result = [];

  // INSERT HEADERS
  result.push(["slug", "name", "status", "nbUrls", "report url"]);

  // FETCHING API
  var queryParams = [];
  if (nbAnalyses) {
    queryParams.push("size=" + nbAnalyses);
  }
  if (onlySuccess) {
    queryParams.push("only_success=true");
  }

  var qs = queryParams.length > 0 ? "?" + queryParams.join("&") : "";
  var url =
    "https://api.botify.com/v1/analyses/" + username + "/" + projectSlug + qs;
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
  var analyses = response.results;
  analyses.forEach(function(analysis) {
    result.push([
      analysis.slug,
      analysis.name,
      analysis.status,
      analysis.urls_done,
      analysis.url
    ]);
  });

  return result;
}
