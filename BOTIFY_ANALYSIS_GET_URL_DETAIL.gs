/**
 * Return the requested fields of a given URL
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {String} url Url to get detail on
 * @param {Range}  Range of fields to fetch (ex A1:A4)
 * @param {Boolean} showHeaders Show Groups and Metrics headers (default to true)
 * @return {Array} The value of the fields
 * @customfunction
 */
function BOTIFY_ANALYSIS_GET_URL_DETAIL(apiToken, username, projectSlug, analysisSlug, url, fields, showHeaders) {
  var result = [];

  fields = fields[0].filter(function (v) { return !!v });

  if (typeof showHeaders === "undefined") {
    showHeaders = true;
  }

  // INSERT HEADERS
  if (showHeaders) {
    result.push(fields);
  }

  // FETCHING API
  url = encodeURIComponent(url);
  var apiurl = 'https://api.botify.com/v1/analyses/' + username + '/' + projectSlug + '/' + analysisSlug + '/urls/' + url;
  apiurl += '?fields=' + fields.join(',');
  var options = {
    'method': 'get',
    'headers': {
      'Authorization': 'Token ' + apiToken,
      'Content-type': 'application/json',
    },
  };

  var lock = LockService.getScriptLock();
  lock.waitLock(60000);  // LOCK wait for up to 1min other processes to finish.

  var response = JSON.parse(UrlFetchApp.fetch(apiurl, options).getContentText());

  lock.releaseLock(); // UNLOCK

  if(response.error) {
    throw new Error('ERROR ' + response.error.message);
  }

  // APPEND ROW RESULTS
  var row = [];
  fields.forEach(function(field) {
    var val = get(response, field);
    if (Array.isArray(val)) val = val[0];
    row.push(val);
  });
  result.push(row);

  return result;
}

function get(obj, path){
  path = path.split('.');
  for (var i = 0; i < path.length; i++){
    obj = obj[path[i]];
  };
  return obj;
};
