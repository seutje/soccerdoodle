/**
 * @jest-environment jsdom
 */

global.__TEST__ = true;

document.body.innerHTML = '<canvas id="gameCanvas"></canvas>';
const canvas = document.getElementById('gameCanvas');
canvas.getContext = jest.fn(() => ({}));

const { initPlayers, gameState } = require('../assets/js/game');

test('initPlayers creates 10 players', () => {
  initPlayers();
  expect(gameState.players.length).toBe(10);
});
