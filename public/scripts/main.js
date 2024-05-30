async function setUpTable(gameState, gameVisualElements) {
    let playerHand = gameState.playerHand;
    let dealerHand = gameState.dealerHand;
    let playerHandElement = gameVisualElements.playerHandElement;
    let dealerHandElement = gameVisualElements.dealerHandElement;
    let cashField = gameVisualElements.cashField;
    let insuranceButton = gameVisualElements.insuranceButton;
    let splitButton = gameVisualElements.splitButton;
    let chipStack = gameVisualElements.chipStack;


    // basically skip round if there is blackjack
    if (gameState.message == "blackjack") {
        await disableBetting(gameState, gameVisualElements);
        await showPopup(gameState.message, gameVisualElements);

        resetDealerHandRendering(gameVisualElements.dealerHandElement);
        renderDealerHand(gameState.displayDealerHand, dealerHandElement);

        resetTable(playerHandElement, dealerHandElement);

        // necessary to avoid infinite recursion (hacky, but hey, it works)
        gameState.message = "all ok";

        await setUpTable(gameState, gameVisualElements);

        gameState = await fetchGameState("continue");

        return gameState;
    }

    // disable the actions before setting the bet (to keep the game bug free)
    await disableActionButtons(gameVisualElements);

    if (!gameVisualElements.ignoreBetting) {
        resetChips(chipStack);
    
        gameState = await placeBets(gameState, gameVisualElements);
        let cash = gameState.cash;
    
        // disable betting once the bet is determined
        await disableBetting(gameState, gameVisualElements);
    } 
    // reminder: cards render only when bet is done, so I have to circumvent it if it's disabled
    else {
        renderHands(gameState, gameVisualElements);
        gameVisualElements.ignoreBetting = false;
    }

    await enableActionButtons(gameVisualElements);

    updateCashField(gameState.cash, cashField);

    if (gameState.insuranceAvailable) {
        // code to offer insurance
        insuranceButton.disabled = false;

        insuranceButton.onclick = async function () {
            gameState = await fetchGameState("insurance");

            if (gameState.message == "insurance win") {
                resetDealerHandRendering(gameVisualElements.dealerHandElement);
                renderDealerHand(gameState.displayDealerHand, gameVisualElements.dealerHandElement);

                updateCashField(gameState.cash, cashField);

                await showPopup(gameState.message, gameVisualElements);

                resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
                await setUpTable(gameState, gameVisualElements);
            } else {
                updateCashField(gameState.cash, cashField);
                await showPopup(gameState.message, gameVisualElements);
            }

            insuranceButton.disabled = true;
        }
    } else if (!insuranceButton.disabled && !gameState.insuranceAvailable) {
        insuranceButton.disabled = true;
    }
    
    if (gameState.splitAvailable) {
        splitButton.disabled = false;

        splitButton.onclick = async function () {
            gameState = await fetchGameState("split");

            resetTable(playerHandElement, dealerHandElement);
            renderHands(gameState, gameVisualElements);

            gameVisualElements.ignoreBetting = true;
            splitButton.disabled = true;
        }
    }
    return gameState;

}

