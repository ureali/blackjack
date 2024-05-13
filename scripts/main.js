// declare arrays of values and suits (separately)
let cardValue = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
let cardSuit = ["Clubs", "Diamonds", "Hearts", "Spades"];

let cardDeck; 
let playerHand;
let dealerHand;
let dealerValue;
let obfuscatedDealerHand;
let userInput;

// bets
let cash = 100;
let bet = 1;
let winnings = 0;

// function to generate card deck based on arrays of suits and values
function generateCardDeck(cardValue, cardSuit) {
    // total iterations needed
    let totalCards = cardValue.length * cardSuit.length;
    
    // separate counters for suit and value
    let suitCounter = 0;
    let valueCounter = 0;

    let cardDeck = [];

    for (i = 0; i < totalCards; i++) {
        // push new card only if value of the card exists
        if (valueCounter < cardValue.length) {
            cardDeck.push(cardValue[valueCounter] + " Of " + cardSuit[suitCounter]);

            valueCounter++;
        }
        // else move to the next suit
        else {
            suitCounter++;
            valueCounter = 0;
            i--;
        }
    }

    return cardDeck;

}

function dealCards(cardDeck) {
    // create an array of two random cards
    let hand = [cardDeck[Math.floor(Math.random() * cardDeck.length)], cardDeck[Math.floor(Math.random() * cardDeck.length)]];
    // remove those cards from the deck
    cardDeck.splice(cardDeck.indexOf(hand[0]), 1);
    cardDeck.splice(cardDeck.indexOf(hand[1]), 1);
    return hand;
}

// get the total value of the player hand
function getValue(hand) {
    let value = 0;
    let cardValue;

    for (i = 0; i < hand.length; i++) {
        // get card value (not the most effective way, but I prefer to keep it simple)
        cardValue = hand[i].split(" ")[0];

        // loooong switch that covers all the values
        switch(cardValue) {
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
                value += parseInt(cardValue);
                break;
        }
    }
    
    return value;
}

// hide one dealer card
function hideDealerCard(dealerHand) {
    return ["***", dealerHand[1]];
}

// choose winner based on who's closer to 21
function chooseWinner(dealerValue, playerValue) {
    if (21 - dealerValue < 21 - playerValue) {
        return "dealer";
    } else {
        return "player";
    }
}

// blackjack actions

// hit (take a card)
function hit(hand, deck) {
    // get random card
    let card = deck[Math.floor(Math.random() * deck.length)];
    // add it to hand, take it from deck
    hand.push(card);
    return hand;
}

// stand (don't take a card). Useless, but I included it for better readability (e.g. not return hand, but stand(hand))
function stand(hand) {
    return hand;
}

// double down
function doubleDown(hand, deck) {
    hand = hit(hand, deck);
    return hand;
}

// dealer "AI"
// dealer's strategy is fixed, such are blackjack rules
function playDealerTurn(dealerHand, dealerValue, deck) {
    if (dealerValue < 17) {
        const newHand = hit(dealerHand, deck);
        const newValue = getValue(newHand);
        return playDealerTurn(newHand, newValue, deck);
    } else {
        return stand(dealerHand);
    }
}

// bets actions
// from the perspective of player
function calculateNewCash(cash, bet, action) {
    if (action == "lose") {
        cash -= bet;
    } else if (action == "double lose") {
        cash -= 2 * bet;
    } else if (action == "win") {
        cash += bet;
    } else if (action == "double win") {
        cash += 2 * bet;
    } else if (action == "surrender") {
        cash -= 1/2 * bet;
    } else if (action == "blackjack") {
        cash += 3/2 * bet;
    } else if (action == "insurance") {
        cash += 2 * bet;
    } 

    return Math.floor(cash);
}



// main cycle

while (cash > 0) {
    cardDeck = generateCardDeck(cardValue, cardSuit);
    playerHand = dealCards(cardDeck);
    dealerHand = dealCards(cardDeck);
    dealerHand[1] = "Ace Of Spades";
    obfuscatedDealerHand = hideDealerCard(dealerHand);

    bet = parseInt(prompt(`Your cash is ${cash}, please enter current bet`));
    
    if (getValue(playerHand) == 21) {
        alert("Blackjack!");
        cash = calculateNewCash(cash, bet, "blackjack");
        continue;
    } else if (dealerHand[1].split(" ")[0] === "Ace") {
        let insuranceBet = Math.floor(bet / 2);
        let takeInsurance = confirm(`Dealer's face-up card is an Ace. Do you want to buy insurance for ${insuranceBet}?`);

        if (takeInsurance) {
            if (getValue(dealerHand) == 21) {
                alert("Dealer has blackjack. Insurance pays 2:1.");
                cash = calculateNewCash(cash, insuranceBet, "insurance");
                continue;
            } else {
                alert("Dealer does not have blackjack. Insurance lost.");
                cash = calculateNewCash(cash, insuranceBet, "lose");
                continue;
            }
        }
    }

    while (true) {
        currentHandValue = getValue(playerHand);
        
        if (currentHandValue == 21) {
            alert("You win!");
            cash = calculateNewCash(cash, bet, "win");
            break;
        } else if (currentHandValue > 21) {
            alert("Bust!");
            cash = calculateNewCash(cash, bet, "lose");
            break;
        }
    
        userInput = prompt(`Dealer hand is: ${obfuscatedDealerHand[0] + " " + obfuscatedDealerHand[1]}
                    Your hand is: ${playerHand}
                    What will you do?`);
        if (userInput == "hit") {
            playerHand = hit(playerHand, cardDeck);  
            continue;
        }
        else if (userInput == "surrender") {
            alert("You surrender!");
            cash = calculateNewCash(cash, bet, "surrender");
            break;
        }
        else if (userInput == "stand" || userInput == "double down") {
            // this section is used to determine the impact on bet
            let action = "";

            if (userInput == "double down") {
                action = "double ";
                playerHand = hit(playerHand, cardDeck);
            }

            dealerHand = playDealerTurn(dealerHand, getValue(dealerHand), cardDeck);
            dealerValue = getValue(dealerHand);
            
            if (dealerValue > 21) {
                alert("Dealer's bust! you won!");
                cash = calculateNewCash(cash, bet, action + "win");
                break;
            } else if (dealerValue == 21) {
                alert("Blakcjack! Dealer won!");
                cash = calculateNewCash(cash, bet, action + "lose");
                break; 
            } else {
                if (chooseWinner(dealerValue, getValue(playerHand)) == "dealer") {
                    alert("Dealer won! His hand is " + dealerHand);
                    cash = calculateNewCash(cash, bet, action + "lose");
                    break;
                }
                else {
                    alert("You won! Dealer\'s hand is" + dealerHand);
                    cash = calculateNewCash(cash, bet, action + "win");
                    break;
                }
            }
            
        }
    }
}
