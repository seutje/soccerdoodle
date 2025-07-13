const fs = require('fs');
const path = require('path');

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function train(data, labels, epochs = 300, lr = 0.1) {
  const weights = [0, 0];
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let i = 0; i < data.length; i++) {
      const x = data[i];
      const y = labels[i];

      let z = bias;
      for (let j = 0; j < weights.length; j++) {
        z += weights[j] * x[j];
      }
      const pred = sigmoid(z);
      const error = pred - y;
      for (let j = 0; j < weights.length; j++) {
        weights[j] -= lr * error * x[j];
      }
      bias -= lr * error;
    }
  }
  return { weights, bias };
}

function generateData(role, samples = 500) {
  const data = [];
  const labels = [];

  for (let i = 0; i < samples; i++) {
    let playerX = Math.random() * 2 - 1;
    let playerY = Math.random() * 2 - 1;
    let ballX = Math.random() * 2 - 1;
    let ballY = Math.random() * 2 - 1;

    // simulate a few steps of play
    for (let step = 0; step < 5; step++) {
      // random ball movement
      ballX = Math.max(-1, Math.min(1, ballX + (Math.random() - 0.5) * 0.2));
      ballY = Math.max(-1, Math.min(1, ballY + (Math.random() - 0.5) * 0.2));

      // simple player chase behaviour
      const dx = ballX - playerX;
      const dy = ballY - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1e-6;

      playerX += (dx / dist) * 0.1;
      playerY += (dy / dist) * 0.1;
    }

    const feature = [ballX - playerX, ballY - playerY];
    data.push(feature);

    let label = 0;
    switch (role) {
      case 'forward':
        label = ballX > 0 && Math.abs(ballY) < 0.5 ? 1 : 0;
        break;
      case 'midfielder':
        label = Math.abs(ballX) < 0.3 && Math.abs(ballY) < 0.3 ? 1 : 0;
        break;
      case 'defender':
        label = ballX < 0 ? 1 : 0;
        break;
      case 'goalkeeper':
        label = ballX < -0.7 && Math.abs(ballY) < 0.4 ? 1 : 0;
        break;
    }
    labels.push(label);
  }

  return { data, labels };
}

function trainAll() {
  const roles = ['goalkeeper', 'defender', 'midfielder', 'forward'];
  const modelDir = path.join(__dirname, 'models');
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir);
  }

  roles.forEach(role => {
    const { data, labels } = generateData(role);
    const model = train(data, labels);
    fs.writeFileSync(path.join(modelDir, `${role}.json`), JSON.stringify(model, null, 2));
    console.log(`Model for ${role} saved to models/${role}.json`);
  });
}

trainAll();

