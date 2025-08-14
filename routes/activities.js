var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");

const User = require("../models/users");
const Activity = require("../models/activities");
const uniqid = require("uniqid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// AFFICHAGE DES ACTIVITES//

//Get Calendar : on recup les types de sport et dates pour affichage calendrier

router.get("/calendar/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .populate({
      path: "idActivities",
      select: "title type date duration grade comment activitiesPic -_id ", // tous les champs utiles
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

// ENREGISTREMENT NOUVELLE ACTIVITE                                   //MODIF ROUTE POUR PHOTO GALERIE+IMPORT //
router.post("/newactivity/:token", async (req, res) => {
  try {
    const data = await User.findOne({ token: req.params.token });
    if (!data) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }

    if (
      !req.body.title ||
      !req.body.type ||
      !req.body.date ||
      !req.body.duration ||
      !req.body.grade
    ) {
      return res.json({ result: false, error: "Champs manquants" });
    }

    // Vérification qu'il n'existe pas déjà une activité pour ce jour pour cet utilisateur
    // On définit la plage de temps correspondant au jour entier (min et max de la date)
    const startOfDay = new Date(req.body.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.body.date);
    endOfDay.setHours(23, 59, 59, 999);

    // Recherche d'une activité existante sur la même date
    const existingActivity = await Activity.findOne({
      idUser: data._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (existingActivity) {
      // Si une activité existe déjà, on refuse l'ajout
      return res.json({
        result: false,
        error: "Activité déjà enregistrée pour ce jour",
      });
    }

    if (!req.files || !req.files.activitiesPic) {
      return res.json({ result: false, error: "Image manquante" });
    }

    const activitiesPicPath = `/tmp/${uniqid()}.jpg`; //Enlever le '.' avant le déploiement
    const resultMove = await req.files.activitiesPic.mv(activitiesPicPath);

    if (resultMove) {
      return res.json({ result: false, error: "erreur move" });
    }
    //error: resultMove
    const resultCloudinary = await cloudinary.uploader.upload(
      activitiesPicPath
    );

    fs.unlinkSync(activitiesPicPath);

    const id = data._id;
    const newActivity = new Activity({
      title: req.body.title,
      type: req.body.type,
      duration: req.body.duration,
      date: new Date(req.body.date),
      activitiesPic: resultCloudinary.secure_url,
      comment: req.body.comment,
      grade: req.body.grade,
      idUser: id,
    });

    const savedActivity = await newActivity.save();

    await User.updateOne(
      { token: req.params.token },
      { $push: { idActivities: savedActivity._id } }
    );
    const formattedActivity = {
      title: savedActivity.title,
      type: savedActivity.type,
      duration: savedActivity.duration,
      date: new Date(savedActivity.date),
      activitiesPic: resultCloudinary.secure_url,
      comment: savedActivity.comment,
      grade: savedActivity.grade,
    };

    res.json({ result: true, newActivity: formattedActivity });
  } catch (error) {
    res.json({ result: false, error: "Erreur Update" });
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

const activities = ["Muscu", "Muscu", "Muscu", "Course", "Fitness"];

const setDeTest = Array.from({ length: 100 }, (_, i) => ({
  title: `activité ${i}`,
  type: activities[Math.floor(Math.random() * activities.length)],
  date: createDateRandom(),
  duration: Math.trunc(170 * Math.random()) + 11,
  grade: Math.trunc(5 * Math.random()) + 1,
}));
//
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

// REMPLISSAGE DE LA BDD POUR L AJOUT D4UNE PHOTO SUPPLEMENTAIRE
router.post("/addPicture/:token", async (req, res) => {
  try {
    const data = await User.findOne({ token: req.params.token });
    if (!data) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }
    if (!req.body.idActivity) {
      return res.json({ result: false, error: "Champ idActivity manquant" });
    }
    // Vérification qu'il n'existe pas déjà une activité pour ce jour pour cet utilisateur
    const existingActivity = await Activity.findOne({
      idUser: data._id,
      _id: req.body.idActivity,
    });
    if (!existingActivity) {
      return res.json({
        result: false,
        error: "Activité non enregistrée pour ce jour",
      });
    }

    if (!req.files || !req.files.activitiesPic) {
      return res.json({ result: false, error: "Image manquante" });
    }
    const activitiesPicPath = `/tmp/${uniqid()}.jpg`; //Enlever le '.' avant le déploiement
    const resultMove = await req.files.activitiesPic.mv(activitiesPicPath);

    if (resultMove) {
      return res.json({ result: false, error: resultMove });
    }
    const resultCloudinary = await cloudinary.uploader.upload(
      activitiesPicPath
    );

    fs.unlinkSync(activitiesPicPath);
    await Activity.updateOne(
      {_id: req.body.idActivity, },
      { $push: { activitiesPic: resultCloudinary.secure_url } }
    );
    res.json({ result: true });
  } catch (error) {
    res.json({ result: false, error: error });
  }
});

module.exports = router;
