const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers")

const app = express();
const PORT = 8080; // default port 8080

//config
app.set("view engine", "ejs"); //tells Express app that EJS as its default templating engine

//middleware
app.use(express.urlencoded({ extended: true })); //body parser, to convert to string
app.use(cookieSession({
  name: "user-cookie",
  keys: ['silversprings'],
}))


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

//
//HELPER FUNCTIONS
//
//to create short urls or userIds
const generateRandonString = function() {
  return Math.random().toString(36).slice(2, 8);
};

//returns URLs where the userID is equal to the id of the currently logged-in user
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
  const user_id = req.session.user_id;
  //if not logged in (no cookie)
  if (!user_id) {
    return res.status(401).send("Error: Cannot access if not logged in");
  }
  const templateVars = {
    urls: urlsForUser(user_id), //so only viewing the users URLs
    user: users[user_id]
  };
  res.render("urls_index", templateVars);
});


//
// ADD 
//

//USER ADDS NEW URL
app.post("/urls", (req, res) => {
  //check if logged in 
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.send("Error: You must register/login to create TinyURL");
  }
  const id = generateRandonString();  //create random ID
  //store data in urlDatabase object
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: user_id
  };
  //redirect to coressponding url page
  res.redirect(`/urls/${id}`);
});

//REGISTER
app.post("/register", (req, res) => {
  //if the email or password field is empty send 400 code
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("Email or Password not inputted");
  }
  //if the email exists in db send 400 code
  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email already in use.");
  }
  //happy path - hash pw and create userID
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userID = generateRandonString();
  //add user info to user obj
  users[userID] = {
    id: userID,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = userID //save user id 
  res.redirect("/urls");
});

//LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(email, users);
  //check if email is in db if its not send 403 status
  if (!foundUser) {
    return res.status(403).send("email not found");
  }
  //check if pw in db matches input, if no match send 403
  if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("incorrect password");
  }
  //if email/pw pass, set cookie to associated user_id and redirect
  req.session.user_id = foundUser.id
  res.redirect("/urls");
});

//LOGOUT - Clear user_id
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


//
//EDIT
//

//UPDATE - EDIT LONG URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user_id = req.session.user_id;
  //check if id is in db
  if (!urlDatabase[id]) {
    return res.status(404).send(`Cannot update. ID: ${id} does not exist`);
  }
  //check if user is logged in
  if (!user_id) {
    return res.status(401).send("Page not accessible. User must be logged in to update");
  }
  //check if the user owns the url
  if (urlDatabase[id].userID !== user_id) {
    return res.status(401).send("Error, only URL owner can make changes");
  }

  urlDatabase[id].longURL = req.body.longURL; //update long url in db
  res.redirect("/urls");
});


//
// DELETE
//

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const user_id = req.session.user_id;
    //check if id is in db
    if (!urlDatabase[id]) {
      return res.status(404).send(`Cannot remove ID: ${id}, the URL was not found`);
    }
    //check if user is logged in
    if (!user_id) {
      return res.status(401).send("Page not accessible. User must be logged in to make changes");
    }
    //check if the user owns the url
    if (urlDatabase[id].userID !== user_id) {
      return res.status(401).send("Error, only URL owner can remove this URL");
    }
  
  delete urlDatabase[id]; //delete url from db
  res.redirect("/urls"); //redirect to urls page
});


//
// READ
//

//SEE REGISTER PAGE
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_registration", templateVars);
});

//SEE LOGIN PAGE
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_login", templateVars);
});

//SEE ADD NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[user_id] };
  res.render("urls_new", templateVars);
});

//SEE SPECIFIC URL PAGE - restricted to owner of URL
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;

  if (!urlDatabase[id]) { //if the short url is not in our data
    return res.status(404).send("Page not found: Invalid URL");
  }

  //must be logged in to see page
  if (!user_id) {
    return res.status(401).send("Page not accessible. User must be logged in");
  }

  //if there's no associated urls with user_id
  if (urlDatabase[id].userID !== user_id) {
    return res.status(401).send("Page only accessible to URL owner");
  }

  const templateVars = {
    id: id,
    longURL: urlDatabase[id].longURL,
    user: users[user_id]
  };
  res.render("urls_show", templateVars);
});

//REDIRECT SHORT URLS to LONG URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  //check if url in our db
  if (!urlDatabase[id]) {
    return res.status(404).send("Page not found: Invalid URL");
  }
  res.redirect(urlDatabase[id].longURL);
});



//app listen on port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});