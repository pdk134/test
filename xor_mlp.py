import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def sigmoid_deriv(x):
    # x 是 sigmoid 的输出
    return x * (1.0 - x)


def train_xor(hidden_size=4, lr=0.5, epochs=10000, seed=42):
    np.random.seed(seed)

    # 训练数据: XOR
    X = np.array([[0, 0],
                  [0, 1],
                  [1, 0],
                  [1, 1]])
    y = np.array([[0],
                  [1],
                  [1],
                  [0]])

    # 权重随机初始化
    W1 = np.random.randn(2, hidden_size)
    b1 = np.zeros((1, hidden_size))
    W2 = np.random.randn(hidden_size, 1)
    b2 = np.zeros((1, 1))

    for epoch in range(epochs):
        # 前向传播
        z1 = X.dot(W1) + b1
        a1 = sigmoid(z1)
        z2 = a1.dot(W2) + b2
        a2 = sigmoid(z2)

        # 损失 (均方误差)
        loss = np.mean((a2 - y) ** 2)

        # 反向传播
        d_a2 = 2 * (a2 - y) / y.shape[0]
        d_z2 = d_a2 * sigmoid_deriv(a2)
        d_W2 = a1.T.dot(d_z2)
        d_b2 = np.sum(d_z2, axis=0, keepdims=True)

        d_a1 = d_z2.dot(W2.T)
        d_z1 = d_a1 * sigmoid_deriv(a1)
        d_W1 = X.T.dot(d_z1)
        d_b1 = np.sum(d_z1, axis=0, keepdims=True)

        # 更新
        W2 -= lr * d_W2
        b2 -= lr * d_b2
        W1 -= lr * d_W1
        b1 -= lr * d_b1

        if epoch % 1000 == 0:
            print(f"epoch {epoch:5d}  loss = {loss:.6f}")

    return (W1, b1, W2, b2)


def predict(params, X):
    W1, b1, W2, b2 = params
    a1 = sigmoid(X.dot(W1) + b1)
    a2 = sigmoid(a1.dot(W2) + b2)
    return (a2 > 0.5).astype(int), a2


if __name__ == "__main__":
    X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
    params = train_xor(hidden_size=4, lr=0.5, epochs=10000)
    preds, probs = predict(params, X)
    print("\n预测结果:")
    for i in range(4):
        print(f"  {X[i].tolist()} -> 预测 {preds[i][0]} (概率 {probs[i][0]:.4f})")
