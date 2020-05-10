const uuidv1 = require('uuid/v1');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');
const date = require('date-and-time');
const nodemailer = require('nodemailer');
const apikey = 'Insert-key-here'

const BlueMaps = require('./BlueMaps');

let accounts = [];

//used for sending emails
var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bluemapstravel@gmail.com',
        pass: 'spicyavocado',
      }
    });


/**
  * @typedef account
  * @prop {string} email - the email associated with this account account
  * @prop {string} password - the password associated with this account account
  * @prop {[FavoriteTrip]} favoriteTrips - a list of this account's favorite trips
*/

/**
  * @typedef FavoriteTrip
  * @prop {string} id - the id of this trip
  * @prop {Trip} trip - the trip object
 */

 /**
   * @typedef Trip
   * @prop {[{lat, lon, name}] stops - the stops of this trip
   * @prop {number} time - the duration for this trip
 */

class Account {


  /**
  * Finds the account associated with email
  * @param {string} email - the email to search for
  * @return {account | undefined} - the account account associated with email
  */
  static findAccount(email) {
    return accounts.filter(account => account.email === email)[0];
  }

  /**
    * Checks if this username, password combo has been created. Used for signing in
    * @param {string} email - user's email
    * @param {string} password - user's password
    * @return {account} - the account account corresponding to this combo
    * @return {false} - if this combo does not exist
    */
    static checkAccount(email, password) {
      const account = Account.findAccount(email);
      if (account !== undefined && account.password === password) {
          return account;
      }
      else {
          return false;
      }
    }
  /**
    * Validates the email address inputted
    * @param {string} email - user's email
    * @return {boolean} - true iiff the email is correct format
    */
    static validateEmail(email) {
      return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
    }

  /**
  * Creates this email, password combo, if possible
  * @param {string} email - user's new email
  * @param {string} password - user's new password
  * @return {account} - the account account that was just created
  * @return {false} - iff created unsuccessfully (ex. email already in system, email invalid)
  */
  static createAccount(email, password) {
    const currentaccount = Account.findAccount(email);
    //make sure an account with this name has never been created
    if (currentaccount !== undefined || !Account.validateEmail(email)) {
      return false;
    }
    else {
      let favoriteTrips =  []
      let accountObject = {email, password, favoriteTrips};
      accounts.push(accountObject);
      return accountObject;
    }
  }

  /**
  * Deletes this account by removing the account from the system
  * @param {string} email - user's account email
  * @return {account} - the account that was just deleted
  * @return {false} - iff nothing was deleted
  */
  static deleteAccount(email) {
    const account = Account.findAccount(email);
    if (account !== undefined) {
      accounts = accounts.filter(account => account.email !== email);
      return account;
    }
    else {
      return false;
    }
  }

