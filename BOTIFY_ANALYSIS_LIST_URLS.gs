/**
 * Return the requested fields of a given URL
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {BQLFilter} filter Filter of apply on urls
 * @param {Range} fields Range of fields to fetch (ex A1:A4)
 * @param {BQLSort} sort Sort of apply on urls
 * @param {Number} size Number of urls to retrieve (max: 1000, default 100)
 * @param {Number} page Number of urls to retrieve (default 1)
 * @param {Boolean} displayTotal Display the number of urls matching the filter
 * @return {Array} The value of the fields
 * @customfunction
 */
function BOTIFY_ANALYSIS_LIST_URLS(apiToken, username, projectSlug, analysisSlug, filter, fields, sort, size, page, displayTotal) {
  var result = [];

  // PREPARE INPUTS
  if (typeof filter === "undefined") {
    filter = {}; // no filter
  } else {
    filter = JSON.parse(filter);
  }

  if (fields.map) {
    fields = fields[0].filter(function (v) { return !!v }); // remove empty fields
  } else {
    fields = [fields];
  }

  if (typeof sort === "undefined") {
    sort = [];
  } else {
    sort = JSON.parse(sort);
  }
  
  if (typeof size === "undefined") {
    size = 100;
  }

  if (typeof page === "undefined") {
    page = 1;
  }

  if (typeof displayTotal === "undefined") {
    displayTotal = false;
  }

  // FETCHING API
  var apiurl = 'https://api.botify.com/v1/analyses/' + username + '/' + projectSlug + '/' + analysisSlug + '/urls?page=' + page + '&size=' + size;
  var options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Token ' + apiToken,
      'Content-type': 'application/json',
      'X-Botify-Client': "google-sheets",
    },
    'payload': JSON.stringify({
      'fields': fields,
      'filters': filter,
      'sort': sort,
    }),
  };

  var response = JSON.parse(UrlFetchApp.fetch(apiurl, options).getContentText());

  if (displayTotal) {
    result.push(['Total Urls', response.count]);
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

function get(obj, path){
  path = path.split('.');
  for (var i = 0; i < path.length; i++){
    obj = obj[path[i]];
    if (typeof obj === "undefined") {
      return null;
    }
  };
  return isObject(obj) ? JSON.stringify(obj) : obj;
};

function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}
