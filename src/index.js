function getTokenFromProperties() {
  return PropertiesService.getUserProperties().getProperty("BOTIFY_API_TOKEN")
}

/**
 * Returns true if the provided argument seems to be an API token (40-digit hexadecimal string)
 * @param str
 */
function isToken(str) {
  return /^[0-9a-fA-F]{40}$/.test(str)
}

function init() {
  SpreadsheetApp.getUi()
    .createMenu("Botify Addon")
    .addItem("Edit authentication        ", "promptForApiToken")
    .addToUi()

  var token = getTokenFromProperties()
  if (!token) {
    promptForApiToken()
  }
}

function onOpen() {
  init()
}

function onInstall() {
  init()
}

function promptForApiToken() {
  var ui = SpreadsheetApp.getUi()

  var token = getTokenFromProperties()
  var message = !!token
    ? 'Your current token: "' +
    token +
    '"\r\n\r\nChange your Botify API Token:\r\n\r\n'
    : "Your API token, which can be found in your Botify settings,\r\nallows Google Sheets to access your Botify data.\r\n\r\nPlease enter your Botify API Token:\r\n\r\n"
  var result = ui.prompt(
    "Botify Addon Authentication",
    message,
    ui.ButtonSet.OK_CANCEL
  )

  var button = result.getSelectedButton()
  var newToken = result.getResponseText()
  if (button === ui.Button.OK) {
    var properties = PropertiesService.getUserProperties()
    properties.setProperty("BOTIFY_API_TOKEN", newToken)
    if (!!newToken) {
      ui.alert(
        "Your Botify API Token (" +
        newToken +
        ") was correctly setup.\r\nYou may now fetch your Botify data with the Botify Google Sheets Addon."
      )
    } else {
      ui.alert("Your Botify API Token was removed.")
    }
  } else if (
    (button === ui.Button.CANCEL || button === ui.Button.CLOSE) &&
    !token
  ) {
    ui.alert(
      "You must input an API token for the Botify addon to fetch your data."
    )
  }
}

function extractRowKeys(resultGroup) {
  var rowId = []
  resultGroup.key.forEach(function (key) {
    if (typeof key.from !== "undefined" || typeof key.to !== "undefined") {
      // Range group key
      if (typeof key.from === "undefined") {
        rowId.push("< " + key.to)
      } else if (typeof key.to === "undefined") {
        rowId.push(">= " + key.from)
      } else {
        rowId.push(key.from + " to " + key.to)
      }
    } else {
      // Simple group key
      rowId.push(key)
    }
  })
  return rowId
}
