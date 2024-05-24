const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const blackjackRoutes = require('./routes/blackjackRouter');

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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// routing stuff
app.use("/play", blackjackRoutes);

app.listen(port, () => console.log("working"));