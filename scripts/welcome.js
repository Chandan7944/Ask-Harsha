const {Image} = require('dialogflow-fulfillment');

  module.exports = {
    welcome: function (agent) {
      if(agent['request_']['body']['originalDetectIntentRequest']['source']==='hangouts'){
        var name = agent['request_']['body']['originalDetectIntentRequest']['payload']['data']['event']['user']['displayName'];
        name = name.split(" ")[0]
        agent.add(`Hi ${name}, welcome to Ask Harshaa! ✋`)
        agent.add(new Image("https://media.tenor.com/images/acc4116372dcc4b342cb1a00ae657151/tenor.gif"));
        agent.add('I am a chatbot for cricket enthusiasts 🏏')
        agent.add('You can ask me for live match scores, upcoming matches for your favourite teams, head to head between players/teams or even cricket fun facts!')
        agent.add(`Bored? Let's test your cricketing brain🧠 by saying 'start quiz' `)
        agent.add('Go ahead, try something 😀')
      }
      else
        agent.add("Welcome to Ask Harshaa!")
    },
  };
