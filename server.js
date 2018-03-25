const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
const app = express()

const apiKey = '5c1518cd';

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index', { lyric: null, error: null });
})

app.post('/', function (req, res) {

  let artistName = req.body.artistInput;
  let songName = req.body.songInput;
  var lyrics = "";

  url = 'http://lyrics.wikia.com/wiki/' + artistName + ':' + songName;


  request(url, function (error, response, html) {
    if (error) {
      res.render('index', { lyric: null, error: 'Error, please try again' });
    }
    else {

      var $ = cheerio.load(html);
      $('script').remove();
      var lyrics = ($('.lyricbox').html());
     
      /**
       * Override default underscore escape map
       */
      var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "'": '&apos;',
        '`': '&#x60;',
        '': '\n'
      };
      var unescapeMap = _.invert(escapeMap);
      var createEscaper = function (map) {
        var escaper = function (match) {
          return map[match];
        };

        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function (string) {
          string = string == null ? '' : '' + string;
          return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
      };
      _.escape = createEscaper(escapeMap);
      _.unescape = createEscaper(unescapeMap);

      // replace html codes with punctuation
      lyrics = _.unescape(lyrics);
      // remove everything between brackets
      lyrics = lyrics.replace(/\[[^\]]*\]/g, '');
      // remove html comments
      lyrics = lyrics.replace(/(<!--)[^-]*-->/g, '');
      // replace newlines
      lyrics = lyrics.replace(/<br>/g, '\n');
      // remove all tags
      lyrics = lyrics.replace(/<[^>]*>/g, '');
      console.log(lyrics);
      
      if (lyrics != "") {
        res.render('index', { lyric: lyrics, error: null });
      }
      else {
        res.render('index', { lyric: null, error: 'Not Found' });
      }
    }
  });

})

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server started on ${port}`);
})
