const Blackjack = require("../models/blackjackGame");

const game = new Blackjack();

exports.startGame = (req, res) => {
    game.generateCardDeck();
    
    game.dealerHand = game.dealCards(game.cardDeck);
    game.playerHand = game.dealCards(game.cardDeck);

    res.json(game.getGameState());
}

exports.hit = (req, res) => {
    game.hit(game.playerHand, game.cardDeck);

    if (game.checkForBust(game.playerHand)) {
        game.setMessage("bust");
        game.wrapUpGame("lose");

        res.json(game.gameState);
    } else if (game.getValue(game.playerHand) == 21) {
        // reset table if player has blackjack
        game.setMessage("blackjack");
        game.wrapUpGame("blackjack");
    }

    res.json(game.getGameState());
}

exports.surrender = (req, res) => {
    game.setMessage("surrender");
    game.wrapUpGame("surrender");

    res.json(game.getGameState());
}

exports.stand = (req, res) => {
    game.dealerHand = game.playDealerTurn();

    game.wrapUpGame("stand");

    res.json(game.getGameState());
}

exports.double = (req, res) => {
    game.hit(game.playerHand, game.cardDeck);
    
    if (game.checkForBust(game.playerHand)) {
        game.setMessage("bust");
        game.wrapUpGame("lose");

        res.json(game.gameState);
    } else {
        game.dealerHand = game.playDealerTurn();

        game.wrapUpGame("double");

        res.json(game.getGameState());
    }
}

exports.insurance = (req, res) => {
    game.insurance(game.dealerHand);

    res.json(game.getGameState());
}