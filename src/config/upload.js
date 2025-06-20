const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
	cloud_name: 'dbs2lqchy',
	api_key: '645256847652639',
	api_secret: 'LKOwlz8ZO-xbKmevk73UIw7ohHY',
});

const storage = new CloudinaryStorage({
	cloudinary,
	allowedFormats: ['jpg', 'png'],
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + file.originalname);
	},
});

// Cấu hình file upload
const upload = multer({ storage });

module.exports = { upload, cloudinary };
//CLOUDINARY_URL=cloudinary://<645256847652639>:<LKOwlz8ZO-xbKmevk73UIw7ohHY>@dbs2lqchy
