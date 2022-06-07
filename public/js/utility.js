function timer(auctions) {
  setInterval(() => {

    auctions.forEach(element => {
      countDown(element.val());
    });

  }, 1000);
}

function countDown(auction){
  var now = new Date().getTime();
    
      var timeleft = Date.parse(auction.startDate)+ 86400000 - now;
  
      // console.log(timeleft);
      if(timeleft>0 && isLive(auction).isLive){
  
      var hours = Math.floor(
        (timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
  
  document.getElementById(`${auction.name}hours`).innerHTML = hours + "h " 
  document.getElementById(`${auction.name}mins`).innerHTML = minutes + "m " 
  document.getElementById(`${auction.name}secs`).innerHTML = seconds + "s"
      }
}

function countDown1(auction){
  setInterval(() => {
    countDown(auction);
  }, 1000);
}

function isLive(auction){
  var now = new Date().getTime();
    
  var timeleft =now - Date.parse(auction.startDate);

  // console.log(timeleft,auction);
  if(timeleft<0){
    // console.log(auction);
    return {
      isLive:false,
     reason:"upcoming"    
    };
  }else if (timeleft>=0 && timeleft<=86400000){
    return {
      isLive:true,
      reason:null
    };
  }else{
    return {
      isLive:false,
      reason:"ended"
    };
  }
}
function numFormatter(num) {
  if(num > 999 && num < 1000000){
      return (num/1000).toFixed(1) + 'K'; // convert to K for number from > 1000 < 1 million 
  }else if(num >= 1000000){
      return (num/1000000).toFixed(1) + 'M'; // convert to M for number from > 1 million 
  }else if(num < 900){
      return num; // if value < 1000, nothing to do
  }
}

