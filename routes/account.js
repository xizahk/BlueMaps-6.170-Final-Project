const express = require('express');

const router = express.Router();

const Account = require('../models/Account');
const session = require("express-session");

/**
 * Returns the user's email if the user is logged in.
 * @name GET/api/account
 * @returns {email} - JSON of user's email if the user is already logged in
 * @throws {409} - if the client is not signed in
 */
router.get('/', (req, res) => {
    let email = req.session.email;
    if (email === undefined) {
        res.status(409).json({
            error: `You must be signed in to get your username.`
        }).end();
    } else {
        let account = Account.findAccount(email)
        res.status(200).json(account).end();
    }
});

/**
* Creates a user account
* @name POST/api/account
* @param {string} username - the username of this new account
* @param {string} password - the password of this new account
* @return {Login} - the created login account
* @throws {400}  - if the username already exists in this system
*/
router.post("/", (req, res) => {
  if (req.session.email !== undefined) {
    res.status(400).json({
      error: "You are already signed in! Please sign out and try this again.",
    }).end();
  }
  else if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.status(400).json({
      error: "You must enter a non-empty email and password",
    }).end();
  }
  else if (req.body.password.length < 8) {
  	res.status(400).json({
      error: "Your password must be greater than 8 characters",
    }).end();
  }
  else {
    const account = Account.createAccount(req.body.email, req.body.password);
    if (account === false) {
      res.status(400).json({
        error: "This email is invalid or has already been used. Please try again",
      }).end();
    }
    else {
        req.session.email = account.email;
        res.status(200).json(account).end();
    }
  }
});

