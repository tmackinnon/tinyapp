const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user object, that contains the associated email.', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    const expectedUserObj = testUsers[expectedUserID];
    assert.equal(user, expectedUserObj);
  });

  it('should return undefined, if the email cannot be found in database', function() {
    const user = getUserByEmail("notindb@example.com", testUsers);
    assert.equal(user, undefined);
  });

});