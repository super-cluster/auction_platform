const express = require("express");
const {db,admin} = require("../utils/firebase");
var access = 0;

const router = express.Router();

router.get("/", (req, res) => {
  res.render("login");
});

// const isAuthenticated = (req,res,next)=>{
//   var user = admin
//   .auth().createUser;
//   if(user){
//     res.render("profile");
//   }else{
//     next();
//   }
// }

// router.use(isAuthenticated);

// function checkAuthentication(req,res,next){
//   var user = admin.auth().createUser;
//   if(user){
//       res.redirect("/profile")
//   }else{

//   }
// }


router.get("/signIn",(req, res) => {
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      res.redirect("/profile");
    })
    .catch((error) => {
      res.render("signIn");
    });
});
router.get("/signUp", (req, res) => {

  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      res.redirect("/profile");
    })
    .catch((error) => {
      res.render("signUp");
    });

});

router.get("/profile",function (req, res) {
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      res.render("profile");
    })
    .catch((error) => {
      res.redirect("/signIn");
    });
});

router.post("/sessionLogin", (req, res) => {
  console.log(req.body);
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.send(({ status: "success" }));
      },
      (error) => {
        console.log(error);
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});



router.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/signIn");
});


router.post("/getAuctions",(req,res)=>{
    var auctions = [];
    db.ref("auctions").once("value", (snapshot) => {
        snapshot.forEach(snap => {
            auctions.push(snap.val());
        });
        res.send({result:auctions});
      });
})



router.post("/placeBid/:auctionNo",async (req,res)=>{
    var auctionName = req.params.auctionNo;
    var bidValue = parseInt(req.body.bidValue);
    var HighestBidValue= await getHighestBid(auctionName);
    // console.log(req.body.highestBid);
    var totalNoOfBids = await getTotalNoOfBids(auctionName);
    console.log(HighestBidValue,bidValue);
   if(access===0){
     access=1;
    if(HighestBidValue.value<bidValue && HighestBidValue.bidderId!=="bid_1"){
      var firstBid = HighestBidValue.type==="highestBid";
      var time = new Date().toUTCString();

      var id = db.ref(`auctions/${auctionName}/item/bidderList/bid_1`).push().key;

      var updatedUserData = {
        highestBid:{
          value:bidValue,
          bidderId:"bid_1",
          time:time
        },
        count:totalNoOfBids+1
      };
      // updatedUserData['bidderList']['bid_1'][id]={
      //   bidValue:bidValue,
      //   time:time,
      //   previousHighestBidValue:HighestBidValue.value,
      //   previousHighestBidTime:!firstBid?"NA":HighestBidValue.time
      // };

      // updatedUserData[`auctions/${auctionName}/item/highestBid`]={
      //     value:bidValue,
      //     bidderId:"bid_1",
      //     time:time
      // }
      // var id = db.ref(`auctions/${auctionName}/item/bidderList/bid_1`).push().key;
      // updatedUserData[`auctions/${auctionName}/item/biddersList/bid_1/${id}`]={
      //     bidValue:bidValue,
      //     time:time,
      //     previousHighestBidValue:HighestBidValue.value,
      //     previousHighestBidTime:!firstBid?"NA":HighestBidValue.time
      // }

      // updatedUserData[`auctions/${auctionName}/item`]={
      //   count:totalNoOfBids+1
      // }

      db.ref(`auctions/${auctionName}/item`).update(updatedUserData,(error)=>{
        if(error){
          console.log(error);
          access=0;
          res.send({message:"not ok"});
        }else{
          db.ref(`auctions/${auctionName}/item/biddersList/bid_1/${id}`).set({
            bidValue:bidValue,
            time:time,
            previousHighestBidValue:HighestBidValue.value,
            previousHighestBidTime:!firstBid?"NA":HighestBidValue.time
          }).then(()=>{
            access=0;
            res.send({message:"ok"});
          }).catch(()=>{
            access=0;
            res.send({message:"not ok"});
          })
        }
      })




    // db.ref(`auctions/${auctionName}/item/highestBid`).update({
    //       value:bidValue,
    //       bidderId:"bid_1",
    //       time:time
    // }).then(()=>{
    //     var id = db.ref(`auctions/${auctionName}/bidderList/bid_1`).push().key;
    //     db.ref(`auctions/${auctionName}/item/biddersList/bid_1/${id}`).set({
    //       bidValue:bidValue,
    //       time:time,
    //       previousHighestBidValue:HighestBidValue.value,
    //       previousHighestBidTime:!firstBid?"NA":HighestBidValue.time
    //     }).then(()=>{
    //       db.ref(`auctions/${auctionName}/item/`).set({
    //         count:totalNoOfBids+1
    //       }).then(()=>{
    //         access=0;
    //         res.send({message:"ok"});
    //       })
    //     }) 
    //   }).catch(error=>{
    //     access=0;
    //     console.log(error);
    //     res.send({message:"not ok"});
    //   })
    // }else{
    // access=0;
    // res.send({message:"not ok"});
    // }
  }else{
    access=0;
    res.send({message:"not ok"});
  }}else{
    res.send({message:"not ok"});
  }


})



