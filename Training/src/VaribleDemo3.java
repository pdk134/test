import java.util.Scanner;

public class VaribleDemo3 {
    //�����
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        // ������������
        System.out.println("����������������");
        int a = sc.nextInt();
        int b = sc.nextInt();
        boolean result1 = a > b;
        System.out.println(result1);
        // �ر�Scanner����
        sc.close(); 
    }
}