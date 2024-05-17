// declare arrays of values and suits (separately)
const CARD_VALUES = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
const CARD_SUITS = ["Clubs", "Diamonds", "Hearts", "Spades"];

const DEALER_THRESHOLD = 17;
const RESHUFFLE_THRESHOLD = 0.5;

let cash = 100;

let dealerValue;
let obfuscatedDealerHand;

// function to generate card deck based on arrays of suits and values
function generateCardDeck(CARD_VALUES, CARD_SUITS, numDecks) {
    // total iterations needed
    // numDecks is necessary to implement card counting functionality
    let totalCards = CARD_VALUES.length * CARD_SUITS.length * numDecks;

    // separate counters for suit and value
    let suitCounter = 0;
    let valueCounter = 0;

    let cardDeck = [];

    for (i = 0; i < totalCards; i++) {
        // if suitCounter too big move on to the next deck
        if (suitCounter > CARD_SUITS.length - 1) {
            suitCounter = 0;
            valueCounter = 0;
            i--;
        }
        // push new card only if value of the card exists
        else if (valueCounter < CARD_VALUES.length) {
            cardDeck.push(CARD_VALUES[valueCounter] + " Of " + CARD_SUITS[suitCounter]);

            valueCounter++;
        }
        // else move to the next suit
        else if (suitCounter < CARD_SUITS.length) {
            suitCounter++;
            valueCounter = 0;
            i--;
        }
    }

    return cardDeck;

}

