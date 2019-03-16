/**
 * Return the requested fields of a given URL
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {Range} fields Range of fields to fetch (ex A1:A4)
 * @param {BQLFilter} filter [Optional] Filter of apply on urls
 * @param {BQLSort} sort [Optional] Sort of apply on urls
 * @param {Number} size [Optional] Number of urls to retrieve (max: 1000, default: 100)
 * @param {Number} page [Optional] Number of urls to retrieve (default: 1)
 * @param {Boolean} displayTotal [Optional] Display the number of urls matching the filter (default: false)
 * @return {Array} The value of the fields
 * @customfunction
 */
function BOTIFY_ANALYSIS_LIST_URLS(
  username,
  projectSlug,
  analysisSlug,
  fields,
  filter,
  sort,
  size,
  page,
  displayTotal
) {
  var apiToken = getTokenFromProperties();
  // Support old token format
  // Old signature was BOTIFY_ANALYSIS_LIST_URLS(apiToken, username, projectSlug, analysisSlug, fields, (filter), (sort), (size), (page), (displayTotal))
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
    analysisSlug = arguments[3];
    fields = arguments[4];
    filter = arguments[5];
    sort = arguments[6];
    size = arguments[7];
    page = arguments[8];
    displayTotal = arguments[9];
  }

  // PARAMS CHECKING
  if (!apiToken)
    throw new Error(
      "API Token is missing in the Addon configuration. Click on the Botify Addon item in the menu to add your token."
    );
  if (!username) throw new Error("username is missing in parameters");
  if (!projectSlug) throw new Error("projectSlug is missing in parameters");
  if (!analysisSlug) throw new Error("analysisSlug is missing in parameters");
  if (!fields) throw new Error("fields list is missing in parameters");
  if (typeof filter === "undefined") filter = "{}";
  if (typeof sort === "undefined") sort = "[]";
  if (typeof size === "undefined") size = 100;
  if (typeof size > 1000)
    throw new Error("size parameter must be between 1 and 1000");
  if (typeof page === "undefined") page = 1;
  if (typeof displayTotal === "undefined") displayTotal = false;

  var result = [];

  // PREPARE INPUTS
  if (fields.map) {
    fields = fields[0].filter(function(v) {
      return !!v;
    }); // remove empty fields
  } else {
    fields = [fields];
  }
  filter = JSON.parse(filter);
  sort = JSON.parse(sort);

  // FETCHING API
  var apiurl =
    "https://api.botify.com/v1/analyses/" +
    username +
    "/" +
    projectSlug +
    "/" +
    analysisSlug +
    "/urls?page=" +
    page +
    "&size=" +
    size;
  var options = {
    method: "post",
    headers: {
      Authorization: "Token " + apiToken,
      "Content-type": "application/json",
      "X-Botify-Client": "google-sheets"
    },
    payload: JSON.stringify({
      fields: fields,
      filters: filter,
      sort: sort
    })
  };

  var response = JSON.parse(
    UrlFetchApp.fetch(apiurl, options).getContentText()
  );

  if (displayTotal) {
    result.push(["Total Urls", response.count]);
  }

  response.results.forEach(function(item) {
    // Get requested fields
    var row = [];
    fields.forEach(function(field) {
      var val = get(item, field);
      row.push(val);
    });
    result.push(row);
  });

  if (!result.length) return "No result";

  return result;
}

function get(obj, path) {
  path = path.split(".");
  for (var i = 0; i < path.length; i++) {
    obj = obj[path[i]];
    if (typeof obj === "undefined") {
      return null;
    }
  }
  return isObject(obj) ? JSON.stringify(obj) : obj;
}

function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
