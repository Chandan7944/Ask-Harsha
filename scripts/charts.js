const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const os = require('os');
const path = require('path');
var Kraken = require("kraken");
var kraken = new Kraken({
    "api_key": 'e289a019b008869967a3339ae8dd87c8',
    "api_secret": '5709101e024ded19d6630bd2aa3e3ccb449ca8b8'
});
const post_URL = 'https://api.kraken.io/v1/upload'
const api_key = '93a65b9b9655520346595a7919990ab3'
const tempDir = os.tmpdir()
const timeout = 300 //ms

module.exports = {

    createHeadToHeadChart: async function(team1, team2, team1wins, team2wins){
        const start = new Date().getTime();
        const canvasRenderService = new ChartJSNodeCanvas({ width: 250, height: 250 })
        var url
        var colors = []
        const teams = 2
        for(var i=0;i<teams;i++){
            const red = Math.floor(Math.random() * 256);
            const green = Math.floor(Math.random() * 256);
            const blue = Math.floor(Math.random() * 256);
            colors.push(`rgb(${red}, ${green}, ${blue})`)
        }
        const chart_item = {
            label: [`${team1} vs ${team2}`],
            data: [team1wins, team2wins],
            fill: true,
            backgroundColor: colors
        }
        const data = {
            labels: [team1, team2],
            datasets: [chart_item]
        };
    
        const configuration =  {
            type: 'pie',
            data: data,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${team1} vs ${team2}`
                    }
                }
            }
          };
    
        const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
        const end = new Date().getTime();
        console.log((end - start)/1000, 's');
        const URL = await uploadImage(imageBuffer)
        return URL
    },

    createTeamStatsChart: async function(teamName, win, loss){
        const start = new Date().getTime();
        const canvasRenderService = new ChartJSNodeCanvas({ width: 250, height: 250 })
        var url
        var colors = []
        const teams = 2
        for(var i=0;i<teams;i++){
            const red = Math.floor(Math.random() * 256);
            const green = Math.floor(Math.random() * 256);
            const blue = Math.floor(Math.random() * 256);
            colors.push(`rgb(${red}, ${green}, ${blue})`)
        }
        const chart_item = {
            label: [`${teamName} stats`],
            data: [win, loss],
            fill: true,
            backgroundColor: colors
        }
        const data = {
            labels: ['wins','losses'],
            datasets: [chart_item]
        };
    
        const configuration =  {
            type: 'pie',
            data: data,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${teamName} stats`
                    }
                }
            }
          };
    
        const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
        const end = new Date().getTime();
        console.log((end - start)/1000, 's');
        const URL = await uploadImage(imageBuffer)
        return URL

    },

    createPlayerHeadToHeadChart: async function(playerStats, player1, player2){
        const start = new Date().getTime();
        const canvasRenderService = new ChartJSNodeCanvas({ width: 500, height: 300 })
        var url
        var backgroundColor = [], borderColor = []
        console.log(Object.keys(playerStats));
        const parameters = Object.keys(playerStats).length
        for(var i=0;i<parameters;i++){
            const red = Math.floor(Math.random() * 256);
            const green = Math.floor(Math.random() * 256);
            const blue = Math.floor(Math.random() * 256);
            backgroundColor.push(`rgba(${red}, ${green}, ${blue}, 0.2)`)
            borderColor.push(`rgb(${red}, ${green}, ${blue})`)
        }
        const labels = Object.keys(playerStats)
        const data = {
          labels: labels,
          datasets: [{
            label: `${player1} vs ${player2}`,
            data: Object.values(playerStats),
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: 1
          }]
        };
    
        const configuration = {
            type: 'bar',
            data: data,
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            },
          };
    
        const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
        const end = new Date().getTime();
        console.log((end - start)/1000, 's');
        const URL = await uploadImage(imageBuffer)
        return URL
    }
    
}

async function uploadImage(imageBuffer){
    var filename = path.join(tempDir, `${new Date().getTime()}.jpg`), URL

    fs.writeFileSync(filename, imageBuffer);
        
    var opts = {
        file: fs.createReadStream(filename),
        wait: true
    };
    const uploadImg = new Promise((resolve, reject) => {
        setTimeout(() => {
            kraken.upload(opts, function (err, data) {
                if (err) {
                    console.log('Failed. Error message: %s', err);
                    reject(err)
                } else {
                    console.log('Success. Optimized image URL: %s', data.kraked_url);
                    fs.unlinkSync(filename)
                    resolve(data.kraked_url)
                }
            });
        }, timeout)
    })

    await uploadImg.then(url => {
        URL = url
    }).catch(err => {
        console.log("Error Occured: ", err)
        URL = 'https://miro.medium.com/max/3200/0*p9_tjE1pg4p5lt3O'
    })
    const end = new Date().getTime()
    return URL
}