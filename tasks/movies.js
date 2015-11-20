var Yakuza   = require('yakuza');
var cheerio  = require('cheerio');
var mongoose = require('mongoose');
var Movie    = require('../app/models/movie');
var config   = require('../config/config');
mongoose.connect(config.db);

Yakuza.scraper('movie')
Yakuza.agent('movie', 'imdb').plan(['top250']);
Yakuza.task('movie', 'imdb', 'top250').main(function (task, http, params){
  // console.log(params);
  //logic for retrieving html and extract data
  var url = "http://www.imdb.com/chart/top?ref_=nv_mv_250_6";
    http.get(url, function (error, res, html){
        // console.log(html);
      if (error) { return task.fail(error); }

      var $ = cheerio.load(html);
      var movies = $('tbody.lister-list > tr');
      var moviesList = [];

      movies.each(function(index, movie){
        movie = $(movie);
        img = movie.find(".posterColumn > a > img").attr('src');
        title = movie.find(".titleColumn > a").html() +
        " " + movie.find(".titleColumn > span").html();
        rating = parseFloat(movie.find(".imdbRating > strong").html());

        moviesList.push({
          img: img,
          title: title,
          rating: rating
        });
      });

      return task.success({message: "completed task", moviesList: moviesList});
    });
  }).builder(function (job){
    return job.params;
  });

var top250 = Yakuza.job('movie', 'imdb', {someParams: 'someParams'}).enqueue('top250');

top250.on('task:top250:success', function (task){
  console.log(task.data.message);
  // console.log(task.data.moviesList);
  var moviesList = task.data.moviesList;
  moviesList.forEach(function (movie){
    saveMovie(movie);
  });
});
top250.run();

function saveMovie (movieInfo) {

  Movie.findOneAndUpdate({title: movieInfo.title}, movieInfo, function (error, movie) {
    if (error) {return console.log(error); }
    if(!movie) {
      movie = new Movie(movieInfo);
      movie.save(function (error) {
        if (error) { return console.log(error); }
        return console.log("Movie created >>> " + movie.title);
      });
    } else {
      return console.log("Movie Updated >>> " + move.title);
    }
  });
}

