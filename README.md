# 🧩 Sudoku

A self coded Sudoku game built with plain HTML, CSS, and JavaScript. It generates a new random puzzle every time and includes a fun hint system.

**▶ Play it live:** https://ishhwarrii.github.io/sudoku-game/

## Features
- Random puzzle generator with Easy, Medium, and Hard levels
- Every puzzle has exactly one solution
- Rule checking: wrong moves flash red
- Score system (+10 correct, -5 mistake, -5 per hint)
- 3 playful hints per game that never give away the number
- Number pad, so it works on phones too

## How it works
- **Rule checker:** checks the row, column, and 3x3 box before accepting a number.
- **Backtracking solver:** fills the board by trying numbers, and going back and trying another number when it gets stuck. Numbers are tried in random order, so each board is different.
- **Puzzle generator:** removes numbers one by one, and after each removal counts the solutions to make sure the puzzle still has exactly one answer.

## Built with
HTML, CSS, JavaScript (no libraries)

## Run it locally
Download the files and open `index.html` in your browser.

## Ideas for the future
- Save the best score
- Timer
- Pencil marks for notes
