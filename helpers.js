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


module.exports = { getUserByEmail }