// the function is just another descriptive name for generating new deck
function reshuffleCards(CARD_VALUES, CARD_SUITS, numDecks) {
    return generateCardDeck(CARD_VALUES, CARD_SUITS, numDecks);
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
    let cardValues;

    for (i = 0; i < hand.length; i++) {
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
function hideDealerCard(dealerHand) {
    return [dealerHand[0], "***"];
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
async function getResults(action, gameState, gameVisualElements) {
    let playerHand = gameState.playerHand;
    let dealerHand = gameState.dealerHand;
    let cash = gameState.cash;

    let bet = gameState.bet;

    let popupElement = gameVisualElements.popupElement;
    let popupTextElement = gameVisualElements.popupTextElement;

    // this section is used to determine the impact on bet

    if (action == "double") {
        action += " ";
    } else if (action == "stand") {
        action = "";
    } else if (action == "lose") {
        cash = calculateNewCash(cash, bet, "lose");
        return cash;
    } else if (action == "surrender") {
        cash = calculateNewCash(cash, bet, "surrender");
        return cash;
    } else if (action == "blackjack") {
        // blackjack
        cash = calculateNewCash(cash, bet, "blackjack");
        return cash;
    } else if (action == "insurance win") {
        // insurance
        cash = calculateNewCash(cash, bet, "win");
        return cash;
    }

    let dealerValue = getValue(dealerHand);
    let playerValue = getValue(playerHand);

    // if dealer's bust and the player is not
    if (dealerValue > 21 && playerValue <= 21) {
        await showPopup("win", gameVisualElements);
        cash = calculateNewCash(cash, bet, action + "win");
    }
    // in case of push 
    else if (dealerValue == playerValue) {
        await showPopup("tie", gameVisualElements);
        cash = calculateNewCash(cash, bet, "tie");
    } else {
        if (chooseWinner(dealerValue, playerValue) == "dealer") {
            await showPopup("lose", gameVisualElements);
            cash = calculateNewCash(cash, bet, action + "lose");
        }
        else {
            await showPopup("win", gameVisualElements);
            cash = calculateNewCash(cash, bet, action + "win");
        }
    }
    

    return cash;
}

// wrap up the game and reset table
async function wrapUpGame(action, gameState, gameVisualElements) {
    gameState.cash = await getResults(action, gameState, gameVisualElements);
    gameState.bet = 0;

    // check if it's time to reshuffle the cards
    if(gameState.cardDeck.length < gameState.cardDeckLength * gameState.reshuffleThreshold) {
        showPopup("reshuffle", gameVisualElements);
        gameState.cardDeck = reshuffleCards(gameState.cardValues, gameState.cardSuits, gameState.deckNum);
    }

    gameState.playerHand = dealCards(gameState.cardDeck);
    gameState.dealerHand = dealCards(gameState.cardDeck);

    resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
    resetChips(gameVisualElements.chipStack);
    gameState = await setUpTable(gameState, gameVisualElements);

    return gameState;
}

async function setUpTable(gameState, gameVisualElements) {
    let cardDeck = gameState.cardDeck;
    let playerHand = gameState.playerHand;
    let dealerHand = gameState.dealerHand;
    let playerHandElement = gameVisualElements.playerHandElement;
    let dealerHandElement = gameVisualElements.dealerHandElement;
    let betField = gameVisualElements.betField;
    let cashField = gameVisualElements.cashField;
    let popupElement = gameVisualElements.popupElement;
    let popupTextElement = gameVisualElements.popupTextElement;
    let insuranceButton = gameVisualElements.insuranceButton;

    gameState = await placeBets(gameState, gameVisualElements);
    let cash = gameState.cash;
    let bet = gameState.bet;



    updateCashField(cash, cashField);
    let obfuscatedDealerHand = hideDealerCard(dealerHand);


    // render the playing cards

    for (let i = 0; i < 2; i++) {
        renderCard(obfuscatedDealerHand[i], dealerHandElement);
    }

    for (let i = 0; i < 2; i++) {
        renderCard(playerHand[i], playerHandElement);
    }

    if (getValue(playerHand) == 21) {
        // reset table if player has blackjack
        await showPopup("blackjack", gameVisualElements);
        await wrapUpGame("blackjack", gameState, gameVisualElements);
    } else if (dealerHand[0].split(" ")[0] === "Ace") {
        // code to offer insurance
        let insuranceBet = Math.floor(bet / 2);
        gameState.bet = insuranceBet;

        insuranceButton.disabled = false;

        insuranceButton.onclick = async function () {
            if (getValue(dealerHand) == 21) {
                await showPopup("insurance win", gameVisualElements);
                insuranceButton.disabled = true;
                await wrapUpGame("insurance win", gameState, gameVisualElements)
            } else {
                showPopup("insurance lose", gameVisualElements);
                insuranceButton.disabled = true;
                cash = calculateNewCash(cash, insuranceBet, "lose");
                gameState.cash = cash
            }
        }
    }
    return gameState;

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
function playDealerTurn(dealerHand, dealerValue, deck, dealerThreshold) {
    if (dealerValue < dealerThreshold) {
        const newHand = hit(dealerHand, deck);
        const newValue = getValue(newHand);
        return playDealerTurn(newHand, newValue, deck, dealerThreshold);
    } else {
        return stand(dealerHand);
    }
}

// bets actions
// from the perspective of player
function calculateNewCash(cash, bet, action) {
    if (action == "lose") {
        // the line doesn't do anything, added for clarity
        cash = cash;
    } else if (action == "double lose") {
        cash -= bet;
    } else if (action == "win") {
        cash += bet * 2;
    } else if (action == "double win") {
        cash += bet + bet * 2;
    } else if (action == "surrender") {
        cash += 1 / 2 * bet;
    } else if (action == "blackjack") {
        cash += bet + 3 / 2 * bet;
    } else if (action == "insurance") {
        cash += bet + 2 * bet;
    } else if (action == "tie") {
        cash += bet;
    }

    return Math.floor(cash);
}


// rendering

// render cards
function renderCard(card, parentElement) {
    let cardFileName;
    const CARD_WIDTH = 112;
    let initialCardOffset = 20;
    let cardOffset = 50;
    let cardsNum = parentElement.getElementsByClassName("playingCard").length + 1;

    // I don't have a #@)$?$0 clue how this formula works, but it works
    let parentElementWidth = initialCardOffset + (cardsNum - 1) * cardOffset + CARD_WIDTH;

    // render back of the card if it's obfuscated
    if (card == "***") {
        cardFileName = "back.svg";
    } else {
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

    // add class and zindex to cards
    cardImg.className = "playingCard";

    cardImg.style.zIndex = `${cardsNum}}`;

    // check if there are cards before applying left
    cardImg.style.left = `${cardsNum == 1 ? initialCardOffset : cardsNum * cardOffset}px`;

    // randomly rotate the card
    cardImg.style.transform = `rotate(${Math.floor(Math.random() / 12 * 100)}deg)`

    // update parent element width
    parentElement.style.width = `${parentElementWidth}px`;

    parentElement.appendChild(cardImg);
}

// render playing chips
function renderChip(chipValue, parentElement) {
    let chip = document.createElement("div");

    // add class to the chip
    chip.className = "chips";
    // add background image to chip
    chip.style.backgroundImage = `url(img/chips/chip_${chipValue}.svg)`;

    parentElement.appendChild(chip);
}

// this function checks what chips can the player bet and makes them available
async function makeBettingAvailable(gameState, gameVisualElements) {
    let currentCash = gameState.cash;
    let betField = gameVisualElements.betField;
    let chipButtons = betField.children;
    let betButton = gameVisualElements.betButton;

    // need to make sure all is rendered before proceeding
    return new Promise((resolve, reject) => {
        for(let button of chipButtons) {
        let chipValue = button.dataset.chipValue;

        if (chipValue <= currentCash || button == betButton) {
            button.disabled = false;
        } else {
            button.disabled = true;
        }
        
    };
    resolve();
  });
}

// updates the cash field with new value
function updateCashField(value, cashField) {
    cashField.innerText = value;
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

// reset chips 
function resetChips(chipStack) {
    chipStack.innerHTML = "";
}

// reset the table
function resetTable(playerHandElement, dealerHandElement) {
    playerHandElement.innerHTML = "";
    dealerHandElement.innerHTML = "";
}


// function to place bet
async function placeBets(gameState, gameVisualElements) {
    let betField = gameVisualElements.betField;
    let chipButtons = betField.children;
    let betButton = gameVisualElements.betButton;
    let chipStack = gameVisualElements.chipStack;

    updateCashField(gameState.cash, gameVisualElements.cashField);

    await makeBettingAvailable(gameState, gameVisualElements);

    /*  MAJOR BUG
        Multiple event listeners are created and attached
        results in taking several chips with one click
    */
    return new Promise(function(resolve, reject) {
        betField.addEventListener("click", (event) => betHandler(event, resolve, gameState, gameVisualElements));
    })
}

async function betHandler(event, resolve, gameState, gameVisualElements) {
    let target = event.target;
    let chipValue = parseInt(target.dataset.chipValue);

    if (target === gameVisualElements.betButton) {
        resolve(gameState);
    } else if (chipValue) {
        renderChip(chipValue, chipStack);
        await makeBettingAvailable(gameState, gameVisualElements);
        gameState.bet += chipValue;
        gameState.cash -= chipValue;
        updateCashField(gameState.cash, gameVisualElements.cashField);
    }
}
// render popup
async function showPopup(action, gameVisualElements) {
    let popupElement = gameVisualElements.popupElement;
    let popupTextElement = gameVisualElements.popupTextElement;

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
        case "tie":
            popupTextElement.innerText = "Push!";
            break;
        case "reshuffle":
            popupTextElement.innerText = "Reshuffling!";
            break;
        default:
            popupTextElement.innerText = "Error!";
            break;
    }

    // stop the game execution until player closes the popup
    return new Promise(function (resolve, reject) {
        popupElement.onclick = function () {
            popupElement.style.display = "none";
            resolve();
        }
    })
}


//main cycle
window.onload = function () {
    let startButton = document.getElementById("start");
    let betField = document.getElementById("betSet");
    let cashField = document.getElementById("cashValue");
    let popupElement = document.getElementById("infoScreen");
    let popupTextElement = document.getElementById("infoText");
    let chipStack = document.getElementById("chipStack");

    updateCashField(cash, cashField);

    startButton.onclick = async function () {
        let hitButton = document.getElementById("hit");
        let standButton = document.getElementById("stand");
        let doubleButton = document.getElementById("double");
        let insuranceButton = document.getElementById("insurance");
        let surrenderButton = document.getElementById("surrender");

        let betButton = document.getElementById("bet");

        hitButton.disabled = false;
        standButton.disabled = false;
        doubleButton.disabled = false;
        surrenderButton.disabled = false;

        startButton.disabled = true;

        let dealerHandElement = document.getElementById("dealerCards");
        let playerHandElement = document.getElementById("playerCards");

        let cardDeck = generateCardDeck(CARD_VALUES, CARD_SUITS, 4);


        let initialPlayerHand = dealCards(cardDeck);
        let initialDealerHand = dealCards(cardDeck);
        
        // object containing all the game info
        let gameState = {
            cardDeck: cardDeck,
            cardDeckLength: cardDeck.length,
            playerHand: initialPlayerHand,
            dealerHand: initialDealerHand,
            bet: 0,
            cash: cash,
            dealerThreshold: DEALER_THRESHOLD,
            reshuffleThreshold: RESHUFFLE_THRESHOLD,
            cardValues: CARD_VALUES,
            cardSuits: CARD_SUITS,
            deckNum: 4
        };

        // object containing all the elements to be manipulated
        let gameVisualElements = {
            playerHandElement: playerHandElement,
            dealerHandElement: dealerHandElement,
            betField: betField,
            betButton: betButton,
            cashField: cashField,
            popupElement: popupElement,
            popupTextElement: popupTextElement,
            insuranceButton: insuranceButton,
            chipStack: chipStack
        };

        gameState = await setUpTable(gameState, gameVisualElements);

        hitButton.onclick = async function () {
            gameState.playerHand = hit(gameState.playerHand, gameState.cardDeck);
            renderCard(gameState.playerHand.at(-1), gameVisualElements.playerHandElement);
            // check for bust before dealing new card
            if (checkForBust(gameState.playerHand)) {
                await showPopup("bust", gameVisualElements);
                gameState = await wrapUpGame("lose", gameState, gameVisualElements);
            } else if (getValue(gameState.playerHand) == 21) {
                // reset table if player has blackjack
                await showPopup("blackjack", gameVisualElements);
                await wrapUpGame("blackjack", gameState, gameVisualElements);
            }
        }
        surrenderButton.onclick = async function () {
            showPopup("surrender", gameVisualElements);
            gameState = await wrapUpGame("surrender", gameState, gameVisualElements);
        }
        standButton.onclick = async function () {
            gameState.dealerHand = playDealerTurn(gameState.dealerHand, getValue(gameState.dealerHand), gameState.cardDeck, gameState.dealerThreshold);
            resetDealerHandRendering(gameVisualElements.dealerHandElement);
            renderDealerHand(gameState.dealerHand, gameVisualElements.dealerHandElement);
            gameState = await wrapUpGame("stand", gameState, gameVisualElements);
        }
        doubleButton.onclick = async function () {
            // same as stand basically
            gameState.playerHand = hit(gameState.playerHand, gameState.cardDeck);
            renderCard(gameState.playerHand.at(-1), gameVisualElements.playerHandElement);
            // check for bust
            if (checkForBust(gameState.playerHand)) {
                await showPopup("bust", gameVisualElements);
                gameState = await wrapUpGame("lose", gameState, gameVisualElements);
            } else {
                gameState.dealerHand = playDealerTurn(gameState.dealerHand, getValue(gameState.dealerHand), gameState.cardDeck, gameState.dealerThreshold);
                resetDealerHandRendering(gameVisualElements.dealerHandElement);
                renderDealerHand(gameState.dealerHand, gameVisualElements.dealerHandElement);
                gameState = await wrapUpGame("double", gameState, gameVisualElements);
            }
        }
    }
}
