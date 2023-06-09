const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString } = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //tells Express app that EJS as its default templating engine

//MIDDLEWARE
app.use(express.urlencoded({ extended: true })); //body parser, to convert to string
app.use(cookieSession({
  name: "user-cookie",
  keys: ['silversprings'],
}));


//obj to hold urls -- existing urls to be used for tests
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};
//obj to hold user info -- user aJ48lW to be used for tests
const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "a@a.com",
    password: "$2a$10$Gyp9PyqSE//lxvokM69LkuPys.3jE9ngqD6LM18BeQHQMwBG.H9LG", //use 1234 in browser
  },
};

//HELPER FUNCTION
//returns urls where the userID is equal to the id of the currently logged-in user
const urlsForUser = function(id) {
  let urls = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
};

//
//BROWSE
//

// HOMEPAGE - redirected to /urls //
app.get("/", (req, res) => {
  //check if logged in 
  const user_id = req.session.user_id;
  if (!user_id) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});


//
//CRUD URLS
//

// CREATE - POST //
//USER ADDS NEW URL
app.post("/urls", (req, res) => {
  //check if logged in 
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.send("Error: You must register/login to create TinyURL");
  }
  const id = generateRandomString();  //create random ID
  //store data in urlDatabase object
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: user_id
  };
  //redirect to coressponding url page
  res.redirect(`/urls/${id}`);
});

// READ ALL - GET //
// RAW DATA
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// READ ONE - GET //
//REDIRECT SHORT URLS TO LONG URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  //check if url in our db
  if (!urlDatabase[id]) {
    return res.status(404).send("<h2>Page not found: Invalid URL</h2>");
  }
  res.redirect(urlDatabase[id].longURL);
});

// UPDATE - POST/PUT //
//EDIT LONG URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user_id = req.session.user_id;
  //check if id is in db
  if (!urlDatabase[id]) {
    return res.status(404).send("<h2>Cannot update.This short URL does not exist</h2>");
  }
  //check if user is logged in
  if (!user_id) {
    return res.status(401).send("<h2>Page not accessible. User must be logged in to update</h2>");
  }
  //check if the user owns the url
  if (urlDatabase[id].userID !== user_id) {
    return res.status(401).send("<h2>Error, only URL owner can make changes</h2>");
  }

  urlDatabase[id].longURL = req.body.longURL; //update long url in db
  res.redirect("/urls");
});

//DELETE - POST/DELETE //
//REMOVE URL FROM DB
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const user_id = req.session.user_id;
  //check if id is in db
  if (!urlDatabase[id]) {
    return res.status(404).send("<h2>Cannot remove. The requested URL was not found</h2>");
  }
  //check if user is logged in
  if (!user_id) {
    return res.status(401).send("<h2>Page not accessible. User must be logged in to make changes</h2>");
  }
  //check if the user owns the url
  if (urlDatabase[id].userID !== user_id) {
    return res.status(401).send("<h2>Error, only URL owner can remove this URL</h2>");
  }

  delete urlDatabase[id]; //delete url from db
  res.redirect("/urls"); //redirect to urls page
});


//
// AUTH API
//

//REGISTER
app.post("/register", (req, res) => {
  //if the email or password field is empty send 400 code
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("<h2>Email or Password not inputted</h2>");
  }
  //if the email exists in db send 400 code
  if (getUserByEmail(email, users)) {
    return res.status(400).send("<h2>Email already in use.</h2>");
  }
  //happy path - hash pw and create userID
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userID = generateRandomString();
  //add user info to user obj
  users[userID] = {
    id: userID,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = userID; //save user id 
  res.redirect("/urls");
});

//LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(email, users);
  //check if email is in db if its not send 403 status
  if (!foundUser) {
    return res.status(403).send("<h2>email not found</h2>");
  }
  //check if pw in db matches input, if no match send 403
  if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("<h2>incorrect password</h2>");
  }
  //if email/pw pass, set cookie to associated user_id and redirect
  req.session.user_id = foundUser.id;
  res.redirect("/urls");
});

//LOGOUT - Clear user_id
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


//                                     
// RENDERING/INDEX ROUTES - rendering
//                                   

// URLS FRONT END (all/new/show) //

//ALL URLS PAGE
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  //if not logged in (no cookie)
  if (!user_id) {
    return res.status(401).send("<h2>Cannot access page if not logged in</h2><h3>Please <a href=/login> login to view</h3>");
  }
  const templateVars = {
    urls: urlsForUser(user_id), //so only viewing the users URLs
    user: users[user_id]
  };
  res.render("urls_index", templateVars);
});

//ADD NEW URL
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_new", templateVars);
});

//SHOW SPECIFIC URL PAGE - restricted to owner of URL
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;

  if (!urlDatabase[id]) { //if the short url is not in our data
    return res.status(404).send("<h2>Page not found: Invalid URL</h2>");
  }

  //must be logged in to see page
  if (!user_id) {
    return res.status(401).send("<h2>Page not accessible. User must be logged in</h2>");
  }

  //if there's no associated urls with user_id
  if (urlDatabase[id].userID !== user_id) {
    return res.status(401).send("<h2>Page only accessible to URL owner</h2>");
  }

  const templateVars = {
    id: id,
    longURL: urlDatabase[id].longURL,
    user: users[user_id]
  };
  res.render("urls_show", templateVars);
});

// AUTH FRONT END //

//SEE REGISTER PAGE
//
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_registration", templateVars);
});

//SEE LOGIN PAGE
//
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_login", templateVars);
});

//CATCH ALL 
app.use((req, res) => {
  res.status(404).send("<h1>Page not found</h1>");
});

//app listen on port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});