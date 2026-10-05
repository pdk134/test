li = [1,2]
li2 = (1.0,2222,3)

a = zip(li,li2)

for i in a:
    print(i)
print(list(zip(li,li2)))

funa = lambda x : x*5
mp = map(funa,li)

print(mp)

for i in mp:
    print(i)

from functools import reduce

li = [1,2,3,4]

add = lambda a,b : a+b

print(reduce(add ,li))

a,* b = li
print(a,b)