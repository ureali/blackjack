const Blackjack = require("../models/blackjackGame");

// necessary to add methods to object back in case they go away due to session
function reviveBlackjack(game) {
    if (game && typeof game === 'object') {
        Object.setPrototypeOf(game, Blackjack.prototype);
    }
    return game;
}

exports.startGame = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        if (!game) {
            game = req.session.game = new Blackjack();
    
            game.generateCardDeck();
    
            game.setUpGame();
        }
    
        res.json(game.getGameState());
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
    }
}

exports.continue = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = req.body.bet;
    
        if (game.getValue(game.playerHand) == 21) {
            // reset table if player has blackjack
            game.setMessage("blackjack");
            game.wrapUpGame("blackjack");
    
            game.setUpGame();
    
            res.json(game.getGameState());
        } else {
            game.setMessage("all ok");
    
            res.json(game.getGameState());
        }
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
        
    }
}

exports.hit = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
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
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
        
    }

}

exports.surrender = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = req.body.bet;
    
        game.setMessage("surrender");
        game.wrapUpGame("surrender");
    
        game.setUpGame();
    
        await res.json(game.getGameState());
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
        
    }
}

exports.stand = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = req.body.bet;
    
        game.dealerHand = game.playDealerTurn();
    
        game.wrapUpGame("stand");
    
        game.setUpGame();
    
        await res.json(game.getGameState());
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
        
    }
}

exports.double = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = req.body.bet;
    
        game.playerHand = game.hit(game.playerHand, game.cardDeck);
    
        if (game.checkForBust(game.playerHand)) {
            game.setMessage("bust");
            game.wrapUpGame("double lose");
    
            game.setUpGame();
    
            await res.json(game.getGameState());
        } else {
            game.dealerHand = game.playDealerTurn();
    
            game.wrapUpGame("double");
    
            game.setUpGame();
    
            await res.json(game.getGameState());
        }
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
        
    }
}

exports.insurance = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = req.body.bet;
    
        game.insurance(game.dealerHand);
    
        if (game.message == "insurance win") {
            game.setUpGame();
        }
    
        res.json(game.getGameState());
    } catch (error) {
        res.json({"message": "ERROR_SESSION_TIMEOUT"});
        
    }
}