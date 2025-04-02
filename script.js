document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const statusElement = document.getElementById('status');
    const restartButton = document.getElementById('restart-button');
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const minesInput = document.getElementById('mines');

    let rows = 10;
    let cols = 10;
    let numMines = 15;
    let board = []; // 2D array representing the board state
    let revealedCells = 0;
    let flagsPlaced = 0;
    let gameOver = false;
    let firstClick = true;

    // --- Game Initialization ---

    function initGame() {
        // Read settings from inputs
        rows = parseInt(rowsInput.value, 10);
        cols = parseInt(colsInput.value, 10);
        numMines = parseInt(minesInput.value, 10);

        // Validate settings
        const maxCells = rows * cols;
        if (numMines >= maxCells) {
            numMines = maxCells - 1; // Ensure at least one safe cell
            minesInput.value = numMines;
            alert("Number of mines adjusted to be less than total cells.");
        }
        if (numMines < 1) {
            numMines = 1;
            minesInput.value = numMines;
        }

        // Reset game state
        board = [];
        revealedCells = 0;
        flagsPlaced = 0;
        gameOver = false;
        firstClick = true;
        gameBoardElement.innerHTML = ''; // Clear previous board
        gameBoardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`; // Set grid columns
        statusElement.textContent = `Mines: ${numMines}`;
        document.body.classList.remove('game-over'); // Remove game over styling

        createBoardData();
        renderBoard();
    }

    // --- Board Data Management ---

    function createBoardData() {
        // Initialize empty board
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    element: null // Will store the corresponding DOM element
                };
            }
        }
        // Mines and adjacent counts are placed after the first click
    }

    function placeMinesAndCalculateAdjacent(firstClickRow, firstClickCol) {
        let minesToPlace = numMines;
        while (minesToPlace > 0) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);

            // Don't place a mine on the first clicked cell or if already a mine
            if (r === firstClickRow && c === firstClickCol) continue;
            if (!board[r][c].isMine) {
                board[r][c].isMine = true;
                minesToPlace--;
            }
        }

        // Calculate adjacent mines for all cells
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!board[r][c].isMine) {
                    board[r][c].adjacentMines = countAdjacentMines(r, c);
                }
            }
        }
    }

    function countAdjacentMines(row, col) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue; // Skip the cell itself
                const nr = row + dr;
                const nc = col + dc;
                if (isValidCell(nr, nc) && board[nr][nc].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    function isValidCell(row, col) {
        return row >= 0 && row < rows && col >= 0 && col < cols;
    }

    // --- Rendering ---

    function renderBoard() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell', 'hidden');
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;

                // Left Click Listener
                cellElement.addEventListener('click', handleLeftClick);
                // Right Click Listener (Context Menu)
                cellElement.addEventListener('contextmenu', handleRightClick);

                board[r][c].element = cellElement; // Store reference
                gameBoardElement.appendChild(cellElement);
            }
        }
    }

    function updateCellAppearance(row, col) {
        const cellData = board[row][col];
        const cellElement = cellData.element;

        cellElement.classList.remove('hidden', 'flagged', 'mine');
        cellElement.classList.add('revealed');
        cellElement.textContent = ''; // Clear previous content (like flag)

        if (cellData.isMine) {
            cellElement.classList.add('mine');
            cellElement.textContent = '💣'; // Mine emoji
        } else if (cellData.adjacentMines > 0) {
            cellElement.textContent = cellData.adjacentMines;
            cellElement.classList.add(`num-${cellData.adjacentMines}`); // For styling numbers
        }
        // If adjacentMines is 0, it remains blank
    }

     function updateStatus() {
        const remainingMines = numMines - flagsPlaced;
        if (gameOver) {
             // Status already set by endGame function
        } else {
             statusElement.textContent = `Mines: ${remainingMines}`;
        }
    }

    // --- Event Handlers ---

    function handleLeftClick(event) {
        if (gameOver) return;

        const cellElement = event.target;
        const row = parseInt(cellElement.dataset.row, 10);
        const col = parseInt(cellElement.dataset.col, 10);
        const cellData = board[row][col];

        if (cellData.isRevealed || cellData.isFlagged) return;

        // First click logic: Place mines ensuring the first click is safe
        if (firstClick) {
            placeMinesAndCalculateAdjacent(row, col);
            firstClick = false;
        }

        if (cellData.isMine) {
            endGame(false); // Player hit a mine - lose
            revealAllMines();
            cellElement.style.backgroundColor = '#ff0000'; // Highlight the clicked mine
        } else {
            revealCell(row, col);
            checkWinCondition();
        }
    }

    function handleRightClick(event) {
        event.preventDefault(); // Prevent context menu
        if (gameOver) return;

        const cellElement = event.target;
        const row = parseInt(cellElement.dataset.row, 10);
        const col = parseInt(cellElement.dataset.col, 10);
        const cellData = board[row][col];

        if (cellData.isRevealed) return; // Can't flag revealed cells

        cellData.isFlagged = !cellData.isFlagged; // Toggle flag

        if (cellData.isFlagged) {
            flagsPlaced++;
            cellElement.classList.add('flagged');
            cellElement.classList.remove('hidden');
            cellElement.textContent = '🚩'; // Flag emoji
        } else {
            flagsPlaced--;
            cellElement.classList.remove('flagged');
            cellElement.classList.add('hidden');
            cellElement.textContent = '';
        }
         updateStatus();
    }

    // --- Game Logic ---

    function revealCell(row, col) {
        const cellData = board[row][col];

        // Base cases for recursion/stop revealing
        if (!isValidCell(row, col) || cellData.isRevealed || cellData.isFlagged) {
            return;
        }

        cellData.isRevealed = true;
        revealedCells++;
        updateCellAppearance(row, col);

        // If the cell has 0 adjacent mines, reveal its neighbors (flood fill)
        if (cellData.adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    revealCell(row + dr, col + dc);
                }
            }
        }
    }

    function revealAllMines() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].isMine) {
                    // Don't reveal if correctly flagged during loss
                    if (!board[r][c].isFlagged) {
                         board[r][c].isRevealed = true; // Mark as revealed internally
                         updateCellAppearance(r, c);
                    }
                } else if (board[r][c].isFlagged) {
                     // If flagged incorrectly, show 'X' maybe? (optional)
                    // board[r][c].element.textContent = '❌';
                }
            }
        }
    }

    function checkWinCondition() {
        const totalSafeCells = rows * cols - numMines;
        if (revealedCells === totalSafeCells) {
            endGame(true); // Player revealed all safe cells - win
        }
    }

    function endGame(isWin) {
        gameOver = true;
        document.body.classList.add('game-over'); // Add class for potential styling/disabling hover

        if (isWin) {
            statusElement.textContent = '🎉 You Win! 🎉';
            // Automatically flag remaining mines on win (optional)
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].isMine && !board[r][c].isFlagged) {
                         board[r][c].isFlagged = true;
                         board[r][c].element.classList.add('flagged');
                         board[r][c].element.classList.remove('hidden');
                         board[r][c].element.textContent = '🚩';
                    }
                }
            }
             updateStatus(); // Update mine count to 0 potentially
        } else {
            statusElement.textContent = '💥 Game Over! 💥';
            revealAllMines();
        }
    }

    // --- Event Listeners ---
    restartButton.addEventListener('click', initGame);

    // --- Initial Setup ---
    initGame(); // Start the game when the page loads
});
