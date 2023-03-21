const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //tells Express app to use EJS as its templating engine
app.use(express.urlencoded({ extended: true })); //convert body from buffer to string

//obj to hold urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//to create short urls
const generateRandonString = function() {
  return Math.random().toString(36).slice(2, 8);
};


//GET SECTION

//HOMEPAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//ALL URLS PAGE
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }; //need to send these in an object
  res.render("urls_index", templateVars); //looks for urls_index.ejs file and gives it access to templateVars
});

//ADD NEW URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//SPECIFIC URL PAGE
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  
  if (!urlDatabase[req.params.id]) { //if the short url is not in our data
    res.status(404).render("urls_error")
    res.end();
  } else {
    res.render("urls_show", templateVars);
  }
});

//REDIRECT SHORT URLS to LONG URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  
  if (!urlDatabase[req.params.id]) { //if the url is not in our data
    res.status(404).render("urls_error")
    res.end();
  } else {
    res.redirect(302, longURL);
  }
});


//POST SECTION

//POST ON URLS
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const newShortURL = generateRandonString();  //create random ID
  urlDatabase[newShortURL] = req.body.longURL; //store data in urlDatabase object
  //redirect to coressponding url page
  res.redirect(`/urls/${newShortURL}`);
});

//app listen on port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
