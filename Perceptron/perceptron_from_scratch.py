import numpy as np

# ==================== 1. 准备数据 ====================
# 与门 (AND Gate) 训练数据
# 只有两个输入都为1时，输出才是1
X = np.array([[0, 0],
              [0, 1],
              [1, 0],
              [1, 1]])

y = np.array([[0],
              [1],
              [1],
              [0]])

# ==================== 2. 初始化参数 ====================
np.random.seed(42)
weights = np.random.randn(2, 1)  # 2个输入 → 1个输出
bias = np.random.randn(1)

print("=" * 55)
print("从零手写感知机 - 学习逻辑与门 (AND Gate)")
print("=" * 55)
print(f"初始权重: {weights.flatten()}")
print(f"初始偏置: {bias[0]:.4f}\n")

# ==================== 3. 定义激活函数 ====================
def step_function(z):
    """阶跃函数：z > 0 输出1，否则输出0"""
    return 1 if z > 0 else 0

# ==================== 4. 前向传播 ====================
def forward(X):
    """对所有样本进行预测"""
    predictions = []
    for i in range(X.shape[0]):
        z = np.dot(X[i], weights) + bias
        pred = step_function(z)
        predictions.append(pred)
    return np.array(predictions).reshape(-1, 1)

# ==================== 5. 训练模型 ====================
learning_rate = 0.1
epochs = 20

print("开始训练...\n")
for epoch in range(epochs):
    total_loss = 0
    
    for i in range(X.shape[0]):
        # 前向传播
        z = np.dot(X[i], weights) + bias
        prediction = step_function(z)
        
        # 计算误差
        error = y[i] - prediction
        total_loss += abs(error)
        
        # 感知机学习规则：用误差调整权重和偏置
        weights += learning_rate * error * X[i].reshape(-1, 1)
        bias += learning_rate * error     
    # 每轮打印一次进度
        print(f"Epoch {epoch+1:2d}/{epochs} | 总误差: {total_loss[0]:.0f} | "
            f"权重: [{weights[0][0]:.4f}, {weights[1][0]:.4f}] | 偏置: {bias[0]:.4f}")

# ==================== 6. 测试模型 ====================
print("\n" + "=" * 55)
print("训练完成！与门测试结果：")
print("=" * 55)

predictions = forward(X)
for i in range(4):
    status = "✓" if predictions[i][0] == y[i][0] else "✗"
    print(f"  输入: {X[i]} → 预测: {predictions[i][0]}, 真实值: {y[i][0]}  {status}")

print(f"\n  最终权重: [{weights[0][0]:.4f}, {weights[1][0]:.4f}]")
print(f"  最终偏置: {bias[0]:.4f}")

# ==================== 7. 小实验：或门 (OR Gate) ====================
print("\n" + "=" * 55)
print("小实验：改成或门 (OR Gate) 再训练一次")
print("=" * 55)

# 或门数据：只要有一个输入为1，输出就是1
y_or = np.array([[0],
                 [1],
                 [1],
                 [1]])

# 重新初始化参数
weights_or = np.random.randn(2, 1)
bias_or = np.random.randn(1)

# 快速训练
for epoch in range(20):
    for i in range(X.shape[0]):
        z = np.dot(X[i], weights_or) + bias_or
        pred = step_function(z)
        error = y_or[i] - pred
        weights_or += learning_rate * error * X[i].reshape(-1, 1)
        bias_or += learning_rate * error

# 测试或门
print("\n  或门测试结果：")
for i in range(4):
    z = np.dot(X[i], weights_or) + bias_or
    pred = step_function(z)
    status = "✓" if pred == y_or[i][0] else "✗"
    print(f"  输入: {X[i]} → 预测: {pred}, 真实值: {y_or[i][0]}  {status}")

# ==================== 8. 彩蛋：试试异或门 (XOR) ====================
print("\n" + "=" * 55)
print("彩蛋：异或门 (XOR) —— 单层感知机学不会！")
print("=" * 55)
print("异或门：输入相同输出0，不同输出1")
print("你可以试着把 y 改成 XOR 的数据，跑一下看看...")
print("这就是为什么后来需要『多层神经网络』的原因！\n")