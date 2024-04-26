// import packages
import express from "express";
import cors from "cors";
import records from "./routes/record.js";

// set port according to config.env
const PORT = process.env.PORT || 5050;
// create express app
const app = express();

// mount the packages
app.use(cors());
app.use(express.json());
app.use("/record", records);

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



//mongodb+srv://nehabbas04:vUynAQCPM48QGlYx@database.frmzvmn.mongodb.net/?retryWrites=true&w=majority&appName=database