const { Card, Image, Payload } = require('dialogflow-fulfillment');
const { HandCricketClass } = require('./HandCricketClass')
const fs=require('fs')

var handCricketObj = null;
var rawData=fs.readFileSync('commentary.json');
var data=JSON.parse(rawData);
let userName = 'You'
const botName = 'Bot Harsha'

const instructions = [
  "๐ข๐ณ๐ณ๐ถ๐ฐ๐ถ๐ฎ๐น ๐ฅ๐๐น๐ฒ๐ ๐ข๐ณ ๐๐ฎ๐ป๐ฑ ๐๐ฟ๐ถ๐ฐ๐ธ๐ฒ๐ ๐",
  "1. The player has to type any number between 1 and 6 ๐, once the player enters, Bot Harsha will choose a number.",
  "2. If both the numbers are equal, the batsman is out. โ",
  "3. If the numbers do not match, the number chosen by the batsman is the number of runs scored ๐",
  "4. Type 'Exit' or 'Quit' to leave the game. ๐ฅ"
]
                    
module.exports = {

  clearContexts: function(agent){
    agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
    agent.context.set({'name': 'toss-followup', 'lifespan': 0});
    agent.add("Now the game of legendsโฆ That we played for hours in our school life is made real ๐ฅณ. It's time for the toss: ๐ข๐ฑ๐ฑ or ๐๐๐ฒ๐ป?")
  },

  //Method to determine the toss decision.
  tossDecision: function(agent){

    var number = agent.parameters.playerChoice; //Number entered by player.
    
    //Invalid user input
    if(number > 6 || number < 1 || (Number(number) === number && number % 1 !== 0)) {
      agent.add('Please enter a number between (1-6)')
      return
    }

    var choice =  agent['contexts'][0]['parameters']['toss']; //Odd or Even.
    var randomNumber = Math.floor(Math.random()*6)+1
    var decision = ((randomNumber+number)%2 == 0)? 'Even' : 'Odd';
    
    agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+botName+' choose number '+randomNumber+'.')
    if(decision.localeCompare(choice) == 0){
      agent.add('You have won the toss. What do you choose: ๐ฏ๐ฎ๐๐๐ถ๐ป๐ด or ๐ฏ๐ผ๐๐น๐ถ๐ป๐ด?')
      agent.context.set({'name': 'BattingOrBowling', 'lifespan': 2});
    }
    else {
      var botDecision = Math.floor(Math.random()*1.9)
      var temp

      if(botDecision == 0) {
        handCricketObj = new HandCricketClass('Lost', 'Bowling');
        temp = ' bat. ๐'
      }
      else {
        handCricketObj = new HandCricketClass('Lost', 'Batting');
        temp = ' bowl. โพ'
      }

      agent.add(botName+' has won the toss and choose to'+temp);
      agent.context.set({'name': 'HandCricketGame', 'lifespan': 2});

      for(var i in instructions) {
        agent.add(instructions[i])
      }
    
      agent.add("Let the game begin. May the odds be ever in your favour.")
      agent.add('Please enter a number between(1-6)')
    }
  },

  //Method that asks user for his choice(batting/bowling)
  battingOrBowling: function(agent){

    agent.context.set({'name': 'Toss-followup', 'lifespan': 0});
    var type = agent.parameters.type
    var decision = type.localeCompare('bowling') == 0? 'Bowling' : 'Batting';
    
    handCricketObj = new HandCricketClass('Won', decision);
    var temp = type.localeCompare('bowling') == 0? 'bowl first. โพ' : 'bat first. ๐'
    
    agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: You choose to '+temp)

    for(var i in instructions) {
      agent.add(instructions[i])
    }

    agent.add("Let the game begin. May the odds be ever in your favour.")
    agent.add('๐ฃ๐น๐ฒ๐ฎ๐๐ฒ ๐ฒ๐ป๐๐ฒ๐ฟ ๐ฎ ๐ป๐๐บ๐ฏ๐ฒ๐ฟ ๐ฏ๐ฒ๐๐๐ฒ๐ฒ๐ป(๐ญ-๐ฒ)')
  },

  //Actual game
  handCricketGame: function(agent){

    userName = agent['request_']['body']['originalDetectIntentRequest']['payload']['data']['event']['user']['displayName'].split(" ")[0];
    
    var userChoice = agent.parameters.number
    var botChoice = Math.floor(Math.random()*6) + 1

    if(userChoice > 6 || userChoice < 1 || (Number(userChoice) === userChoice && userChoice % 1 !== 0)) {
      agent.add('Please enter a number between (1-6)')
      return
    }

    if( userChoice === botChoice) {
      //Condition for when user gets out at first innings.
      if(handCricketObj.getInnings() == 1) {
        
        var bowler = (handCricketObj.getChoice().localeCompare('Batting') == 0)? botName : userName
    
        agent.add(new Image(data['gifs']['wickets'][Math.floor(Math.random()*(Object.keys(data['gifs']['wickets']).length))]));
        agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+ data['commentary']['wicket'][Math.floor(Math.random()*(Object.keys(data['commentary']['wicket']).length))] )
        agent.add('Its the end of the first innings. And '+bowler+' needs '+(handCricketObj.getTarget()+1)+' runs to win.');
        agent.add('Please enter a number between 1-6 to start the second innings.');
        
        handCricketObj.setInnings(2);
        handCricketObj.setScore(0)
        handCricketObj.setNumberOfBalls(0)
      }
      //Condition for when user gets out in the second innings.
      else {
        if(handCricketObj.getChoice().localeCompare('Batting') == 0){
          
          //Draw condition
          if(handCricketObj.getScore() == handCricketObj.getTarget()) {

            agent.add(new Image(data['gifs']['wickets'][Math.floor(Math.random()*(Object.keys(data['gifs']['wickets']).length))]));
            agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+data['commentary']['wicket'][Math.floor(Math.random()*(Object.keys(data['commentary']['wicket']).length))] )
            agent.add('Its a tie..')
            agent.add('Opener: '+userName+'       Target: '+(handCricketObj.getTarget()+1))
            agent.add('Chaser: '+botName+'       Score: '+(handCricketObj.getScore()))
            agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
            return;
          }

          agent.add(new Image(data['gifs']['celebration'][Math.floor(Math.random()*(Object.keys(data['gifs']['celebration']).length))]))
          agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+data['commentary']['win'][Math.floor(Math.random()*(Object.keys(data['commentary']['win']).length))])
          agent.add(userName+' have won the game by '+(handCricketObj.getTarget()-handCricketObj.getScore())+' runs ๐')
          agent.add('Opener: '+userName+'       Target: '+(handCricketObj.getTarget()+1))
          agent.add('Chaser: '+botName+'       Score: '+(handCricketObj.getScore()))
          agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
        }
        else {
          //Draw condition
          if(handCricketObj.getScore() == handCricketObj.getTarget()) {

            agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+fetchCommentary(userChoice))
            agent.add(new Image(data['gifs']['wickets'][Math.floor(Math.random()*(Object.keys(data['gifs']['wickets']).length))]));
            agent.add(data['commentary']['wicket'][Math.floor(Math.random()*(Object.keys(data['commentary']['wicket']).length))] )

            agent.add('Its a tie..')
            agent.add('Opener: '+botName+'       Target: '+(handCricketObj.getTarget()))
            agent.add('Chaser: '+userName+'       Score: '+(handCricketObj.getScore()))
            agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
            return;
          }
          
          agent.add(new Image(data['gifs']['lost'][Math.floor(Math.random()*(Object.keys(data['gifs']['lost']).length))]))
          agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+data['commentary']['win'][Math.floor(Math.random()*(Object.keys(data['commentary']['win']).length))])
          agent.add(botName+' has won the game by '+(handCricketObj.getTarget()-handCricketObj.getScore())+' runs.')
          agent.add('Opener: '+botName+'       Target: '+(handCricketObj.getTarget()))
          agent.add('Chaser: '+userName+'       Score: '+(handCricketObj.getScore()))
          agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
        }
      }
    }
    else {
      var commentary 
      var imgUrl
      if(handCricketObj.getInnings() == 1) {
        
        if(handCricketObj.getChoice().localeCompare('Batting') == 0) {
          handCricketObj.setScore(userChoice)
          imgUrl = (userChoice == 6)? data['gifs']['six'][Math.floor(Math.random()*(Object.keys(data['gifs']['six']).length))] : (userChoice == 4)? data['gifs']['four'][Math.floor(Math.random()*(Object.keys(data['gifs']['four']).length))] : ''
          commentary = fetchCommentary(userChoice)
        }
        else {
          handCricketObj.setScore(botChoice)
          imgUrl = (botChoice == 6)? data['gifs']['six'][Math.floor(Math.random()*(Object.keys(data['gifs']['six']).length))] : (botChoice == 4)? data['gifs']['four'][Math.floor(Math.random()*(Object.keys(data['gifs']['four']).length))] : ''
          commentary = fetchCommentary(botChoice)
        }

        var batting = (handCricketObj.getChoice().localeCompare('Batting') == 0)? userName : botName
        var text = commentary.length > 0? '๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+commentary+'.' : ''

        if(imgUrl.length > 0){
          agent.add(new Image(imgUrl))
        }
        agent.add(text)
      
        let json = {
          "hangouts": {
            "header": {
              "title": batting+': '+handCricketObj.getScore()+' ('+handCricketObj.getOvers()+')  Innings: ('+handCricketObj.getInnings()+')',
              "subtitle": botName+"'s choice: "+botChoice,
            }
          }
        };
        let payload = new Payload(
        'hangouts',
        json,
        { rawPayload: true, sendAsMessage: true}
        );
        agent.add(payload);
        // agent.add(batting+': '+handCricketObj.getScore()+' ('+handCricketObj.getOvers()+')  Innings: ('+handCricketObj.getInnings()+')')
        // agent.add(botName+"'s choice: "+botChoice)
      }
      else if(handCricketObj.getInnings() == 2) {
        
        var commentary
        var imgUrl
        
        if(handCricketObj.getChoice().localeCompare('Batting') == 0) {

          handCricketObj.setScore(botChoice)
          //Win condition
          if(handCricketObj.getScore() > handCricketObj.getTarget()) {
            
            agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+fetchCommentary(botChoice))
            agent.add(new Image(data['gifs']['lost'][Math.floor(Math.random()*(Object.keys(data['gifs']['lost']).length))]))
            agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+data['commentary']['win'][Math.floor(Math.random()*(Object.keys(data['commentary']['win']).length))])
            agent.add(botName+' has won the game.')
            agent.add('Opener: '+userName+'       Target: '+(handCricketObj.getTarget()+1))
            agent.add('Chaser: '+botName+'       Score: '+(handCricketObj.getScore()))

            agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
            return;
          }

          imgUrl = (botChoice == 6)? data['gifs']['six'][Math.floor(Math.random()*(Object.keys(data['gifs']['six']).length))] : (botChoice == 4)? data['gifs']['four'][Math.floor(Math.random()*(Object.keys(data['gifs']['four']).length))] : ''
          commentary = fetchCommentary(botChoice)
        }
        else {
          //Win condition
          handCricketObj.setScore(userChoice)
          if(handCricketObj.getScore() > handCricketObj.getTarget()) {
            
            agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+fetchCommentary(userChoice))
            agent.add(new Image(data['gifs']['celebration'][Math.floor(Math.random()*(Object.keys(data['gifs']['celebration']).length))]))
            agent.add('๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+data['commentary']['win'][Math.floor(Math.random()*(Object.keys(data['commentary']['win']).length))])
            agent.add('Yayyy,'+ userName +' have won the match. ๐')
            agent.add('Opener: '+botName+'       Target: '+(handCricketObj.getTarget()+1))
            agent.add('Chaser: '+userName+'       Score: '+(handCricketObj.getScore()))

            agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
            return;
          }

          imgUrl = (userChoice == 6)? data['gifs']['six'][Math.floor(Math.random()*(Object.keys(data['gifs']['six']).length))] : (userChoice == 4)? data['gifs']['four'][Math.floor(Math.random()*(Object.keys(data['gifs']['four']).length))] : ''
          commentary = fetchCommentary(userChoice)
        }
        
        var batting = (handCricketObj.getChoice().localeCompare('Batting') == 0)? botName : userName
        var text = commentary.length > 0? '๐๐ผ๐บ๐บ๐ฒ๐ป๐๐ฎ๐๐ผ๐ฟ: '+commentary+'.' : ''

        if(imgUrl.length > 0){
          agent.add(new Image(imgUrl))
        }
        agent.add(text)
      
        let json = {
          "hangouts": {
            "header": {
              "title": batting+': '+handCricketObj.getScore()+' ('+handCricketObj.getOvers()+') Innings: ('+handCricketObj.getInnings()+')',
              "subtitle": botName+"'s choice: "+botChoice+'.   Need '+(handCricketObj.getTarget() - handCricketObj.getScore() + 1)+' more to win.',
            }
          }
        };
        let payload = new Payload(
        'hangouts',
        json,
        { rawPayload: true, sendAsMessage: true}
        );
        agent.add(payload);
        // agent.add(batting+': '+handCricketObj.getScore()+' ('+handCricketObj.getOvers()+') Innings: ('+handCricketObj.getInnings()+')')
        // agent.add(botName+"'s choice: "+botChoice+'.   Need '+(handCricketObj.getTarget() - handCricketObj.getScore() + 1)+' more to win.')      
      }
    }
  },

  //Method to handle exit.
  exit: function(agent) {
    agent.context.set({'name': 'HandCricketGame', 'lifespan': 0});
    agent.add('Thanks for playing Hand Cricket. Come back soon.')
  }
}

function fetchCommentary(number) {

  var num
  var len

  num = number.toString();

  len = Object.keys(data['commentary'][num]).length
  return data['commentary'][num][Math.floor(Math.random()*len)]
}
