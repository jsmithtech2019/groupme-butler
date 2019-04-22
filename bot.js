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

// Collection of commands that Jenkins can be triggered on
// Longest command length is 7 characters
var helpCommand = '/help';
var giphyCommand = '/giphy';
var lmgtfyCommand = '/lmgtfy';
var xkcdCommand = '/xkcd';
var wolframCommand = '/wolf';
var jenkinsCommand = '/jenkins';
var clearCommand = '/clear';
var allCommand = '/all';

// Array of different butler statements
var butlerJokes = ['You rang sir?',
                     'Those who choose to be servants know the most about being free.',
                     'Am I really the only servant here?',
                     'You can\'t unfry an egg, sir.',
                     'Who employees butlers anymore?',
                     'I see nothing, I hear nothing, I only serve.',
                     'Good evening, Colonel. Can I give you a lift?',
                     'You are not authorized to access this area.'];

// Help message for bot usage
var helpMessage = 'Usage instructions for your Butler:\n\
  "/help"     Posts this help message.\n\
  "/giphy"   Posts a relevant Gif.\n\
  "/xkcd"    Finds a relevant XKCD comic.\n\
  "/clear"   Clears the chat history.\n\
  "/lmgtfy" Posts dumb question response.\n\
  "/wolf"    Finds Answer on Wolfram Alpha.\n\
  "/reddit" *BETA* Posts related\n                      Reddit comment.';

// Posts a really bad image that can't be removed, ignore this value with Giphy
var bannedHalal = 'halal';

// Confused Nick Young Face Image
var confusedNickYoung = 'https://i.kym-cdn.com/entries/icons/mobile/000/018/489/nick-young-confused-face-300x256-nqlyaa.jpg';

//************************** Methods *****************************************
// Main function that parses input from Groupme users
function parse() {
  var request = JSON.parse(this.req.chunks[0])
  var command = ''
  // Verify there is text in the message (not an image or blank)
  if (request.text){
    // Grab only first word of the request
    command = request.text.toLowerCase().replace(/ .*/,'');

    // Parse to find the proper function to reply with
    switch(command) {
      case helpCommand:
        this.res.writeHead(200);
        postMessage(helpMessage);
        this.res.end();
        break;
      case lmgtfyCommand:
        this.res.writeHead(200);
        letMeGoogleThatForYou(request.text.substring(lmgtfyCommand.length + 1))
        this.res.end();
        break;
      case giphyCommand:
        // Ensure an image was requested and not just the command
        if(request.text.length > giphyCommand.length + 1){
          this.res.writeHead(200);
          searchGiphy(request.text.substring(giphyCommand.length + 1));
          this.res.end();
        }
        break;
      case xkcdCommand:
        // Ensure a comic was requested and not just a blank command
        if(request.text.length > xkcdCommand.length + 1){
          this.res.writeHead(200);
          searchXKCD(request.text.substring(xkcdCommand.length + 1));
          this.res.end();
        }
        break;
      case wolframCommand:
        // Ensure a request was made and not just a blank command
        if(request.text.length > wolframCommand.length + 1){
          this.res.writeHead(200);
          askWolfram(request.text.substring(wolframCommand.length + 1));
          this.res.end();
        }
        break;
      case clearCommand:
        this.res.writeHead(200);
        // Buffer is returns 34 on Iphone XS Max
        postMessage(" \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nChat cleared.");
        this.res.end();
        break;
      case allCommand:
        // Not yet implemented, need a database of active user ID's up first
        break;
      case jenkinsCommand:
        this.res.writeHead(200);
        postMessage(butlerJokes[Math.floor(Math.random() * butlerJokes.length)]);
        this.res.end();
        break;
    }
  }

  // Post Confused Nick Young if anyone says 'wut' in the chat
  else if (request.text.toLowerCase().includes('wut')) {
    this.res.writeHead(200);
    postMessage(confusedNickYoung);
    this.res.end();
  }

  else {
    // Do nothing
    this.res.writeHead(200);
    this.res.end();
  }
}

// Query Giphy API for a gif
function searchGiphy(giphyToSearch) {
  var options = {
    host: 'api.giphy.com',
    path: '/v1/gifs/search?api_key=' + apiKey + '&q=' + encodeQuery(giphyToSearch)
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

// Query Wolfram API for answer to a question
function askWolfram(query) {
  // Replace '+' with 'plus' to avoid misreadings
  query = query.split('+').join('plus');

  options = {
    hostname: 'api.wolframalpha.com',
    path: '/v1/result?appid=' + wolfApiKey + '&i=' + encodeQuery(query)
  };

  var callback = function(response) {
    var str = '';

    response.on('data', function(chunk){
      str += chunk;
    });

    response.on('end', function() {
      postMessage(str);
    });
  }
  HTTP.request(options, callback).end();
}

// Create a sassy response (URL) to a dumb question
function letMeGoogleThatForYou(textToGoogle) {
  var lmgtfyURL = 'http://lmgtfy.com/?q=' + encodeQuery(textToGoogle);
  postMessage(lmgtfyURL);
}

// Generate random integer between 0 and input param
function random_int(max) {
  return Math.floor(Math.random() * (max - 0) + 0);
}

// Removes spaces and replaces them with '+'' marks
function encodeQuery(query) {
  return query.replace(/\s/g, '+');
}

// Post message to the Groupme chat
function postMessage(message) {
  var options, body, botReq, botResponse = message;

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

exports.parse = parse;