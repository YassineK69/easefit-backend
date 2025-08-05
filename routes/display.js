var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");

require('../models/connection');
const User = require("../models/users");

//Get Calendar : on recup les types de sport et dates pour affichage calendrier

router.get('/calendar/:id', (req,res) => {

    const now = new Date(); 
    const dateLimit = new Date(now.setDate(now.getDate()-30)); 

    User.findById(req.params.id).populate({
        path: "idActivities",
        match: { date: { $gte: dateLimit } },
        select: "type date -_id",
    })
    .then(user => {
        if(!user) {
            return 'utilisateur non trouvé'
        } 
        res.json({
            user : {id : user._id}, activities : user.activities
        })
    })
})

module.exports = router;