db.ref("auctions").on("value", (snapshot) => {
  var auctions = [];
  snapshot.forEach((element) => {
    auctions.push(element.val());
  });
  auctions.forEach((auction) => {
    (async function() {
        while(true) {  
          await sleep(1000);
          var elaspsedDate = end(auction.startDate);
          if(auction.status==="running" && elaspsedDate<86400){
          console.log(elaspsedDate);
          if(elaspsedDate===200){
            var result = await EarlyStage();
            console.log(result,await EarlyStage1());
            console.log(auction.name+" Early Stage");
          }
          if(elaspsedDate===320){
            console.log(auction.name+" Middle Stage");
          }
          if(elaspsedDate===300){
            console.log(auction.name+" Late Stage");
          }
          if(elaspsedDate===390){
            console.log(auction.name+" Final Stage");
            db.ref("auctions/"+auction.name).update({
                status:"ended"
            });
            auction.status = "ended";
          }
        }
    }
      })();
      
  });
});

function end(startTime,endTime=new Date()) {
  // endTime = new Date();
  startTime = Date.parse(startTime);
  endTime = Date.parse(endTime);
  var timeDiff = endTime - startTime; 
  timeDiff /= 1000;
  var seconds = Math.round(timeDiff);
  return seconds;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

const EarlyStage =()=> new Promise((resolve,reject)=>{
    db.ref("users").once("value",(snapshot)=>{
        resolve(snapshot.val());
    })
});

const EarlyStage1 =()=> new Promise((resolve,reject)=>{
    db.ref("amount").once("value",(snapshot)=>{
        resolve(snapshot.val());
    })
});

const getHighestBid = (auctionName)=>{
 return new Promise((resolve,reject)=>{
    db.ref(`auctions/${auctionName}/item/highestBid`).once("value",(snapshot)=>{
      if(snapshot.exists()){
        var object ={
          value:snapshot.val().value,
          bidderId:snapshot.val().bidderId,
          time:snapshot.val().time,
          type:"highestBid"
        }
        resolve(object);
      }else{
        db.ref(`auctions/${auctionName}/item/reserve`).once("value",(snapshot1)=>{
          var object ={
            value:snapshot1.val(),
            type:"reserve"
          }
          resolve(object);
        })
      }
    })
  })
}

async function LSSCaculation (auctionName,startTime,duration){
    const totalNoOfBids = await getTotalNoOfBids(auctionName);
    const totalBidders = await getTotalBidders(auctionName);
    if(totalBidders){
    const participatedBidderIds = Object.keys(totalBidders);

    var maxAvgInterBiddingTime = Number.MIN_SAFE_INTEGER;
    var minAvgInterBiddingTime = Number.MAX_SAFE_INTEGER;
    var maxAvgInterBiddingIncrement = Number.MIN_SAFE_INTEGER;
    var minAvgInterBiddingIncrement = Number.MAX_SAFE_INTEGER;
    var maxBiddingTimeDiff = Number.MIN_SAFE_INTEGER;
    var minBiddingTimeDiff = Number.MAX_SAFE_INTEGER;
    var biddingTimeDiff ;
    participatedBidderIds.forEach(id => {

      //Beta Calculation
      // const worstCase = parseInt(totalNoOfBids/2);
      const totalBidPerBidder = Object.keys(totalBidders[id]);
      // const beta = totalBidPerBidder.length/worstCase;
      // console.log(beta);

      var interBiddingTime = 0;
      var interBiddingIncrement = 0;
      var averageInterBiddingTime ;
      var averageInterBiddingIncrement;
      totalBidPerBidder.forEach((bid,index) => {
        // console.log(index,"index");
        if(index===0){
          firstBidTime = totalBidders[id][bid].time;
          console.log(firstBidTime,startTime,"firstBid",id);
          biddingTimeDiff = end(startTime,firstBidTime);
        }
        console.log(totalBidders[id][bid].previousHighestBidTime);
          if(totalBidders[id][bid].previousHighestBidTime!=="NA"){
              var timeInterval = end(totalBidders[id][bid].previousHighestBidTime,totalBidders[id][bid].time)
              console.log(timeInterval,'inter bidding',id);
              interBiddingTime+=timeInterval;
              interBiddingIncrement+=totalBidders[id][bid].bidValue - totalBidders[id][bid].previousHighestBidValue;
          }
      });

      // console.log(biddingTimeDiff);
       
      averageInterBiddingTime = interBiddingTime/totalBidPerBidder.length;
      averageInterBiddingIncrement = interBiddingIncrement/totalBidPerBidder.length;
      
      if(maxAvgInterBiddingTime<averageInterBiddingTime){
        maxAvgInterBiddingTime=averageInterBiddingTime;
      }
      if(minAvgInterBiddingTime>averageInterBiddingTime){
        minAvgInterBiddingTime=averageInterBiddingTime;
      }

      if(maxAvgInterBiddingIncrement<averageInterBiddingIncrement){
        maxAvgInterBiddingIncrement=averageInterBiddingIncrement;
      }
      if(minAvgInterBiddingIncrement>averageInterBiddingIncrement){
        minAvgInterBiddingIncrement=averageInterBiddingIncrement;
      }

      if(maxBiddingTimeDiff < biddingTimeDiff){
        maxBiddingTimeDiff = biddingTimeDiff;
      }
      if(minBiddingTimeDiff > biddingTimeDiff){
        minBiddingTimeDiff = biddingTimeDiff;
      }

      // console.log(averageInterBiddingTime,id);



});
console.log(minAvgInterBiddingTime,maxAvgInterBiddingTime,minAvgInterBiddingIncrement,maxAvgInterBiddingIncrement,minBiddingTimeDiff,maxBiddingTimeDiff);



    participatedBidderIds.forEach(id => {

          //Beta Calculation
          const worstCase = parseInt(totalNoOfBids/2);
          const totalBidPerBidder = Object.keys(totalBidders[id]);
          const beta = totalBidPerBidder.length/worstCase;
          console.log(beta);

          //
          var interBiddingTime = 0;
          var interBiddingIncrement = 0;
          var averageInterBiddingTime ;
          var averageInterBiddingIncrement;
          totalBidPerBidder.forEach((bid,index) => {
            if(index===0){
              firstBidTime = totalBidders[id][bid].time;
              biddingTimeDiff = end(startTime,firstBidTime);
            }
            console.log(totalBidders[id][bid].previousHighestBidTime);
              if(totalBidders[id][bid].previousHighestBidTime!=="NA"){
                  var timeInterval = end(totalBidders[id][bid].previousHighestBidTime,totalBidders[id][bid].time)
                  console.log(timeInterval,'inter bidding',id);
                  interBiddingTime+=timeInterval;
                  interBiddingIncrement+=totalBidders[id][bid].bidValue - totalBidders[id][bid].previousHighestBidValue;
              }
          });

          averageInterBiddingTime = interBiddingTime/totalBidPerBidder.length;
          averageInterBiddingIncrement = interBiddingIncrement/totalBidPerBidder.length;



          var normalizedBidTimeDiff = 1 -((biddingTimeDiff-minBiddingTimeDiff)/(maxBiddingTimeDiff-minBiddingTimeDiff));
          var normalizedInterBiddingTime =1 - ((averageInterBiddingTime-minAvgInterBiddingTime)/(maxAvgInterBiddingTime-minAvgInterBiddingTime));
          var normalizedInterBidIncrement =1 - ((averageInterBiddingIncrement-minAvgInterBiddingIncrement)/(maxAvgInterBiddingIncrement-minAvgInterBiddingIncrement));


          console.log(normalizedInterBidIncrement,normalizedInterBiddingTime,id,"normal")
          console.log(averageInterBiddingTime,id);
          console.log(minAvgInterBiddingTime,maxAvgInterBiddingTime,minAvgInterBiddingIncrement,maxAvgInterBiddingIncrement,normalizedBidTimeDiff);


          var x1 = 2;
          var x2 = 2;
          var x3 = 2;
          var x4 = 2;
          var x5 = 5;
          var pEarly = 8;
          var pMiddle = 7;
          var pLate = 7;
          var pFinal = 6;

          var Lss = ((x1*beta + x2*normalizedInterBiddingTime + x3*normalizedInterBidIncrement + x4*normalizedBidTimeDiff)/(x1 + x2 + x3 + x4 + x5))*10;
          console.log(Lss,id);

          switch(duration){
            case "early":if(Lss>pEarly){
                          console.log("Penalty 1",id);
                         }
                         break;
            case "middle":if(Lss>pMiddle){
                            console.log("Penalty 2",id);
                          }
                          break;
            case "late":if(Lss>pLate){
                            console.log("Penalty 3",id);
                          }
                          break;

          }

          
          

    });
  }

}

const getTotalNoOfBids = (auctionName)=>{
  return new Promise((resolve,reject)=>{
    db.ref(`auctions/${auctionName}/item/count`).once("value",snapshot=>{
      resolve(snapshot.val());
    })
  })
}

const getTotalBidders = (auctionName)=>{
  return new Promise((resolve,reject)=>{
    db.ref(`auctions/${auctionName}/item/biddersList`).once("value",snapshot=>{
      resolve(snapshot.val());
    })
  })
}

// LSSCaculation("auction1594")
LSSCaculation("auction1594","Thu, 21 Mar 2022 11:10:27 GMT","middle");


module.exports = router;
