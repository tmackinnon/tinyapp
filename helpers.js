//
//HELPER FUNCTIONS
//

//Check if user email exists in db object
const getUserByEmail = function(email, database) {
  for (const userKey in database) {
    const user = database[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

//to create short urls or userIds
const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};


module.exports = { getUserByEmail, generateRandomString }