var HTTPS = require('https');
var HTTP = require('http');


//************************** GLOBAL VARIABLES*********************************
// Add variables in the hosting service to allow access to the following keys
// The Groupme bot that is running this application
var botID = process.env.GROUPME_BOT_ID;

// API key for Giphy
var apiKey = process.env.GIPHY_API_KEY;

// API key for Wolfram Alpha
var wolfApiKey = process.env.WOLFRAM_APP_ID;



//************************** Methods *****************************************
// Main function that parses input from Groupme users
function respond() {

  // Accepted commands by the bot
  var request = JSON.parse(this.req.chunks[0]),
    helpCommand = '/help',
    giphyCommand = '/giphy',
    lmgtfyCommand = '/lmgtfy',
    xkcdCommand = '/xkcd',
    wolframCommand = '/wolf',
    // Posts a really bad image that can't be removed, ignore this value with Giphy
    bannedHalal = 'halal';

  // Do nothing if there is no text
  /*if(!(request.text)){
    // Do nothing if there is no text
    this.res.writeHead(200);
    this.res.end();*/

  // Print the usage instructions for the Jenkins Butler
  if(request.text && request.text.substring(0, helpCommand.length) === helpCommand){
    this.res.writeHead(200);
    postMessage('Usage instructions for your Butler:\n\
      "/help"     Posts this help message.\n\
      "/giphy"   Posts a relevant Gif.\n\
      "/xkcd"     Finds a relevant XKCD comic.\n\
      "/lmgtfy" Posts the answer to\n                      stupid questions.\n\
      "/wolf"    Finds Answer on\n                              Wolfram Alpha.\n\
      "/reddit" *BETA* Posts related\n                      Reddit comment.');
    this.res.end();

  // Provides a Let Me Google That For You link to the requested query
  } else if(request.text && request.text.length > lmgtfyCommand.length &&
      request.text.substring(0, lmgtfyCommand.length) === lmgtfyCommand){
    this.res.writeHead(200);
    letMeGoogleThatForYou(request.text.substring(lmgtfyCommand.length + 1));
    this.res.end();

  // Searches and responds with proper Giphy gif for provided query
  } else if(request.text && request.text.length > giphyCommand.length &&
     request.text.toLowerCase().substring(giphyCommand.length + 1).includes('halal') == 0 &&
     request.text.substring(0, giphyCommand.length) === giphyCommand){
    this.res.writeHead(200);
    searchGiphy(request.text.substring(giphyCommand.length + 1));
    this.res.end();

  // Searches for a relevant XKCD comic to provided query
  } else if(request.text && request.text.length > xkcdCommand.length &&
      request.text.substring(0, xkcdCommand.length) === xkcdCommand){
    this.res.writeHead(200);
    searchXKCD(request.text.substring(xkcdCommand.length + 1));
    this.res.end();

  // Searches Wolfram Alpha and returns the answer to a question
  } else if(request.text &&
      request.text.length > wolframCommand.length &&
      request.text.toLowerCase().substring(1, wolframCommand.length).includes('wolf') === true &&
      request.text.substring(0, wolframCommand.length) === wolframCommand){
    this.res.writeHead(200);
    askWolfram(request.text.substring(wolframCommand.length + 1));
    this.res.end()

// Do nothing
  } else {
    this.res.writeHead(200);
    this.res.end();
  }
}

// Query Wolfram API for answer to a question
function askWolfram(query) {
  const fetch = require("node-fetch");
  var url = 'http://http://api.wolframalpha.com/v1/result?appid=' + wolfApiKey + '&i=' + encodeQuery(query);

  options = {
    hostname: 'api.wolframalpha.com',
    path: '/v1/result?appid=' + wolfApiKey + '&i=' + encodeQuery(query)
  };

  var data = '';
  var wolfRequest = HTTPS.request(options, function(res) {
    res.on('data', function (chunk) {
        data += chunk;
    });
    res.on('end', function () {
        console.log(data);
    });
  });
  wolfRequest.end();
  postMessage(data);
}

// Query Giphy API for a gif
function searchGiphy(giphyToSearch) {
  var options = {
    host: 'api.giphy.com',
    path: '/v1/gifs/search?q=' + encodeQuery(giphyToSearch) + '&api_key=' + apiKey
  };

  var callback = function(response) {
    var str = '';

    response.on('data', function(chunk){
      str += chunk;
    });

    response.on('end', function() {
      if (!(str && JSON.parse(str).data[0])) {
        postMessage('Couldn\'t find a gif 💩');
      } else {
        var id = JSON.parse(str).data[0].id;
        var giphyURL = 'http://i.giphy.com/' + id + '.gif';
        postMessage(giphyURL);
      }
    });
  };
  HTTP.request(options, callback).end();
}

// Query RelevantXKCD to get a comic
function searchXKCD(query) {
  var xkcdRelatedUrl = 'https://relevantxkcd.appspot.com/process?action=xkcd&query=' + encodeQuery(query);
  const request = require('superagent');

  request.get(xkcdRelatedUrl)
    .then(res => res.text.split(' ').slice(3)[0].trim())
    .then(res => {
      n = res.lastIndexOf('/');
      res = res.substring(n + 1);
      postMessage('https://imgs.xkcd.com/comics/' + res);
    })
    .catch(err => postMessage('Could not find a relevant xkcd'));
}

// Create a sassy response (URL) to a dumb question
function letMeGoogleThatForYou(textToGoogle) {
  var lmgtfyURL = 'http://lmgtfy.com/?q=' + encodeQuery(textToGoogle);
  postMessage(lmgtfyURL);
}

// Removes spaces and replaces them with '+'' marks
function encodeQuery(query) {
  return query.replace(/\s/g, '+');
}

// Post message to the Groupme chat
function postMessage(message) {
  var botResponse, options, body, botReq;

  botResponse = message;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        console.log('202 response');
      } else {
        console.log('rejecting bad status code from groupme:' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

exports.respond = respond;