async function fetchGameState(action) {
    try {
        const response = await fetch(`/play/${action}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({bet: gameState.bet})
        });
    
        gameState = await response.json();

        if (gameState.message === "ERROR_SESSION_TIMEOUT") {
            throw new Error("The card game session has ended due to inactivity. Please refresh the page");
        }
    
        return gameState;

    } catch (error) {
        alert(error);
    }
}

// rendering

// render cards
function renderCard(card, parentElement) {
    let cardFileName;
    const CARD_WIDTH = 112;
    let initialCardOffset = 20;
    let cardOffset = 50;
    let cardsNum = parentElement.getElementsByClassName("playingCard").length + 1;

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

    cardImg.style.zIndex = `${cardsNum}`;

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

async function disableBetting(gameState, gameVisualElements) {
    let betField = gameVisualElements.betField;
    let buttons = betField.children;

    return new Promise((resolve, reject) => {
        for(let button of buttons) {
            button.disabled = true;
    };
    resolve();
  });
}

// make the action buttons disabled or enable them
async function enableActionButtons(gameVisualElements) {
    let actionSet = gameVisualElements.actionSet;
    let buttons = actionSet.children;
    let startButton = gameVisualElements.startButton;
    let insuranceButton = gameVisualElements.insuranceButton;
    let splitButton = gameVisualElements.splitButton; 

    return new Promise((resolve, reject) => {
        for(let button of buttons) {
            if (button == startButton || button == insuranceButton || button == splitButton) {
                button.disabled = true;
            } else {
                button.disabled = false;
            }
    };
    resolve();
  });
}

async function disableActionButtons(gameVisualElements) {
    let actionSet = gameVisualElements.actionSet;
    let buttons = actionSet.children;

    return new Promise((resolve, reject) => {
        for(let button of buttons) {
            button.disabled = true;
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

// render initial hands 
function renderHands(gameState, gameVisualElements) {
    let obfuscatedDealerHand = ["***", gameState.dealerHand[1]];


    // render the playing cards

    for (let i = 0; i < 2; i++) {
        renderCard(obfuscatedDealerHand[i], gameVisualElements.dealerHandElement);
    }

    for (let i = 0; i < 2; i++) {
        renderCard(gameState.playerHand[i], gameVisualElements.playerHandElement);
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

    updateCashField(gameState.cash, gameVisualElements.cashField);

    await makeBettingAvailable(gameState, gameVisualElements);

    /*  onlick is not the best solution 
        but eventhandler breaks stuff hard
    */
    return new Promise(function(resolve, reject) {
        betField.onclick = (event) => betHandler(event, resolve, gameState, gameVisualElements);
    })
}

async function betHandler(event, resolve, gameState, gameVisualElements) {
    let target = event.target;
    let chipValue = parseInt(target.dataset.chipValue);

    if (target === gameVisualElements.betButton) {
        gameState = await fetchGameState("continue");

        // reset table if player has blackjack
        if (gameState.message === "blackjack") {
            setUpTable(gameState, gameVisualElements);
        }

        renderHands(gameState, gameVisualElements);

        resolve(gameState);
    } else if (chipValue) {
        renderChip(chipValue, chipStack);

        gameState.bet += chipValue;

        /* 
           for the future: this doesn't actually update 
           serverside cash, because it's calculated AFTER fetching
        */
        gameState.cash -= chipValue;
        
        await makeBettingAvailable(gameState, gameVisualElements);

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
    let cashUI = document.getElementById("cashUI");
    let cashField = document.getElementById("cashValue");
    let popupElement = document.getElementById("infoScreen");
    let popupTextElement = document.getElementById("infoText");
    let chipStack = document.getElementById("chipStack");

    startButton.onclick = async function () {
        let actionSet = document.getElementById("actionSet");
        let hitButton = document.getElementById("hit");
        let standButton = document.getElementById("stand");
        let doubleButton = document.getElementById("double");
        let insuranceButton = document.getElementById("insurance");
        let splitButton = document.getElementById("split");
        let surrenderButton = document.getElementById("surrender");

        let betButton = document.getElementById("bet");

        hitButton.disabled = false;
        standButton.disabled = false;
        doubleButton.disabled = false;
        surrenderButton.disabled = false;

        startButton.disabled = true;

        let dealerHandElement = document.getElementById("dealerCards");
        let playerHandElement = document.getElementById("playerCards");

        // object containing all the game info

        const response = await fetch("/play/start");

        gameState = await response.json();

        updateCashField(gameState.cash, cashField);

        // loading cash only after receiving info from server
        cashUI.style.visibility = "visible";

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
            chipStack: chipStack,
            actionSet: actionSet,
            startButton: startButton,
            splitButton: splitButton,
            ignoreBetting: false
        };
        

        await setUpTable(gameState, gameVisualElements);

        hitButton.onclick = async function () {
            hitButton.disabled = true;

            gameState = await fetchGameState("hit");

            renderCard(gameState.playerHand.at(-1), gameVisualElements.playerHandElement);
            // check for bust before dealing new card
            if (gameState.message === "bust" || gameState.message === "blackjack") {
                // Reset and render dealer's hand
                resetDealerHandRendering(gameVisualElements.dealerHandElement);
                renderDealerHand(gameState.displayDealerHand, gameVisualElements.dealerHandElement);
    
                // Show appropriate popup
                await showPopup(gameState.message, gameVisualElements);
    
                // Reset the table
                resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
                await setUpTable(gameState, gameVisualElements);
            }

            hitButton.disabled = false;
        }
        surrenderButton.onclick = async function () {

            gameState = await fetchGameState("surrender");


            resetDealerHandRendering(gameVisualElements.dealerHandElement);
            renderDealerHand(gameState.displayDealerHand, gameVisualElements.dealerHandElement);

            await showPopup(gameState.message, gameVisualElements);

            resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
            await setUpTable(gameState, gameVisualElements);
        }
        standButton.onclick = async function () {
            gameState = await fetchGameState("stand");

            resetDealerHandRendering(gameVisualElements.dealerHandElement);
            renderDealerHand(gameState.displayDealerHand, gameVisualElements.dealerHandElement);

            await showPopup(gameState.message, gameVisualElements);

            resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
            await setUpTable(gameState, gameVisualElements);
        }

        doubleButton.onclick = async function () {
            // same as stand basically

            gameState = await fetchGameState("double");

            renderCard(gameState.playerHand.at(-1), gameVisualElements.playerHandElement);
            // check for bust
            if (gameState.message == "bust") {
                resetDealerHandRendering(gameVisualElements.dealerHandElement);
                renderDealerHand(gameState.displayDealerHand, gameVisualElements.dealerHandElement);
    
                await showPopup("bust", gameVisualElements);

                resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
                await setUpTable(gameState, gameVisualElements);
            } else {
                resetDealerHandRendering(gameVisualElements.dealerHandElement);
                renderDealerHand(gameState.displayDealerHand, gameVisualElements.dealerHandElement);
    
                await showPopup(gameState.message, gameVisualElements);

                resetTable(gameVisualElements.playerHandElement, gameVisualElements.dealerHandElement);
                await setUpTable(gameState, gameVisualElements);
            }
        }
    }
}
