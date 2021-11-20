var axios = require('axios');
const cheerio = require('cheerio');
const { Card, Payload } = require('dialogflow-fulfillment')
const NEWS_API_KEY = 'b7bcfafee24c4602b5b5bf56d8c7b743'

module.exports = {

  //Method to display latest cricket news.
  getNews: async function(agent) {

    var teamName = agent.parameters.geoCountry;
    var person = agent.parameters.person;

    var newsContainer = [];
    if(person) {
      newsContainer = await getNews(person.name);
    }
    else if(teamName) {
      newsContainer = await getNews(teamName+' Cricket')
    }
    else {
      newsContainer = await getNewsFromCriccBuzz(agent.parameters.NewsFilters);
    }

    var index = shuffle(newsContainer.length);
    var len = newsContainer.length;
    if(len == 0) {
      agent.add('Sorry could not fetch any news.');
      return;
    }
    if(len > 5) {
      len = 5;
    }
    for(var i = 0; i<len ; i++){

      agent.add(new Card({
        title : newsContainer[index[i]][0],
        imageUrl: newsContainer[index[i]][3],
        text : newsContainer[index[i]][1],
        buttonText : 'To read more',
        buttonUrl : newsContainer[index[i]][2]
      }));
    }
    agent.add("You can also search for news categories like: 'Live blogs', 'Cricket Interviews', 'Match analysis', 'Expert opinions', 'Spotlight', team or player news.") 
  }
}

const getNewsFromCriccBuzz = async (filter) => {

  var result = [];
  const URL = "https://www.cricbuzz.com/cricket-news"+filter;
  const html = await getDataFromRemote(URL);
  const $ = cheerio.load(html);
  $('h2.cb-nws-hdln').each(function(_,element){
    const news = $(element).text()
    const flash = $(element).next().text()
    const link = 'https://www.cricbuzz.com/' + $(element).children().attr('href')
    const imgUrl = 'https://www.cricbuzz.com' + $(element).parent().prev().children('meta[itemprop="url"]').attr('content').slice(6)
    result.push([news, flash, link, imgUrl])
})
  return result;
}

const getNews = async (temp) => {

  const NewsAPI = require('newsapi');
  const newsapi = new NewsAPI(NEWS_API_KEY);
  var result = [];
  await newsapi.v2.topHeadlines({
    q: temp,
    category: 'sports',
    language: 'en'
  }).then(response => {
    for(var i in response.articles) {
      result.push([response.articles[i].title, response.articles[i].description, response.articles[i].url, response.articles[i].urlToImage]);
    }
  })
  return result;
}

//Method to fetch data from the provided URL.
const getDataFromRemote = async (URL) => {
  const response = await axios.get(URL);
  const {data} = response;
  return data;
}

function shuffle(len) {

  var o = [];
  for(var i = 0; i < len; i++) {
    o.push(i);
  }
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}
