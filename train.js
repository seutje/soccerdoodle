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

const data = [];
const labels = [];
for (let i = 0; i < 100; i++) {
  const ballX = Math.random() * 2 - 1;
  const ballY = Math.random() * 2 - 1;
  data.push([ballX, ballY]);
  labels.push(ballX > 0 ? 1 : 0);
}

const model = train(data, labels);

const modelDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir);
}

fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(model, null, 2));
console.log('Model trained and saved to models/model.json');

