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

function generateData(role) {
  const data = [];
  const labels = [];
  for (let i = 0; i < 100; i++) {
    const ballX = Math.random() * 2 - 1;
    const ballY = Math.random() * 2 - 1;
    data.push([ballX, ballY]);
    switch (role) {
      case 'forward':
        labels.push(ballX > 0 ? 1 : 0);
        break;
      case 'midfielder':
        labels.push(ballY > 0 ? 1 : 0);
        break;
      case 'defender':
        labels.push(ballX < 0 ? 1 : 0);
        break;
      case 'goalkeeper':
        labels.push(Math.abs(ballY) < 0.5 ? 1 : 0);
        break;
    }
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

