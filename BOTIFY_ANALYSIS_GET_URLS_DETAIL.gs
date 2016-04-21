/**
 * Return the requested fields of a given URL
 * @param {String} apiToken Botify API token
 * @param {String} username Username of the project owner
 * @param {String} projectSlug Project's slug of the analysis
 * @param {String} analysisSlug Analysis's slug
 * @param {Range} urls Urls to get detail on
 * @param {Range} fields Range of fields to fetch (ex A1:A4)
 * @param {Boolean} showHeaders Show Groups and Metrics headers (default to true)
 * @return {Array} The value of the fields
 * @customfunction
 */
function BOTIFY_ANALYSIS_GET_URLS_DETAIL(apiToken, username, projectSlug, analysisSlug, urls, fields, showHeaders) {
  var result = [];

  // PREPARE INPUTS
  if (fields.map) { // fields is a range (only a range row is supported)
    fields = fields[0].filter(function (v) { return !!v }); // remove empty fields
  }
  if (urls.map) { // urls is a range (only a range column is supported)
    var tempUrls = [];
    for (var i = 0; i < urls.length; i++) {
      if (urls[i][0]) {
        tempUrls.push(urls[i][0])
      }
    }
    urls = tempUrls;
  } else { // urls is a single cell
    urls = [urls];
  }

  if (typeof showHeaders === "undefined") {
    showHeaders = true;
  }

  // INSERT HEADERS
  if (showHeaders) {
    result.push(fields);
  }

  // FETCHING API
  var chunks = chunkArray(urls, 100);

  for (var i = 0; i < chunks.length; i++) {
    var apiurl = 'http://api.staging.botify.com/v1/analyses/' + username + '/' + projectSlug + '/' + analysisSlug + '/urls';
    var options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Token ' + apiToken,
        'Content-type': 'application/json',
      },
      'payload': JSON.stringify({
        'fields': fields.concat('url'),
        'filters': {
          'or': chunks[i].map(function (url) {
            return {
              'field': 'url',
              'value': url
            };
          })
        }
      })
    };

    var response = JSON.parse(UrlFetchApp.fetch(apiurl, options).getContentText()).results;

    for (var j = 0; j < chunks[i].length; j++) {
      var url = chunks[i][j];

      // Find item (because results are not returned in the order we asked)
      var item;
      for (var k = 0; k < response.length; k++) {
        if (response[k].url === url) {
          item = response[k];
          break;
        }
      }
      
      // Get requested fields
      var row = [];
      fields.forEach(function(field) {
        if (item) {
          var val = get(item, field);
          if (Array.isArray(val)) val = val[0]; // If multiple field, display only first item
          row.push(val);
        } else { // No result for the given URL
          row.push('NOT FOUND');
        }
      });
      result.push(row);
    }
 
    if (i !== 0 && i % 5 === 0) { // Sleep to handle rate limit
      Utilities.sleep(1000);
    }
  }

  return result;
}

function get(obj, path){
  path = path.split('.');
  for (var i = 0; i < path.length; i++){
    obj = obj[path[i]];
  };
  return obj;
};

function chunkArray(array, size) {
  var chunks = [];
  for (var i = 0; i < array.length; i++) {
    var idx = Math.floor(i/size);
    if (!chunks[idx]) {
      chunks[idx] = [];
    }
    chunks[idx].push(array[i]);
  }
  return chunks;
}
