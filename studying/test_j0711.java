import java.util.Scanner;

public class test_j0711 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("������Ʊ�ţ�");
        int number = sc.nextInt();
        if (number >= 0 && number <= 100) {        
            if (number % 2 == 0) {
                System.out.println("�����ұ�");
            } else {
                System.out.println("�������");
            }
        } else {
            System.out.println("��ЧƱ��");
        }
    }
}
