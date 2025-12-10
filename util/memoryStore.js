let storedUsers = [];
let loggedOnUser = null;

function getStoredUsers() {
  return storedUsers;
}

function addUser(user) {
  storedUsers.push(user);
}

function getLoggedOnUser() {
  return loggedOnUser;
}

function setLoggedOnUser(user) {
  loggedOnUser = user;
}

function clearStore() {
  storedUsers = [];
  loggedOnUser = null;
}

module.exports = {
  storedUsers,
  addUser,
  getStoredUsers,
  setLoggedOnUser,
  getLoggedOnUser,
  clearStore,
};
