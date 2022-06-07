// xxxxxxxxxx Working For Sign Up Form xxxxxxxxxx
// xxxxxxxxxx Full Name Validation xxxxxxxxxx
// console.log(window.location.href);
// if(window.location.href !== "http://localhost:8080/profile"){
//     firebase.auth().onAuthStateChanged((user)=>{
//         if(user){
//             window.location.href="/profile";
//     }else{
//                     console.log("worked");
//                 }
//     })
//     // var user = firebase.auth().currentUser;
//     //         var uid;
//     //         if (user != null) {
//     //             uid = user.uid;
//     //             window.location.href="/profile";
//     //         }else{
//     //             console.log("worked");
//     //         }
// }

function checkUserFullName(){
    var userSurname = document.getElementById("userFullName").value;
    var flag = false;
    if(userSurname === ""){
        flag = true;
    }
    if(flag){
        document.getElementById("userFullNameError").style.display = "block";
    }else{
        document.getElementById("userFullNameError").style.display = "none";
    }
}
// xxxxxxxxxx User Surname Validation xxxxxxxxxx
function checkUserSurname(){
    var userSurname = document.getElementById("userSurname").value;
    var flag = false;
    if(userSurname === ""){
        flag = true;
    }
    if(flag){
        document.getElementById("userSurnameError").style.display = "block";
    }else{
        document.getElementById("userSurnameError").style.display = "none";
    }
}
// xxxxxxxxxx Email Validation xxxxxxxxxx
function checkUserEmail(){
    var userEmail = document.getElementById("userEmail");
    var userEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var flag;
    if(userEmail.value.match(userEmailFormate)){
        flag = false;
    }else{
        flag = true;
    }
    if(flag){
        document.getElementById("userEmailError").style.display = "block";
    }else{
        document.getElementById("userEmailError").style.display = "none";
    }
}
// xxxxxxxxxx Password Validation xxxxxxxxxx
function checkUserPassword(){
    var userPassword = document.getElementById("userPassword");
    var userPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;      
    var flag;
    if(userPassword.value.match(userPasswordFormate)){
        flag = false;
    }else{
        flag = true;
    }    
    if(flag){
        document.getElementById("userPasswordError").style.display = "block";
    }else{
        document.getElementById("userPasswordError").style.display = "none";
    }
}
// xxxxxxxxxx Check user bio characters. It'll use later xxxxxxxxxx
function checkUserBio(){
    var userBio = document.getElementById("userBio").value;
    var flag = false;
    if(flag){
        document.getElementById("userBioError").style.display = "block";
    }else{
        document.getElementById("userBioError").style.display = "none";
    }
}
// xxxxxxxxxx Submitting and Creating new user in firebase authentication xxxxxxxxxx
function signUp(){
    var userFullName = document.getElementById("userFullName").value;
    var userSurname = document.getElementById("userSurname").value;
    var userEmail = document.getElementById("userEmail").value;
    var userPassword = document.getElementById("userPassword").value;
    var userPhone = document.getElementById("userPhone").value;
    var userType = document.getElementById("userType").value;
    var userFullNameFormate = /^([A-Za-z.\s_-])/;    
    var userEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var userPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;      

    var checkUserFullNameValid = userFullName.match(userFullNameFormate);
    var checkUserEmailValid = userEmail.match(userEmailFormate);
    var checkUserPasswordValid = userPassword.match(userPasswordFormate);
    var checkPhoneNumber = userPhone.match(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/);

    if(checkUserFullNameValid == null){
        return checkUserFullName();
    }else if(userSurname === ""){
        return checkUserSurname();
    }else if(checkUserEmailValid == null){
        return checkUserEmail();
    }else if(checkUserPasswordValid == null){
        return checkUserPassword();
    }else if(checkPhoneNumber == null){
        return checkUserPhone();
    }
    // console.log(userPassword,"sidbfhb");
    else{
        firebase.auth().createUserWithEmailAndPassword(userEmail, userPassword).then((userData) => {
            console.log(userData);
            var user = firebase.auth().currentUser;
            console.log(user);
            var uid;
            if (user != null) {
                uid = user.uid;
            }var userData = {
                userFullName: userFullName,
                userSurname: userSurname,
                userEmail: userEmail,
                uid:uid,
                userType:userType,
                phoneNumber:userPhone
            }
            user.sendEmailVerification().then(()=>{
                console.log("ok");
                var firebaseRef = firebase.database().ref(`Users`);
            firebaseRef.child(uid).set(userData,error=>{
                if(error){
                    console.log(error);
                }else{
                    // user.getIdToken().then((idToken)=>{
                    //     $.ajax({
                    //         url:"/sessionLogin",
                    //         method:"POST",
                    //         data:{idToken:idToken},
                    //         success:function(result,status,xhr){
                                swal('Your Account Created','Your account was created successfully, you can log in now. After verifying your Email',
                                ).then((value) => {
                                    setTimeout(function(){
                                        firebase.auth().signOut();
                                        window.location.assign("/signIn");
                                    }, 1000)
                                });
                    //         },
                    //         error:function(xhr,status,error){
                    //             console.log(error);
                    //         }
                    //     })
                    // })
                }
            })
            })
            
        }).catch((error) => {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            swal({
                type: 'error',
                title: errorCode,
                text: errorMessage,
            })
        });
    }
}
// xxxxxxxxxx Working For Sign In Form xxxxxxxxxx
// xxxxxxxxxx Sign In Email Validation xxxxxxxxxx
function checkUserSIEmail(){
    var userSIEmail = document.getElementById("userSIEmail");
    var userSIEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var flag;
    if(userSIEmail.value.match(userSIEmailFormate)){
        flag = false;
    }else{
        flag = true;
    }
    if(flag){
        document.getElementById("userSIEmailError").style.display = "block";
    }else{
        document.getElementById("userSIEmailError").style.display = "none";
    }
}
// xxxxxxxxxx Sign In Password Validation xxxxxxxxxx
function checkUserSIPassword(){
    var userSIPassword = document.getElementById("userSIPassword");
    var userSIPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;      
    var flag;
    if(userSIPassword.value.match(userSIPasswordFormate)){
        flag = false;
    }else{
        flag = true;
    }    
    if(flag){
        document.getElementById("userSIPasswordError").style.display = "block";
    }else{
        document.getElementById("userSIPasswordError").style.display = "none";
    }
}
function checkUserPhone(){
    var userPhone = document.getElementById("userPhone");
    var userPhoneFormat = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    var flag;
    if(userPhone.value.match(userPhoneFormat)){
        flag = false;
    }else{
        flag = true;
    }
    if(flag){
        document.getElementById("userPhoneError").style.display = "block";
    }else{
        document.getElementById("userPhoneError").style.display = "none";
    }
}
// xxxxxxxxxx Check email or password exsist in firebase authentication xxxxxxxxxx    
function signIn(){
    var userSIEmail = document.getElementById("userSIEmail").value;
    var userSIPassword = document.getElementById("userSIPassword").value;
    var userSIEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var userSIPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;      

    var checkUserEmailValid = userSIEmail.match(userSIEmailFormate);
    var checkUserPasswordValid = userSIPassword.match(userSIPasswordFormate);

    if(checkUserEmailValid == null){
        return checkUserSIEmail();
    }else if(checkUserPasswordValid == null){
        return checkUserSIPassword();
    }else{
        firebase.auth().signInWithEmailAndPassword(userSIEmail, userSIPassword).then(({user}) => {
            if(user.emailVerified){
            user.getIdToken().then((idToken)=>{
                $.ajax({
                    url:"/sessionLogin",
                    method:"POST",
                    data:{idToken:idToken},
                    success:function(result,status,xhr){
                        swal({
                            type: 'successfull',
                            title: 'Succesfully signed in', 
                        }).then((value) => {
                            setTimeout(function(){
                                window.location.href="/dashboard"
                            }, 1000)
                        });
                    },
                    error:function(xhr,status,error){
                        console.log(error);
                    }
                })
            })
        }else{
            swal({
                type: 'error',
                title: "Verify your Email",
                text: "Activation link has been sent to your mail",
            })
        }
            
        }).catch((error) => {
            // Handle Errors here.
            console.log(error);
            var errorCode = error.code;
            var errorMessage = error.message;
            swal({
                type: 'error',
                title: errorCode,
                text: errorMessage,
            })
        });
    }
}
// xxxxxxxxxx Show edit profile form with detail xxxxxxxxxx
function showEditProfileForm(){
    document.getElementById("profileSection").style.display = "none"
    document.getElementById("editProfileForm").style.display = "block"
    var userPfFullName = document.getElementById("userPfFullName").innerHTML;
    var userPfSurname = document.getElementById("userPfSurname").innerHTML;
    // var userPfFb = document.getElementById("userPfFb").getAttribute("href");
    // var userPfTw = document.getElementById("userPfTw").getAttribute("href");
    // var userPfGp = document.getElementById("userPfGp").getAttribute("href");
    // var userPfBio = document.getElementById("userPfBio").innerHTML;
    document.getElementById("userFullName").value = userPfFullName; 
    document.getElementById("userSurname").value = userPfSurname; 
    // document.getElementById("userFacebook").value = userPfFb; 
    // document.getElementById("userTwitter").value = userPfTw; 
    // document.getElementById("userGooglePlus").value = userPfGp; 
    // document.getElementById("userBio").value = userPfBio; 
}
// xxxxxxxxxx Hide edit profile form xxxxxxxxxx
function hideEditProfileForm(){
    document.getElementById("profileSection").style.display = "block";
    document.getElementById("editProfileForm").style.display = "none";
}
// xxxxxxxxxx Save profile and update database xxxxxxxxxx
function saveProfile(uid){
    let userFullName = document.getElementById("userFullName").value 
    let userSurname = document.getElementById("userSurname").value 
    // let userFacebook = document.getElementById("userFacebook").value 
    // let userTwitter = document.getElementById("userTwitter").value 
    // let userGooglePlus = document.getElementById("userGooglePlus").value 
    // let userBio = document.getElementById("userBio").value
    var userFullNameFormate = /^([A-Za-z.\s_-])/; 
    var checkUserFullNameValid = userFullName.match(userFullNameFormate);
    if(checkUserFullNameValid == null){
        return checkUserFullName();
    }else if(userSurname === ""){
        return checkUserSurname();
    }else{
        var firebaseRef = firebase.database().ref('Users');
        var userData = {
            userFullName: userFullName,
            userSurname: userSurname
        }
        firebaseRef.child(uid).update(userData);
        swal({
            type: 'successfull',
            title: 'Update successfull',
            text: 'Profile updated.', 
        }).then((value) => {
            setTimeout(function(){
                document.getElementById("profileSection").style.display = "block";

                document.getElementById("editProfileForm").style.display = "none";
            }, 1000)
        });
    }
}
// xxxxxxxxxx Working For Sign Out xxxxxxxxxx
function signOut(){

    $.ajax({
        url:"/sessionLogout",
        method:"POST",
        success:function(result,status,xhr){
            swal({
                type: 'successfull',
                title: 'Signed Out', 
            }).then((value) => {
                setTimeout(function(){
                    window.location.assign("/signIn");
                }, 1000)
            });
        },
        error:function(xhr,status,error){
            let errorMessage = error.message;
            swal({
                type: 'error',
                title: 'Error',
                text: "Error",
            })
        }
    })
}
