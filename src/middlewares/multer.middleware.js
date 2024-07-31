import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, files, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage: storage,
});
