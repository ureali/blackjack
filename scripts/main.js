// declare arrays of values and suits (separately)
let cardValue = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
let cardSuit = ["Clubs", "Diamonds", "Hearts", "Spades"];

let cardDeck; 
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

// catch all end game function
async function getResults(action, playerHand, dealerHand, cash, bet, popupElement, popupTextElement) {
    // this section is used to determine the impact on bet

    if (action == "double") {
        action += " ";
    } if (action == "stand") {
        action = "";
    }

    dealerValue = getValue(dealerHand);
    
    if (dealerValue > 21) {
        await showPopup("win", popupElement, popupTextElement);
        cash = calculateNewCash(cash, bet, action + "win");
    } else if (dealerValue == 21) {
        await showPopup("lose", popupElement, popupTextElement);
        cash = calculateNewCash(cash, bet, action + "lose");
    } else {
        if (chooseWinner(dealerValue, getValue(playerHand)) == "dealer") {
            await showPopup("lose", popupElement, popupTextElement);
            cash = calculateNewCash(cash, bet, action + "lose");
        }
        else {
            await showPopup("win", popupElement, popupTextElement);
            cash = calculateNewCash(cash, bet, action + "win");
        }
    }

    return cash;
}

async function setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton) {
    console.log(cardDeck);
    cashField.innerText = cash;
    let obfuscatedDealerHand = hideDealerCard(dealerHand);


    // render the playing cards

    for(let i = 0; i < 2; i++) {
        renderCard(obfuscatedDealerHand[i], dealerHandElement);
    }

    for(let i = 0; i < 2; i++) {
        renderCard(playerHand[i], playerHandElement);
    }
    
    if (getValue(playerHand) == 21) {
        // reset table if player has blackjack
        await showPopup("blackjack", popupElement, popupTextElement);
        cash = calculateNewCash(cash, bet, "blackjack");
        playerHand = dealCards(cardDeck);
        dealerHand = dealCards(cardDeck);
        resetTable(playerHandElement, dealerHandElement);
        setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
    } else if (dealerHand[1].split(" ")[0] === "Ace") {
        // code to offer insurance
        let insuranceBet = Math.floor(bet / 2);
        insuranceButton.disabled = false;

        insuranceButton.onclick = function() {
            if (getValue(dealerHand) == 21) {
                showPopup("insurance win", popupElement, popupTextElement);
                cash = calculateNewCash(cash, insuranceBet, "insurance");
                insuranceButton.disabled = true;
                playerHand = dealCards(cardDeck);
                dealerHand = dealCards(cardDeck);
                resetTable(playerHandElement, dealerHandElement);
                setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
            } else {
                showPopup("insurance lose", popupElement, popupTextElement);
                insuranceButton.disabled = true;
                cash = calculateNewCash(cash, insuranceBet, "lose");
            }
        } 
    }
    
}

// blackjack actions

