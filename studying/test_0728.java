import java.util.Scanner;

public class test_0728 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("������һ��������ʾ����");
        int week = sc.nextInt();
        switch (week){
            case 1,2,3,4,5 -> System.out.println("������");
            case 6,7 -> System.out.println("��Ϣ��");
            default -> System.out.println("��Ч����");                                     
        }

    }
}