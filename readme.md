# The Command Butler for Groupme

This is a bot that adds the functionality for several different commands to a Groupme chat that reflect similar commands from Slack.

After deployment, users can just message a group on Groupme a command in the format `/<command>` and the bot will respond appropriately. The available instructions can be seen in the list below:

Command            | Response
----------------   | -------------
`/help`            | Posts the command list and short tutorial for the bot's usage.
`/giphy <topic>`   | Finds and displays a relevant gif to the provided topic.
`/lmgtfy <topic>`  | Posts a sarcastic reply to a question.
`/xkcd <topic>`    | Finds a related XKCD comic.
`/wolf <question>` | Searches Wolfram Alpha for the solution to a question.
`/jenkins`         | Responds with a witty Butler line.
`/clear`           | Clears the chat of visible messages.
`/reddit` <topic>  | *BETA* Finds a related reddit post or comment.
`/all`             | *BETA* Tags all members of the chat.


## Deployment
You will need to provide a Groupme Bot ID as an environment variable. This can be generated from https://dev.groupme.com. You will also need a Giphy API key as well as a Wolfram App key to allow these two functions to work normally.

### Easter Eggs
If anyone posts the word `wut` in the chat a static response image will be posted.
