const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  idUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // clé étrangère vers la collection users
    required: true
  },
  sport: String,
  titre: String,
  duration: Number,
  distance: Number, // en kilomètres
  notes: Number,
  commentaires: String,
   
  date: {
    type: Date,
    default: Date.now
  },
  
});

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;