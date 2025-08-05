var express = require('express');
var router = express.Router();

const User = require('../models/users');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* Get user infos. */
router.get('/user/:token', async (req, res) => {
  const userToken = req.params.token; //revoir

  try {
if (!userToken) {
    return res.status(401).json({ message: 'Token non trouvé' });
    }

  const user = await User.findOne({ token: req.params.token }).populate('Activity');

if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé'});
}

  const userInfo = {
      prenom: user.prenom,
      dateDeNaissance: user.dateDeNaissance,
      genre: user.genre,
      taille: user.taille,
      nombreActivites: user.activities ?
      user.activites.length: 0,
    };

  res.json(userInfo);

  }catch (error) { 
    console.error('Erreur lors de la récupération des données du user :', error);
    res.status(500).json({ message: 'Erreur serveur'});
  }
});

module.exports = router;