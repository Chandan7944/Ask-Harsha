const { Client } = require('pg');
const fs = require('fs');
const { Suggestion, Card, Image } = require('dialogflow-fulfillment');

//Method to establish connection to db.
function connectToDB() {
    const client = new Client({
      user: 'askharsha',
      host: '34.93.210.170',
      database: 'askharsha',
      password: 'postgress',
      port: 5432,
    })
    client.connect();
    return client;
}
  

module.exports = {
    welcome: function(agent){

        agent.add('Welcome to the cricket Quiz!')
        agent.add('To answer a question, you have to choose or type one option among a, b, c')
        agent.add('You can end the quiz anytime by writing quit or exit')
        agent.add('type start to start the quiz.')
        agent.add(new Suggestion('start'))
        // agent.setFollowupEvent('quiz');

    },

    start: async function(agent){
        agent.add("loading ...")
        var total_questions = 0
        try{
            const query = "SELECT COUNT(*) FROM quizquestions;";
            const res = await queryDB(query);
            total_questions = res[0].count
            console.log("Total questions: ", total_questions);
            if(total_questions == 0){
                throw "No questions found!"
            }
            var indices = []
            for(var i=1;i<=total_questions;i++){
                indices.push(i)
            }
            indices.sort( ()=>Math.random()-0.5 );
            console.log("Indices: ", indices);
            agent.setFollowupEvent({'name': 'begin-quiz-event', 'parameters': {'question': indices, 'index': 0, 'score': 0, 'correct': -1}});
        }catch(err){
            console.log("Error while fetching questions from DB: ", err)
            agent.add("No questions found in the database!")
        }
    },
    question: async function(agent){
        const eventName = 'begin-quiz-event'
        for(var i=0;i<agent.contexts.length;i++){
            const element = agent.contexts[i]
            if(element.name == eventName){
                console.log("FOUND THE CONTEXT")
                const index = element.parameters.index
                console.log(element.parameters);
                const nextQuestion = parseInt(element.parameters.question[index])
                const prevQuestion = index-1 < 0? element.parameters.question.length+1: parseInt(element.parameters.question[index-1])
                const score = parseInt(element.parameters.score)
                const wasCorrect = parseInt(element.parameters.correct)
                const prevIdx = prevQuestion < nextQuestion? 0: 1;
                const nextIdx = prevQuestion < nextQuestion? 1: 0;
                query = `SELECT * FROM quizquestions WHERE question_no = ${prevQuestion} or question_no = ${nextQuestion} order by question_no;`;
                await queryDB(query).then(results => {
                    console.log(results);
                    console.log(`results size: ${results.length} and index: ${nextQuestion}`)
                    if(wasCorrect == 1){
                        agent.add("✔️ Correct Answer")
                        if(results[prevIdx].explanation != null)
                        agent.add("Explanation: " + results[prevIdx].explanation)
                    }
                    else if(wasCorrect == 0){
                        agent.add("❌ Wrong, the correct ans is: " +  results[prevIdx]['option'+results[prevIdx].ans])
                        if(results[prevIdx].explanation != null)
                            agent.add("Explanation: " + results[prevIdx].explanation)
                    }
                    else if(wasCorrect == 2)
                        agent.add("⚠️ Invalid Option, Please Select again!")
                    if(index >= element.parameters.question.length){
                        agent.add("Quiz completed")
                        agent.setFollowupEvent({'name': 'quiz-exit', 'parameters': {'score': score, 'total_questions': index}});
                    }else{
                        var card = new Card({
                            title: `Question ${index+1}`,
                            // text: results[nextQuestion].question,
                            imageUrl: results[nextIdx].image,
                        });
                        agent.add(card)
                        agent.add(results[nextIdx].question);
                        agent.add("a. " + results[nextIdx].option1)
                        agent.add("b. " + results[nextIdx].option2)
                        agent.add("c. " + results[nextIdx].option3)
                        agent.add(new Suggestion('a'))
                        agent.add(new Suggestion('b'))
                        agent.add(new Suggestion('c'))
                        agent.add(new Suggestion('Exit'))
                    }
                }).catch(err => {
                    console.log("ERROR OCCURRED: ", err)
                    agent.add("Couldn't find Questions")
                })
                break
            }
        }
    },

    checkAns: async function(agent){
        console.log("Check Ans called..")
        const eventName = 'begin-quiz-event'
        const userParameter = 'quiz-start-followup'
        for(var i=0;i<agent.contexts.length;i++){
            const element = agent.contexts[i]
            if(element.name == eventName){
                const index = parseInt(element.parameters.index)
                const questionNo = parseInt(element.parameters.question[index])
                const score = parseInt(element.parameters.score)
                var userOption = 'option', userRes
                for(var j=0;j<agent.contexts.length;j++){
                    const contextName = agent.contexts[j].name
                    if(contextName == userParameter){
                        userRes = agent.contexts[j].parameters.options
                        console.log("USER OPTION : ", userRes)
                        if(userRes == 'exit'){
                            console.log("CALLING QUIZ-EXIT");
                            agent.add("EXITING...")
                            agent.setFollowupEvent({'name': 'quiz-exit', 'parameters': {'score': score, 'total_questions': index}})
                            return
                        }
                        else if(userRes <= 3 && userRes >= 1){
                            userOption += userRes
                            break
                        }else{
                            console.log("User Selected the invalid option: ", userRes)
                            agent.add("INVALID OPTION")
                            agent.setFollowupEvent({'name': eventName, 'parameters': {'question': element.parameters.question, 
                            'index': element.parameters.index, 'score': element.parameters.score, 'correct': 2}})
                            return
                        }
                    }
                }
                console.log("User answered: ", userOption)
                const query = `SELECT * FROM quizquestions WHERE question_no = ${questionNo}`;
                await queryDB(query).then(res => {
                    console.log("ANS? ",res);
                    agent.add("Checking ans...")
                    const ans = res[0]['option'+res[0].ans]
                    const userAns = res[0][userOption]
                    if(ans == userAns){
                        agent.setFollowupEvent({'name': eventName, 'parameters': {'question': element.parameters.question,
                        'index': element.parameters.index+1, 'score': score+1, 'correct': 1}})
                        console.log("User ans correct")
                    }
                    else{
                        agent.setFollowupEvent({'name': eventName, 'parameters': {'question': element.parameters.question,
                        'index': element.parameters.index+1, 'score': score, 'correct': 0}})
                        console.log("User answered: ", userAns)
                        console.log("but actual ans is: ", ans)
                    }
                })
                console.log("Ans Checked")
                break
            }
        }
    },

    repeatQuestion: async function(agent){
        console.log("Fall back Intent called...");
        agent.add("Invalid option selected")
        const eventName = 'begin-quiz-event'
        for(var i=0;i<agent.contexts.length;i++){
            const element = agent.contexts[i]
            if(element.name == eventName){
                agent.setFollowupEvent({'name': eventName, 'parameters': {'question': element.parameters.question, 
                'index': element.parameters.index, 'score': element.parameters.score, 'correct': 2}})
                break
            }
        }
    },

    exit: async function(agent){
        console.log("EXITING QUIZ...")
        var playerEmail = 'na@na.com'
        if(agent['request_']['body']['originalDetectIntentRequest']['source']==='hangouts'){
            console.log(agent['request_']['body']['originalDetectIntentRequest']['payload']['data']['event']['user']);
            playerEmail = agent['request_']['body']['originalDetectIntentRequest']['payload']['data']['event']['user']['email'];
        }
        const event = 'quiz-exit'
        for(var i=0;i<agent.contexts.length;i++){
            const element = agent.contexts[i]
            if(element.name == event){
                await addOrUpdateUser(agent, playerEmail, element.parameters.score)
                const queryFindRank = "SELECT * FROM scoreboard ORDER BY score DESC"
                const res = await queryDB(queryFindRank)
                const rank = findRank(res , element.parameters.score)
                agent.add(`🎉 Your Score is: ${element.parameters.score}/${element.parameters.total_questions} 🥳`)
                agent.add(`You are #${rank}`)
                agent.add(new Image("https://media.tenor.com/images/b4c2f5c658c1d3ade7e506ee7ffe3c5e/tenor.gif"));
                break
            }
        }
    },

    scoreboard: async function(agent){
        console.log("Showing scoreboard for quiz...")
        const query = "SELECT * FROM scoreboard ORDER BY score DESC LIMIT 10;"
        const res = await queryDB(query)
        for(var i=0;i<res.length;i++){
            const scores = `#${i+1} is ${res[i].email} with score ${res[i].score}`
            agent.add(scores)
        }
    },

    getScoreByEmail: async function(agent){
        console.log("Showing score by email...");
        const playerEmail = agent.contexts[0].parameters.email
        const query = `SELECT * FROM scoreboard WHERE email = '${playerEmail}';`
        const res = await queryDB(query)
        if(res.length){
            agent.add(`${playerEmail} has a score of ${res[0].score}`)
        }else{
            agent.add(`${playerEmail} not found!`)
        }
    },

    getSelfScore: async function(agent){
        console.log("Showing self score...");
        var playerEmail
        if(agent['request_']['body']['originalDetectIntentRequest']['source']==='hangouts'){
            console.log(agent['request_']['body']['originalDetectIntentRequest']['payload']['data']['event']['user']);
            playerEmail = agent['request_']['body']['originalDetectIntentRequest']['payload']['data']['event']['user']['email'];
        }else{
            playerEmail = 'na@na.com'
        }
        const query = `SELECT * FROM scoreboard WHERE email = '${playerEmail}'`
        const res = await queryDB(query)
        if(res.length){
            agent.add(`Your score is : ${res[0].score}`)
        }else{
            agent.add("Could not find your score!")
        }
    }
}

async function addOrUpdateUser(agent, playerEmail, score){
    const findPlayer = `SELECT * FROM scoreboard WHERE email = '${playerEmail}';`
    const res = await queryDB(findPlayer)
    var query
    if(res.length == 0){
        query = `INSERT INTO scoreboard (email, score) VALUES ('${playerEmail}', ${score});`
        
    }else if(res[0].score < score){
        query = `UPDATE scoreboard SET score = ${score} WHERE email = '${playerEmail}';`
    }else{
        agent.add(`Your max score is ${res[0].score}, which remains unchanged!`)
        return;
    }
    await queryDB(query)
}

function findRank(ranks, score){
    var rank = 1, prevScore = -1
    for(var i=0;i<ranks.length;i++){
        if(ranks[i].score <= score){
            return rank
        }else if(ranks[i].score != prevScore){
            rank++
        }
        prevScore = ranks[i].score
    }
    return rank
}

//Method to query the database.
async function queryDB(query) {
    console.log("Query is: ", query);
    try{
      const client = connectToDB();
      var result = await client.query(query);
      await client.end();
    }
    catch(err){
      console.log(err.stack);
    }
    return result.rows;
}