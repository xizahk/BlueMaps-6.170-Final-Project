# Routes 
##Trip
PUT api/trip 
1. 200: Returns trip locations of shortest trip between each subsequent pair of input locations
2. 400: Invalid Address(es) or if there are no Blue Bikes available.

##Account
GET api/account
1. 200: Returns the user's email if the user is logged in
2. 409: If the client is not signed in

POST api/account
1. 200: Returns the created login account if successfully created
2. 400: If the email already used, or invalid

PUT api/account/email
1. 200: Returns the newly changed login account if successfully changed
2. 400: If the requested email is already used, or invalid

PUT api/account/password
1. 200: Returns the newly changed login account if successfully changed
2. 400: If the password contains fewer than 8 characters

DELETE api/account
1. 200: Returns the deleted account if successfully deleted
2. 401: If the client is not signed in

PUT api/account/signin
1. 200: Returns the account that was just signed in to if successful
2. 400: If the entered username/password combo does not exist

PUT api/account/signout
1. 200: If successfully signed out
2. 401: If client is not already signed in to

POST api/account/trip
1. 200: Returns the ID of this trip if successfully added to user's saved
2. 401: If client is not signed in

GET api/account/trips
1. 200: Returns the saved trips for this client
2. 401: If client is not signed in

DELETE api/account/trip/:id
1. 200: If successfully removed this trip from saved trips
2. 400: If trip was not already saved for client

PUT api/account/start
1. 200: Returns the trip from user's favorites that was started
2. 401: If client not signed in

PUT api/account/send
1. 200: If trip successfully sent to email
2. 401: If client not signed in

##Docks
GET api/docks
1. 200: Returns a list of the most up-to-date dock info
2. 400: If an error occurred updating the dock info


