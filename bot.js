var HTTPS = require('https');
var HTTP = require('http');


//************************** GLOBAL VARIABLES*********************************
// Add variables in the hosting service to allow access to the following keys
// The Groupme bot that is running this application
var botID = process.env.GROUPME_BOT_ID;

var groupmeToken = process.env.MY_GROUPME_TOKEN;

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
var gitCommit = '/commit';
var wolframCommand = '/wolf';
var clearCommand = '/clear';
var allCommand = '/all';
var mitchEasterEgg = '/mitch';
var margEasterEgg = 'margs';

// Array of different butler statements
var butlerJokes =   ['You rang sir?',
                     'Those who choose to be servants know the most about being free.',
                     'Am I really the only servant here?',
                     'You can\'t unfry an egg, sir.',
                     'Who employs butlers anymore?',
                     'I see nothing, I hear nothing, I only serve.',
                     'Good evening, Colonel. Can I give you a lift?',
                     'You are not authorized to access this area.',
                     'As far as I\'m concerned, \'whom\' is a word that was invented to make everyone sound like a butler.',
                     'Ah, the patter of little feet around the house. There\'s nothing like having a midget for a butler.',
                     'Wives in their husbands\' absences grow subtler, And daughters sometimes run off with the butler.',
                     'I think I\'d take a human butler over a robot one.',
                     'I went back-to-back from \'AI\' to \'Butler,\' literally with no break.',
                     'I\'m simply one hell of a butler.',
                     'It was no time for mercy, it was time to terminate with extreme prejudice.',
                     'The thing about a diversion is that it has to be diverting.',
                     'Jenkins, of course, is a gentleman’s gentlemen, not a butler, but if the call comes, he can buttle with the best of them.',
                     'There are few greater pleasures in life than a devoted butler.',
                     'A good butler should save his employer\'s life at least once a day.',
                     'Never pass up new experiences, they enrich the mind.',
                     'No one is a hero to their butler.',
                     'Very good, Sir',
                     'That\'s the sort of special touch that a butler always adds'];

// Help message for bot usage
var helpMessage = 'Usage instructions for your Butler:\n\
  "/help"     Posts this help message.\n\
  "/all"      Tags all members of the chat.\n\
  "/giphy"   Posts a relevant Gif.\n\
  "/xkcd"    Finds a relevant XKCD comic.\n\
  "/clear"   Clears the chat history.\n\
  "/lmgtfy" Posts dumb question response.\n\
  "/wolf"    Finds Answer on Wolfram Alpha.\n\
  "/commit" Posts a random git commit.\n\
  "/reddit" *BETA* Posts related\n                      Reddit comment.';

// Posts a really bad image that can't be removed, ignore this value with Giphy
var bannedHalal = 'halal';

// Confused Nick Young Face Image
var confusedNickYoung = 'https://i.kym-cdn.com/entries/icons/mobile/000/018/489/nick-young-confused-face-300x256-nqlyaa.jpg';

// Mitch face
var mitchFace = 'https://i.imgur.com/0HirwrK.jpg';

// Margarita image
var margaritaImage = 'https://i.imgur.com/4SbhSbY.jpeg';

