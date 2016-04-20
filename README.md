# Botify SDK for Google Sheets

This repository contains the file included in the Google Sheets Botify Library.


## Getting started with Google Sheets scripts

A very good guide to start with Google Sheets scripts can be found at
https://developers.google.com/apps-script/guides/sheets#get_started.
The following expects the reader to know these basics.


## Install

- Open a spreadsheet
- Click on Tools -> Script Editor
- Click on Resources -> Librairies
- Enter `M24CMoOKf-eA42UYRa2yd_ArEMJ_QsI0X` in the find a library field
- Click on Select
- On version dropdown, select the latest version.
- Click on Save
You are done


## Interface

### Get latest analyses
The function `BotifyAPI.fetchLastAnalyses` prints the latest analyses in a tab.

The following script displays the last 5 analyses in the tab `My analyses`.
```JS
var sheetName = 'My analyses';
var apiToken = '5200a30fb41f179e6dadab3b4e2d40f83a0a8ccd';
var username = 'adam_warlock';
var projectSlug = 'demo-project';
var nbAnalyses = 5;

BotifyAPI.fetchLastAnalyses(sheetName, apiToken, username, projectSlug, nbAnalyses);
```

### Aggregate Analysis URLs data;
The function `BotifyAPI.fetchUrlsAggs` performs an aggregation on URLs of a given analyses and prints result in a tab.

The following script compute compute the number of URLS and the average number of internal follow inlinks for compliant/not compliant active URLs. And display result in the tab 'Insights';
```JS
var sheetName = 'Insights';
var apiToken = '5200a30fb41f179e6dadab3b4e2d40f83a0a8ccd';
var username = 'adam_warlock';
var projectSlug = 'demo-project';
var analysisSlug = '20160308';
var request = {
  "aggs": [
    {
      "group_by": [
        "compliant.is_compliant"
      ],
      "metrics": [
        "count",
        {
          "avg": "inlinks_internal.nb.follow.unique"
        },
      ]
    }
  ],
  "filters": {
    "field": "visits.organic.google.nb",
    "predicate": "gt",
    "value": 0
  }
};

BotifyAPI.fetchUrlsAggs(sheetName, apiToken, username, projectSlug, analysisSlug, request);
```
