var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");

const User = require("../models/users");
const Activity = require("../models/activities");

// AFFICHAGE DES ACTIVITES

//Get Calendar : on recup les types de sport et dates pour affichage calendrier

router.get("/calendar/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .populate({
      path: "idActivities",
      select: "type date -_id",
    })
    .then((user) => {
      if (!user) {
        return "utilisateur non trouvé";
      }
      res.json({
        activities: user.idActivities,
      });
    });
});

// ENREGISTREMENT NOUVELLE ACTIVITE
router.post("/newactivity/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (!data) {
      res.json({ result: false });
    } else {
      const id = data._id;
      const newActivity = new Activity({
        title: req.body.title,
        type: req.body.type,
        duration: req.body.duration,
        date: req.body.date,
        activitiesPic: [],
        comment: req.body.comment,
        grade: req.body.grade,
        idUser: id,
      });

      newActivity.save().then((savedActivity) => {
        User.updateOne(
          { token: req.params.token },
          { $push: { idActivities: savedActivity._id } }
        ).then(() => {
          res.json({ result: true, newActivity: savedActivity });
        });
      });
    }
  });
});


// REMPLISSAGE DE LA BDD POUR UN SET DE TEST

const dejaDonne = []
function createDateRandom() {
    let result;
    do {
        let month = Math.floor(Math.random() * 8) + 1;
        month = month > 9 ? parseInt(month) : "0" + parseInt(month);
        let day = Math.floor(Math.random() * 28) + 1;
        day = day > 9 ? parseInt(day) : "0" + parseInt(day);
        result = `2025-${month}-${day}T00:00:00.000+00:00`
    } while (dejaDonne.includes(result));
    dejaDonne.push(result);
    return result;
}

const activities = ["muscu", "course", "fitness"];

const setDeTest = Array.from({ length: 100 }, (_, i) => ({
  title: `activité ${i}`,
  type: activities[Math.floor(Math.random() * activities.length)],
  date: createDateRandom(),
  duration: Math.trunc(180 * Math.random()) + 1,
  grade: Math.trunc(5 * Math.random()) + 1,
}));

router.get("/loadsettestdb/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((data) => {
    if (!data) {
      res.json({ result: false });
    } else {
      const id = data._id;
      for (let obj of setDeTest) {
        const newActivity = new Activity({
          title: obj.title,
          type: obj.type,
          duration: obj.duration,
          date: obj.date,
          activitiesPic: [],
          comment: "Ceci est un commentaire pour le set de test",
          grade: obj.grade,
          idUser: id,
        });

        newActivity.save().then((savedActivity) => {
          User.updateOne(
            { token: req.params.token },
            { $push: { idActivities: savedActivity._id } }
          ).then(() => {
            res.json({ result: true });
          });
        });
      }
    }
  });
});




module.exports = router;