//************************** Methods *****************************************
// Main function that parses input from Groupme users
function parse() {
  var request = JSON.parse(this.req.chunks[0])
  var command = ''

  // Prep the response buffer.
  this.res.writeHead(200);

  // Post Confused Nick Young if anyone says 'wut' in the chat
  if (request.text.toLowerCase().includes('wut')) {
    postMessage(confusedNickYoung);
  }

  // Post Mitch if anyone says 'mitch' in the chat
  if (request.text.toLowerCase().includes('mitch')) {
    postMessage(mitchFace);
  }

  // Post margarita meme if anyone mentions margs
  if (request.text.toLowerCase().includes('margs')) {
    postMessage(margaritaImage);
  }

  // Post Butler quote if anyone says 'jenkins' in the chat
  if (request.text.toLowerCase().includes('jenkin')) {
    postMessage(butlerJokes[Math.floor(Math.random() * butlerJokes.length)]);
  }

  // Verify there is text in the message (not an image or blank)
  else if (request.text){
    // Grab only first word of the request
    command = request.text.toLowerCase().replace(/ .*/,'');

    // Parse to find the proper function to reply with
    switch(command) {
      case helpCommand:
        postMessage(helpMessage);
        break;
      case lmgtfyCommand:
        if(request.text.length > lmgtfyCommand.length + 1){
          letMeGoogleThatForYou(request.text.substring(lmgtfyCommand.length + 1));
        }
        break;
      case giphyCommand:
        // Ensure an image was requested and not just the command
        if(request.text.length > giphyCommand.length + 1){
          searchGiphy(request.text.substring(giphyCommand.length + 1));
        }
        break;
      case xkcdCommand:
        // Ensure a comic was requested and not just a blank command
        if(request.text.length > xkcdCommand.length + 1){
          searchXKCD(request.text.substring(xkcdCommand.length + 1));
        }
        break;
      case wolframCommand:
        // Ensure a request was made and not just a blank command
        if(request.text.length > wolframCommand.length + 1){
          askWolfram(request.text.substring(wolframCommand.length + 1));
        }
        break;
      case clearCommand:
        // Buffer is returns 34 on Iphone XS Max
        postMessage(" \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nChat cleared.");
        break;
      case allCommand:
        atAll();
        break;
      case gitCommit:
        getGitCommit();
        break;
    }
  }

  // End the response.
  this.res.end();
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

// Get a random git commit from url
function getGitCommit() {
  options = {
    hostname: 'whatthecommit.com',
    path: '/index.txt'
  };

  var callback = function(response) {
    var str = '';

    response.on('data', function(chunk){
      str += chunk;
    });

    response.on('end', function(){
      postMessage(str);
    });
  }

  HTTP.request(options, callback).end();
}

// Tag all members of the chat
function atAll() {
  const request = require('superagent');
  var text = '{"message":{"source_guid":"';
  var attachments = '';
  var loci = '"loci":[';
  var loci_count = 0;
  var user_ids = '],"type":"mentions","user_ids":[';

  request.get('https://api.groupme.com/v3/groups/35310029?token=' + groupmeToken).then(res =>{
    const obj = JSON.parse(res.text);

    request.get('https://www.uuidgenerator.net/api/version4').then(res => {
      text = text + res.text.substring(0, res.text.length - 2) + '","text":"';

      // Get all the names in a list with @ symbol, also get all ID nums in same order
      for(var i = 0; i < obj.response.members.length; i++){
        loci = loci + '[' + loci_count + ',' + obj.response.members[i].nickname.length + '],';
        loci_count = loci_count + obj.response.members[i].nickname.length + 1;
        user_ids = user_ids + '"' + obj.response.members[i].user_id + '",';
        text = text + '@' + obj.response.members[i].name + ' ';
      }
      // Drop extra space
      text = text.substring(0, text.length - 1);

      // Add loci string and user ids plus ending to the text
      text = text + '","attachments":[{' + loci.substring(0, loci.length - 1) + user_ids.substring(0, user_ids.length - 1) + ']}]}}';

      // Parse into a JSON object
      var jsonPayload = JSON.parse(text);

      console.log('Using JSON payload: ' + jsonPayload);

      var options = {
        uri: 'https://api.groupme.com/v3/groups/35310029/messages?token=' + groupmeToken,
        method: 'POST',
        headers: {'content-type' : 'application/json'},
        json: jsonPayload
      };

      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200 || response.statusCode == 202) {
          console.log(body)
        }
      });
    });
  });
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


// Testing @all chat capabilities using postgres.
/*const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('SELECT user_id FROM user_db;', (err, res) => {
  var str = '[{"type":"mentions","user_ids":[';
  if (err) throw err;
  for (let row of res.rows) {
    // Return needs to be parsed and sent as objects with @name and user_id
    // should the name change.
    //"attachments":[{"type":"mentions","user_ids":["17152696"]}]
    str.concat('"' + row + '",');
  }
  // Drop last comma
  str = str.slice(0, -1);
  // Add final packaging
  str.concat(']}]');
  postMessage('@all', str)
  client.end();
});*/
