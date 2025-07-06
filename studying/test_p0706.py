name = 'TTKK'
age = 18
print('%s的年龄是：%d岁' % (name, age))
#字典的概念
info = {'name': name, 'name': "a",'age': age}
print(type(info))
print(info.get('nam','不存在'))
info['age'] = 10
print(info['age'])
info['Remark'] = '在线征婚'
print(info)
ddd = {'a' : 1}
# del ddd
ddd.pop('a')
print(ddd)