// hit (take a card)
function hit(hand, deck) {
    // get random card
    let card = deck[Math.floor(Math.random() * deck.length)];
    // add it to hand, take it from deck
    hand.push(card);
    deck.splice(deck.indexOf(card), 1);
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

// check if player has busted 
function checkForBust(hand) {
    if (getValue(hand) > 21) {
        return true;
    } else {
        return false;
    }
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


// rendering

// render cards
function renderCard(card, parentElement) {
    let cardFileName;

    // render back of the card if it's obfuscated
    if (card == "***") {
        cardFileName = "back.svg";
    } else {
        console.log(card, parentElement);
        cardFileName = card.toLowerCase().split(" ");

        //that's only because the card pack I downloaded has 2 versions of face cards, I prefer 2nd one
        if (/Jack|Queen|King/.test(card)) {
            cardFileName[2] += "2";
        } 

        cardFileName = cardFileName.join("_");
        cardFileName += ".svg";
    }

    let cardImg = document.createElement("img");
    cardImg.src = `cards/${cardFileName}`;

    parentElement.appendChild(cardImg);
}

// reset only the dealer hand
function resetDealerHandRendering(dealerHandElement) {
    dealerHandElement.innerHTML = "";
}

// render dealer hand
function renderDealerHand(dealerHand, dealerHandElement) {
    for (let card of dealerHand) {
        renderCard(card, dealerHandElement);
    }
}

// reset the table
function resetTable(playerHandElement, dealerHandElement) {
    playerHandElement.innerHTML = "";
    dealerHandElement.innerHTML = "";
}

// render popup
async function showPopup(action, popupElement, popupTextElement) {
  popupElement.style.display = "block";
  switch (action) {
    case "win": 
        popupTextElement.innerText = "You won!";
        break;
    case "lose":
        popupTextElement.innerText = "You lost!";
        break;
    case "blackjack":
        popupTextElement.innerText = "Blackjack!";
        break;
    case "bust":
        popupTextElement.innerText = "Bust!";
        break;
    case "surrender": 
        popupTextElement.innerText = "You surrender!";
        break;
    case "insurance win": 
        popupTextElement.innerText = "Dealer has blackjack! Enjoy your payout!";
        break;
    case "insurance lose": 
        popupTextElement.innerText = "Dealer does not have blackjack!";
        break;
  }

  // stop the game execution until player closes the popup
  return new Promise(function(resolve, reject) {
  popupElement.onclick = function() {
    popupElement.style.display = "none";
    resolve();
  }})
}


//main cycle
window.onload= function() {
    let startButton = document.getElementById("start");
    let betField = document.getElementById("betField");
    let cashField = document.getElementById("cashValue");
    let popupElement = document.getElementById("infoScreen");
    let popupTextElement = document.getElementById("infoText");

    cashField.innerText = cash;

    startButton.onclick = function() {
        let hitButton = document.getElementById("hit");
        let standButton = document.getElementById("stand");
        let doubleButton = document.getElementById("double");
        let insuranceButton = document.getElementById("insurance");
        let surrenderButton = document.getElementById("surrender");

        hitButton.disabled = false;
        standButton.disabled = false;
        doubleButton.disabled = false;
        surrenderButton.disabled = false;

        startButton.disabled = true;
        
        let dealerHandElement = document.getElementById("dealerCards");
        let playerHandElement = document.getElementById("playerCards");

        cardDeck = generateCardDeck(cardValue, cardSuit);


        let playerHand = dealCards(cardDeck);
        let dealerHand = dealCards(cardDeck);

        let bet = parseInt(betField.value);

        setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
         
        hitButton.onclick = function() {
            // check for bust before dealing new card
            if(checkForBust(playerHand)) {
                showPopup("bust", popupElement, popupTextElement);
                cash = calculateNewCash(cash, bet, "lose");
                playerHand = dealCards(cardDeck);
                dealerHand = dealCards(cardDeck);
                resetTable(playerHandElement, dealerHandElement);
                setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
            } else {
                playerHand = hit(playerHand, cardDeck);  
                renderCard(playerHand.at(-1), playerHandElement);
            }
        }
        surrenderButton.onclick = function() {
            showPopup("surrender", popupElement, popupTextElement);
            cash = calculateNewCash(cash, bet, "surrender");
            playerHand = dealCards(cardDeck);
            dealerHand = dealCards(cardDeck);
            resetTable(playerHandElement, dealerHandElement);
            setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
        }
        standButton.onclick = async function() {
            dealerHand = playDealerTurn(dealerHand, getValue(dealerHand), cardDeck);
            resetDealerHandRendering(dealerHandElement);
            renderDealerHand(dealerHand, dealerHandElement);
            cash = await getResults("stand", playerHand, dealerHand, cash, bet, popupElement, popupTextElement);
            playerHand = dealCards(cardDeck);
            dealerHand = dealCards(cardDeck);
            resetTable(playerHandElement, dealerHandElement);
            setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
        }
        doubleButton.onclick = async function() {
            // same as stand basically
            playerHand = hit(playerHand, cardDeck);  
            renderCard(playerHand.at(-1), playerHandElement);
            dealerHand = playDealerTurn(dealerHand, getValue(dealerHand), cardDeck);
            resetDealerHandRendering(dealerHandElement);
            renderDealerHand(dealerHand, dealerHandElement);
            cash = await getResults("double", playerHand, dealerHand, cash, bet, popupElement, popupTextElement);
            playerHand = dealCards(cardDeck);
            dealerHand = dealCards(cardDeck);
            resetTable(playerHandElement, dealerHandElement);
            setUpTable(cardDeck, cash, bet, playerHand, dealerHand, playerHandElement, dealerHandElement, betField, cashField, popupElement, popupTextElement, insuranceButton);
        }
    }        
 }
