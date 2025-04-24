class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gridElement = document.getElementById('grid');
        this.scoreElement = document.getElementById('score');
        this.initializeGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
        this.setupKeyboardControls();
    }

    initializeGrid() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${i}-${j}`;
                this.gridElement.appendChild(cell);
            }
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({i, j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.classList.add('new-tile');
            setTimeout(() => cell.classList.remove('new-tile'), 200);
        }
    }

    updateDisplay() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.getElementById(`cell-${i}-${j}`);
                const value = this.grid[i][j];
                cell.textContent = value || '';
                cell.className = 'cell';
                if (value) {
                    cell.classList.add(`tile-${value}`);
                }
            }
        }
        this.scoreElement.textContent = this.score;
    }

    async move(direction) {
        let moved = false;
        const oldGrid = JSON.stringify(this.grid);

        // Add slide animation classes
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.getElementById(`cell-${i}-${j}`);
                if (this.grid[i][j] !== 0) {
                    cell.classList.add(`slide-${direction}`);
                }
            }
        }

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 150));

        if (direction === 'left' || direction === 'right') {
            for (let i = 0; i < 4; i++) {
                let row = this.grid[i].filter(x => x !== 0);
                
                // Merge tiles
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1]) {
                        row[j] *= 2;
                        this.score += row[j];
                        row.splice(j + 1, 1);
                        moved = true;
                    }
                }
                
                // Fill with zeros based on direction
                while (row.length < 4) {
                    if (direction === 'left') {
                        row.push(0);
                    } else {
                        row.unshift(0);
                    }
                }
                
                this.grid[i] = row;
            }
        } else {
            for (let j = 0; j < 4; j++) {
                let column = this.grid.map(row => row[j]).filter(x => x !== 0);
                
                // Merge tiles
                for (let i = 0; i < column.length - 1; i++) {
                    if (column[i] === column[i + 1]) {
                        column[i] *= 2;
                        this.score += column[i];
                        column.splice(i + 1, 1);
                        moved = true;
                    }
                }
                
                // Fill with zeros based on direction
                while (column.length < 4) {
                    if (direction === 'up') {
                        column.push(0);
                    } else {
                        column.unshift(0);
                    }
                }
                
                for (let i = 0; i < 4; i++) {
                    this.grid[i][j] = column[i];
                }
            }
        }

        // Remove slide animation classes
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.getElementById(`cell-${i}-${j}`);
                cell.classList.remove(`slide-${direction}`);
            }
        }

        if (JSON.stringify(this.grid) !== oldGrid) {
            this.updateDisplay();
            await new Promise(resolve => setTimeout(resolve, 50));
            this.addRandomTile();
        }

        if (this.isGameOver()) {
            alert('Game Over! Your score: ' + this.score);
        }
    }

    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if (
                    (i < 3 && current === this.grid[i + 1][j]) ||
                    (j < 3 && current === this.grid[i][j + 1])
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', async (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                    await this.move('left');
                    break;
                case 'ArrowRight':
                    await this.move('right');
                    break;
                case 'ArrowUp':
                    await this.move('up');
                    break;
                case 'ArrowDown':
                    await this.move('down');
                    break;
            }
        });
    }
}

// Start the game
const game = new Game2048(); 