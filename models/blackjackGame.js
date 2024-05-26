class BlackjackGame {
    cardValues = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
    cardSuits = ["Clubs", "Diamonds", "Hearts", "Spades"];

    dealerThreshold = 17;
    reshuffleThreshold = 0.5;
    cash = 100;
    cardDeck;
    cardDeckLength;
    playerHand;
    dealerHand;
    bet = 0;
    numDecks = 4;
    insuranceAvailable = false;

    constructor(config) {
        this.dealerThreshold = this.dealerThreshold;
        this.reshuffleThreshold = this.reshuffleThreshold;
        this.cash = this.cash;
        this.cardDeck = this.cardDeck;
        this.cardDeckLength = this.cardDeckLength;
        this.playerHand = this.playerHand;
        this.dealerHand = this.dealerHand;
        this.bet = this.bet;
        this.cardValues = this.cardValues;
        this.cardSuits = this.cardSuits;
        this.numDecks = this.numDecks;
    }
    // function to generate card deck based on arrays of suits and values
    generateCardDeck() {
        // total iterations needed
        // numDecks is necessary to implement card counting functionality
        let totalCards = this.cardValues.length * this.cardSuits.length * this.numDecks;
        // separate counters for suit and value
        let suitCounter = 0;
        let valueCounter = 0;

        let cardDeck = [];

        for (let i = 0; i < totalCards; i++) {
            // if suitCounter too big move on to the next deck
            if (suitCounter > this.cardSuits.length - 1) {
                suitCounter = 0;
                valueCounter = 0;
                i--;
            }
            // push new card only if value of the card exists
            else if (valueCounter < this.cardValues.length) {
                cardDeck.push(this.cardValues[valueCounter] + " Of " + this.cardSuits[suitCounter]);

                valueCounter++;
            }
            // else move to the next suit
            else if (suitCounter < this.cardSuits.length) {
                suitCounter++;
                valueCounter = 0;
                i--;
            }
        }

        this.cardDeck = cardDeck;

    }

    // the function is just another descriptive name for generating new deck
    reshuffleCards() {
        return this.generateCardDeck(this.cardValues, this.cardSuits, this.numDecks);
    }

    dealCards(cardDeck) {
        // create an array of two random cards
        let hand = [cardDeck[Math.floor(Math.random() * cardDeck.length)], cardDeck[Math.floor(Math.random() * cardDeck.length)]];
        // remove those cards from the deck
        cardDeck.splice(cardDeck.indexOf(hand[0]), 1);
        cardDeck.splice(cardDeck.indexOf(hand[1]), 1);
        return hand;
    }

    // get the total value of the player hand
    getValue(hand) {
        let value = 0;
        let cardValues;

        for (let i = 0; i < hand.length; i++) {
            // get card value (not the most effective way, but I prefer to keep it simple)
            cardValues = hand[i].split(" ")[0];

            // loooong switch that covers all the values
            switch (cardValues) {
                case "Ace":
                    // standard blackjack rules for ace
                    if (value + 11 > 21) {
                        value += 1;
                    } else {
                        value += 11;
                    }
                    break;
                case "Jack":
                    value += 10;
                    break;
                case "Queen":
                    value += 10;
                    break;
                case "King":
                    value += 10;
                    break;
                default:
                    value += parseInt(cardValues);
                    break;
            }
        }

        return value;
    }

    // hide one dealer card
    hideDealerCard(dealerHand) {
        return [dealerHand[0], "***"];
    }

    // choose winner based on who's closer to 21
    chooseWinner(dealerValue, playerValue) {
        if (21 - dealerValue < 21 - playerValue) {
            return "dealer";
        } else {
            return "player";
        }
    }

    // blackjack actions

    // hit (take a card)
    hit(hand, deck) {
        // get random card
        let card = deck[Math.floor(Math.random() * deck.length)];
        // add it to hand, take it from deck
        hand.push(card);
        deck.splice(deck.indexOf(card), 1);
        return hand;
    }

    // stand (don't take a card). Useless, but I included it for better readability (e.g. not return hand, but stand(hand))
    stand(hand) {
        return hand;
    }

    // double down
    doubleDown(hand, deck) {
        hand = this.hit(hand, deck);
        return hand;
    }

    // code to offer insurance
    insurance(dealerHand) {
        let insuranceBet = Math.floor(this.bet / 2);
        if (getValue(dealerHand) == 21) {
            this.setMessage("insurance win");
            this.wrapUpGame("insurance win");
        } else {
            this.setMessage("insurance lose");
            let cash = this.calculateNewCash(cash, insuranceBet, "lose");
            this.cash = cash
        }

        this.insuranceAvailable = false;
    
    }   


    // check if player has busted 
    checkForBust(hand) {
        if (this.getValue(hand) > 21) {
            return true;
        } else {
            return false;
        }
    }

    // dealer "AI"
    // dealer's strategy is fixed, such are blackjack rules
    playDealerTurn(dealerHand = this.dealerHand, dealerValue = this.getValue(this.dealerHand)) {
        if (dealerValue < this.dealerThreshold) {
            const newHand = this.hit(dealerHand, this.cardDeck);
            const newValue = this.getValue(newHand);
            return this.playDealerTurn(newHand, newValue);
        } else {
            return this.stand(dealerHand);
        }
    }

    // bets actions
    // from the perspective of player
    calculateNewCash(cash, bet, action) {
        if (action == "lose") {
            cash -= bet;
        } else if (action == "double lose") {
            cash -= bet*2;
        } else if (action == "win") {
            cash += bet;
        } else if (action == "double win") {
            cash += bet * 2;
        } else if (action == "surrender") {
            cash -= (1 / 2) * bet;
        } else if (action == "blackjack") {
            cash += (3 / 2) * bet;
        } else if (action == "insurance") {
            cash += 2 * bet;
        } else if (action == "tie") {
            // this line is useless I left it in for more clarity
            cash = cash;
        }

        return Math.floor(cash);
    }
    
    getResults(action) {
        let cash = this.cash;
        let bet = this.bet;

        // this section is used to determine the impact on bet
        if (action == "double") {
            action += " ";
        } else if (action == "stand") {
            action = "";
        } else if (action == "lose") {
            cash = this.calculateNewCash(cash, bet, "lose");
            return cash;
        } else if (action == "surrender") {
            cash = this.calculateNewCash(cash, bet, "surrender");
            return cash;
        } else if (action == "blackjack") {
            // blackjack
            cash = this.calculateNewCash(cash, bet, "blackjack");
            return cash;
        } else if (action == "insurance win") {
            // insurance
            cash = this.calculateNewCash(cash, bet, "win");
            return cash;
        }

        let dealerValue = this.getValue(this.dealerHand);
        let playerValue = this.getValue(this.playerHand);

        // if dealer's bust and the player is not
        if (dealerValue > 21 && playerValue <= 21) {
            this.setMessage("win");
            cash = this.calculateNewCash(cash, bet, action + "win");
        }
        // in case of push 
        else if (dealerValue == playerValue) {
            this.setMessage("tie");
            cash = this.calculateNewCash(cash, bet, "tie");
        } else {
            if (this.chooseWinner(dealerValue, playerValue) == "dealer") {
                this.setMessage("lose");
                cash = this.calculateNewCash(cash, bet, action + "lose");
            }
            else {
                this.setMessage("win");
                cash = this.calculateNewCash(cash, bet, action + "win");
            }
        }
        

        return cash;
    }

    // wrap up the game and reset table
    wrapUpGame(action) {
        this.cash = this.getResults(action);
        this.bet = 0;

        // check if it's time to reshuffle the cards
        if(this.cardDeck.length < this.cardDeckLength * this.reshuffleThreshold) {
            this.setMessage("reshuffle");
            this.cardDeck = this.reshuffleCards(this.cardValues, this.cardSuits, this.numDecks);
        }

        this.playerHand = this.dealCards(this.cardDeck);
        this.dealerHand = this.dealCards(this.cardDeck);
        
        this.setUpGame();

    }

    setUpGame() {
        let cash = this.cash;
        let bet = this.bet;

        if (this.getValue(this.playerHand) == 21) {
            // reset table if player has blackjack
            this.setMessage("blackjack");
            this.wrapUpGame("blackjack");
        } else if (this.dealerHand[0].split(" ")[0] === "Ace") {
                this.insuranceAvailable = true;
            }

    }

    setMessage(message) {
        this.message = message;
    }

    getGameState() {
        return {
            message: this.message,
            playerHand: this.playerHand,
            dealerHand: this.dealerHand,
            cash: this.cash,
            bet: this.bet,
            insuranceAvailable: this.insuranceAvailable
        }
    }
}

module.exports = BlackjackGame;