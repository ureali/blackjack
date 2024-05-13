// TODO: add bets

// declare arrays of values and suits (separately)
let cardValue = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
let cardSuit = ["Clubs", "Diamonds", "Hearts", "Spades"];

let cardDeck; 
let playerHand;
let dealerHand;
let dealerValue;
let obfuscatedDealerHand;
let userInput;

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
            case "2":
                value += 2;
                break;
            case "3":
                value += 3;
                break;
            case "4":
                value += 4;
                break;
            case "5":
                value += 5;
                break;
            case "6":
                value += 6;
                break;
            case "7":
                value += 7;
                break;
            case "8":
                value += 8;
                break;
            case "9":
                value += 9;
                break;
            case "10":
                value += 10;
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
                alert("ERROR: Can't calculate value!");
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



// dealer "AI"
function playDealerTurn(dealerHand, dealerValue, deck) {
    if (dealerValue < 17) {
        const newHand = hit(dealerHand, deck);
        const newValue = getValue(newHand);
        alert(dealerValue);
        return playDealerTurn(newHand, newValue, deck);
    } else {
        return stand(dealerHand);
    }
}

cardDeck = generateCardDeck(cardValue, cardSuit);

playerHand = dealCards(cardDeck);
dealerHand = dealCards(cardDeck);
obfuscatedDealerHand = hideDealerCard(dealerHand);

// main cycle

while (true) {
    userInput = prompt(`Dealer hand is: ${obfuscatedDealerHand[0] + " " + obfuscatedDealerHand[1]}
                Your hand is: ${playerHand}
                What will you do?`);
    
    if (userInput == "hit") {
        playerHand = hit(playerHand, cardDeck);
        continue;
    }
    else if (userInput == "stand") {
        dealerHand = playDealerTurn(dealerHand, getValue(dealerHand), cardDeck);
        dealerValue = getValue(dealerHand);
        
        if (dealerValue > 21) {
            alert("Dealer's bust! you won!");
            break;
        } else if (dealerValue == 21) {
            alert("Blakcjack! Dealer won!")
            break; 
        } else {
            if (chooseWinner(dealerValue, getValue(playerHand)) == "dealer") {
                alert("Dealer won! His hand is " + dealerHand)
            }
            else {
                alert("You won! Dealer\'s hand is" + dealerHand)
            }
        }
        
    }
}
