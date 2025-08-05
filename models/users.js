const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  mdp: String,
  prénom: String,
  nom: String, 
  genre: String,
  token: String,
  dateDeNaissance: Date,
  taille: Number, 
  idActivite: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'  // fait référence au modèle Activity
  }]

}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});


const User = mongoose.model('User', userSchema);


module.exports = User;