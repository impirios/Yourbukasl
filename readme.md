Documentation of the API

For the Schemas of the objects refer to /src/models
files
Card.js //Card Schema
user.js //User Schema



Routes:

Note :- All the arguments,Parameters mentioned are important and the keys should be the same as mentioned

1 /api/signup  method POST
arguments:-
upload-----(An image file)
Username
Password
Email
Dob
Phonenumber

2 /api/login   method POST
arguments:-
Email
Password

3 /api/user     method GET
arguments:-
id

4 /uploads/:filename  method GET
desc: gets the file object which have the name :filename 
parameters:-
filename

5 /images/:filename method GET
desc: returns the image file with name :filename
parameters:-
filename

6 /cards/:filename method GET
desc: returns the Card image with name :filename
parameters:-
filename

7 /cards/category/:category method GET
desc: returns all the card object with category :category either Premium or Basic 
parameters:-
category (either Basic or Premium)

8 /api/linkusers method POST
desc: adds the profile picture of user1 into the contact list of user2 and vice versa
parameters:-
id1(user 1's ID)
id2(user 2's ID)

9 /api/uploadCard method POST
desc: uploads A card image and sets the category
parameters:-
upload (card image file)
category(Basic or Premium)