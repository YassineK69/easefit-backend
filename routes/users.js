var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
require("../models/connection");
})

const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const User = require("../models/users");

//comment
/* signIn */
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({
        result: false,
        error: "Pas de compte trouvé, reessayez ou inscrivez-vous",
      });
    }
  });
});

/* signUp */
router.post("/signup", (req, res) => {
  console.log("route reçue", req.body);
  if (
    !checkBody(req.body, [
      "email",
      "password",
      "lastName",
      "firstName",
      "gender",
      "birthday",
      "height",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const newUser = new User({
        email: req.body.email,
        password: hash,
        token: uid2(32),
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        gender: req.body.gender,
        birthday: req.body.birthday,
        height: req.body.height,
        profilePic: "avatar.png",
        idActivities: [],
      });

      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // User already exist in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

/* Get user infos. */
router.get('/user/:token', async (req, res) => {
  const userToken = req.params.token;
  try {
if (!userToken) {
    return res.status(401).json({ message: 'Token non trouvé' });
    }

  const user = await User.findOne({ token: userToken }).populate('idActivities');
if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé'});
}

  const userInfo = {
      firstName: user.firstName,
      birthday: user.birthday,
      gender: user.gender,
      height: user.height,
      idActivities: user.idActivities.length,
    };
  res.json(userInfo);

  }catch (error) { 
    console.error('Erreur lors de la récupération des données du user :', error);
    res.status(500).json({ message: 'Erreur serveur'});
  }
});

module.exports = router;