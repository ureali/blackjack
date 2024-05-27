const Blackjack = require("../models/blackjackGame");

const game = new Blackjack();

exports.startGame = (req, res) => {

    game.generateCardDeck();
    
    game.setUpGame();

    res.json(game.getGameState());
}

exports.continue = (req, res) => {
    game.bet = req.body.bet;

    if (game.getValue(game.playerHand) == 21) {
        // reset table if player has blackjack
        game.setMessage("blackjack");
        game.wrapUpGame("blackjack");

        game.setUpGame();
    }

    res.json(game.getGameState());    
}

exports.hit = async (req, res) => {
    game.bet = req.body.bet;

    game.playerHand = game.hit(game.playerHand, game.cardDeck);

    if (game.checkForBust(game.playerHand)) {
        game.setMessage("bust");
        await game.wrapUpGame("lose");


        game.setUpGame();

        await res.json(game.getGameState());
    } else if (game.getValue(game.playerHand) == 21) {
        // reset table if player has blackjack
        game.setMessage("blackjack");
        await game.wrapUpGame("blackjack");


        game.setUpGame();

        await res.json(game.getGameState());
    } else {
        game.setMessage("all ok");
        res.json(game.getGameState());
        
    }

}

exports.surrender = async (req, res) => {
    game.bet = req.body.bet;
    
    game.setMessage("surrender");
    game.wrapUpGame("surrender");

    game.setUpGame();

    await res.json(game.getGameState()); 
}

exports.stand = async (req, res) => {
    game.bet = req.body.bet;
    
    game.dealerHand = game.playDealerTurn();

    game.wrapUpGame("stand");


    game.setUpGame();

    await res.json(game.getGameState());
}

exports.double = async (req, res) => {
    game.bet = req.body.bet;
    
    game.playerHand = game.hit(game.playerHand, game.cardDeck);

    if (game.checkForBust(game.playerHand)) {
        game.setMessage("bust");
        game.wrapUpGame("lose");

        game.setUpGame();

        await res.json(game.getGameState());
    } else {
        game.dealerHand = game.playDealerTurn();

        game.wrapUpGame("double");

        game.setUpGame();

        await res.json(game.getGameState());
    }
}

exports.insurance = (req, res) => {
    game.bet = req.body.bet;
    
    game.insurance(game.dealerHand);

    res.json(game.getGameState());
}