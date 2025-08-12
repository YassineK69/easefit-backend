var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");

const User = require("../models/users");
const Activity = require("../models/activities");

// AFFICHAGE DES ACTIVITES //

// Get Calendar : on récupère les types de sport et dates pour affichage calendrier
router.get("/calendar/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .populate({
      path: "idActivities",
      select: "title type date duration grade comment -_id", // tous les champs utiles
    })
    .then((user) => {
      if (!user) {
        return res.json({ result: false, error: "Utilisateur non trouvé" });
      }
      res.json({
        activities: user.idActivities,
      });
    });
});

// ENREGISTREMENT NOUVELLE ACTIVITE
router.post("/newactivity/:token", async (req, res) => {
  try {
    // Recherche de l'utilisateur par token
    const user = await User.findOne({ token: req.params.token });
    if (!user) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }

    const { title, type, date, duration, grade, comment } = req.body;

    // Vérification que tous les champs obligatoires sont présents
    if (!title || !type || !date || !duration || !grade) {
      return res.json({ result: false, error: "Champs manquants" });
    }

    // Vérification qu'il n'existe pas déjà une activité pour ce jour pour cet utilisateur
    // On définit la plage de temps correspondant au jour entier (min et max de la date)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Recherche d'une activité existante sur la même date
    const existingActivity = await Activity.findOne({
      idUser: user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingActivity) {
      // Si une activité existe déjà, on refuse l'ajout
      return res.json({ result: false, error: "Activité déjà enregistrée pour ce jour" });
    }

    // Sinon, création et sauvegarde de la nouvelle activité
    const newActivity = new Activity({
      title,
      type,
      duration,
      date,
      activitiesPic: [],
      comment,
      grade,
      idUser: user._id,
    });

    const savedActivity = await newActivity.save();

    // Mise à jour de l'utilisateur avec l'id de la nouvelle activité
    await User.updateOne(
      { token: req.params.token },
      { $push: { idActivities: savedActivity._id } }
    );

    // Réponse positive avec l'activité créée
    res.json({ result: true, newActivity: savedActivity });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: "Erreur serveur" });
  }
});

// REMPLISSAGE DE LA BDD POUR UN SET DE TEST

const dejaDonne = [];
function createDateRandom() {
  let result;
  do {
    let month = Math.floor(Math.random() * 8) + 1;
    month = month > 9 ? parseInt(month) : "0" + parseInt(month);
    let day = Math.floor(Math.random() * 28) + 1;
    day = day > 9 ? parseInt(day) : "0" + parseInt(day);
    result = `2025-${month}-${day}T00:00:00.000+00:00`;
  } while (dejaDonne.includes(result));
  dejaDonne.push(result);
  return result;
}

const activities = ["Muscu", "Course", "Fitness"];

const setDeTest = Array.from({ length: 100 }, (_, i) => ({
  title: `activité ${i}`,
  type: activities[Math.floor(Math.random() * activities.length)],
  date: createDateRandom(),
  duration: Math.trunc(180 * Math.random()) + 1,
  grade: Math.trunc(5 * Math.random()) + 1,
}));

router.get("/loadsettestdb/:token", async (req, res) => {
  const data = await User.findOne({ token: req.params.token });
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

      const savedActivity = await newActivity.save();
      await User.updateOne(
        { token: req.params.token },
        { $push: { idActivities: savedActivity._id } }
      );
    }
    res.json({ result: true });
  }
});

module.exports = router;
