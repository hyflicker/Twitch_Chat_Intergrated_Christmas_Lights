import express from 'express';
import ejs from "ejs";
import { fileURLToPath } from 'url'
import * as path from 'path';
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express();
const router = express.Router();
const port = 3020;

app.use(router);
app.use(express.static(path.join(__dirname, '/Assets')))

app.set('views', path.join(__dirname, '/Pages'));
app.set("view engine", "ejs")

router.route('/')
    .get((req,res,next) => {
        res.render('home');
    })

app.listen(port, () => {
    console.log(`Lights Website Online at ${port}`)
  })