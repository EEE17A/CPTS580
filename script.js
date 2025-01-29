var count = 1;
function changeImage() {
    if (count % 2) {
        var img = document.getElementById('profile-img');
        img.src = './public/photo.jpg';
        count = count + 1;
    }
    else {
        var img = document.getElementById('profile-img');
        img.src = './public/profile-photo.jpg';
        count = count + 1;
    }
}
