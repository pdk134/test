import java.util.Scanner;

public class test_j0907 {
    public static void main(String[] args){
        Scanner sc =new Scanner(System.in);
        System.out.println("��¼��һ�����ֱ�ʾ��Χ�Ŀ�ʼ");
        int start = sc.nextInt();
        System.out.println("��¼��һ�����ֱ�ʾ��Χ�Ľ���");
        int end = sc.nextInt();
        int count = 0;
        for(int i = start; i <= end; i++){
            if (i%3 == 0 && i%5 ==0) {
            System.out.println(i);
            count += 1;
            }        
        }
         System.out.println(count);
    }
    
}
