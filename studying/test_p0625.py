# i = 1
# sum = 0
# while i <= 100:
#     sum += i
#     i += 1
#     print(sum)
# print("最终结果是：",sum)
i = 1#外側ループの回数を記録する変数
while i <= 3:
    print(f"ーーー外側ループ{i}回目ーーー")
    j = 1
    i += 1
    while j <= 5:
        print(f"内側ループ{j}回目") 
        j += 1
