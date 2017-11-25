var express = require('express')
var app = express();
// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
     defaultLayout:'main',
     helpers: {
        foo: function (){ return "<h2>FOO HELPER</f2>"},

        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
     }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static('public'))

app.get('/', function (req, res) {
  res.render('maincontent',{
      showLogin: true
  })
})

app.get('/user-account', function (req, res) {
    res.render('user-account',{
        showLogin: true
    })
})

app.get('/register', function(req, res){ 
    res.render('register');
});

app.listen(3000)