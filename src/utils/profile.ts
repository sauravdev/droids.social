function getProfileData() {
    const profile = JSON.parse(localStorage.getItem('profile')); 
    return profile; 
}

function updateProfileDataInCache(data : any ) {
    localStorage.removeItem('profile') ;
    localStorage.setItem('profile' , JSON.stringify(data) ) ; 
}
export {getProfileData , updateProfileDataInCache} ;