  /**
  * Modifies the account by changing the password to newPassword
  * @param {string} email - user's email for this account
  * @param {string} newPassword - user's desired, new password
  * @param {account} - the account account that was just modified
  * @return {boolean} - false iff this operation did not modify any account
  */
  static changePassword(email, newPassword) {
    const account = Account.findAccount(email);
    if (account !== undefined) {
      account.password = newPassword;
      return account;
    }
    return false;
  }
  /**
  * Modifies the account by changing the oldEmail to newEmail
  * @param {string} oldEmail - user's current email
  * @param {string} newEmail - user's desired, new email
  * @return {account} - the account account that was just modified
  * @return {boolean} - false iff this operation did not modify any account
  */
  static changeEmail(oldEmail, newEmail) {
    const oldAccount = Account.findAccount(oldEmail);
    const newAccount = Account.findAccount(newEmail);
    //make sure account exists and no one has used requested username and new email is valid
    if (oldAccount !== undefined && newAccount === undefined && Account.validateEmail(newEmail)) {
      oldAccount.email = newEmail;
      return oldAccount;
    }
    return false;
  }
  /**
  * Adds a favorite trup to the account with email email
  * @param {string} email - the user's email account to add favorite trips to
  * @param {Trip} trip - the trip to add to favorites
  * @return {false | tripID} - false iff the email is not associated with an account or the tripID if it worked
  */
  static addFavoriteTrip(email, trip) {
    const favoriteTrips = Account.getFavoriteTrips(email);
    if (favoriteTrips === undefined) {
      return false;
    }
    else {
      let tripID = uuidv1();
      let favTrip = {id: tripID, trip};
      favoriteTrips.push(favTrip);
      return tripID;
    }
  }
  /**
  * Removes the favorite trip with id id from email's favorite trips
  * @param {string} email - the user's email account to remove the favorite trip
  * @param {string} id - the id of the trip to remove
  * @return {boolean} - true iff a trip was actually removed
  */
  static removeFavoriteTrip(email, id) {
    const account       = Account.findAccount(email);
    var favoriteTrips = Account.getFavoriteTrips(email);
    if (favoriteTrips === undefined) {
      return false;
    }
    else {
      let oldCount     = favoriteTrips.length; 
      favoriteTrips    = favoriteTrips.filter(trip => trip.id !== id);
      let newCount     = favoriteTrips.length;
      account.favoriteTrips = favoriteTrips;

      if (oldCount === newCount) {
        return false;
      }
      else {
        return true;
      }
    }
  }
  /**
  * Finds all the favorites trips of the account associated with this email
  * @param {string} email - the user's account account to get favorite trips of
  * @return {boolean | [FavoriteTrip]} - false iff this email does not have an account
  										or the list of FavoriteTrip otherwise
  */
  static getFavoriteTrips(email) {
    const favoriteTrips = accounts.find(account => account.email === email).favoriteTrips;
    if (favoriteTrips === undefined) {
      return false;
    }
    else {
      return favoriteTrips;
    }
  }
  /**
  * Finds whether the trip with the provided details has been favorited by the user
  * @param {string} email - the user's account id
  * @param {string} start - the start address of the trip
  * @param {string} end - the end address of the trip
  * @param {num} stops - the number of stops of the trip
  * @return {false | string} - false iff this given trip has not been favorited by the user,
                            otherwise, the id of this favorited trip
  */
  static isFavoriteTrip(email, start, end, stops) {
    const favoriteTrips = Account.getFavoriteTrips(email);
    if (favoriteTrips === undefined) {
      return false;
    }
    else {
      const favoriteTrip = favoriteTrips.filter(favTrip => 
        favTrip.trip.stops[0].name === start && 
        favTrip.trip.stops[favTrip.trip.stops.length-1].name === end && 
        favTrip.trip.stops.length === stops)[0];
      if (favoriteTrip === undefined) {
        return false;
      }
      else {
        return favoriteTrip.id;
      }
    }
  }
  /**
  * Starts the favorite trip with id id from the account associated with email
  * @param {string} email - the user's account to start favorite trip from
  * @param {string} id - the id of the trip to start
  * @return {boolean | Promise} - false iff this account or trip do not exist
  */
  static startFavoriteTrip(email, id) {
    const favoriteTrips = Account.getFavoriteTrips(email);
    if (favoriteTrips === undefined) {
      return false;
    }
    else {
      let trip = favoriteTrips.filter(favTrip => favTrip.id === id)[0];
      if (trip === undefined) {
        return false;
      }
      else {
        var promise = new Promise(
          function(resolve, reject) {
            let originAddress = trip.stops[0].name
            let destinationAddress = trip.stops[trip.stops.length-1].name
            BlueMaps.findTrip(originAddress, destinationAddress).then(function(formattedTrip) {
              resolve(formattedTrip);
            }, 
            function(errorStr) {
              reject(errorStr);
            })
          }
        )
        return promise;
      }
    }
  }
  /**
  * Sends the trip to the given email
  * @param {string} email - the user's account to send the trip to
  * @param {Trip} trip - the json trip object to send
  */
  static sendTrip(email, trip) {
  	let formattedEmail = Account.formatEmail(trip);
    const now = new Date();
    let dateStr = date.format(now, "MM/DD");

    var mailOptions = {
      from: 'Blue Maps',
      to: email,
      subject: `Your BlueMaps Trip on ${dateStr}`,
      text: formattedEmail,
      html: formattedEmail,
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      }
      else {
        console.log('Email sent: ' + info.response);
      }
    });
 
  }

  static sendTestEmail(email) {

    var mailOptions = {
      from: 'Blue Maps',
      to: email,
      subject: 'Your BlueMaps Trip',
      text: 'Hello world?',
      html: "<b> Hello world? </b>"

    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      }
      else {
        console.log('Email sent: ' + info.response);
      }
    });

  }

  /**
  * Formats the email to send
  * @param {Trip} trip - the json trip object to send
  * Trip is [{start, end, directions}] 
  */
  static formatEmail(trip) {
    var origin = trip[0].start;
    var destination = trip[trip.length - 1].end;
  	let emailStr = "<div> Trip from <b>" + origin + "</b> to <b>" + destination + "</b>";
  	let rightArrow = "→";

  	trip.forEach((route) => {
      emailStr += "<div>";
      emailStr += `${route.start} ${rightArrow} ${route.end}`;
  		emailStr += "</div>";
      route.directions.forEach((direction) => {
        emailStr += "<div>";
        emailStr += "° " + direction;
        emailStr += "</div>";
      });
      emailStr += "<br/>";
  	});
  	return emailStr;
  }


}

module.exports = Account;