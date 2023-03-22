const express = require("express");
cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

//config
app.set("view engine", "ejs"); //tells Express app that EJS as its default templating engine

//middleware
app.use(express.urlencoded({ extended: true })); //body parser, to convert to string
app.use(cookieParser());


//obj to hold urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//obj to hold user info
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234",
  },
};

//
//HELPER FUNCTIONS
//
//to create short urls or userIds
const generateRandonString = function() {
  return Math.random().toString(36).slice(2, 8);
};
//to check if user email already exists
const getUserByEmail = function(email) {
  for (const userKey in users) {
    const user = users[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};


//
//BROWSE
//

//HOMEPAGE
app.get("/", (req, res) => {
  console.log("url Database:", urlDatabase); //for debugging purposes
  res.send("Hello!");
});

// Don't know the purpose of this
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//ALL URLS PAGE
app.get("/urls", (req, res) => {
  console.log(req.cookies);
  const user_id = req.cookies["user_id"];
  const templateVars = {
    urls: urlDatabase,
    user: users[user_id]
  };
  res.render("urls_index", templateVars); //looks for urls_index.ejs file and gives it access to templateVars
});


//
// ADD 
//

//ADD NEW URL
app.post("/urls", (req, res) => {
  const newShortURL = generateRandonString();  //create random ID
  urlDatabase[newShortURL] = req.body.longURL; //store data in urlDatabase object
  //redirect to coressponding url page
  res.redirect(`/urls/${newShortURL}`);
});

//REGISTER
app.post("/register", (req, res) => {
  //if the email or password field is empty send 400 code
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("Email/Password not inputted");
    return;
  }

  //if the email exists in db send 400 code
  if (getUserByEmail(email)) {
    res.status(400).send("Email already in use.")
    return;
  }
  
  const userID = generateRandonString();
  //add user info to user obj
  users[userID] = {
    id: userID,
    email: email,
    password: password
  };
  res.cookie("user_id", userID); //save user id  as cookie
  console.log(users);
  res.redirect("/urls");
});

//LOGIN
app.post("/login", (req, res) => {
  res.redirect("/urls");
});

//LOGOUT - Clear user_id
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


//
//EDIT
//
//UPDATE LONG URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL; //update long url in db
  res.redirect(`/urls`);
});


//
// DELETE
//

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]; //delete url from db
  res.redirect("/urls"); //redirect to urls page
});


//
// READ
//

//GO TO REGISTER PAGE
app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  console.log("req.cookies", req.cookies)
  const templateVars = { user: users[user_id] };
  res.render("urls_registration", templateVars);
});

app.get("login", (req, res) => {
  res.render("urls_login");
});

//GO TO ADD NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = { user: users[user_id] };
  res.render("urls_new", templateVars);
});

//GO TO SPECIFIC URL PAGE
app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[user_id]
  };

  if (!urlDatabase[req.params.id]) { //if the short url is not in our data
    res.status(404).render("urls_error");
    res.end();
  } else {
    res.render("urls_show", templateVars);
  }
});

//REDIRECT SHORT URLS to LONG URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];

  if (!urlDatabase[req.params.id]) { //if the url is not in our data
    res.status(404).render("urls_error");
    res.end();
  } else {
    res.redirect(longURL);
  }
});



//app listen on port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});