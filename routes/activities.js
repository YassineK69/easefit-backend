var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");

const User = require("../models/users");
const Activity = require("../models/activities");

// AFFICHAGE DES ACTIVITES 

//Get Calendar : on recup les types de sport et dates pour affichage calendrier

router.get('/calendar/:token', (req,res) => {

    User.findOne({token:req.params.token}).populate({
        path: "idActivities",
        select: "type date -_id",
    })
    .then(user => {
        if(!user) {
            return 'utilisateur non trouvé'
        } 
        res.json({
            activities : user.idActivities
        })
    })
})

// ENREGISTREMENT NOUVELLE ACTIVITE

router.post('/newactivity/:token', (req,res) => {

    User.findOne({token : req.params.token}).then(data => {
        if (!data) {
            res.json({result:false})
        } else {
            const id = data._id
            const newActivity = new Activity({
                title : req.body.title, 
                type : req.body.type,
                duration : req.body.duration, 
                date : req.body.date,
                activitiesPic : [], 
                comment : req.body.comment, 
                grade : req.body.grade, 
                idUser : id,
            })

            newActivity.save().then (savedActivity => {
                User.updateOne(
                    {token : req.params.token}, 
                    {$push: {idActivities:savedActivity._id}}
                )
                .then(()=> {
                    res.json({result : true, newActivity : savedActivity})
                })
            })
        }
    })    
})

module.exports = router;

