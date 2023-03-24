const { assert } = require('chai');
const { getUserByEmail, generateRandomString } = require('../helpers.js');

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

describe('generateRandomString', function() {
  it('should return a string with 6 characters', function () {
    const id = generateRandomString();
    const expectedLength = 6;
    assert.equal(id.length, expectedLength);
    assert.typeOf(id, 'string')
  })
});
