const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");

const port = 3000;

const app = express();

app.engine('hbs', exphbs.engine(
    { 
        extname: 'hbs', 
        defaultLayout: 'main', 
        layoutsDir: path.join(__dirname, 'views/layouts') 
    }
));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));

// temporary routing
app.get("/play", (req, res) => {
    res.render("play");
});

app.listen(port, () => console.log("working"));