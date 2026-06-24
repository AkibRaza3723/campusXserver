import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp"); //temp folder where file stored (from where the server is starting - root)
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); //only temp store file 
    }
  });
    
export const upload = multer({ 
    storage, 
});
