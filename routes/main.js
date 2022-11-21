const express = require("express");
const {db,admin} = require("../utils/firebase");
const Vonage = require('@vonage/server-sdk')
const Razorpay = require('razorpay');
const { resolve } = require("path");

var instance = new Razorpay({
  key_id: 'Key_Id',
  key_secret: 'Key_Secret',
});

const vonage = new Vonage({
  apiKey: "apiKey",
  apiSecret: "apiSecret"
})

var access = {};

const router = express.Router();

router.get("/", (req, res) => {
  res.redirect("signIn")
});

router.get("/signIn",(req, res) => {
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      res.redirect("/dashboard");
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
      res.redirect("/dashboard");
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
      res.render("profile",{userData:userData});
    })
    .catch((error) => {
      res.redirect("/signIn");
    });
});

router.get("/dashboard",(req,res)=>{
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(async function (userData){
        var user = await getUserProfile(userData.user_id);
        console.log(user);
        if(user.userType=="Bidder")
        res.render("dashBoard",{userData:userData,user:user});
        else if(user.userType=="admin"){
          res.render("adminPage",{userData:userData,user:user});
        }else{
          res.render("seller",{userData:userData,user:user});
        }
    })
    .catch((error) => {
      res.redirect("/signIn");
    });
})

router.post("/sendSms",(req,res)=>{
  
})


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
        console.log(auctions);
        res.send({result:auctions});
      });
})

router.post("/getAuctionSeller",(req,res)=>{
  console.log(req.body.uid);
  var auctions = [];
  db.ref("auctions").once("value", (snapshot) => {
      snapshot.forEach(snap => {
        if(snap.val().seller===req.body.uid)
          auctions.push(snap.val());
      });
      console.log(auctions);
      res.send({result:auctions});
    });
})

router.post("/getRequests",async (req,res)=>{
  var requests = [];
    db.ref("Requests").once("value", (snapshot) => {
        snapshot.forEach(snap => {
            requests.push(snap.val());
        });
        // console.log(auctions);
        res.send({result:requests});
      });
})

router.post("/createOrder",async (req,res)=>{
  var amount = req.body.amount;
  console.log(amount);
  var order = instance.orders.create({
    amount: amount,
    currency: "INR",
    receipt: "receipt#1",
  }).then(order=>{
    res.send({order_id:order.id})
    // console.log(order);
  })
})

router.post("/api/payment/verify",(req,res)=>{
  body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  var crypto = require("crypto");
  var expectedSignature = crypto.createHmac('sha256', 'FlkuQMq5sVo8YtRgYPYUokri')
                                  .update(body.toString())
                                  .digest('hex');
                                  console.log("sig"+req.body.razorpay_signature);
                                  console.log("sig"+expectedSignature);
  var response = {"status":"failure"}
  if(expectedSignature === req.body.razorpay_signature)
   response={"status":"success"}
      res.send(response);
  });


router.get("/auction/:auctionName",async (req,res)=>{
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(async function (userData){
        var user = await getUserProfile(userData.user_id);
        var auctionInfo = await getAuctionInfo(req.params.auctionName);
         console.log(auctionInfo);
         res.render("auctionPage",{auction:auctionInfo,user:user});
    })
    .catch((error) => {
      res.redirect("/signIn");
    });
})

router.post("/placeBid/:auctionNo",async (req,res)=>{
    // console.log(access);
    var auctionName = req.params.auctionNo;
    var bidValue = parseInt(req.body.bidValue);
    console.log(auctionName);
    const sessionCookie = req.cookies.session || "";
    admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(async (userData) => {
      var userId = userData.user_id;
    console.log(userId);
    // var BidderList = await getTotalBidders(auctionName);
    // console.log(BidderLis);
    // var highestBid = getHighestBid(auctionName);
    // BidderList.forEach(ubid => {

    // });
    var HighestBidValue= await getHighestBid(auctionName);

    console.log(HighestBidValue,bidValue);
  //  if(access[auctionName]===0){
  //    access[auctionName]=1;
    //  HighestBidValue.value<bidValue && HighestBidValue.bidderId!==userId
    if(HighestBidValue.value<bidValue){
      var firstBid = HighestBidValue.type==="highestBid";
      var time = new Date().toUTCString();

      var id = db.ref(`auctions/${auctionName}/item/bidderList/${userId}`).push().key;



      



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

          db.ref(`auctions/${auctionName}/item/biddersList/${userId}/${id}`).set({
            bidValue:bidValue,
            time:time,
            previousHighestBidValue:HighestBidValue.value,
            previousHighestBidTime:!firstBid?"NA":HighestBidValue.time
          }).then(()=>{
            db.ref(`auctions/${auctionName}/seller`).once("value",snapshot=>{
                var seller = snapshot.val();
                console.log(seller
                  );
                db.ref(`Users/${userId}/participatedAuction/${auctionName}`).set({
                  status:"particiapted",
                  lastBidValue:bidValue,
                  time:time,
                  sellerId:seller
                }).then(()=>{
                  res.send({message:"ok"});
                }).catch(()=>{
                  res.send({message:"not ok"});
                })
            })
            // access[auctionName]=0;
          }).catch(()=>{
            // access[auctionName]=0;
            res.send({message:"not ok"});
          })

  }else{
    // access[auctionName]=0;
    // if(HighestBidValue.bidderId===userId)
    // res.send({message:"highest"});
    res.send({message:"value"});
  }
// }else{
//     res.send({message:"wait"});
//   }
})
.catch((error) => {
  res.redirect("/signIn");
});

// console.log(access);
})

