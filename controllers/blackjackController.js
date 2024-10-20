const Blackjack = require("../models/blackjackGame");

// necessary to add methods to object back in case they go away due to session
function reviveBlackjack(game) {
    if (game && typeof game === 'object') {
        Object.setPrototypeOf(game, Blackjack.prototype);
    }
    return game;
}

// just to make sure folks don't send request with invalid bet
function validateBet(bet, cash) {
    // TODO: message to a client that the bet is invalid
    if (bet > cash || typeof(bet) !== "number") {
        return 1;
    } else {
        return bet;
    }
}

exports.startGame = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        if (!game) {
            game = req.session.game = new Blackjack();
    
            game.generateCardDeck();
        }

        game.resetGame();
        game.setUpGame();
    
        res.json(game.getGameState());
    } catch (error) {
        // if the game property is undefined, that means session has timed
        if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
    }
}

exports.continue = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
        
        // take bet from cash
        game.cash -= game.bet;

        // it's easier to reset split message here
        if (game.splitMessage !== "") {
            game.splitMessage = "";
        }
    
        if (game.getValue(game.playerHand) == 21) {
            // reset table if player has blackjack
            game.setMessage("blackjack");
            game.wrapUpGame("blackjack");

            let gameStateSnapshot = game.getGameState();
    
            game.setUpGame();
    
            res.json(gameStateSnapshot);
        } else {
            game.setMessage("all ok");
    
            res.json(game.getGameState());
        }
    } catch (error) {
        if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
    }
}

exports.hit = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
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
        if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
    }

}

exports.surrender = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
        game.setMessage("surrender");
        game.wrapUpGame("surrender");
    
        game.setUpGame();
    
        await res.json(game.getGameState());
    } catch (error) {
        if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
    }
}

exports.stand = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
        game.dealerHand = game.playDealerTurn();
    
        game.wrapUpGame("stand");
        
        if (!game.splitTaken) {
            game.setUpGame();
        }
    
        await res.json(game.getGameState());

   } catch (error) {
       if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
    }
}

exports.double = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
        game.playerHand = game.hit(game.playerHand, game.cardDeck);
    
        if (game.checkForBust(game.playerHand)) {
            game.wrapUpGame("double lose");
            game.setMessage("bust");
            
            let gameStateSnapshot = game.getGameState();

            game.setUpGame();

            await res.json(gameStateSnapshot);
        } else {
            game.dealerHand = game.playDealerTurn();
    
            game.wrapUpGame("double");

            let gameStateSnapshot = game.getGameState();

            game.setUpGame();

            await res.json(gameStateSnapshot);
        }
    } catch (error) {
        if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
    }
}

exports.insurance = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
        game.insurance(game.dealerHand);
    
        if (game.message == "insurance win") {
            game.setUpGame();
        }
    
        res.json(game.getGameState());
    } catch (error) {
        if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
    }
}

exports.split = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
        game.splitAction();
    
        res.json(game.getGameState());
   } catch (error) {
       if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
   }
}

exports.splitStand = (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);

        // swap hands (split hand is kinda like a storage)
        let tempVarToSwapHands = game.playerHand;

        game.playerHand = game.splitHand;
        game.splitHand = tempVarToSwapHands;

        game.splitTaken = false;

        game.dealerHand = game.playDealerTurn();

        // EXTREMELY HACKY way to save the bet (remember, betting is disabled until split is done)
        let tempBet = game.bet;

        game.wrapUpGame("stand");

        game.bet = tempBet;

        game.splitMessage = game.message;

        // swap back 
        tempVarToSwapHands = game.playerHand;  
        game.playerHand = game.splitHand;
        game.splitHand = tempVarToSwapHands;
        

        res.json(game.getGameState());
   } catch (error) {
       if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
   }
}

exports.splitHit = async (req, res) => {
    try {
        let game = reviveBlackjack(req.session.game);
    
        game.bet = validateBet(req.body.bet, game.cash);
    
        game.playerHand = game.hit(game.playerHand, game.cardDeck);
    
        if (game.checkForBust(game.playerHand)) {
            game.setMessage("bust");

            game.cash -= game.bet;
    
            game.setUpGame();
    
            await res.json(game.getGameState());
        } else {
            game.setMessage("all ok");
            await res.json(game.getGameState());
        }
   } catch (error) {
       if(error.name == "TypeError") {res.json({"message": "ERROR_SESSION_TIMEOUT"})};
        
   }
}