/**
* Changes the email for this account
* @name PUT/api/account/email
* @param {string} newUsername - the new username for this account
* @return {Login} - the newly changed login account
* @throws {400} - if the modification could not be made
*/
router.put("/email", (req, res)  => {
  if (req.session.email === undefined) {
    res.status(400).json({
      error: "You must be signed in to change your email.",
    }).end();
  }
  else if (req.session.email.length === 0) {
    res.status(400).json({
      error: "Your new username cannot be empty.",
    }).end();
  }
  else if (req.session.email === req.body.email) {
    res.status(400).json({
        error: "You already have this username!",
    }).end();
  }
  else {
    const newAccount = Account.changeEmail(req.session.email, req.body.email);
    if (newAccount === false) {
      res.status(400).json({
        error: "The desired email is invalid or has been used. Please try again.",
      }).end();
    }
    else {
      req.session.email = newAccount.email;
      res.status(200).json(newAccount).end();
    }
  }
})
/**
* Changes the password for this account
* @name PUT/api/account/password
* @param {string} password - the password of the account to change
* @return {Login} - the newly changed login account
* @throws {400} - if the modification could not be made
*/
router.put("/password", (req, res) => {
  if (req.session.email === undefined) {
    res.status(400).json({
      error: "You must be signed in to change your password.",
    }).end();
  }
  else if (req.body.password.length === 0) {
    res.status(400).json({
      error: "Your new password cannot be empty.",
    }).end();
  }
  else {
    const newAccount = Account.changePassword(req.session.email, req.body.password);
    if (newAccount === false) {
      res.status(400).json({
        error: "This modification could not be made. You have no permission to change this password.",
      }).end();
    }
    else {
      res.status(200).json(newAccount).end();
    }
  }
})
/**
* Deletes this entire account
* @name DELETE/api/account
* @return {Login} - the deleted login account
* @throws {400}  - if the deletion could not be made
*/
router.delete("/", (req, res) => {
  if (req.session.email === undefined) {
    res.status(400).json({
      error: "You must be signed in to delete an account.",
    }).end();
  }
  else {
    const deletedAccount = Account.deleteAccount(req.session.email);
    if (deletedAccount === false) {
      res.status(401).json({
        error: "This modification could not be made. You have no permission to delete this account.",
      }).end();
    }
    else {
      req.session.email = undefined;
      res.status(200).json(deletedAccount).end();
    }
  }
});
/**
* Signs in the user to a created account
* @name PUT/api/account/signin
* @param {string} email - the email signing in to this account
* @param {string} password - the password signing in to this account
* @return {Login} - the account that was just signed in to
* @throws {400} - if the username/password combo does not exist
*/
router.put("/signin", (req, res) => {
  if (req.session.email !== undefined) {
    res.status(400).json({
      error: "You are already signed in! Please sign out and try this again.",
    }).end();
  }
  else {
    const account = Account.checkAccount(req.body.email, req.body.password);
    if (account === false) {
      res.status(400).json({
        error: "This username/password combination does not exist. Please try again.",
      }).end();
    }
    else {
      req.session.email = account.email;
      res.status(200).json(account).end();
    }
  }
})
/**
* Signs out the user from the current account
* @name PUT/api/account/signout
* @return {200} - if successfully signed out
* @throws {400} - if could not successfully sign out
*/
router.put("/signout", (req, res) => {
  if (req.session.email === undefined) {
    res.status(401).json({
      error: "You must be signed in to sign out!",
    }).end();
  }
  else {
    req.session.email = undefined;
    res.status(200).json("Successfully signed out!").end();
  }
})
/**
* Adds a trip to the favorite trips of this user
* @name POST/api/account/trip
* @return {200} - if successfully added this trip to their favorites
* @throws {400} - if could not successfully add this trip
*/
router.post("/trip", (req, res) => {
	if (req.session.email === undefined) {
		res.status(401).json({
	      error: "You must be signed in to add a favorite trip!",
	    }).end();
	}
	else {
		const success = Account.addFavoriteTrip(req.session.email, req.body);
		if (success === false) {
			res.status(400).json({
				error: "You could not add this trip to your favorites.",
			}).end();
		}
		else {
			res.status(200).json({
        id: success,
      }).end();
		}
	}
})
/**
* Gets this users' favorite trips
* @name GET/api/account/trips
* @return {200} - if successfully received this users' trips
* @throws {400} - if could not successfully receive this users' trip
*/
router.get("/trips", (req, res) => {
	if (req.session.email === undefined) {
		res.status(401).json({
			error: "You must be signed in to view your trips.",
		}).end();
	}
	else {
		const favoriteTrips = Account.getFavoriteTrips(req.session.email);
		if (favoriteTrips === false) {
			res.status(400).json({
				error: "Could not find your favorite trips.",
			}).end();
		}
		else {
      console.log(favoriteTrips);
			res.status(200).json(favoriteTrips).end();
		}
	}
})
/**
* Deletes the favorite trip with the specified id
* @name DELETE/api/account/trip/:id
* @return {200} - if successfully deleted this trip
* @throws {400} - if could not remove this trip
*/
router.delete("/trip/:id", (req, res) => {
	if (req.session.email === undefined) {
		res.status(400).json({
			error: "You must be signed in to delete a favorite trip.",
		}).end();
	}
	else {
		const success = Account.removeFavoriteTrip(req.session.email, req.params.id);
		if (success === false) {
			res.status(400).json({
				error: "Could not remove this trip.",
			}).end();
		}
		else {
			res.status(200).json().end();
		}
	}
});
/**
* Starts this favorite trip with the specified id
* @name PUT/api/account/start
* @return {200} - if successfully started this trip
* @throws {400} - if could not start this trip
*/
router.put("/start", (req, res) => {
  if (req.session.email === undefined) {
    res.status(401).json({
      error: "You must be signed in to start a favorite trip.",
    }).end();
  }
  else {
    const promise = Account.startFavoriteTrip(req.session.email, req.params.id);
    if (promise === false) {
      res.status(400).json({
        error: "Could not start this favorite trip.",
      }).end();
    }
    else {
      promise.then(function(trip) {
        res.status(200).json(trip).end();
      },
      function(errorStr) {
        res.status(400).json({
          error: errorStr,
        }).end();
      })

    }

  }
});
/**
* Sends the trip details to the user's email
* @name PUT/api/account/send
* @return {200} - if successfully sent this trip
* @throws {400} - if user is not signed in
*/
router.put("/send", (req, res) => {
  if (req.session.email === undefined) {
    res.status(401).json({
      error: "You must be signed in to send this trip.",
    }).end();
  }
  else {
    Account.sendTrip(req.session.email, req.body.trip);
    res.status(200).json().end();
  }
});

module.exports = router;