// db.ref("auctions").on("value",(snapshot)=>{
//   // console.log(snapshot.val());
//   snapshot.forEach((element) => {
//     if(!access.hasOwnProperty(element.val().name))
//      access[element.val().name]=0;
//   });

// })


db.ref("auctions").on("value", (snapshot) => {

  var auctions = [];
  snapshot.forEach((element) => {
    auctions.push(element.val());
  });
  auctions.forEach((auction) => {
    var HighestBidValue = auction.item.hasOwnProperty("highestBid")?auction.item['highestBid']:auction.item.reserve;
    (async function() {
        while(true) {
          await sleep(1000);
          var elaspsedDate = end(auction.startDate);
          if(auction.status==="running" && elaspsedDate<86400){
          console.log("elapsed time",elaspsedDate);
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

// const getHighestBid = (auctionName)=>{
//  return new Promise((resolve,reject)=>{
//     db.ref(`auctions/${auctionName}/item/highestBid`).once("value",(snapshot)=>{
//       if(snapshot.exists()){
//         var object ={
//           value:snapshot.val().value,
//           bidderId:snapshot.val().bidderId,
//           time:snapshot.val().time,
//           type:"highestBid"
//         }
//         resolve(object);
//       }else{
//         db.ref(`auctions/${auctionName}/item/reserve`).once("value",(snapshot1)=>{
//           var object ={
//             value:snapshot1.val(),
//             type:"reserve"
//           }
//           resolve(object);
//         })
//       }
//     })
//   })
// }

async function LSSCaculation (auctionName,startTime,duration){
    // const totalNoOfBids = await getTotalNoOfBids(auctionName);
    const totalBidders = await getTotalBidders(auctionName);
    var participatedBidderIds;
    if(totalBidders){
    participatedBidderIds = Object.keys(totalBidders);

    //Calculating total Bids
    var totalNoOfBids = 0;
    participatedBidderIds.forEach(bids => {
      totalNoOfBids+=Object.keys(totalBidders[bids]).length;
    });
    //Calculating total Bids end

    console.log("total bids",totalNoOfBids);

    var maxAvgInterBiddingTime = Number.MIN_SAFE_INTEGER;
    var minAvgInterBiddingTime = Number.MAX_SAFE_INTEGER;
    var maxAvgInterBiddingIncrement = Number.MIN_SAFE_INTEGER;
    var minAvgInterBiddingIncrement = Number.MAX_SAFE_INTEGER;
    var maxBiddingTimeDiff = Number.MIN_SAFE_INTEGER;
    var minBiddingTimeDiff = Number.MAX_SAFE_INTEGER;
    var biddingTimeDiff ;

    for(const id of participatedBidderIds){
    // participatedBidderIds.forEach(async (id) => {

      //Alpha Calculation


      //Alpha Calculation End

      //Beta Calculation
      // const worstCase = parseInt(totalNoOfBids/2);

      const totalBidPerBidder = Object.keys(totalBidders[id]);
      // const beta = totalBidPerBidder.length/worstCase;
      // console.log(beta);

      var interBiddingTime = 0;
      var interBiddingIncrement = 0;
      var averageInterBiddingTime ;
      var averageInterBiddingIncrement;


     

      // particiaptedAuctionIds.forEach(async (auctionId) => {
        // var totalBidsObject = await getTotalBid(auctionName,id);
        // console.log(auctionId,id,totalBidsObject);
        // var totalBids = Object.keys(totalBidsObject);

        var localInterBidTime = 0;
        var localInterBidIncrement = 0;


        totalBidPerBidder.forEach((bid,index) => {
          console.log("bidder ",bid,id);
          if(index===0){
            firstBidTime = totalBidders[id][bid].time;
            console.log(firstBidTime,startTime,"firstBid",bid,id);
            biddingTimeDiff = end(startTime,firstBidTime);
          }else{
          console.log(totalBidders[id][bid].previousHighestBidTime);
            // if(totalBidders[id][bid].previousHighestBidTime!=="NA"){
                var timeInterval = end(totalBidders[id][bid].previousHighestBidTime,totalBidders[id][bid].time)
                console.log(timeInterval,'inter bidding',id);
                localInterBidTime+=timeInterval;
                console.log(interBiddingTime," i");
                localInterBidIncrement+=totalBidders[id][bid].bidValue - totalBidders[id][bid].previousHighestBidValue;
            // }
          }
        });

        localInterBidTime/=totalBidPerBidder.length;
        localInterBidIncrement/=totalBidPerBidder.length;

        if(maxBiddingTimeDiff<biddingTimeDiff)maxBiddingTimeDiff = biddingTimeDiff;
        if(minBiddingTimeDiff>biddingTimeDiff)minBiddingTimeDiff = biddingTimeDiff;
        if(localInterBidTime>maxAvgInterBiddingTime)maxAvgInterBiddingTime = localInterBidTime;
        if(localInterBidTime<minAvgInterBiddingTime)minAvgInterBiddingTime = localInterBidTime;
        if(localInterBidIncrement>maxAvgInterBiddingIncrement)maxAvgInterBiddingIncrement=localInterBidIncrement;
        if(localInterBidIncrement<minAvgInterBiddingIncrement)minAvgInterBiddingIncrement = localInterBidIncrement

        // interBiddingTime+=localInterBidTime;
        // interBiddingIncrement+=localInterBidIncrement;

      // });
      // }

    // }



      // var rapidOutBidTime = 0;
      // console.log(interBiddingTime);
      // if(particiaptedAuctionIds.length>0)
      // rapidOutBidTime = 1-(interBiddingTime/particiaptedAuctionIds.length);
      // console.log("Rapid -> ",rapidOutBidTime,id);


      // I changed upto here


      // totalBidPerBidder.forEach((bid,index) => {
      //   // console.log(index,"index");
      //   if(index===0){
      //     firstBidTime = totalBidders[id][bid].time;
      //     console.log(firstBidTime,startTime,"firstBid",bid);
      //     biddingTimeDiff = end(startTime,firstBidTime);
      //   }
      //   console.log(totalBidders[id][bid].previousHighestBidTime);
      //     // if(totalBidders[id][bid].previousHighestBidTime!=="NA"){
      //         var timeInterval = end(totalBidders[id][bid].previousHighestBidTime,totalBidders[id][bid].time)
      //         console.log(timeInterval,'inter bidding',id);
      //         interBiddingTime+=timeInterval;
      //         interBiddingIncrement+=totalBidders[id][bid].bidValue - totalBidders[id][bid].previousHighestBidValue;
      //     // }
      // });


      // console.log(biddingTimeDiff);
       
      // averageInterBiddingTime = interBiddingTime/totalBidPerBidder.length;
      // averageInterBiddingIncrement = interBiddingIncrement/totalBidPerBidder.length;
      
      // if(maxAvgInterBiddingTime<averageInterBiddingTime){
      //   maxAvgInterBiddingTime=averageInterBiddingTime;
      // }
      // if(minAvgInterBiddingTime>averageInterBiddingTime){
      //   minAvgInterBiddingTime=averageInterBiddingTime;
      // }

      // if(maxAvgInterBiddingIncrement<averageInterBiddingIncrement){
      //   maxAvgInterBiddingIncrement=averageInterBiddingIncrement;
      // }
      // if(minAvgInterBiddingIncrement>averageInterBiddingIncrement){
      //   minAvgInterBiddingIncrement=averageInterBiddingIncrement;
      // }

      // if(maxBiddingTimeDiff < biddingTimeDiff){
      //   maxBiddingTimeDiff = biddingTimeDiff;
      // }
      // if(minBiddingTimeDiff > biddingTimeDiff){
      //   minBiddingTimeDiff = biddingTimeDiff;
      // }

      // console.log(averageInterBiddingTime,id);



// });
    }
// console.log(minAvgInterBiddingTime,maxAvgInterBiddingTime,minAvgInterBiddingIncrement,maxAvgInterBiddingIncrement,minBiddingTimeDiff,maxBiddingTimeDiff);



    for(const id of participatedBidderIds){

          //Beta Calculation
          const worstCase = totalNoOfBids/2;
          const totalBidPerBidder = Object.keys(totalBidders[id]);
          const beta = totalBidPerBidder.length/worstCase;

          console.log(beta,"beta");


          var particiaptedAuctionObject = await getParticipatedAuction(id);
          var particiaptedAuctionIds = Object.keys(particiaptedAuctionObject);
    
          // console.log("user participated",particiaptedAuctionIds,id);
    
          // for(const auctionId of particiaptedAuctionIds){
          var auctionWon = 0;
          for(const partAuctionId of particiaptedAuctionIds){
            if(particiaptedAuctionObject[partAuctionId].status === "won")
              auctionWon++;
          }
          var gamaRating = 0;
          if(particiaptedAuctionIds.length>0)
          gamaRating = 1 - (auctionWon/particiaptedAuctionIds.length)

          //
          var interBiddingTime = 0;
          var interBiddingIncrement = 0;
          var averageInterBiddingTime = 0 ;
          var averageInterBiddingIncrement = 0;

          var localInterBidTime = 0;
          var localInterBidIncrement = 0;


        totalBidPerBidder.forEach((bid,index) => {
          console.log("bidder ",bid,id);
          if(index===0){
            firstBidTime = totalBidders[id][bid].time;
            console.log(firstBidTime,startTime,"firstBid",bid,id);
            biddingTimeDiff = end(startTime,firstBidTime);
          }else{
          console.log(totalBidders[id][bid].previousHighestBidTime);
            // if(totalBidders[id][bid].previousHighestBidTime!=="NA"){
                var timeInterval = end(totalBidders[id][bid].previousHighestBidTime,totalBidders[id][bid].time)
                console.log(timeInterval,'inter bidding',id);
                localInterBidTime+=timeInterval;
                console.log(interBiddingTime," i");
                localInterBidIncrement+=totalBidders[id][bid].bidValue - totalBidders[id][bid].previousHighestBidValue;
            // }
          }
        });

        localInterBidTime/=totalBidPerBidder.length;
        localInterBidIncrement/=totalBidPerBidder.length;


        var normalizedBidTimeDiff =  0 ;        
        var normalizedInterBiddingTime = 0;
        var normalizedInterBidIncrement = 0;
        if(maxBiddingTimeDiff!==minBiddingTimeDiff)
          normalizedBidTimeDiff = 1 -((biddingTimeDiff-minBiddingTimeDiff)/(maxBiddingTimeDiff-minBiddingTimeDiff));
        if(maxAvgInterBiddingTime!==minAvgInterBiddingTime)
          normalizedInterBiddingTime = 1 - ((localInterBidTime-minAvgInterBiddingTime)/(maxAvgInterBiddingTime-minAvgInterBiddingTime));
        if(minAvgInterBiddingIncrement!==maxAvgInterBiddingIncrement)
          normalizedInterBidIncrement = 1 - ((localInterBidIncrement-minAvgInterBiddingIncrement)/(maxAvgInterBiddingIncrement-minAvgInterBiddingIncrement));


        console.log(normalizedInterBidIncrement,normalizedInterBiddingTime,id,"normal")
        console.log(averageInterBiddingTime,id);
        console.log(minAvgInterBiddingTime,maxAvgInterBiddingTime,minAvgInterBiddingIncrement,maxAvgInterBiddingIncrement,normalizedBidTimeDiff);
        console.log(gamaRating," won lose");


          var x1 = 2;
          var x2 = 2;
          var x3 = 2;
          var x4 = 2;
          var x5 = 5;
          var pEarly = 8;
          var pMiddle = 7;
          var pLate = 7;
          var pFinal = 6;

          var Lss = ((x1*beta + x2*normalizedInterBiddingTime + x3*normalizedInterBidIncrement + x4*normalizedBidTimeDiff)/(x1 + x2 + x3 + x4 ))*10;
          console.log(Lss,id);

          switch(duration){
            case "early":if(Lss>pEarly){
                          db.ref(`User/${id}/Penalties/${auctionName}`).set({
                            "penalty1":true,
                            "read":false
                          })
                         }
                         break;
            case "middle":if(Lss>pMiddle){
                            db.ref(`User/${id}/Penalties/${auctionName}`).set({
                            "penalty2":true,
                            "read":false
                            }).then(()=>{
                              db.ref(`auctions/${auctionName}/Monitoring`).set({
                                "suspectedBehavious":true
                              }).then(()=>{
                                pauseAuction(auctionName,delay);
                              }) 
                            })
                          }
                          break;
            case "late":if(Lss>pLate){
                            db.ref(`User/${id}/Penalties/${auctionName}`).set({
                            "penalty3":true,
                            "read":false
                            }).then(()=>{
                              db.ref(`auctions/${auctionName}/Monitoring`).set({
                                "suspectedBehavious":true
                              }).then(()=>{
                                stopAuction(auctionName,delay);
                              }) 
                            })
                          }
                          break;
            case "final":
               var highestBid = await getHighestBid(auctionName);
               if(highestBid.type!=="reserve"){
                 var winnerId = highestBid.bidderId;
                 db.ref(`User/${winnerId}/participatedAuction/${auctionName}`).update({
                   status:"won"
                 }).then(()=>{
                   db.ref(`auctions/${auctionName}/winner`).set({
                     winnerId:winnerId
                   }).then(()=>{
                     db.ref(`auctions/${auctionName}`).update({
                       status:"ended"
                     })
                   })
                 })
               }
              // var LssFinal = ((x1*beta + x2*normalizedInterBiddingTime + x3*normalizedInterBidIncrement + x4*normalizedBidTimeDiff + x5*gamaRating)/(x1 + x2 + x3 + x4 +x5))*10;
              // if(LssFinal>pFinal){
              //   db.ref(`User/${id}/Penalties/${auctionName}`).set({
              //     "penalty4":true,
              //     "read":false
              //     }).then(()=>{
              //       db.ref(`auctions/${auctionName}/Monitoring`).set({
              //         "suspectedBehavious":true
              //       }).then(()=>{
              //         stopAuction(auctionName,delay);
              //       }) 
              //     })
              //   }
              // }
            
            

          }

          
          

    }
  }

}

// const getTotalNoOfBids = (auctionName)=>{
//   return new Promise((resolve,reject)=>{
//     db.ref(`auctions/${auctionName}/item/BidderList`).once("value",snapshot=>{
//       resolve(snapshot.val());
//     })
//   })
// }

const getTotalBid = (auctionId,bid)=>{
  return new Promise((resolve,reject)=>{
    db.ref(`auctions/${auctionId}/item/biddersList/${bid}`).once("value",snapshot=>{
      if(snapshot.exists()){
        resolve(snapshot.val());
      }else{
        resolve({});
      }
     
    })
  })
}

const getParticipatedAuction = (bid)=>{
  return new Promise((resolve,reject)=>{
    db.ref(`Users/${bid}/participatedAuction`).once("value",snapshot=>{
      if(snapshot.exists()){
        resolve(snapshot.val());
      }else{
        resolve({});
      }
    })
  })
}

const getTotalBidders = (auctionName)=>{
  return new Promise((resolve,reject)=>{
    db.ref(`auctions/${auctionName}/item/biddersList`).once("value",snapshot=>{
      if(snapshot.exists()){
        resolve(snapshot.val());
      }else{
        resolve({});
      }
     
    })
  })
}


async function getHighestBid(auctionName){
  var highestBid = -Infinity;
  var BidderList = await getTotalBidders(auctionName);
  var totalBidders = Object.keys(BidderList);
  var object;
  totalBidders.forEach(bid => {
    var bidList = Object.keys(BidderList[bid]);
    bidList.forEach(ubid => {
      console.log(BidderList[bid][ubid]);
      if(highestBid<=BidderList[bid][ubid].bidValue){
       object ={
                  value:BidderList[bid][ubid].bidValue,
                  bidderId:bid,
                  time:BidderList[bid][ubid].time,
                  type:"highestBid"
      }
      highestBid = BidderList[bid][ubid].bidValue;
    }
    });
  });
  if(highestBid===-Infinity){
    db.ref(`auctions/${auctionName}/item/reserve`).once("value",(snapshot1)=>{
      object ={
        value:snapshot1.val(),
        type:"reserve"
      }
      return object;
    });
   
  }
  return object;
}



const getAuctionInfo = (auctionName)=>{
  return new Promise((resolve,reject)=>{
    db.ref(`auctions/${auctionName}`).once("value",snapshot=>{
      resolve(snapshot.val());
    })
  })
}

const getUserProfile = (id)=>{
  return new Promise((resolve,reject)=>{
      db.ref(`Users/${id}`).once("value",snapshot=>{
        resolve(snapshot.val());
      })
  })
}

// LSSCaculation("auction1594")
LSSCaculation("-N0QqtPGHVS0mJqrCfIA","Mon, 29 Apr 2022 13:57:07 GMT","early");


// send sms 
function sendSMS(to,msg){
  const from = "Aucx"
  const text = msg;

  vonage.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
        console.log(err);
    } else {
        if(responseData.messages[0]['status'] === "0") {
            console.log("Message sent successfully.");
        } else {
            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
        }
    }
  })
}


module.exports = router;
