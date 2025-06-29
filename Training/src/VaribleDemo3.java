import java.util.Scanner;

public class VaribleDemo3 {
    //主入口
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        // 输入两个整数
        System.out.println("请输入两个整数：");
        int a = sc.nextInt();
        int b = sc.nextInt();
        boolean result1 = a > b;
        System.out.println(result1);
        // 关闭Scanner对象
        sc.close(); 
    }
}