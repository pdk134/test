
def outer():
    
    num = 5
    def inner():
        nonlocal num
        num = 6
        def inner2():
            nonlocal num
            num = 7
            print('inner_num2:',num)
        inner2()
        print('inner_num:',num)
    inner()
    print('outer_num:',num)
outer()

fund = lambda **kwargs:kwargs
print(fund(a=2))